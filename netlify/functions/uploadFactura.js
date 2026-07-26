const Busboy = require('busboy');
const nodemailer = require('nodemailer');
const hubspot = require('@hubspot/api-client');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS,
  }
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Mètode no permès' }) };
  }

  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (response) => {
      if (resolved) return;
      resolved = true;
      resolve(response);
    };

    const busboy = Busboy({
      headers: event.headers,
      limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 10 }
    });

    let fileBuffer, fileName, mimeType;
    let fileTooBig = false;
    let invalidType = false;
    let fields = {};

    busboy.on('file', (fieldname, file, info) => {
      const { filename, mimeType: type } = info;

      if (!ALLOWED_MIME_TYPES.includes(type)) {
        invalidType = true;
        file.resume();
        return;
      }

      fileName = filename;
      mimeType = type;
      const chunks = [];

      file.on('limit', () => { fileTooBig = true; });
      file.on('data', (d) => { if (!fileTooBig) chunks.push(d); });
      file.on('end', () => {
        if (!fileTooBig && !invalidType) fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('field', (name, val) => { fields[name] = val; });

    busboy.on('error', (err) => {
      console.error('Error Busboy:', err);
      safeResolve({ statusCode: 400, body: JSON.stringify({ error: 'Error processant el fitxer' }) });
    });

    busboy.on('finish', async () => {
      try {
        // -------------------------
        // 0. HONEYPOT (anti-bot)
        // -------------------------
        if (fields.hp_token || fields.hp_extra) {
          return safeResolve({ statusCode: 200, body: JSON.stringify({ ok: true }) });
        }

        // -------------------------
        // VALIDACIONS
        // -------------------------
        if (invalidType) {
          return safeResolve({
            statusCode: 400,
            body: JSON.stringify({ error: 'Tipus de fitxer no vàlid. Només PDF, JPG o PNG.' })
          });
        }
        if (fileTooBig) {
          return safeResolve({
            statusCode: 413,
            body: JSON.stringify({ error: 'El fitxer supera la mida màxima (5MB).' })
          });
        }

        const email   = (fields.email   || '').trim().toLowerCase();
        const name    = (fields.name    || '').trim();
        const phone   = (fields.phone   || '').trim();
        const message = (fields.message || '').trim();
        const section = (fields.section || 'web_general').trim();

        if (!fileBuffer || !email || !name || !phone) {
          return safeResolve({
            statusCode: 400,
            body: JSON.stringify({ error: 'Falten dades obligatòries.' })
          });
        }
        if (!EMAIL_REGEX.test(email)) {
          return safeResolve({
            statusCode: 400,
            body: JSON.stringify({ error: 'Email no vàlid.' })
          });
        }

        const result = { email: { ok: false }, hubspot: { ok: false } };

        // -------------------------
        // 1. EMAIL (Zoho via nodemailer)
        // -------------------------
        try {
          await transporter.sendMail({
            from:     `Factures Efficient Energy <${process.env.ZOHO_USER}>`,
            to:       process.env.NOTIFY_EMAIL,
            replyTo:  email,
            subject:  `Nova factura — ${name}`,
            html: `
              <p><b>Nom:</b> ${name}</p>
              <p><b>Email:</b> ${email}</p>
              <p><b>Telèfon:</b> ${phone}</p>
              <p><b>Secció:</b> ${section}</p>
              ${message ? `<p><b>Comentari:</b> ${message}</p>` : ''}
              <p><b>Fitxer:</b> ${fileName}</p>
            `,
            attachments: [{ filename: fileName, content: fileBuffer }]
          });
          result.email = { ok: true };
        } catch (err) {
          console.error('[Zoho] Error enviant el correu:', err);
          result.email = { ok: false, error: 'Error enviant el correu' };
        }

        // -------------------------
        // 2. HUBSPOT
        // -------------------------
        try {
          const hubspotClient = new hubspot.Client({
            accessToken: process.env.HUBSPOT_ACCESS_TOKEN
          });

          const search = await hubspotClient.crm.contacts.searchApi.doSearch({
            filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }]
          });

          if (search.results.length > 0) {
            const contactId = search.results[0].id;
            await hubspotClient.crm.contacts.basicApi.update(contactId, {
              properties: { phone }
            });
            result.hubspot = { ok: true, contactId };
          } else {
            const created = await hubspotClient.crm.contacts.basicApi.create({
              properties: { email, firstname: name, phone }
            });
            result.hubspot = { ok: true, contactId: created.id };
          }
        } catch (err) {
          console.error('[HubSpot] Error:', err);
          result.hubspot = { ok: false, error: 'Error actualitzant HubSpot' };
        }

        // -------------------------
        // RESPONSE
        // L'èxit depèn de l'email. HubSpot no bloqueja.
        // -------------------------
        const statusCode = result.email.ok ? 200 : 500;
        return safeResolve({
          statusCode,
          body: JSON.stringify({ ok: result.email.ok, result })
        });

      } catch (err) {
        console.error('Error crític:', err);
        safeResolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Error intern processant la factura' })
        });
      }
    });

    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'binary');

    busboy.end(body);
  });
};
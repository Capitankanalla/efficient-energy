const Busboy = require('busboy');
const { getStore } = require('@netlify/blobs');
const { Resend } = require('resend');
const hubspot = require('@hubspot/api-client');

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB — límit real de Netlify Functions
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
        fields: 10,
      }
    });

    let fileBuffer;
    let fileName;
    let mimeType;
    let fileTooBig = false;
    let invalidType = false;
    let fields = {};

    busboy.on('file', (fieldname, file, info) => {
      const { filename, mimeType: type } = info;

      if (!ALLOWED_MIME_TYPES.includes(type)) {
        invalidType = true;
        file.resume(); // drenar l'stream o Busboy es penja
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

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

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
            body: JSON.stringify({ error: 'Tipus de fitxer no vàlid. Només PDF o JPG.' })
          });
        }
        if (fileTooBig) {
          return safeResolve({
            statusCode: 413,
            body: JSON.stringify({ error: 'El fitxer supera la mida màxima (4MB).' })
          });
        }

        const email   = (fields.email  || '').trim().toLowerCase();
        const name    = (fields.name   || '').trim();
        const phone   = (fields.phone  || '').trim();
        const message = (fields.message|| '').trim();
        const section = (fields.section|| 'web_general').trim();

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

        const id = `${Date.now()}-${fileName}`;
        const result = {
          blobs:   { ok: false },
          email:   { ok: false },
          hubspot: { ok: false },
        };

        // -------------------------
        // 1. STORAGE (Netlify Blobs)
        // -------------------------
        try {
          const store = getStore('factures');
          await store.set(id, fileBuffer, {
            metadata: { email, name, phone, fileName, mimeType, section }
          });
          await store.set(`tracking-${id}.json`, JSON.stringify({
            id, status: 'stored', email, name, phone, section,
            createdAt: new Date().toISOString()
          }));
          result.blobs = { ok: true, id };
        } catch (err) {
          console.error('[Blobs] Error desant la factura:', err);
          result.blobs = { ok: false, error: 'Error desant la factura' };
        }

        // -------------------------
        // 2. EMAIL (Resend)
        // -------------------------
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from:    process.env.MAIL_FROM || 'Factures <onboarding@resend.dev>',
            to:      process.env.NOTIFY_EMAIL,
            replyTo: email,
            subject: `📄 Nova factura — ${name}`,
            html: `
              <p><b>Nom:</b> ${name}</p>
              <p><b>Email:</b> ${email}</p>
              <p><b>Telèfon:</b> ${phone}</p>
              <p><b>Secció:</b> ${section}</p>
              ${message ? `<p><b>Comentari:</b> ${message}</p>` : ''}
              <p><b>Fitxer:</b> ${fileName}</p>
              <p><b>ID:</b> ${id}</p>
            `,
            attachments: [{ filename: fileName, content: fileBuffer.toString('base64') }]
          });
          result.email = { ok: true };
        } catch (err) {
          console.error('[Resend] Error enviant el correu:', err);
          result.email = { ok: false, error: 'Error enviant el correu' };
        }

        // -------------------------
        // 3. HUBSPOT
        // -------------------------
        try {
          const hubspotClient = new hubspot.Client({
            accessToken: process.env.HUBSPOT_ACCESS_TOKEN
          });

          let contactId;
          const search = await hubspotClient.crm.contacts.searchApi.doSearch({
            filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }]
          });

          if (search.results.length > 0) {
            contactId = search.results[0].id;
          } else {
            const created = await hubspotClient.crm.contacts.basicApi.create({
              properties: { email, firstname: name, phone }
            });
            contactId = created.id;
          }

          await hubspotClient.crm.contacts.basicApi.update(contactId, {
            properties: {
              ultima_factura_data: new Date().toISOString(),
              nom_fitxer_factura:  fileName,
              seccio_origen:       section,
              estat_factura:       'Processada OK'
            }
          });
          result.hubspot = { ok: true, contactId };
        } catch (err) {
          console.error('[HubSpot] Error actualitzant el contacte:', err);
          result.hubspot = { ok: false, error: 'Error actualitzant HubSpot' };
        }

        // -------------------------
        // RESPONSE
        // La factura es considera rebuda si Blobs ha funcionat.
        // Resend i HubSpot es reportem però no bloquegen la resposta.
        // -------------------------
        const statusCode = result.blobs.ok ? 200 : 500;
        return safeResolve({
          statusCode,
          body: JSON.stringify({ ok: result.blobs.ok, result })
        });

      } catch (err) {
        console.error('Error crític:', err);
        safeResolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Error intern processant la factura' })
        });
      }
    });

    // Netlify pot enviar el body en base64 o binary segons el context
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'binary');

    busboy.end(body);
  });
};
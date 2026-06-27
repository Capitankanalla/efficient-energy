const Busboy = require('busboy');
const { getStore } = require('@netlify/blobs');
const { Resend } = require('resend');
const hubspot = require('@hubspot/api-client');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Mètode no permès' }) };
  }

  return new Promise((resolve) => {
    const busboy = Busboy({ headers: event.headers });

    let fileBuffer;
    let fileName;
    let mimeType;
    let fields = {};

    busboy.on('file', (fieldname, file, info) => {
      const { filename, mimeType: type } = info;

      const allowed = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];

      if (!allowed.includes(type)) {
        busboy.emit('error', new Error('Tipus de fitxer no vàlid'));
        return;
      }

      fileName = filename;
      mimeType = type;

      const chunks = [];
      file.on('data', (d) => chunks.push(d));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('error', (err) => {
      resolve({ statusCode: 400, body: JSON.stringify({ error: err.message }) });
    });

    busboy.on('finish', async () => {
      try {
        // -------------------------
        // 0. HONEYPOT (anti-bot)
        // -------------------------
        if (fields.company_website) {
          return resolve({
            statusCode: 200,
            body: JSON.stringify({ ok: true })
          });
        }

        if (!fileBuffer || !fields.email) {
          throw new Error('Falten dades obligatòries');
        }

        const id = `${Date.now()}-${fileName}`;

        // -------------------------
        // 1. STORAGE (Netlify Blobs)
        // -------------------------
        const store = getStore('factures');

        await store.set(id, fileBuffer, {
          metadata: {
            email: fields.email,
            fileName,
            mimeType
          }
        });

        // -------------------------
        // 2. TRACKING (estat intern)
        // -------------------------
        const tracking = {
          id,
          status: 'stored',
          email: fields.email,
          createdAt: new Date().toISOString()
        };

        await store.set(`tracking-${id}.json`, JSON.stringify(tracking));

        // -------------------------
        // 3. EMAIL (Resend)
        // -------------------------
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: 'Factura <onboarding@resend.dev>',
          to: process.env.NOTIFY_EMAIL,
          subject: '📄 Nova factura rebuda',
          html: `
            <p>Nova factura rebuda</p>
            <p><b>Fitxer:</b> ${fileName}</p>
            <p><b>Email:</b> ${fields.email}</p>
            <p><b>ID:</b> ${id}</p>
          `,
          attachments: [
            {
              filename: fileName,
              content: fileBuffer.toString('base64')
            }
          ]
        });

        // -------------------------
        // 4. HUBSPOT (últim pas)
        // -------------------------
        const hubspotClient = new hubspot.Client({
          accessToken: process.env.HUBSPOT_ACCESS_TOKEN
        });

        let contactId;

        const search = await hubspotClient.crm.contacts.searchApi.doSearch({
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: 'EQ',
              value: fields.email
            }]
          }]
        });

        if (search.results.length > 0) {
          contactId = search.results[0].id;
        } else {
          const created = await hubspotClient.crm.contacts.basicApi.create({
            properties: { email: fields.email }
          });
          contactId = created.id;
        }

        await hubspotClient.crm.contacts.basicApi.update(contactId, {
          properties: {
            ultima_factura_data: new Date().toISOString(),
            nom_fitxer_factura: fileName,
            estat_factura: 'Processada OK'
          }
        });

        // -------------------------
        // RESPONSE
        // -------------------------
        resolve({
          statusCode: 200,
          body: JSON.stringify({
            ok: true,
            id,
            contactId
          })
        });

      } catch (err) {
        console.error(err);
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: err.message })
        });
      }
    });

    const body = Buffer.from(event.body, 'base64');
    busboy.end(body);
  });
};
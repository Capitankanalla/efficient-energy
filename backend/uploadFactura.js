// backend/uploadFactura.js
const Busboy = require('busboy');
const hubspot = require('@hubspot/api-client');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Mètode no permès' }) };
  }

  return new Promise((resolve) => {
    const busboy = Busboy({ headers: event.headers });
    let fileBuffer;
    let fileName;
    let fileType;
    let formDataFields = {}; // Per guardar email, secció, etc.

    // 1. Processar fitxers
    busboy.on('file', (fieldname, file, info) => {
      const { filename, mimeType } = info;
      
      // Validació estricta de tipus
      if (!mimeType.includes('pdf') && !mimeType.includes('image/jpeg') && !mimeType.includes('image/jpg')) {
        busboy.emit('error', new Error('Tipus de fitxer no vàlid. Només PDF o JPG.'));
        return;
      }

      fileName = filename;
      fileType = mimeType;
      const chunks = [];
      
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => { fileBuffer = Buffer.concat(chunks); });
    });

    // 2. Processar camps de text (email, secció, etc.)
    busboy.on('field', (name, val) => {
      formDataFields[name] = val;
    });

    // 3. Error handling
    busboy.on('error', (error) => {
      resolve({ statusCode: 400, body: JSON.stringify({ error: error.message }) });
    });

    // 4. Executar lògica un cop tot rebut
    busboy.on('finish', async () => {
      try {
        if (!fileBuffer || !formDataFields.email) {
          throw new Error('Falten dades obligatòries (fitxer o email).');
        }

        // --- A. AUTOMATITZACIÓ HUBSPOT ---
        const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });
        
        // Buscar o crear contacte
        let contactId;
        try {
          const searchResult = await hubspotClient.crm.contacts.searchApi.doSearch({
            filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: formDataFields.email }] }]
          });
          
          if (searchResult.results.length > 0) {
            contactId = searchResult.results[0].id;
          } else {
            const newContact = await hubspotClient.crm.contacts.basicApi.create({
              properties: { email: formDataFields.email }
            });
            contactId = newContact.id;
          }
        } catch (err) {
          console.error('Error HubSpot:', err);
          throw new Error('Error connectant amb HubSpot');
        }

        // Actualitzar contacte amb dades de la factura
        // Nota: Per pujar el fitxer físic a HubSpot cal la API de Files (més complex).
        // Aquesta solució guarda les metadades i avisa que s'ha rebut.
        await hubspotClient.crm.contacts.basicApi.update(contactId, {
          properties: {
            ultima_factura_data: new Date().toISOString(),
            nom_fitxer_factura: fileName,
            seccio_origen: formDataFields.section || 'web_general',
            estat_factura: 'Rebuda pendents de revisió' // Propietat personalitzada recomanada
          }
        });

        // --- B. NOTIFICACIÓ INTERNA (Opcional però recomanat) ---
        // Aquí pots afegir codi per enviar un email amb el 'fileBuffer' adjunt
        // utilitzant un servei com SendGrid, Mailgun o la mateixa integració de Netlify Email.

        resolve({
          statusCode: 200,
          body: JSON.stringify({ 
            message: 'Lead creat i factura processada', 
            contactId, 
            fileName 
          })
        });

      } catch (error) {
        console.error('Error crític:', error);
        resolve({ statusCode: 500, body: JSON.stringify({ error: error.message }) });
      }
    });

    // Netlify passa el body com a string base64 en multipart
    const bodyData = Buffer.from(event.body, 'base64');
    busboy.end(bodyData);
  });
};   
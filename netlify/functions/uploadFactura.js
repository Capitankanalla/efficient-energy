function bufferSplit(buffer, separator) {
  const parts = [];
  let start = 0;
  let index = buffer.indexOf(separator, start);

  while (index !== -1) {
    parts.push(buffer.slice(start, index));
    start = index + separator.length;
    index = buffer.indexOf(separator, start);
  }

  parts.push(buffer.slice(start));
  return parts;
}

function parseMultipart(bodyBuffer, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts = bufferSplit(bodyBuffer, delimiter)
    .map(part => part.slice(2)) // remove leading CRLF if present
    .filter(part => part.length > 0 && !part.equals(Buffer.from('--')));

  return parts.map(part => {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) return null;

    const headerText = part.slice(0, headerEnd).toString('utf8');
    const content = part.slice(headerEnd + 4, part.length - 2); // strip trailing CRLF

    const headers = {};
    headerText.split('\r\n').forEach(line => {
      const [name, value] = line.split(': ');
      if (name && value) headers[name.toLowerCase()] = value;
    });

    const disposition = headers['content-disposition'];
    if (!disposition) return null;

    const dispositionParts = disposition.split(';').map(p => p.trim());
    const namePart = dispositionParts.find(p => p.startsWith('name='));
    const filenamePart = dispositionParts.find(p => p.startsWith('filename='));
    const fieldName = namePart ? namePart.split('=')[1].replace(/(^"|"$)/g, '') : null;
    const filename = filenamePart ? filenamePart.split('=')[1].replace(/(^"|"$)/g, '') : null;

    return {
      name: fieldName,
      filename,
      type: headers['content-type'] || null,
      data: content,
    };
  }).filter(Boolean);
}

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' }),
      };
    }

    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType || !contentType.startsWith('multipart/form-data')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid Content-Type. Expected multipart/form-data' }),
      };
    }

    const boundaryMatch = contentType.match(/boundary=(.*)$/);
    if (!boundaryMatch) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Boundary not found in Content-Type header' }),
      };
    }
    const boundary = boundaryMatch[1];

    const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    const parts = parseMultipart(bodyBuffer, boundary);
    const filePart = parts.find(part => part.filename);
    const sectionPart = parts.find(part => part.name === 'section');

    if (!filePart) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No file found in upload' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Factura rebuda correctament',
        file: {
          fieldName: filePart.name,
          filename: filePart.filename,
          contentType: filePart.type,
          size: filePart.data.length,
        },
        section: sectionPart ? sectionPart.data.toString('utf8') : null,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error intern', error: error.message }),
    };
  }
};

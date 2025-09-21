// Ethan Shek - HTTP API Assignment

const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

// ==== Helpers for JSON/XML responses ====
const respondJSON = (res, status, obj) => {
  const responseJSON = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.write(responseJSON);
  res.end();
};

const respondXML = (res, status, obj) => {
  let responseXML = '<response>';
  responseXML += `<message>${obj.message}</message>`;
  if (obj.id) responseXML += `<id>${obj.id}</id>`;
  responseXML += '</response>';

  res.writeHead(status, { 'Content-Type': 'application/xml' });
  res.write(responseXML);
  res.end();
};

// Pick JSON or XML based on Accept header (default JSON)
const respond = (req, res, status, obj) => {
  const accept = req.headers.accept;
  if (accept && accept.includes('xml')) {
    respondXML(res, status, obj);
  } else {
    respondJSON(res, status, obj);
  }
};

// ==== Static file serving ====
const serveFile = (res, filePath, contentType, status = 200) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      respond(res, 500, { message: 'Internal Server Error', id: 'internal' });
      return;
    }
    res.writeHead(status, { 'Content-Type': contentType });
    res.write(data);
    res.end();
  });
};

// ==== Request Handler ====
const handleRequest = (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // --- Serve client.html ---
  if (pathname === '/' || pathname === '/client.html') {
    const clientPath = path.join(__dirname, 'client', 'client.html');
    serveFile(res, clientPath, 'text/html');
    return;
  }

  // --- Serve style.css ---
  if (pathname === '/style.css') {
    const cssPath = path.join(__dirname, 'client', 'style.css');
    serveFile(res, cssPath, 'text/css');
    return;
  }

  // --- API routes ---
  switch (pathname) {
    case '/success':
      respond(req, res, 200, { message: 'This is a successful response!' });
      break;

    case '/badRequest':
      if (query.valid === 'true') {
        respond(req, res, 200, { message: 'This request has the required parameters' });
      } else {
        respond(req, res, 400, { message: 'Missing valid query parameter set to true', id: 'badRequest' });
      }
      break;

    case '/unauthorized':
      if (query.loggedIn === 'yes') {
        respond(req, res, 200, { message: 'You have successfully viewed the content.' });
      } else {
        respond(req, res, 401, { message: 'Missing loggedIn query parameter set to yes', id: 'unauthorized' });
      }
      break;

    case '/forbidden':
      respond(req, res, 403, { message: 'You do not have access to this content.', id: 'forbidden' });
      break;

    case '/internal':
      respond(req, res, 500, { message: 'Internal server error. Something went wrong.', id: 'internal' });
      break;

    case '/notImplemented':
      respond(req, res, 501, { message: 'A GET request for this page has not been implemented yet.', id: 'notImplemented' });
      break;

    default:
      respond(req, res, 404, { message: 'The page you are looking for was not found.', id: 'notFound' });
      break;
  }
};

// ==== Create and start server ====
const PORT = process.env.PORT || 3000;
http.createServer(handleRequest).listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


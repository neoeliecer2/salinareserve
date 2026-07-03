const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  let filePath = req.url === '/' ? './index.html' : '.' + req.url;
  
  // Normalize paths and strip query params
  filePath = filePath.split('?')[0];
  const absolutePath = path.resolve(filePath);
  
  // Basic security check to prevent directory traversal outside workspace
  const workspacePath = path.resolve('.');
  if (!absolutePath.startsWith(workspacePath)) {
    res.statusCode = 403;
    res.end('Access Denied');
    return;
  }
  
  const ext = path.extname(absolutePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(absolutePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.statusCode = 404;
        res.end('File Not Found');
      } else {
        res.statusCode = 500;
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`La Salina Reserve Server is running at http://localhost:${PORT}`);
});

const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

const m = svg.match(/id="path3109"[^>]*d="([^"]+)"/);
if (m) {
  console.log('d starts with:', m[1].slice(0, 200));
}

const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

// Let's inspect paths inside layer1
const pathMatches = svg.match(/<path\b[^>]*>/g) || [];
console.log('Total paths:', pathMatches.length);

pathMatches.forEach((p, idx) => {
  const id = p.match(/id="([^"]+)"/)?.[1];
  const fill = p.match(/fill:[^;"]+/)?.[0];
  const d = p.match(/d="([^"]+)"/)?.[1];
  const start = d ? d.slice(0, 40) : '';
  if (idx < 10 || idx > pathMatches.length - 5) {
    console.log(`Path ${idx}: id=${id}, fill=${fill}, start=${start}`);
  }
});

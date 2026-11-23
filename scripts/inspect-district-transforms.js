const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

// In Inkscape SVG:
// layer1 has transform="translate(1177.7235, 694.14004)"
// Children of layer1 (groups g3107 to g3239) have transform="matrix(1.25,0,0,1.25,-1177.7231,-694.1366)"
// Let's verify what the transforms are for paths 2 to 37!

const lines = svg.split('\n');
const pathInfos = [];
let currentStack = [];

lines.forEach((line, idx) => {
  const gMatch = line.match(/<g\b([^>]*)>/);
  const gClose = line.match(/<\/g>/);
  const pathMatch = line.match(/<path\b([^>]*)\bd="([^"]+)"/);
  
  if (gMatch) {
    const id = gMatch[1].match(/id="([^"]+)"/)?.[1] || '';
    const tr = gMatch[1].match(/transform="([^"]+)"/)?.[1] || '';
    currentStack.push({ id, tr });
  }
  
  if (pathMatch) {
    const pId = pathMatch[1].match(/id="([^"]+)"/)?.[1] || '';
    const d = pathMatch[2];
    pathInfos.push({
      pId,
      stack: [...currentStack],
      d
    });
  }
  
  if (gClose) {
    currentStack.pop();
  }
});

console.log('Total pathInfos:', pathInfos.length);
pathInfos.slice(2, 6).forEach(p => {
  console.log(`Path ${p.pId}:`);
  p.stack.forEach(s => console.log(`   Group id=${s.id}, tr=${s.tr}`));
});

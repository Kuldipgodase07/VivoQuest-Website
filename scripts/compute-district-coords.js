const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

// Parse text items and compute their exact root (X, Y)
const lines = svg.split('\n');
const stack = [];
const districtCoords = {};

lines.forEach((line, idx) => {
  const gOpen = line.match(/<g\b([^>]*)>/);
  const gClose = line.match(/<\/g>/);
  
  if (gOpen) {
    const id = gOpen[1].match(/id="([^"]+)"/)?.[1] || 'no-id';
    const tr = gOpen[1].match(/transform="([^"]+)"/)?.[1] || '';
    
    // Parse translate(tx, ty)
    let tx = 0, ty = 0;
    const trMatch = tr.match(/translate\(([^,]+),([^)]+)\)/);
    if (trMatch) {
      tx = parseFloat(trMatch[1]);
      ty = parseFloat(trMatch[2]);
    }
    stack.push({ id, tx, ty });
  }
  
  const textMatch = line.match(/<text\b([^>]*)>([\s\S]*?)<\/text>/);
  if (textMatch) {
    const attrs = textMatch[1];
    const name = textMatch[2].replace(/<[^>]+>/g, '').trim();
    const x = parseFloat(attrs.match(/x="([^"]+)"/)?.[1] || '0');
    const y = parseFloat(attrs.match(/y="([^"]+)"/)?.[1] || '0');
    
    // Total translation
    let totalTx = 0, totalTy = 0;
    stack.forEach(s => {
      totalTx += s.tx;
      totalTy += s.ty;
    });
    
    const rootX = Math.round((x + totalTx) * 10) / 10;
    const rootY = Math.round((y + totalTy) * 10) / 10;
    
    districtCoords[name] = { rootX, rootY };
  }
  
  if (gClose) {
    stack.pop();
  }
});

console.log('Computed district coordinates (Root SVG 3105.78 x 2453.01):');
console.log(JSON.stringify(districtCoords, null, 2));

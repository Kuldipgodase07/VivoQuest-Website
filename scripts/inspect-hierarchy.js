const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

// Parse XML using a simple tree inspector
const lines = svg.split('\n');
const stack = [];
let count = 0;

lines.forEach((line, idx) => {
  const gOpen = line.match(/<g\b([^>]*)>/);
  const gClose = line.match(/<\/g>/);
  const textOpen = line.match(/<text\b([^>]*)>/);
  
  if (gOpen) {
    const id = gOpen[1].match(/id="([^"]+)"/)?.[1] || 'no-id';
    const tr = gOpen[1].match(/transform="([^"]+)"/)?.[1] || '';
    stack.push({ id, tr, line: idx + 1 });
  }
  
  if (textOpen && count < 6) {
    count++;
    const body = line.replace(/<[^>]+>/g, '').trim();
    console.log(`Text "${body}" at line ${idx+1}. Ancestor stack:`);
    stack.forEach(s => console.log(`  -> id=${s.id}, tr=${s.tr}`));
  }
  
  if (gClose) {
    stack.pop();
  }
});

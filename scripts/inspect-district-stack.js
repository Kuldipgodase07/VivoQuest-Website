const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

const lines = svg.split('\n');
const stack = [];

lines.forEach((line, idx) => {
  const gOpen = line.match(/<g\b([^>]*)>/);
  const gClose = line.match(/<\/g>/);
  
  if (gOpen) {
    const id = gOpen[1].match(/id="([^"]+)"/)?.[1] || 'no-id';
    const tr = gOpen[1].match(/transform="([^"]+)"/)?.[1] || '';
    stack.push({ id, tr, line: idx + 1 });
  }
  
  if (line.includes('>Pune<') || line.includes('>Mumbai') || line.includes('>Nagpur<')) {
    const body = line.replace(/<[^>]+>/g, '').trim();
    console.log(`Text "${body}" at line ${idx+1}. Ancestor stack:`);
    stack.forEach(s => console.log(`  -> id=${s.id}, tr=${s.tr}`));
  }
  
  if (gClose) {
    stack.pop();
  }
});

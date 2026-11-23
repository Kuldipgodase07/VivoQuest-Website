const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

console.log('SVG length:', svg.length);
console.log('width / height check:');
const wMatch = svg.match(/width="([^"]+)"/);
const hMatch = svg.match(/height="([^"]+)"/);
console.log('width:', wMatch ? wMatch[1] : null);
console.log('height:', hMatch ? hMatch[1] : null);

const gMatches = svg.match(/<g[^>]+id="([^"]+)"[^>]*>/g) || [];
console.log('\nAll top-level or named groups:');
gMatches.forEach(g => {
  const id = g.match(/id="([^"]+)"/)?.[1];
  console.log('Group ID:', id);
});

// Check text elements
const textMatches = svg.match(/<text[^>]*>[\s\S]*?<\/text>/g) || [];
console.log('\nText element count:', textMatches.length);
textMatches.slice(0, 10).forEach(t => {
  const content = t.replace(/<[^>]+>/g, '').trim();
  const x = t.match(/x="([^"]+)"/)?.[1];
  const y = t.match(/y="([^"]+)"/)?.[1];
  const tr = t.match(/transform="([^"]+)"/)?.[1];
  console.log(`Text: "${content}", x=${x}, y=${y}, tr=${tr}`);
});

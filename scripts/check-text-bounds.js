const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

// Find all text and pointers
const lines = svg.split('\n');
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

lines.forEach(l => {
  if (l.includes('<text') || l.includes('sodipodi:role="line"')) {
    const xm = l.match(/x="([^"]+)"/);
    const ym = l.match(/y="([^"]+)"/);
    if (xm && ym) {
      let x = parseFloat(xm[1]);
      let y = parseFloat(ym[1]);
      // In root coords: text had various transforms.
      // Let's check text lines
      console.log(`Text at x=${x}, y=${y}: ${l.replace(/<[^>]+>/g, '').trim()}`);
    }
  }
});

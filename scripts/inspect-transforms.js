const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

// Find all transforms
const transforms = [];
const trRegex = /<g[^>]+transform="([^"]+)"/g;
let m;
while (m = trRegex.exec(svg)) {
  transforms.push(m[1]);
}
console.log('Transforms found:', transforms);

// Find legend and district groups
const groups = svg.match(/<g[^>]+id="([^"]+)"[^>]*>/g) || [];
console.log('Found groups count:', groups.length);
groups.forEach(g => {
  const id = g.match(/id="([^"]+)"/)?.[1];
  const tr = g.match(/transform="([^"]+)"/)?.[1];
  const style = g.match(/style="([^"]+)"/)?.[1];
  if (['layer1', 'g2999', 'g4363', 'g4371', 'g4229', 'g4177'].includes(id) || id.includes('legend')) {
    console.log(`Group id=${id}, transform=${tr}`);
  }
});

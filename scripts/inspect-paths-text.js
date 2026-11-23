const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

// List all paths with their parent or id
const pathMatches = svg.match(/<path[^>]+>/g) || [];
console.log('Total path elements:', pathMatches.length);

// Sample some paths and see what fill and stroke they have
const fillCounts = {};
pathMatches.forEach(p => {
  const fill = p.match(/fill:([^;"]+)/)?.[1] || p.match(/fill="([^"]+)"/)?.[1] || 'none';
  fillCounts[fill] = (fillCounts[fill] || 0) + 1;
});
console.log('Fill distribution in paths:', fillCounts);

// Check text elements and locations
const textRegex = /<text\s+([^>]+)>([\s\S]*?)<\/text>/g;
let tm;
console.log('\nText items:');
while ((tm = textRegex.exec(svg)) !== null) {
  const attrs = tm[1];
  const body = tm[2].replace(/<[^>]+>/g, '').trim();
  const x = attrs.match(/x="([^"]+)"/)?.[1] || tm[2].match(/x="([^"]+)"/)?.[1];
  const y = attrs.match(/y="([^"]+)"/)?.[1] || tm[2].match(/y="([^"]+)"/)?.[1];
  console.log(`- "${body}" at x=${x}, y=${y}`);
}

const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-official.svg', 'utf8');

const swMatches = svg.match(/stroke-width:[^;"]+/gi) || [];
const swCounts = {};
swMatches.forEach(s => {
  swCounts[s] = (swCounts[s] || 0) + 1;
});
console.log('Stroke-widths in official SVG:', swCounts);

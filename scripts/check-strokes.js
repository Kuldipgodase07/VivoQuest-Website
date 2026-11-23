const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-official.svg', 'utf8');

const strokeMatches = svg.match(/stroke:[^;"]+/gi) || [];
const strokeCounts = {};
strokeMatches.forEach(s => {
  strokeCounts[s] = (strokeCounts[s] || 0) + 1;
});
console.log('Strokes in official SVG:', strokeCounts);

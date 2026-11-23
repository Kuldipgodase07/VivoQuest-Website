const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

// Check style blocks or inline styles
const styleMatches = svg.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];
console.log('Style blocks:', styleMatches.length);
if (styleMatches.length > 0) {
  console.log('Style block content:\n', styleMatches[0].slice(0, 500));
}

// Check sample district path
const districtSample = svg.match(/<path[^>]+id="path\d+"[^>]*>/);
console.log('\nSample path:\n', districtSample ? districtSample[0] : 'None');

// Check text font and styling
const textSample = svg.match(/<text[^>]+>[\s\S]*?<\/text>/);
console.log('\nSample text:\n', textSample ? textSample[0] : 'None');

const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

// Find legend groups and text
console.log('Legend text in SVG:');
const legendMatches = svg.match(/<text[^>]*>(?:(?!<\/text>)[\s\S])*?Division(?:(?!<\/text>)[\s\S])*?<\/text>/gi) || [];
legendMatches.forEach(t => console.log(t.replace(/<[^>]+>/g, '').trim()));

// Find legend swatches
const swatchMatches = svg.match(/<path[^>]+id="path34\d+"[^>]*>/g) || [];
console.log('Legend swatches:', swatchMatches.length);

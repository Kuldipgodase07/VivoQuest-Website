const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

console.log('Length:', svg.length);
console.log('viewBox:', svg.match(/viewBox="[^"]+"/)?.[0]);
console.log('Sample text tag:');
const tm = svg.match(/<text[^>]*>[\s\S]*?<\/text>/);
console.log(tm ? tm[0] : 'None');

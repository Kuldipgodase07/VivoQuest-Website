const fs = require('fs');
const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

['Pune', 'Nagpur', 'Nashik', 'Mumbai', 'Kolhapur'].forEach(name => {
  const reg = new RegExp('<text[^>]*>[\\s\\S]*?' + name + '[\\s\\S]*?<\\/text>', 'i');
  const m = svg.match(reg);
  if (m) console.log(name, m[0]);
});

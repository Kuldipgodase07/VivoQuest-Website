const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

// Let's check the root svg tag attributes
const rootMatch = svg.match(/<svg[^>]+>/);
console.log('Root SVG tag:');
console.log(rootMatch[0]);

// Let's find all path 'd' attributes and check coordinate ranges
const dRegex = /d="([^"]+)"/g;
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
let match;
while ((match = dRegex.exec(svg)) !== null) {
  const d = match[1];
  // extract numbers
  const nums = d.match(/-?[\d.]+/g);
  if (nums) {
    for (let i = 0; i < nums.length; i += 2) {
      const x = parseFloat(nums[i]);
      const y = parseFloat(nums[i+1]);
      if (!isNaN(x) && !isNaN(y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
}
console.log(`Raw coordinate range in paths: X[${minX}, ${maxX}], Y[${minY}, ${maxY}]`);

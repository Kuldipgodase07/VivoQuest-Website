const fs = require('fs');

const svg = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

const lines = svg.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('>Solapur<') || line.includes('>Jalna<')) {
    console.log(`Line ${idx+1}:`, line);
    for (let j = Math.max(0, idx - 8); j <= Math.min(lines.length - 1, idx + 4); j++) {
      console.log(`  ${j+1}: ${lines[j]}`);
    }
  }
});

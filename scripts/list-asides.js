const fs = require('fs');
const path = require('path');

const dir = 'vivoquest-frontend/public/screens';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const asideMatch = content.match(/<aside\b([^>]*)>/);
  if (asideMatch) {
    console.log(`${f}: aside tag: ${asideMatch[0]}`);
  }
});

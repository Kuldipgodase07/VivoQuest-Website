const fs = require('fs');
const path = require('path');

const dir = path.join('vivoquest-frontend', 'public', 'screens');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const asideMatch = content.match(/<aside\b[^>]*>/i);
  if (asideMatch) {
    const idx = asideMatch.index;
    const snippet = content.substring(idx, idx + 200).replace(/\n/g, ' ');
    console.log(`[${f}] ${asideMatch[0]} -> snippet: ${snippet.substring(0, 80)}...`);
  } else {
    const headerMatch = content.match(/<header\b[^>]*>/i);
    console.log(`[${f}] NO ASIDE -> header: ${headerMatch ? headerMatch[0] : 'NONE'}`);
  }
});

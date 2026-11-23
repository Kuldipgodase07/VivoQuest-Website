const fs = require('fs');
const path = require('path');

const dir = 'vivoquest-frontend/public/screens';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const hasAside = content.includes('<aside') || content.includes('sidebar');
  const hasCollapse = content.includes('collapse') || content.includes('minimize') || content.includes('toggle');
  console.log(`${f}: hasSidebar=${hasAside}, hasCollapse=${hasCollapse}`);
});

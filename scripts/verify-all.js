const fs = require('fs');
const path = require('path');

const dir = path.join('vivoquest-frontend', 'public', 'screens');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const hasAside = content.includes('<aside');
  const hasControls = content.includes('class="vq-sidebar-controls"');
  const hasBack = content.includes('vq-back-btn') || content.includes('vq-header-back-btn');
  const hasMin = content.includes('vq-minimize-btn');
  console.log(`[${f}] aside=${hasAside} | controls=${hasControls} | back=${hasBack} | minimize=${hasMin}`);
});

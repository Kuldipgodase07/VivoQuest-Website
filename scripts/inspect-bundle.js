const fs = require('fs');
const content = fs.readFileSync('VivoQuest Web App.html', 'utf8');
console.log('Size:', content.length);
const manifestMatch = content.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (manifestMatch) {
  const manifest = JSON.parse(manifestMatch[1]);
  console.log('Manifest keys count:', Object.keys(manifest).length);
  const pages = Object.keys(manifest).filter(k => k.endsWith('.html') || (manifest[k] && manifest[k].mime === 'text/html'));
  console.log('HTML pages in manifest:', pages);
}

const fs = require('fs');

const content = fs.readFileSync('VivoQuest Web App.html', 'utf8');
const manifestMatch = content.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (manifestMatch) {
  const manifest = JSON.parse(manifestMatch[1]);
  Object.keys(manifest).forEach(k => {
    const item = manifest[k];
    if (item.text) {
      const titleMatch = item.text.match(/<title>([^<]+)<\/title>/i);
      console.log(`Key ${k}: Title = ${titleMatch ? titleMatch[1] : 'No title'}`);
    }
  });
}

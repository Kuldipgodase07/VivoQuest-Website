const fs = require('fs');

const content = fs.readFileSync('VivoQuest Web App.html', 'utf8');
const manifestMatch = content.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (manifestMatch) {
  const manifest = JSON.parse(manifestMatch[1]);
  const firstKey = Object.keys(manifest)[0];
  console.log('firstKey:', firstKey);
  console.log('keys:', Object.keys(manifest[firstKey]));
  console.log('val starts with:', JSON.stringify(manifest[firstKey]).substring(0, 100));
}

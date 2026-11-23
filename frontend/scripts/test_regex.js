const fs = require('fs');

const line176 = `const table=(head,data)=>{const esc=(v)=>String(v).replace(/&/g,'&amp;').replace(/<\\/g,'&lt;');};`;
try {
  new Function(line176);
  console.log('line176 parsed OK');
} catch (e) {
  console.log('line176 error:', e.message);
}

const html = fs.readFileSync('frontend/public/screens/admin.html', 'utf8');
const start = html.indexOf('data-dc-script');
const scriptOpen = html.indexOf('>', start) + 1;
const scriptClose = html.indexOf('</script>', scriptOpen);
const js = html.substring(scriptOpen, scriptClose);

// Let's test lines one by one or blocks
const lines = js.split('\n');
for (let i = 0; i < lines.length; i++) {
  try {
    new Function(lines.slice(0, i + 1).join('\n'));
  } catch (e) {
    if (e.message.includes('Invalid regular expression')) {
      console.log(`Failed at line ${i + 1}: ${e.message}`);
      console.log('Line content:', lines[i]);
      break;
    }
  }
}

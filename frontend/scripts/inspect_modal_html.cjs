const fs = require('fs');
const html = fs.readFileSync('frontend/public/screens/landing.html', 'utf8');

const phrases = ['Sign in', 'MOBILE NUMBER', 'Send code', '9820011223', 'secure login code', 'auth', 'dialog', 'modal'];
for (const p of phrases) {
  let count = 0;
  let pos = -1;
  while ((pos = html.toLowerCase().indexOf(p.toLowerCase(), pos + 1)) !== -1) {
    count++;
    if (count <= 3) {
      console.log(`=== "${p}" match #${count} at ${pos} ===`);
      console.log(html.substring(Math.max(0, pos - 100), Math.min(html.length, pos + 250)));
    }
  }
  console.log(`Total "${p}": ${count}\n`);
}

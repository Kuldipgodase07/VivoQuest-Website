const fs = require('fs');

const admin = fs.readFileSync('vivoquest-frontend/public/screens/admin.html', 'utf8');

const s5 = admin.match(/<script>\s*window\.addEventListener\('click'[\s\S]*?<\/script>/);
if (s5) {
  console.log('Script 5 in admin.html:');
  console.log(s5[0]);
}

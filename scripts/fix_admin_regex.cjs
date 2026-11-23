const fs = require('fs');

const files = [
  'frontend/public/screens/admin.html',
  'vivoquest-frontend/public/screens/admin.html',
  'frontend/public/screens/AdministratorConsole.dc.html',
  'vivoquest-frontend/public/screens/AdministratorConsole.dc.html',
  'frontend/public/AdministratorConsole.dc.html',
  'vivoquest-frontend/public/AdministratorConsole.dc.html'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const target = "replace(/<\\/g,'&lt;')";
    if (content.includes(target)) {
      content = content.replaceAll(target, "replace(/</g,'&lt;')");
      fs.writeFileSync(file, content, 'utf8');
      console.log('Successfully fixed regex in:', file);
    } else {
      console.log('Target not found in:', file);
    }
  }
}

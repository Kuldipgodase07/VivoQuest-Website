const fs = require('fs');

const admin = fs.readFileSync('vivoquest-frontend/public/screens/admin.html', 'utf8');

const sideCss = admin.match(/\.side\s*\{[^}]+\}/g);
console.log('Side CSS in admin.html:', sideCss);

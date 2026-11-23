const fs = require('fs');

const admin = fs.readFileSync('vivoquest-frontend/public/screens/admin.html', 'utf8');

// Find sidebar markup in admin.html
const sidebarMatch = admin.match(/<aside[^>]*>[\s\S]*?<\/aside>/);
if (sidebarMatch) {
  console.log('Admin sidebar markup:');
  console.log(sidebarMatch[0].slice(0, 1500));
}

// Find sidebar collapse logic or CSS
const collapseMatch = admin.match(/collapse[\s\S]{0,200}/gi);
console.log('\nCollapse mentions in admin.html:', collapseMatch?.slice(0, 5));

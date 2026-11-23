const fs = require('fs');

const admin = fs.readFileSync('vivoquest-frontend/public/screens/admin.html', 'utf8');

const scriptMatches = admin.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) || [];
console.log('Total scripts in admin.html:', scriptMatches.length);
scriptMatches.forEach((s, idx) => {
  console.log(`Script ${idx} (first 200 chars):\n${s.slice(0, 200)}\n---`);
});

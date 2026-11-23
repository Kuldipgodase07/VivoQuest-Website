const fs = require('fs');

const dp = fs.readFileSync('vivoquest-frontend/public/screens/discharge-planner.html', 'utf8');

// Find header or navigation
const navMatch = dp.match(/<header\b[\s\S]*?<\/header>/);
console.log('Header in discharge-planner.html:');
console.log(navMatch ? navMatch[0].slice(0, 500) : 'None');

// Check top navigation
const topMatch = dp.match(/<div class="[^"]*nav[^"]*"[\s\S]*?<\/div>/);
console.log('\nTop nav in discharge-planner.html:');
console.log(topMatch ? topMatch[0].slice(0, 500) : 'None');

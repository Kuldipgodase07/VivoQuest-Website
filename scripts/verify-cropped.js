const fs = require('fs');
const s = fs.readFileSync('vivoquest-frontend/public/maharashtra-themed.svg', 'utf8');

const vb = s.match(/viewBox="[^"]+"/);
console.log('viewBox:', vb ? vb[0] : 'None');
console.log('Has ocean path2997:', s.includes('path2997'));
console.log('Has Amaravati Division legend text:', s.includes('Amaravati Division'));

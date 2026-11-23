const fs = require('fs');

let html = fs.readFileSync('frontend/public/screens/admin.html', 'utf8');

// Replace d="{{ n.icon }}" with sc-camel-d="{{ n.icon }}"
html = html.replace('d="{{ n.icon }}"', 'sc-camel-d="{{ n.icon }}"');
html = html.replace('points="{{ b.sp }}"', 'sc-camel-points="{{ b.sp }}"');
html = html.replace('const fl=(o)=>({...o,[\'f_\'+o.t]:true});', 'const fl=(o)=>({sub:\'\',...o,[\'f_\'+o.t]:true});');

fs.writeFileSync('frontend/public/screens/test_admin_clean.html', html, 'utf8');
console.log('Saved test_admin_clean.html');

const fs = require('fs');

const origLine = `const table=(head,data)=>{const esc=(v)=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;');return '<html><head><meta charset="utf-8"><' + '/head><body><sc-raw-table border=\"1\"><sc-raw-tr>'+head.map((h)=>'<sc-raw-th>'+esc(h)+'<' + '/sc-raw-th>').join('')+'<' + '/sc-raw-tr>'+data.map((r)=>'<sc-raw-tr>'+r.map((c)=>'<sc-raw-td>'+esc(c)+'<' + '/sc-raw-td>').join('')+'<' + '/sc-raw-tr>').join('')+'<' + '/sc-raw-table><' + '/body><' + '/html>';};`;

try {
  new Function(origLine);
  console.log('origLine parsed SUCCESS!');
} catch (e) {
  console.log('origLine error:', e.message);
}

// Let's test the entire admin.html script with this line fixed!
let html = fs.readFileSync('frontend/public/screens/admin.html', 'utf8');

// Replace the broken regex /<\/g with /</g
html = html.replace("replace(/<\\/g,'&lt;')", "replace(/</g,'&lt;')");

const start = html.indexOf('data-dc-script');
const scriptOpen = html.indexOf('>', start) + 1;
const scriptClose = html.indexOf('</script>', scriptOpen);
const js = html.substring(scriptOpen, scriptClose);

try {
  new Function(js);
  console.log('FULL ADMIN SCRIPT PARSED SUCCESSFULLY WITH ZERO ERRORS!!');
} catch (e) {
  console.log('Script still has error:', e.message);
}

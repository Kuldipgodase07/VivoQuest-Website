const fs = require('fs');

['admin.html', 'patient.html', 'nurse.html', 'caregiver.html', 'clinician.html'].forEach(f => {
  const content = fs.readFileSync('vivoquest-frontend/public/screens/' + f, 'utf8');
  const m = content.match(/<aside\b[^>]*>([\s\S]*?)<\/aside>/);
  if (m) {
    console.log(`\n=== ${f} ===`);
    const lines = m[0].split('\n');
    console.log('Total lines in aside:', lines.length);
    console.log('First 4 lines:\n', lines.slice(0, 4).join('\n'));
    console.log('Last 4 lines:\n', lines.slice(-4).join('\n'));
  }
});

const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, '..', 'vivoquest-frontend', 'public', 'screens'),
  path.join(__dirname, '..', 'frontend', 'public', 'screens')
];

const authGuardSnippet = '<script id="vq-auth-guard">(function(){if(window.top===window){try{var s=localStorage.getItem("vq_session")||sessionStorage.getItem("vq_session");if(!s&&window.location.pathname.indexOf("landing")===-1){window.location.replace("/signin");}}catch(e){}}})();</script>';

dirs.forEach(d => {
  if (!fs.existsSync(d)) return;
  const files = fs.readdirSync(d).filter(f => f.endsWith('.html') && !f.includes('landing'));
  let count = 0;
  files.forEach(f => {
    const p = path.join(d, f);
    let content = fs.readFileSync(p, 'utf8');
    if (!content.includes('vq-auth-guard')) {
      content = content.replace('</head>', authGuardSnippet + '\n</head>');
      fs.writeFileSync(p, content, 'utf8');
      count++;
    }
  });
  console.log(`Protected ${count} / ${files.length} screens in ${d}`);
});

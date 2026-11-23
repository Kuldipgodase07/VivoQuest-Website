const fs = require('fs');

const updatedHtmlMap = `<div style="position:relative;width:100%;max-width:580px;background:transparent;border:none;padding:0;overflow:visible"><svg viewBox="10 80 3070 2180" style="width:100%;height:auto;display:block"><image href="/maharashtra-themed.svg" x="10" y="80" width="3070" height="2180" preserveAspectRatio="xMidYMid meet" /><g stroke="#4520B8" stroke-width="8" stroke-dasharray="18 12" opacity="0.45" fill="none"><path d="M120,1261 L477,1048 L686,1319"></path><path d="M686,1319 L731,1647 L740,2073"></path><path d="M120,1261 L717,764 L900,496 L1177,550"></path><path d="M686,1319 L869,1047 L1029,856 L1363,936"></path><path d="M1029,856 L1457,690 L1714,590 L1866,510 L2237,610 L2391,447"></path></g><g><circle r="36" fill="#10B981" stroke="#fff" stroke-width="8"><animateMotion path="M120,1261 L477,1048 L686,1319" dur="9s" repeatCount="indefinite"></animateMotion></circle><circle r="50" fill="none" stroke="#10B981" stroke-width="6"><animateMotion path="M120,1261 L477,1048 L686,1319" dur="9s" repeatCount="indefinite"></animateMotion><animate attributeName="r" values="30;85;30" dur="2s" repeatCount="indefinite"></animate><animate attributeName="opacity" values="0.9;0;0.9" dur="2s" repeatCount="indefinite"></animate></circle></g><g><circle r="38" fill="#EF4444" stroke="#fff" stroke-width="8"><animateMotion path="M686,1319 L731,1647 L740,2073" dur="11s" repeatCount="indefinite"></animateMotion></circle><circle r="50" fill="none" stroke="#EF4444" stroke-width="6"><animateMotion path="M686,1319 L731,1647 L740,2073" dur="11s" repeatCount="indefinite"></animateMotion><animate attributeName="r" values="30;90;30" dur="1.6s" repeatCount="indefinite"></animate><animate attributeName="opacity" values="1;0;1" dur="1.6s" repeatCount="indefinite"></animate></circle></g><g><circle r="36" fill="#3B82F6" stroke="#fff" stroke-width="8"><animateMotion path="M1029,856 L1457,690 L1714,590 L1866,510 L2237,610 L2391,447" dur="14s" repeatCount="indefinite"></animateMotion></circle><circle r="50" fill="none" stroke="#3B82F6" stroke-width="6"><animateMotion path="M1029,856 L1457,690 L1714,590 L1866,510 L2237,610 L2391,447" dur="14s" repeatCount="indefinite"></animateMotion><animate attributeName="r" values="30;80;30" dur="2s" repeatCount="indefinite"></animate><animate attributeName="opacity" values="0.9;0;0.9" dur="2s" repeatCount="indefinite"></animate></circle></g><g transform="translate(120,1261)"><circle r="14" fill="#fff" stroke="#17143A" stroke-width="4"></circle></g><g transform="translate(686,1319)"><circle r="14" fill="#fff" stroke="#17143A" stroke-width="4"></circle></g><g transform="translate(717,764)"><circle r="14" fill="#fff" stroke="#17143A" stroke-width="4"></circle></g><g transform="translate(1029,856)"><circle r="14" fill="#fff" stroke="#17143A" stroke-width="4"></circle></g><g transform="translate(740,2073)"><circle r="14" fill="#fff" stroke="#17143A" stroke-width="4"></circle></g><g transform="translate(2391,447)"><circle r="14" fill="#fff" stroke="#17143A" stroke-width="4"></circle></g></svg></div>`;

const files = [
  'vivoquest-frontend/public/screens/remote-desk.html',
  'frontend/public/screens/remote-desk.html',
  'vivoquest-frontend/public/screens/admin.html',
  'frontend/public/screens/admin.html'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    // Replace previous SVG box
    content = content.replace(/<div style="[^"]*max-width:540px[^"]*background:#F[79]F[58]FF[^"]*"[\s\S]*?<\/svg><\/div>/gi, updatedHtmlMap);
    content = content.replace(/<div style="flex:1\.2;min-width:280px;max-width:540px;background:#F7F5FF[^"]*"[\s\S]*?<\/svg><\/div>/gi, updatedHtmlMap);
    fs.writeFileSync(f, content);
    console.log(`Updated screen file: ${f}`);
  }
});

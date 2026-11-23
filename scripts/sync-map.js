const fs = require('fs');

const src = fs.readFileSync('vivoquest-frontend/src/components/MaharashtraLiveTrackingMap.tsx', 'utf8');
fs.writeFileSync('frontend/src/components/MaharashtraLiveTrackingMap.tsx', src, 'utf8');
console.log('Synced MaharashtraLiveTrackingMap.tsx');

const fs = require('fs');

const cleanAuthPage = fs.readFileSync('frontend/src/features/auth/AuthPage.tsx', 'utf8');
fs.writeFileSync('vivoquest-frontend/src/features/auth/AuthPage.tsx', cleanAuthPage, 'utf8');
console.log('Successfully overwritten vivoquest-frontend AuthPage with clean version! Length:', cleanAuthPage.length);

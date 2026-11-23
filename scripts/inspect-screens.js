const fs = require('fs');
const path = require('path');

const screens = ['discharge-planner.html', 'health-plan.html', 'remote-desk.html'];
screens.forEach(f => {
  const p = path.join('vivoquest-frontend', 'public', 'screens', f);
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, 'utf8');
  console.log('=== ' + f + ' ===');
  // Check for headers, navs, asides
  const asides = content.match(/<aside[^>]*>/gi);
  const navs = content.match(/<nav[^>]*>/gi);
  const headers = content.match(/<header[^>]*>/gi);
  console.log('asides:', asides);
  console.log('navs:', navs);
  console.log('headers:', headers);
  // Find top-level structure inside <div class="app"> or body
  const appMatch = content.match(/<div class="app"[^>]*>([\s\S]{0,500})/i);
  if (appMatch) {
    console.log('app first 500 chars:', appMatch[1].replace(/<style[\s\S]*?<\/style>/g, '').trim());
  }
});

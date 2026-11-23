import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  
  page.on('console', msg => {
    console.log(`[PAGE ${msg.type().toUpperCase()}]:`, msg.text());
  });
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]:', err);
  });

  const testUrl = 'file:///' + path.resolve(__dirname, '../public/screens/test_admin_clean.html').replace(/\\/g, '/');
  console.log('Navigating to:', testUrl);
  await page.goto(testUrl);
  await page.waitForTimeout(2000);

  // Check if nav icons rendered properly with d attribute
  const iconPath = await page.$eval('.navb svg path', el => el.getAttribute('d')).catch(() => 'NOT FOUND');
  console.log('Nav icon d attribute:', iconPath ? iconPath.substring(0, 30) + '...' : 'NONE');

  // Check if b.sub warning is gone
  console.log('Done checking test_admin_clean.html');

  await browser.close();
})();

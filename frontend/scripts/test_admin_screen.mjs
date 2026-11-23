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

  const adminUrl = 'file:///' + path.resolve(__dirname, '../public/screens/admin.html').replace(/\\/g, '/');
  console.log('Navigating to:', adminUrl);
  await page.goto(adminUrl);
  await page.waitForTimeout(3000);

  const titleText = await page.$eval('h1.h1', el => el.innerText).catch(() => 'NOT FOUND');
  console.log('h1.h1 text:', titleText);

  const eyebrowText = await page.$eval('.eyebrow', el => el.innerText).catch(() => 'NOT FOUND');
  console.log('.eyebrow text:', eyebrowText);

  await page.screenshot({ path: path.resolve(__dirname, '../../admin_rendered.png') });
  console.log('Saved admin_rendered.png');

  await browser.close();
})();

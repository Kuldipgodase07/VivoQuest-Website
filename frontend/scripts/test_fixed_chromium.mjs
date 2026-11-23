import { chromium } from '@playwright/test';
import path from 'path';

async function testFixed() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  const tplPath = path.resolve('C:/Users/YASH/.gemini/antigravity/brain/ee35c765-f053-4afd-bc4b-9bbf5d2b58bd/scratch/fixed_admin_tpl.html');
  await page.goto(`file://${tplPath}`, { waitUntil: 'load' });
  
  const result = await page.evaluate(() => {
    const scriptEl = document.querySelector('script[data-dc-script]');
    if (!scriptEl) return { error: 'no script' };
    const code = scriptEl.textContent;
    try {
      new Function('DCLogic', 'StreamableLogic', 'React', code + '\n;return (typeof Component!=="undefined"&&Component)||undefined;');
      return { success: true, length: code.length };
    } catch (e) {
      return { error: e.message, stack: e.stack };
    }
  });

  console.log('Result in Chromium:', result);
  await browser.close();
}

testFixed().catch(console.error);

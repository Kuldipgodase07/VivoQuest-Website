import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function testLanding() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  const screenPath = path.resolve(projectRoot, 'public/screens/landing.html');
  console.log('Navigating to:', `file://${screenPath}`);
  await page.goto(`file://${screenPath}`, { waitUntil: 'load' });
  
  await page.waitForTimeout(1500);
  
  // If city modal is open, click to select Mumbai
  try {
    const cityBtn = await page.$('.cm-c');
    if (cityBtn) {
      console.log('City modal found, clicking first city (Mumbai)...');
      await cityBtn.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {
    console.log('City modal click error:', e.message);
  }
  
  const screenshotPath = path.resolve(projectRoot, 'public/landing_rendered.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to:', screenshotPath);
  
  const title = await page.title();
  console.log('Page title:', title);
  
  await browser.close();
}

testLanding().catch(console.error);

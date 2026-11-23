import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const origPath = path.resolve(__dirname, '../../VivoQuest Web App.html');
  await page.goto('file:///' + origPath.replace(/\\/g, '/'));
  await page.waitForTimeout(2500);

  // Get first iframe
  const frameHandle = await page.$('section.board:first-child iframe');
  const frame = await frameHandle.contentFrame();
  
  console.log('Frame title:', await frame.title());
  
  // Find buttons inside frame
  const buttons = await frame.$$eval('button', btns => btns.map(b => b.innerText.trim()));
  console.log('Buttons inside first frame:', buttons);

  // Click Sign In inside the frame!
  const signInBtn = await frame.$('button:has-text("Sign in")');
  if (signInBtn) {
    console.log('Found Sign in button in frame, clicking...');
    await signInBtn.click();
    await page.waitForTimeout(1000);
    
    // Screenshot frame
    await frameHandle.screenshot({ path: path.resolve(__dirname, '../../orig_frame_signin_clicked.png') });
    console.log('Saved frame screenshot to orig_frame_signin_clicked.png');
    
    // Check what popped up or changed in the frame
    const modal = await frame.evaluate(() => {
      // Find visible elements with text 'Sign in' or 'mobile'
      const els = Array.from(document.querySelectorAll('*'));
      const active = els.filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 200 && r.height > 200 && (e.innerText.includes('Sign in') || e.innerText.includes('Mobile') || e.innerText.includes('code'));
      });
      return active.map(e => ({ tag: e.tagName, cls: e.className, id: e.id, text: e.innerText.substring(0, 200) }));
    });
    console.log('Visible elements matching auth:', modal);
  } else {
    console.log('No Sign in button in frame');
  }

  await browser.close();
})();

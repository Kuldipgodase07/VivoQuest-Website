const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const filePath = path.resolve('..', 'VivoQuest Web App.html');
  await page.goto('file:///' + filePath.replace(/\\/g, '/'));
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: '../orig_landing_check.png' });
  
  // Find all buttons on page
  const buttons = await page.$$eval('button', btns => btns.map(b => ({ text: b.innerText.trim(), id: b.id, className: b.className })));
  console.log('Buttons on original page count:', buttons.length);
  
  // Click sign in
  const btn = await page.$('button:has-text("Sign in")');
  if (btn) {
    console.log('Clicking Sign in button...');
    await btn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '../orig_signin_clicked.png' });
    
    // Dump visible text and HTML of any modal or dialog
    const modalHtml = await page.evaluate(() => {
      const el = document.querySelector('.modal, [role="dialog"], [class*="auth"], [class*="modal"]');
      return el ? el.outerHTML : 'No modal container found';
    });
    console.log('Modal HTML snippet:', modalHtml.substring(0, 1500));
  } else {
    console.log('No Sign in button found');
  }
  
  await browser.close();
})();

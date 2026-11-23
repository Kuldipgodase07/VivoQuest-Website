import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import http from 'http';

const projectRoot = 'E:/VivoQuest Web App/frontend';

function waitForServer(port, timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}/`, res => resolve());
      req.on('error', err => {
        if (Date.now() - start > timeout) reject(new Error('Server timeout: ' + err.message));
        else setTimeout(check, 300);
      });
    };
    check();
  });
}

async function findExactErrorLocation() {
  const server = spawn('cmd.exe', ['/c', 'npx', 'vite', 'preview', '--port', '4184'], {
    cwd: projectRoot,
    stdio: 'pipe'
  });

  await waitForServer(4184);

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    let caughtError = null;
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:4184/screens/admin.html', { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    const result = await page.evaluate(() => {
      const scriptEl = document.querySelector('script[data-dc-script]');
      const code = scriptEl.textContent;
      try {
        new Function('DCLogic', 'StreamableLogic', 'React', code + '\n;return (typeof Component!=="undefined"&&Component)||undefined;');
        return { success: true };
      } catch (e) {
        return { message: e.message, stack: e.stack };
      }
    });

    console.log('Direct eval result:', result);

    await browser.close();
  } finally {
    server.kill();
  }
}

findExactErrorLocation().catch(console.error);

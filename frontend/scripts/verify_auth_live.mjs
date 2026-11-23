import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
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

async function verifyAuthLive() {
  const server = spawn('cmd.exe', ['/c', 'npx', 'vite', 'preview', '--port', '4177'], {
    cwd: projectRoot,
    stdio: 'pipe'
  });

  await waitForServer(4177);
  console.log('Server is responsive on port 4177!');

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    console.log('Navigating to http://localhost:4177/signin');
    await page.goto('http://localhost:4177/signin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const snapPath = path.resolve(projectRoot, 'public/auth_page_live.png');
    await page.screenshot({ path: snapPath, fullPage: false });
    console.log('Saved auth screenshot to:', snapPath);

    await browser.close();
  } finally {
    server.kill();
  }
}

verifyAuthLive().catch(err => {
  console.error(err);
  process.exit(1);
});

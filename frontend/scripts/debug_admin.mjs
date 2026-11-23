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

async function debugAdmin() {
  const server = spawn('cmd.exe', ['/c', 'npx', 'vite', 'preview', '--port', '4180'], {
    cwd: projectRoot,
    stdio: 'pipe'
  });

  await waitForServer(4180);

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]:`, msg.text()));
    page.on('pageerror', err => console.log('[PAGE ERROR]:', err));

    console.log('Navigating to http://localhost:4180/screens/admin.html');
    await page.goto('http://localhost:4180/screens/admin.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await browser.close();
  } finally {
    server.kill();
  }
}

debugAdmin().catch(console.error);

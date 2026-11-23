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

async function testAdmin() {
  const server = spawn('cmd.exe', ['/c', 'npx', 'vite', 'preview', '--port', '4179'], {
    cwd: projectRoot,
    stdio: 'pipe'
  });

  await waitForServer(4179);

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    console.log('Navigating to http://localhost:4179/screens/admin.html');
    await page.goto('http://localhost:4179/screens/admin.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const titleEl = await page.$('h1.h1');
    const titleText = titleEl ? await titleEl.innerText() : null;
    console.log('Rendered Admin Title:', titleText);

    const hasTitleWarning = logs.some(l => l.includes('{{ title }} never resolved'));
    console.log('Has {{ title }} never resolved warning?', hasTitleWarning);

    await browser.close();
  } finally {
    server.kill();
  }
}

testAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});

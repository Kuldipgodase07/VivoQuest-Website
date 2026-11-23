import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function waitForServer(port, timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}/`, res => {
        resolve();
      });
      req.on('error', err => {
        if (Date.now() - start > timeout) {
          reject(new Error('Server timeout: ' + err.message));
        } else {
          setTimeout(check, 300);
        }
      });
    };
    check();
  });
}

async function verifyLive() {
  console.log('Starting preview server in:', projectRoot);
  const server = spawn('cmd.exe', ['/c', 'npx', 'vite', 'preview', '--port', '4173'], {
    cwd: projectRoot,
    stdio: 'pipe'
  });

  server.stdout.on('data', data => console.log('SERVER:', data.toString().trim()));
  server.stderr.on('data', data => console.log('SERVER ERR:', data.toString().trim()));

  console.log('Waiting for preview server on port 4173...');
  await waitForServer(4173);
  console.log('Server is responsive!');

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    console.log('Navigating to http://localhost:4173/');
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

    await page.waitForTimeout(1500);

    // Look inside iframe for city modal
    const frame = page.frameLocator('iframe');
    const cityBtn = frame.locator('.cm-c').first();
    const isVisible = await cityBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (isVisible) {
      console.log('City modal detected in iframe! Clicking Mumbai...');
      await cityBtn.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('City modal not visible or already closed.');
    }

    const snapPath = path.resolve(projectRoot, 'public/live_app_landing.png');
    await page.screenshot({ path: snapPath, fullPage: false });
    console.log('Live application screenshot saved to:', snapPath);

    await browser.close();
  } finally {
    server.kill();
  }
}

verifyLive().catch(err => {
  console.error('verifyLive error:', err);
  process.exit(1);
});

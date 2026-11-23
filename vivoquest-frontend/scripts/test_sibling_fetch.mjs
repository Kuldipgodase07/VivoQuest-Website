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
      const req = http.get(`http://localhost:${port}/`, res => resolve());
      req.on('error', err => {
        if (Date.now() - start > timeout) reject(new Error('Server timeout: ' + err.message));
        else setTimeout(check, 300);
      });
    };
    check();
  });
}

async function testSiblingFetch() {
  const server = spawn('cmd.exe', ['/c', 'npx', 'vite', 'preview', '--port', '4174'], {
    cwd: projectRoot,
    stdio: 'pipe'
  });

  await waitForServer(4174);
  console.log('Preview server ready on 4174');

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    const errors = [];
    const logs = [];

    page.on('console', msg => {
      const txt = msg.text();
      logs.push(txt);
      if (txt.includes('sibling fetch') || txt.includes('error') || msg.type() === 'error') {
        console.log('CONSOLE:', txt);
      }
    });

    page.on('pageerror', err => {
      errors.push(err.message);
      console.log('PAGE ERROR:', err.message);
    });

    console.log('Navigating to http://localhost:4174/screens/landing.html');
    await page.goto('http://localhost:4174/screens/landing.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasSiblingError = logs.some(l => l.includes('sibling fetch for "AdultVaccination"') && l.includes('has no <x-dc> block'));
    console.log('Has sibling fetch error?', hasSiblingError);

    await browser.close();
  } finally {
    server.kill();
  }
}

testSiblingFetch().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

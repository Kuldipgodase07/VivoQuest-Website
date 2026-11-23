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

async function inspectSignInDom() {
  const server = spawn('cmd.exe', ['/c', 'npx', 'vite', 'preview', '--port', '4178'], {
    cwd: projectRoot,
    stdio: 'pipe'
  });

  await waitForServer(4178);

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto('http://localhost:4178/signin', { waitUntil: 'networkidle' });
    
    const h2 = await page.$('h2');
    console.log('h2 found?', !!h2);
    if (h2) {
      console.log('h2 text:', await h2.innerText());
      console.log('h2 box:', await h2.boundingBox());
    }

    const formText = await page.evaluate(() => document.body.innerText);
    console.log('Body inner text preview:');
    console.log(formText.slice(0, 1000));

    await browser.close();
  } finally {
    server.kill();
  }
}

inspectSignInDom().catch(console.error);

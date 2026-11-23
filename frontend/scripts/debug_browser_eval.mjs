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

async function debugScriptInBrowser() {
  const server = spawn('cmd.exe', ['/c', 'npx', 'vite', 'preview', '--port', '4181'], {
    cwd: projectRoot,
    stdio: 'pipe'
  });

  await waitForServer(4181);

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto('http://localhost:4181/screens/admin.html', { waitUntil: 'load' });
    
    // Evaluate in page context
    const evalResult = await page.evaluate(() => {
      const scriptEl = document.querySelector('script[data-dc-script]');
      if (!scriptEl) return { error: 'No scriptEl' };
      const code = scriptEl.textContent;
      try {
        new Function('DCLogic', 'StreamableLogic', 'React', code + '\n;return (typeof Component!=="undefined"&&Component)||undefined;');
        return { success: true, length: code.length };
      } catch (e) {
        return { error: e.message, stack: e.stack, codeSnippet: code.slice(0, 300) };
      }
    });

    console.log('Eval result in browser:', evalResult);

    await browser.close();
  } finally {
    server.kill();
  }
}

debugScriptInBrowser().catch(console.error);

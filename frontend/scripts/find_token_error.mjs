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

async function findExactTokenError() {
  const server = spawn('cmd.exe', ['/c', 'npx', 'vite', 'preview', '--port', '4182'], {
    cwd: projectRoot,
    stdio: 'pipe'
  });

  await waitForServer(4182);

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto('http://localhost:4182/screens/admin.html', { waitUntil: 'load' });
    
    const result = await page.evaluate(() => {
      const scriptEl = document.querySelector('script[data-dc-script]');
      const full = scriptEl.textContent;
      
      // Binary search lines
      const lines = full.split('\n');
      let low = 0;
      let high = lines.length;
      let errLine = -1;
      let errMsg = '';

      for (let i = 1; i <= lines.length; i++) {
        const sub = lines.slice(0, i).join('\n');
        try {
          new Function(sub);
        } catch (e) {
          if (e.message.includes('Invalid or unexpected token') || (!e.message.includes('Unexpected end of input') && !e.message.includes('missing ) after argument list'))) {
            errLine = i;
            errMsg = e.message;
            break;
          }
        }
      }

      return {
        errLine,
        errMsg,
        lineText: errLine > 0 ? lines[errLine - 1] : null,
        prevLine: errLine > 1 ? lines[errLine - 2] : null,
        nextLine: errLine < lines.length ? lines[errLine] : null
      };
    });

    console.log('Exact token error result:', result);

    await browser.close();
  } finally {
    server.kill();
  }
}

findExactTokenError().catch(console.error);

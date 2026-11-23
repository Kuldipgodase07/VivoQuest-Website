import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

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

function testFetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, length: data.length, hasXDc: data.includes('<x-dc>') });
      });
    }).on('error', reject);
  });
}

async function verifyAllComponents() {
  const server = spawn('cmd.exe', ['/c', 'npx', 'vite', 'preview', '--port', '4176'], {
    cwd: projectRoot,
    stdio: 'pipe'
  });

  await waitForServer(4176);
  console.log('Server is responsive on port 4176!');

  const components = [
    'AdultVaccination',
    'Marketplace',
    'Patient',
    'Nurse',
    'Caregiver',
    'Clinician',
    'AdministratorConsole'
  ];

  for (const c of components) {
    const res1 = await testFetch(`http://localhost:4176/screens/${c}.dc.html`);
    console.log(`/screens/${c}.dc.html => status: ${res1.status}, len: ${res1.length}, has <x-dc>: ${res1.hasXDc}`);

    const res2 = await testFetch(`http://localhost:4176/${c}.dc.html`);
    console.log(`/${c}.dc.html => status: ${res2.status}, len: ${res2.length}, has <x-dc>: ${res2.hasXDc}`);
  }

  server.kill();
  process.exit(0);
}

verifyAllComponents().catch(err => {
  console.error(err);
  process.exit(1);
});

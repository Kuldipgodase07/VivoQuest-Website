const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[36m%s\x1b[0m', '   Starting VivoQuest Backend & Frontend...     ');
console.log('\x1b[36m%s\x1b[0m', '================================================\n');

function runService(name, cwd, commandStr, color) {
  const child = spawn(commandStr, {
    cwd: path.resolve(rootDir, cwd),
    shell: true,
    env: process.env
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trimEnd().split('\n');
    lines.forEach((line) => {
      console.log(`${color}[${name}]\x1b[0m ${line}`);
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trimEnd().split('\n');
    lines.forEach((line) => {
      console.error(`${color}[${name}]\x1b[0m ${line}`);
    });
  });

  child.on('close', (code) => {
    if (code !== null) {
      console.log(`${color}[${name}]\x1b[0m exited with code ${code}`);
    }
  });

  return child;
}

// Cyan for Backend (NestJS + TypeScript on Port 8080)
// Magenta for Frontend (Vite + React on Port 5173 / 3000)
const backendProcess = runService('Backend', 'backend', `${npmCmd} run start:dev`, '\x1b[36m');
const frontendProcess = runService('Frontend', 'vivoquest-frontend', `${npmCmd} run dev`, '\x1b[35m');

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down VivoQuest services...');
  if (isWin) {
    if (backendProcess.pid) spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t'], { shell: true });
    if (frontendProcess.pid) spawn('taskkill', ['/pid', frontendProcess.pid, '/f', '/t'], { shell: true });
  } else {
    backendProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
  }
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

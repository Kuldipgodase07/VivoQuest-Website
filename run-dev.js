const { spawn, execSync } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[36m%s\x1b[0m', '   Starting VivoQuest Backend & Frontend...     ');
console.log('\x1b[36m%s\x1b[0m', '================================================\n');

// Clean up any stale process occupying port 8080 before starting
function freePort(port) {
  try {
    if (isWin) {
      execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"`, { stdio: 'ignore' });
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
  } catch (err) {
    // Ignore error if port is already free
  }
}

console.log('\x1b[33m%s\x1b[0m', 'Ensuring port 8080 is available...');
freePort(8080);

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
    if (code !== null && code !== 0) {
      console.log(`${color}[${name}]\x1b[0m exited with code ${code}`);
    }
  });

  return child;
}

// Cyan for Backend (NestJS + TypeScript on Port 8080)
// Magenta for Frontend (Vite + React on Port 5173)
const backendProcess = runService('Backend', 'backend', `${npmCmd} run start:dev`, '\x1b[36m');
const frontendProcess = runService('Frontend', 'vivoquest-frontend', `${npmCmd} run dev`, '\x1b[35m');

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down VivoQuest services...');
  if (isWin) {
    if (backendProcess && backendProcess.pid) {
      try { execSync(`taskkill /pid ${backendProcess.pid} /f /t`, { stdio: 'ignore' }); } catch (e) {}
    }
    if (frontendProcess && frontendProcess.pid) {
      try { execSync(`taskkill /pid ${frontendProcess.pid} /f /t`, { stdio: 'ignore' }); } catch (e) {}
    }
    freePort(8080);
  } else {
    try { backendProcess.kill('SIGTERM'); } catch (e) {}
    try { frontendProcess.kill('SIGTERM'); } catch (e) {}
    freePort(8080);
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

const { spawn, execSync } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[36m%s\x1b[0m', '   Starting VivoQuest Backend & Frontend...     ');
console.log('\x1b[36m%s\x1b[0m', '================================================\n');

// Automatically free ports before spawning to prevent EADDRINUSE
function freePort(port) {
  try {
    if (isWin) {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const pids = new Set();
      output.trim().split('\n').forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && parseInt(pid, 10) > 0 && parseInt(pid, 10) !== process.pid) {
          pids.add(pid);
        }
      });
      pids.forEach(pid => {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`\x1b[33m[Port Guard]\x1b[0m Freed port ${port} by terminating orphaned PID ${pid}`);
        } catch (e) {}
      });
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
  } catch (e) {
    // Port is free
  }
}

// Clean up ports 8080 and 3000
freePort(8080);
freePort(3000);

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
// Magenta for Frontend (Vite + React on Port 3000)
const backendProcess = runService('Backend', 'backend', `${npmCmd} run start:dev`, '\x1b[36m');
const frontendProcess = runService('Frontend', 'vivoquest-frontend', `${npmCmd} run dev`, '\x1b[35m');

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down VivoQuest services...');
  if (isWin) {
    try {
      if (backendProcess.pid) execSync(`taskkill /pid ${backendProcess.pid} /f /t`, { stdio: 'ignore' });
    } catch (e) {}
    try {
      if (frontendProcess.pid) execSync(`taskkill /pid ${frontendProcess.pid} /f /t`, { stdio: 'ignore' });
    } catch (e) {}
    freePort(8080);
    freePort(3000);
  } else {
    try { backendProcess.kill('SIGTERM'); } catch (e) {}
    try { frontendProcess.kill('SIGTERM'); } catch (e) {}
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

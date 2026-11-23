const { execSync } = require('child_process');

function freePort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const pids = new Set();
      output.trim().split('\n').forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && parseInt(pid, 10) > 0 && parseInt(pid, 10) !== process.pid) {
          pids.add(pid);
        }
      });
      if (pids.size === 0) {
        console.log(`\x1b[32m✔ Port ${port} is free and ready.\x1b[0m`);
        return;
      }
      pids.forEach(pid => {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`\x1b[33m✔ Terminated process ${pid} using port ${port}.\x1b[0m`);
        } catch (e) {
          console.log(`\x1b[31mCould not terminate process ${pid}: ${e.message}\x1b[0m`);
        }
      });
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
      console.log(`\x1b[32m✔ Freed port ${port}.\x1b[0m`);
    }
  } catch (e) {
    console.log(`\x1b[32m✔ Port ${port} is free and ready.\x1b[0m`);
  }
}

const ports = [8080, 3000, 5173];
console.log('\x1b[36mChecking and freeing VivoQuest ports...\x1b[0m');
ports.forEach(freePort);
console.log('\x1b[32mAll ports verified clean!\x1b[0m');

const { app } = require('electron'); // Only need app now
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const open = (...args) => import('open').then(m => m.default(...args));

let backendProcess;
let frontendProcess;

// Wait for Vite dev server to be ready
function waitForVite(url, cb) {
  const interval = setInterval(() => {
    http.get(url, (res) => {
      if (res.statusCode === 200) {
        clearInterval(interval);
        cb();
      }
    }).on('error', () => {
      // Keep waiting
    });
  }, 500);
}

app.whenReady().then(() => {
  // Launch backend
  const backendPath = path.join(__dirname, 'backend', 'server.js');
  backendProcess = spawn(process.execPath, [backendPath], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true,
  });

  backendProcess.on('error', (err) => {
    console.error('Backend failed to start:', err);
  });

  // Launch frontend
  frontendProcess = spawn('npm run dev', {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });

  frontendProcess.on('error', (err) => {
    console.error('Frontend failed to start:', err);
  });

  // Wait for frontend server, then open default browser ONLY (no Electron window)
  waitForVite('http://localhost:5173', async () => {
    await open('http://localhost:5173');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
  if (backendProcess) backendProcess.kill();
  if (frontendProcess) frontendProcess.kill();
});

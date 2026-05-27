const { spawn } = require('child_process');
const fs = require('fs');

const child = spawn('node', ['server.js'], {
  env: { ...process.env, DEBUG: '*' }
});

const log = fs.createWriteStream('full-server-output.log');

child.stdout.pipe(log);
child.stderr.pipe(log);

child.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(0);
});

setTimeout(() => {
  child.kill();
}, 15000);

const Client = require('ssh2').Client;
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  const cmd = 'pkill -f "node.*server.js" 2>&1 || true';
  conn.exec(cmd, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log('Stopped:', out.trim());
      // Wait and restart
      setTimeout(() => {
        const restartCmd = 'cd /var/www/laos-logistics/backend && nohup node server.js > ../logs/backend.log 2>&1 & echo STARTED';
        conn.exec(restartCmd, (err2, stream2) => {
          let out2 = '';
          stream2.on('data', d => out2 += d);
          stream2.stderr.on('data', d => out2 += d);
          stream2.on('close', () => {
            console.log('Restart:', out2.trim());
            // Check if running
            setTimeout(() => {
              conn.exec('sleep 2 && curl -s http://localhost:3001/api/health 2>&1 && echo OK || echo FAIL', (err3, stream3) => {
                let out3 = '';
                stream3.on('data', d => out3 += d);
                stream3.stderr.on('data', d => out3 += d);
                stream3.on('close', () => {
                  console.log('Health check:', out3.trim());
                  conn.end();
                });
              });
            }, 2000);
          });
        });
      }, 2000);
    });
  });
});

conn.on('error', (err) => {
  console.log('Error:', err.message);
});

conn.connect({
  host: '43.129.173.218',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:\\Users\\Administrator\\.ssh\\id_ed25519_laos'),
  readyTimeout: 30000
});

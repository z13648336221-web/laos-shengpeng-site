$sshPath = "C:\Windows\System32\OpenSSH\ssh.exe"
$keyPath = "C:\Users\Administrator\.ssh\id_ed25519_laos"
$server = "ubuntu@43.129.173.218"

$script = @'
const fs = require('fs');
const crypto = require('crypto');

const filePath = '/var/www/laos-logistics/backend/database/data.json';
const newPassword = 'admin123';

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (data.data && data.data.admins && data.data.admins.length > 0) {
        const hash = crypto.createHash('sha256').update(newPassword).digest('hex');
        data.data.admins[0].password = hash;
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log('SUCCESS');
        console.log('Username:', data.data.admins[0].username);
        console.log('New Password:', newPassword);
    } else {
        console.log('ERROR: No admin found');
    }
} catch (error) {
    console.log('ERROR:', error.message);
}
'@

$script | Out-File -FilePath "C:\temp\reset_pwd.js" -Encoding utf8

& $sshPath -i $keyPath $server "mkdir -p /tmp && cat > /tmp/reset_pwd.js << 'EOF'
$script
EOF
cd /var/www/laos-logistics/backend && node /tmp/reset_pwd.js"
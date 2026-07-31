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
        console.log('✅ 密码已重置成功！');
        console.log('用户名:', data.data.admins[0].username);
        console.log('新密码:', newPassword);
        console.log('新哈希:', hash);
    } else {
        console.log('❌ 未找到管理员账户');
    }
} catch (error) {
    console.error('❌ 修改密码失败:', error.message);
}
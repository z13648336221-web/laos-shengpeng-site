import paramiko
import os

host = '43.129.173.218'
port = 22
username = 'root'
key_path = r'F:\hengciwebsite\hengciglobal.pem'
local_dir = r'f:\Laos shengpeng site'
remote_dir = '/var/www/laos-logistics'

files_to_upload = [
    'index.html',
    'about.html',
    'tracking.html',
    'news.html',
    'service-rail.html',
    'service-road.html',
    'service-thai.html',
    'service-thai-rail.html',
    'service-viet.html',
    'service-viet-rail.html',
    'lang/zh.js',
    'lang/en.js',
    'lang/vi.js',
    'lang/all.js',
    'js/i18n.js',
    'js/main.js',
    'js/chat.js',
    'js/tracking.js',
    'js/inquiry.js',
    'js/news-api.js',
    'css/style.css',
    'css/admin.css',
    'css/chat.css'
]

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    # Try RSA key
    pkey = paramiko.RSAKey.from_private_key_file(key_path)
    ssh.connect(host, port, username, pkey=pkey, banner_timeout=200, auth_timeout=200)
    print(f"✓ 成功连接到服务器 {host} (RSA密钥)")
    
    sftp = ssh.open_sftp()
    
    success = 0
    for file in files_to_upload:
        local_path = os.path.join(local_dir, file)
        remote_path = os.path.join(remote_dir, file)
        
        if os.path.exists(local_path):
            sftp.put(local_path, remote_path)
            print(f"✓ 上传成功: {file}")
            success += 1
        else:
            print(f"✗ 文件不存在: {local_path}")
    
    sftp.close()
    ssh.close()
    print(f"\n✅ {success}/{len(files_to_upload)} 个文件上传完成!")

except Exception as e:
    print(f"❌ 上传失败: {str(e)}")

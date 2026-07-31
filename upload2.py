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
    
    # 尝试多种密钥格式
    try:
        private_key = paramiko.RSAKey.from_private_key_file(key_path)
        print("✓ 使用 RSA 密钥")
    except:
        try:
            private_key = paramiko.Ed25519Key.from_private_key_file(key_path)
            print("✓ 使用 Ed25519 密钥")
        except:
            # 尝试加载通用私钥
            from paramiko.ssh_exception import SSHException
            with open(key_path, 'r') as f:
                key_data = f.read()
            
            private_key = None
            for key_class in [paramiko.RSAKey, paramiko.DSSKey, paramiko.Ed25519Key, paramiko.EllipticCurveKey]:
                try:
                    private_key = key_class.from_private_key_file(key_path)
                    print(f"✓ 使用 {key_class.__name__} 密钥")
                    break
                except:
                    continue
            
            if not private_key:
                raise Exception("无法识别密钥格式")
    
    ssh.connect(host, port, username, pkey=private_key, banner_timeout=200)
    
    sftp = ssh.open_sftp()
    
    for file in files_to_upload:
        local_path = os.path.join(local_dir, file)
        remote_path = os.path.join(remote_dir, file)
        
        if os.path.exists(local_path):
            sftp.put(local_path, remote_path)
            print(f"✓ 上传成功: {file}")
        else:
            print(f"✗ 文件不存在: {local_path}")
    
    sftp.close()
    ssh.close()
    print("\n✅ 所有文件上传完成!")

except Exception as e:
    print(f"❌ 上传失败: {str(e)}")
    print("\n💡 可能的解决方案:")
    print("1. 检查私钥文件路径是否正确")
    print("2. 确认服务器已添加公钥到 authorized_keys")
    print("3. 检查服务器防火墙是否允许22端口")

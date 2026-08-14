# Node.js 服务启动问题调试

## 问题分析

从 SSH 连接的输出可以看到：

```
USER@VM-0-2-ubuntu:/var/www/laos-logistics/backend# nohup node server.js > /dev/null 2>&1 &
[1] 3789552
USER@VM-0-2-ubuntu:/var/www/laos-logistics/backend# curl http://localhost:3001/api/news
curl: (7) Failed to connect to localhost port 3001 after 0 ms: Couldn't connect to server
[1]+  Exit 1                  nohup node server.js > /dev/null 2>&1 &
```

**原因**: Node.js 服务启动失败，进程立即退出（Exit 1）。

## 🔍 可能的原因

### 1. 数据库初始化失败
从 server.js 代码可以看到：
```javascript
db.init().then(async () => {
  await initDefaultAdmin();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);  // 这里会导致退出
});
```

### 2. 环境变量缺失
- `.env` 文件可能不存在或配置错误
- 数据库路径可能不正确

### 3. 依赖版本问题
```
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'better-sqlite3@13.0.2',
npm warn EBADENGINE   required: { node: '>=22' },
npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
}
```

### 4. 文件权限问题
- 数据库文件权限
- 日志文件权限

## 🔧 调试步骤

### 1. 检查环境变量
```bash
cd /var/www/laos-logistics/backend
cat .env
```

### 2. 手动启动服务查看错误
```bash
cd /var/www/laos-logistics/backend
node server.js
```

这样可以看到具体的错误信息。

### 3. 检查数据库文件
```bash
cd /var/www/laos-logistics/backend
ls -la database/
```

### 4. 检查日志文件
```bash
cd /var/www/laos-logistics/backend
cat server.log
```

## 🚀 解决方案

### 方案 1: 修复依赖版本问题

服务器运行的是 Node.js v18.20.8，但 some 依赖需要 Node.js >= 20。

#### 选项 A: 升级 Node.js
```bash
# 在服务器上执行
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # 应该显示 v20.x
```

#### 选项 B: 降级依赖版本
修改 `package.json`，使用兼容 Node.js 18 的版本：
```json
{
  "better-sqlite3": "^9.0.0",
  "node-cron": "^3.0.0"
}
```

### 方案 2: 确保环境变量正确

检查 `.env` 文件：
```bash
cd /var/www/laos-logistics/backend
cat .env
```

应该包含：
```
PORT=3001
NODE_ENV=production
```

### 方案 3: 检查数据库文件

确保数据库文件存在且有正确权限：
```bash
cd /var/www/laos-logistics/backend
ls -la database/
chmod 644 database/shengpeng.db
chmod 755 database/
```

### 方案 4: 初始化数据库

如果数据库文件损坏或不存在：
```bash
cd /var/www/laos-logistics/backend
node scripts/init-sqlite.js
```

## 📊 改进的部署步骤

### 1. 先手动启动调试
```bash
cd /var/www/laos-logistics/backend
node server.js
```

### 2. 根据错误信息修复问题
- 如果是数据库问题：修复数据库
- 如果是依赖问题：修复依赖
- 如果是环境变量问题：修复配置

### 3. 确认服务正常启动
```bash
cd /var/www/laos-logistics/backend
node server.js &  # 后台运行
sleep 5
curl http://localhost:3001/api/news
```

### 4. 使用 nohup 启动
```bash
cd /var/www/laos-logistics/backend
nohup node server.js > server.log 2>&1 &
```

## 🔄 更新部署脚本

### 更新后的服务器启动步骤
```yaml
- name: Restart Node.js service
  uses: appleboy/ssh-action@master
  with:
    script: |
      pkill -f "node.*server.js" || true
      cd /var/www/laos-logistics/backend
      nohup node server.js > server.log 2>&1 &
      sleep 5
      echo "Node.js service restarted"
      echo "Checking service status..."
      if ps aux | grep "node.*server.js" | grep -v grep; then
        echo "Service is running"
      else
        echo "Service failed to start"
        echo "Server log:"
        cat server.log
        exit 1
      fi
```

### 添加日志检查
这样可以：
1. 查看服务是否启动
2. 如果失败，显示错误日志
3. 便于调试问题

## 🎯 立即建议

### 1. 先手动调试
```bash
ssh -i "C:\Users\Administrator\.ssh\id_ed25519_laos" USER@SERVER_IP_REDACTED
cd /var/www/laos-logistics/backend
node server.js
```

### 2. 查看具体错误
根据输出的错误信息确定具体问题。

### 3. 修复问题
根据错误信息选择对应的解决方案。

### 4. 验证修复
修复后再次手动启动确认服务正常。

### 5. 使用 CI/CD
确认服务正常后，再使用 GitHub Actions 自动部署。

## 📝 预期错误信息

### 数据库初始化失败
```
数据库初始化失败: Error: SQLITE_CANTOPEN: unable to open database file
```
**解决**: 检查数据库文件路径和权限

### 环境变量缺失
```
Error: .env file not found
```
**解决**: 确保上传了 .env 文件

### 依赖版本不兼容
```
Error: The module '...' was compiled against a different Node.js version
```
**解决**: 升级 Node.js 或降级依赖版本

## 🆘 如果问题持续

如果手动启动仍然失败：

1. **检查 Node.js 版本**
   ```bash
   node -v
   npm -v
   ```

2. **重新安装依赖**
   ```bash
   cd /var/www/laos-logistics/backend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **检查系统资源**
   ```bash
   free -h
   df -h
   ```

4. **查看系统日志**
   ```bash
   journalctl -xe
   ```

优先手动调试确定具体问题，然后再修复 GitHub Actions 部署流程。
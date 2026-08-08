# SCP 上传错误修复

## 问题分析

错误信息：
```
tar: Cowardly refusing to create an empty archive
```

**原因**: drone-scp-action 在尝试创建 tar 归档时遇到问题，可能是源文件路径或格式不正确。

## 🔧 修复方案

### 修复方法：分步上传

将单一的 SCP 上传拆分为多个步骤：

1. **创建远程目录** - 确保目标目录存在
2. **上传 HTML 文件** - 单独上传 HTML 文件
3. **上传 public 目录** - 单独上传 public 目录
4. **上传 backend 目录** - 单独上传 backend 目录

### 修复后的工作流

```yaml
- name: Create remote directories
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST || '43.129.173.218' }}
    username: ${{ secrets.SERVER_USER || 'root' }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    port: ${{ secrets.SSH_PORT || '22' }}
    script: |
      mkdir -p /var/www/laos-logistics/public/admin
      mkdir -p /var/www/laos-logistics/public/services
      mkdir -p /var/www/laos-logistics/public/css
      mkdir -p /var/www/laos-logistics/public/js
      mkdir -p /var/www/laos-logistics/public/lang

- name: Upload HTML files
  uses: appleboy/scp-action@master
  with:
    host: ${{ secrets.SERVER_HOST || '43.129.173.218' }}
    username: ${{ secrets.SERVER_USER || 'root' }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    port: ${{ secrets.SSH_PORT || '22' }}
    source: "index.html,about.html,inquiry.html,tracking.html,news.html"
    target: /var/www/laos-logistics/
    strip_components: 0

- name: Upload public directory
  uses: appleboy/scp-action@master
  with:
    host: ${{ secrets.SERVER_HOST || '43.129.173.218' }}
    username: ${{ secrets.SERVER_USER || 'root' }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    port: ${{ secrets.SSH_PORT || '22' }}
    source: "public/"
    target: /var/www/laos-logistics/
    strip_components: 0

- name: Upload backend directory
  uses: appleboy/scp-action@master
  with:
    host: ${{ secrets.SERVER_HOST || '43.129.173.218' }}
    username: ${{ secrets.SERVER_USER || 'root' }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    port: ${{ secrets.SSH_PORT || '22' }}
    source: "backend/"
    target: /var/www/laos-logistics/
    strip_components: 0
```

## 📊 优势

### 1. 更好的错误处理
- 每个步骤独立执行
- 更容易定位问题
- 不会因为一个文件问题影响整个部署

### 2. 更快的部署
- 只上传必要的文件
- 避免创建大型归档
- 减少网络传输时间

### 3. 更好的可见性
- 每个步骤都有明确的状态
- 更容易监控部署进度
- 便于调试

## 🔄 备用方案

如果 SCP 问题仍然存在，可以考虑：

### 方案 1: 使用 rsync
```yaml
- name: Deploy using rsync
  uses: burnett01/rsync-deployments@5.1.0
  with:
    switches: -avzr --delete
    path: ./
    remote_path: /var/www/laos-logistics/
    remote_host: ${{ secrets.SERVER_HOST }}
    remote_user: ${{ secrets.SERVER_USER }}
    remote_key: ${{ secrets.SSH_PRIVATE_KEY }}
```

### 方案 2: 使用 SSH + tar
```yaml
- name: Deploy using SSH tar
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USER }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      cd /var/www/laos-logistics
      # 使用 git pull 或其他方式部署
```

### 方案 3: 手动部署作为备份
```bash
# 使用现有的部署脚本
node deploy-simple.js
```

## 🎯 当前状态

### 已修复
- ✅ 拆分上传步骤
- ✅ 创建远程目录
- ✅ 分步上传文件

### 需要配置
- ⚠️ SSH_PRIVATE_KEY (必须配置)

### 建议配置
- 📝 确保私钥格式正确
- 📝 测试 SSH 连接
- 📝 验证文件路径

## 📝 配置验证

### 1. 验证 SSH 密钥
```bash
# 测试本地密钥连接
ssh -i C:/Users/Administrator/.ssh/id_ed25519_laos root@43.129.173.218
```

### 2. 验证文件路径
```bash
# 确认文件存在
ls -la index.html
ls -la public/
ls -la backend/
```

### 3. 验证 GitHub Secret
- 进入 GitHub Actions Secrets 页面
- 确认 SSH_PRIVATE_KEY 已配置
- 确保密钥格式正确

## 🚀 下一步

1. **配置 SSH_PRIVATE_KEY**
   - 使用本地密钥配置 GitHub Secret
   - 确保密钥格式正确

2. **测试部署**
   - 推送代码到 main 分支
   - 观察部署状态

3. **监控执行**
   - 查看每个步骤的执行状态
   - 检查是否有其他错误

## 📞 如果问题继续

如果 SCP 问题仍然存在：

1. **使用手动部署**
   ```bash
   node deploy-simple.js
   ```

2. **简化工作流**
   - 暂时只保留 SSH 命令执行
   - 手动处理文件上传

3. **考虑其他工具**
   - 研究其他 GitHub Actions 部署工具
   - 考虑使用 Git 部署

当前的修复应该解决 tar 归档问题，分步上传更稳定可靠。
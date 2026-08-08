# SSH 密钥配置修复指南

## 问题分析

错误信息：
```
ssh.ParsePrivateKey: ssh: no key found
ssh: handshake failed: ssh: unable to authenticate
```

**原因**: SSH_PRIVATE_KEY Secret 未正确配置或格式不正确。

## 🔧 解决方案

### 方案 1: 正确配置 SSH_PRIVATE_KEY

#### 1. 检查本地私钥

```bash
# 查看私钥文件
cat C:/Users/Administrator/.ssh/id_ed25519_laos
```

正确的私钥格式应该包含：
```
-----BEGIN OPENSSH PRIVATE KEY-----
...密钥内容...
-----END OPENSSH PRIVATE KEY-----
```

#### 2. 完整复制私钥

确保复制了**完整**的私钥内容，包括：
- BEGIN 行
- 所有密钥内容
- END 行
- 所有的换行符

#### 3. 在 GitHub 中配置 Secret

1. 进入 GitHub 仓库页面
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
4. 配置如下：
   - **Name**: `SSH_PRIVATE_KEY` (必须完全匹配)
   - **Value**: 粘贴完整的私钥内容
5. 点击 `Add secret`

#### 4. 验证 Secret 配置

配置后，检查 Secret 是否正确显示：
- 应该显示 "Updated" 时间
- 值应该是隐藏的（显示为 •••••••••）

### 方案 2: 使用 GitHub 自托管 Runner（备用方案）

如果 GitHub Actions SSH 配置有问题，可以考虑使用 GitHub 自托管 Runner。

### 方案 3: 简化部署流程（临时方案）

暂时手动部署，等 SSH 配置解决后再使用 CI/CD。

## 🔍 验证步骤

### 1. 验证本地 SSH 连接

```bash
# 测试本地密钥是否可以连接
ssh -i C:/Users/Administrator/.ssh/id_ed25519_laos root@43.129.173.218
```

如果这个连接成功，说明密钥本身是正确的。

### 2. 验证服务器配置

```bash
# 登录到服务器
ssh root@43.129.173.218

# 检查 authorized_keys
cat ~/.ssh/authorized_keys

# 确认公钥是否存在
```

### 3. 检查 GitHub Secret

1. 进入 GitHub 仓库 → Settings → Secrets and variables → Actions
2. 找到 `SSH_PRIVATE_KEY`
3. 确认它存在且不是空的
4. 如果怀疑有问题，删除并重新配置

## 🚨 常见错误

### 错误 1: 只复制了部分密钥
**问题**: 只复制了密钥内容，没有包含 BEGIN/END 行
**解决**: 重新复制完整的私钥内容

### 错误 2: Secret 名称不匹配
**问题**: Secret 名称不是 `SSH_PRIVATE_KEY`
**解决**: 确保名称完全匹配（区分大小写）

### 错误 3: 密钥格式不正确
**问题**: 密钥文件损坏或格式不正确
**解决**: 重新生成密钥对并配置

### 错误 4: 服务器未配置公钥
**问题**: 服务器的 authorized_keys 中没有对应的公钥
**解决**: 将公钥添加到服务器的 authorized_keys

## 🔄 重新配置步骤

### 1. 删除现有 Secret
1. 进入 GitHub Actions Secrets 页面
2. 找到 `SSH_PRIVATE_KEY`
3. 点击删除

### 2. 重新生成密钥对（可选）
```bash
# 生成新的专用密钥
ssh-keygen -t ed25519 -a 256 -f C:/Users/Administrator/.ssh/github_deploy -C "github-actions@laos-logistics"
```

### 3. 添加公钥到服务器
```bash
# 复制新公钥
cat C:/Users/Administrator/.ssh/github_deploy.pub

# 登录到服务器
ssh root@43.129.173.218

# 添加到 authorized_keys
echo "公钥内容" >> ~/.ssh/authorized_keys
```

### 4. 配置新的 Secret
使用新生成的私钥配置 GitHub Secret。

### 5. 测试连接
```bash
# 测试新密钥
ssh -i C:/Users/Administrator/.ssh/github_deploy root@43.129.173.218
```

## 📋 配置检查清单

在配置 SSH_PRIVATE_KEY 之前，请确认：

- [ ] 本地密钥可以成功连接到服务器
- [ ] 服务器已配置对应的公钥
- [ ] 复制了完整的私钥内容（包括 BEGIN/END 行）
- [ ] Secret 名称是 `SSH_PRIVATE_KEY`（完全匹配）
- [ ] 没有多余的空格或换行符
- [ ] 使用的是 OpenSSH 格式的密钥

## 🆘 临时解决方案

如果 SSH 配置暂时无法解决，可以：

1. **使用手动部署**
   ```bash
   node deploy-simple.js
   ```

2. **使用服务器脚本**
   ```bash
   # 在服务器上执行
   bash /var/www/laos-logistics/scripts/auto-deploy.sh
   ```

3. **简化工作流**
   暂时禁用 SSH Action，只保留测试工作流。

## 📞 获取帮助

如果问题仍然存在：

1. **查看完整日志**
   - GitHub Actions 日志会显示详细的错误信息
   - 注意检查具体的错误步骤

2. **检查 GitHub 文档**
   - [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
   - [SSH Action 文档](https://github.com/appleboy/ssh-action)

3. **服务器连接测试**
   - 确认服务器 SSH 服务正常运行
   - 检查防火墙设置
   - 验证网络连接

## 🎯 建议优先级

1. **立即执行**: 使用本地密钥手动部署，确保网站正常运行
2. **短期解决**: 重新配置 SSH_PRIVATE_KEY Secret
3. **长期方案**: 考虑使用 GitHub 自托管 Runner 或其他 CI/CD 工具

## 📝 配置模板

### 正确的 Secret 配置

**Name**: `SSH_PRIVATE_KEY`

**Value**: 
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAb3BlbnNzaC1rZXktdjEAAAAACbBAAB...
...完整的密钥内容...
...确保包含所有行...
-----END OPENSSH PRIVATE KEY-----
```

确保复制了所有内容，不要遗漏任何部分。
# SSH 密钥配置指南

## GitHub Actions SSH 密钥配置

### 1. 生成 SSH 密钥对

如果还没有 SSH 密钥，需要先生成一对：

```bash
# 在本地机器上生成新的 SSH 密钥
ssh-keygen -t ed25519 -a 256 -f ~/.ssh/github_actions_deploy -C "github-actions@laos-logistics"
```

### 2. 添加公钥到服务器

将公钥添加到服务器的 authorized_keys：

```bash
# 复制公钥内容
cat ~/.ssh/github_actions_deploy.pub

# 登录到服务器
ssh root@43.129.173.218

# 添加公钥到 authorized_keys
mkdir -p ~/.ssh
echo "公钥内容" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 3. 配置 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets：

#### 3.1 进入仓库设置
1. 进入 GitHub 仓库页面
2. 点击 Settings → Secrets and variables → Actions
3. 点击 "New repository secret"

#### 3.2 添加必要的 Secrets

需要添加以下 Secrets：

| Secret 名称 | 描述 | 示例值 |
|------------|------|--------|
| `SERVER_HOST` | 服务器地址 | `43.129.173.218` |
| `SERVER_USER` | SSH 用户名 | `root` |
| `SSH_PORT` | SSH 端口 | `22` |
| `SSH_PRIVATE_KEY` | SSH 私钥 | 私钥的完整内容 |

#### 3.3 添加 SSH_PRIVATE_KEY

1. 复制私钥内容（包括 BEGIN 和 END 行）：
```bash
cat ~/.ssh/github_actions_deploy
```

2. 在 GitHub 中添加 Secret：
   - Name: `SSH_PRIVATE_KEY`
   - Value: 粘贴完整的私钥内容

### 4. 测试 SSH 连接

在本地测试 SSH 连接是否正常：

```bash
ssh -i ~/.ssh/github_actions_deploy root@43.129.173.218
```

### 5. 配置服务器权限

确保服务器上的目录权限正确：

```bash
# 在服务器上执行
chmod 755 /var/www/laos-logistics
chmod 755 /var/www/laos-logistics/backend
chmod 644 /var/www/laos-logistics/backend/*
```

### 6. 安全注意事项

⚠️ **重要安全提醒**：

1. **密钥安全**
   - 不要将私钥提交到代码仓库
   - 使用专用的部署密钥，不要使用个人密钥
   - 定期轮换密钥

2. **权限控制**
   - 部署密钥应该只有最小必要权限
   - 限制密钥只能用于特定操作

3. **监控**
   - 监控 GitHub Actions 的执行日志
   - 定期检查 Secrets 的使用情况

### 7. 故障排除

#### 问题：SSH 连接失败
```bash
# 检查密钥权限
chmod 600 ~/.ssh/github_actions_deploy

# 测试连接
ssh -vvv -i ~/.ssh/github_actions_deploy root@43.129.173.218
```

#### 问题：权限被拒绝
```bash
# 在服务器上检查 authorized_keys
cat ~/.ssh/authorized_keys

# 检查文件权限
ls -la ~/.ssh/
```

#### 问题：密钥格式错误
- 确保复制了完整的私钥（包括 BEGIN 和 END 行）
- 确保没有额外的空格或换行

### 8. 回滚和备份管理

#### 查看可用备份
```bash
ssh root@43.129.173.218 "ls -la /var/www/backups/"
```

#### 手动回滚
```bash
ssh root@43.129.173.218
cd /var/www/backups
# 找到需要的备份时间戳
./scripts/rollback.sh <TIMESTAMP>
```

### 9. 自动化部署流程

#### 完整的 CI/CD 流程：
1. 代码推送到 main 分支
2. GitHub Actions 自动触发
3. 运行测试工作流
4. 创建服务器备份
5. 部署新代码
6. 验证部署
7. 清理旧备份

#### 手动触发部署：
1. 进入 GitHub Actions 页面
2. 选择 "Deploy to Production Server" 工作流
3. 点击 "Run workflow"
4. 选择分支并运行

#### 手动回滚：
1. 进入 GitHub Actions 页面
2. 选择 "Rollback Deployment" 工作流
3. 点击 "Run workflow"
4. 输入备份时间戳并运行

### 10. 维护建议

1. **定期检查**
   - 每月检查 Secrets 是否需要更新
   - 检查备份策略是否有效

2. **监控日志**
   - 定期查看部署日志
   - 监控部署成功率

3. **优化流程**
   - 根据实际使用情况调整工作流
   - 优化部署时间
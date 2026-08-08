#!/bin/bash

# 自动化部署脚本
# 用途：在服务器上执行自动化部署操作

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_DIR="/var/www/laos-logistics"
BACKUP_DIR="/var/www/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/www/deployments/deploy_${TIMESTAMP}.log"

# 创建日志目录
mkdir -p /var/www/deployments

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "开始自动化部署"

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    log "错误: 项目目录不存在: $PROJECT_DIR"
    exit 1
fi

# 创建备份
log "创建备份..."
mkdir -p "$BACKUP_DIR"
cp -r "$PROJECT_DIR" "$BACKUP_DIR/laos-logistics_${TIMESTAMP}"
log "备份完成: $BACKUP_DIR/laos-logistics_${TIMESTAMP}"

# 清理旧备份 (保留最近5个)
log "清理旧备份..."
cd "$BACKUP_DIR"
ls -t laos-logistics_* | tail -n +6 | xargs -r rm -rf
log "旧备份清理完成"

# 安装后端依赖
log "安装后端依赖..."
cd "$PROJECT_DIR/backend"
npm install --production
log "依赖安装完成"

# 创建必要的目录
log "创建必要目录..."
mkdir -p "$PROJECT_DIR/backend/secure-uploads/news"
mkdir -p "$PROJECT_DIR/backend/secure-uploads/documents"
mkdir -p "$PROJECT_DIR/backend/secure-uploads/avatars"
log "目录创建完成"

# 重启 Node.js 服务
log "重启 Node.js 服务..."
pkill -f "node.*server.js" || true
sleep 2
nohup node server.js > /dev/null 2>&1 &
log "Node.js 服务重启完成"

# 等待服务启动
log "等待服务启动..."
sleep 5

# 验证部署
log "验证部署..."
if curl -f http://localhost:3001/api/news > /dev/null 2>&1; then
    log "✅ 部署验证成功"
else
    log "❌ 部署验证失败"
    log "正在回滚..."
    pkill -f "node.*server.js" || true
    rm -rf "$PROJECT_DIR"
    cp -r "$BACKUP_DIR/laos-logistics_${TIMESTAMP}" "$PROJECT_DIR"
    cd "$PROJECT_DIR/backend"
    nohup node server.js > /dev/null 2>&1 &
    log "回滚完成"
    exit 1
fi

# 清理部署日志 (保留最近30天)
find /var/www/deployments -name "deploy_*.log" -mtime +30 -delete

log "✅ 自动化部署完成"
log "备份位置: $BACKUP_DIR/laos-logistics_${TIMESTAMP}"
log "日志文件: $LOG_FILE"
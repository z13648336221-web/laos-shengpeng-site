#!/bin/bash

# 回滚脚本
# 用途：将项目回滚到指定的备份版本

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_DIR="/var/www/laos-logistics"
BACKUP_DIR="/var/www/backups"
LOG_FILE="/var/www/deployments/rollback_$(date +%Y%m%d_%H%M%S).log"

# 创建日志目录
mkdir -p /var/www/deployments

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查参数
if [ -z "$1" ]; then
    log "错误: 请指定备份时间戳"
    log "用法: $0 <TIMESTAMP>"
    log "示例: $0 20260808_143000"
    log ""
    log "可用的备份:"
    ls -la "$BACKUP_DIR" | grep "laos-logistics_" || echo "没有找到备份"
    exit 1
fi

BACKUP_TIMESTAMP="$1"
BACKUP_PATH="$BACKUP_DIR/laos-logistics_${BACKUP_TIMESTAMP}"

log "开始回滚到备份: $BACKUP_TIMESTAMP"

# 检查备份是否存在
if [ ! -d "$BACKUP_PATH" ]; then
    log "错误: 备份不存在: $BACKUP_PATH"
    log "可用的备份:"
    ls -la "$BACKUP_DIR" | grep "laos-logistics_" || echo "没有找到备份"
    exit 1
fi

# 停止当前服务
log "停止当前服务..."
pkill -f "node.*server.js" || true
sleep 2

# 移除当前部署
log "移除当前部署..."
rm -rf "$PROJECT_DIR"

# 恢复备份
log "恢复备份..."
cp -r "$BACKUP_PATH" "$PROJECT_DIR"

# 重启服务
log "重启服务..."
cd "$PROJECT_DIR/backend"
nohup node server.js > /dev/null 2>&1 &
sleep 5

# 验证回滚
log "验证回滚..."
if curl -f http://localhost:3001/api/news > /dev/null 2>&1; then
    log "✅ 回滚验证成功"
else
    log "❌ 回滚验证失败"
    exit 1
fi

log "✅ 回滚完成"
log "从备份恢复: $BACKUP_PATH"
log "日志文件: $LOG_FILE"
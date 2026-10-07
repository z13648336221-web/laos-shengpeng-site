#!/bin/bash
# ==============================================================================
# hengciglobal.com SSL 证书部署脚本（服务器端执行）
#
# 用法:
#   sudo bash deploy-ssl-cert.sh <证书暂存目录> [域名]
#
# 示例:
#   # 1) 本地（Windows）上传证书到服务器:
#   #   ssh -i "~/.ssh/id_ed25519_laos" USER@SERVER_IP_REDACTED "mkdir -p /root/ssl-new"
#   #   scp -i "~/.ssh/id_ed25519_laos" `
#   #       hengciglobal.com_bundle.crt hengciglobal.com.key USER@SERVER_IP_REDACTED:/root/ssl-new/
#   # 2) 服务器执行:
#   sudo bash deploy-ssl-cert.sh /root/ssl-new hengciglobal.com
#
# 暂存目录需包含（文件名兼容腾讯云/阿里云下载格式）:
#   <域名>_bundle.crt  或 fullchain.pem   （证书链: 站点证书 + 中间证书，按顺序拼接）
#   <域名>.key         或 privkey.pem      （私钥）
#
# 脚本行为: 安装证书 -> 校验私钥匹配 -> 备份配置 -> 改写 443 证书路径 ->
#           nginx -t -> 失败自动回滚 / 成功平滑重载 -> 线上证书复核
# ==============================================================================
set -uo pipefail

STAGE="${1:-}"
DOMAIN="${2:-hengciglobal.com}"

if [ -z "$STAGE" ] || [ ! -d "$STAGE" ]; then
  echo "用法: sudo bash $0 <证书暂存目录> [域名]"
  exit 1
fi
if [ "$(id -u)" != "0" ]; then
  echo "请使用 root 权限执行（sudo）"
  exit 1
fi

# ---- 定位证书与私钥文件 ----
CRT_SRC=""
KEY_SRC=""
for f in "$STAGE/${DOMAIN}_bundle.crt" "$STAGE/fullchain.pem" "$STAGE/${DOMAIN}.crt" "$STAGE/${DOMAIN}_bundle.pem"; do
  if [ -f "$f" ]; then CRT_SRC="$f"; break; fi
done
for f in "$STAGE/${DOMAIN}.key" "$STAGE/privkey.pem"; do
  if [ -f "$f" ]; then KEY_SRC="$f"; break; fi
done

if [ -z "$CRT_SRC" ] || [ -z "$KEY_SRC" ]; then
  echo "!! 未在 $STAGE 找到证书或私钥文件"
  echo "   期望: ${DOMAIN}_bundle.crt / fullchain.pem 与 ${DOMAIN}.key / privkey.pem"
  exit 1
fi
echo "证书文件: $CRT_SRC"
echo "私钥文件: $KEY_SRC"

TS=$(date +%Y%m%d-%H%M%S)
DEST="/etc/nginx/ssl/$DOMAIN"
BACKUP="/root/ssl-deploy-backup-$TS"
CRT="$DEST/${DOMAIN}_bundle.crt"
KEY="$DEST/${DOMAIN}.key"

# ---- 收集真正的配置文件（解析软链接、去重、排除 .bak 备份文件）----
CONFIGS=()
while IFS= read -r line; do
  [ -n "$line" ] && CONFIGS+=("$line")
done < <(
  for f in /etc/nginx/sites-enabled/* /etc/nginx/sites-available/*; do
    [ -f "$f" ] || continue
    case "$(basename "$f")" in *.bak*|*~) continue ;; esac
    grep -q "server_name.*$DOMAIN" "$f" 2>/dev/null || continue
    readlink -f "$f"
  done | sort -u
)

echo "=== 1. 准备目录 ==="
mkdir -p "$DEST" "$BACKUP"
chmod 755 /etc/nginx/ssl
chmod 700 "$DEST"
echo "DEST=$DEST"
echo "BACKUP=$BACKUP"

echo "=== 2. 安装证书文件 ==="
install -o root -g root -m 644 "$CRT_SRC" "$CRT"
install -o root -g root -m 600 "$KEY_SRC" "$KEY"
ls -la "$DEST"

echo "=== 3. 校验证书与私钥是否匹配 ==="
CMOD=$(openssl x509 -noout -modulus -in "$CRT" | openssl md5)
KMOD=$(openssl rsa -noout -modulus -in "$KEY" 2>/dev/null | openssl md5)
echo "cert modulus: $CMOD"
echo "key  modulus: $KMOD"
if [ "$CMOD" != "$KMOD" ]; then
  echo "!! 私钥与证书不匹配，已中止（未修改 nginx 配置）"
  exit 1
fi
echo "OK: 私钥与证书匹配"

echo "=== 4. 证书信息 ==="
openssl x509 -in "$CRT" -noout -subject -issuer -dates -ext subjectAltName
echo "证书链长度: $(grep -c 'BEGIN CERTIFICATE' "$CRT") 张"

echo "=== 5. 备份现有 nginx 配置 ==="
for f in "${CONFIGS[@]:-}"; do
  [ -n "$f" ] || continue
  cp -a "$f" "$BACKUP/$(basename "$f").bak"
  echo "已备份: $f -> $BACKUP/$(basename "$f").bak"
done

echo "=== 6. 更新 nginx 证书路径 ==="
if [ "${#CONFIGS[@]}" -eq 0 ]; then
  echo "!! 未找到 server_name 含 $DOMAIN 的 nginx 配置，请手动检查 /etc/nginx/sites-enabled/"
else
  for f in "${CONFIGS[@]}"; do
    grep -q "ssl_certificate" "$f" 2>/dev/null || continue
    sed -i -E "s#^([[:space:]]*)ssl_certificate[[:space:]]+.*#\1ssl_certificate $CRT;#; s#^([[:space:]]*)ssl_certificate_key[[:space:]]+.*#\1ssl_certificate_key $KEY;#" "$f"
    echo "--- $f ---"
    grep -n "ssl_certificate" "$f"
  done
fi

echo "=== 7. 测试配置并平滑重载 ==="
if ! nginx -t; then
  echo "!! nginx 配置测试失败，正在回滚配置"
  for f in "$BACKUP"/*.bak; do
    base=$(basename "$f" .bak)
    if [ -e "/etc/nginx/sites-enabled/$base" ]; then cp -a "$f" "/etc/nginx/sites-enabled/$base"; fi
    if [ -e "/etc/nginx/sites-available/$base" ]; then cp -a "$f" "/etc/nginx/sites-available/$base"; fi
  done
  nginx -t && echo "已回滚到原配置"
  exit 1
fi
systemctl reload nginx
sleep 2
echo "nginx 状态: $(systemctl is-active nginx)"

echo "=== 8. 验证实际生效的证书 ==="
for name in "$DOMAIN" "www.$DOMAIN"; do
  echo "--- $name ---"
  echo | openssl s_client -connect 127.0.0.1:443 -servername "$name" 2>/dev/null \
    | openssl x509 -noout -subject -issuer -dates -fingerprint -sha256
done
echo "--- 证书链信任校验（系统信任库）---"
echo | openssl s_client -connect 127.0.0.1:443 -servername "$DOMAIN" -CAfile /etc/ssl/certs/ca-certificates.crt 2>&1 \
  | grep "Verify return code"

echo "=== 9. 访问测试 ==="
curl -sS -o /dev/null -w "https://$DOMAIN/ -> HTTP %{http_code}\n" --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/" || true
curl -sS -o /dev/null -w "https://www.$DOMAIN/ -> HTTP %{http_code}\n" --resolve "www.$DOMAIN:443:127.0.0.1" "https://www.$DOMAIN/" || true
curl -sS -o /dev/null -w "http://$DOMAIN/ (80->443 跳转) -> HTTP %{http_code}\n" --resolve "$DOMAIN:80:127.0.0.1" "http://$DOMAIN/" || true

echo "=== 部署完成 ==="
echo "备份目录: $BACKUP"
echo "提示: 上传证书的暂存目录（含私钥）请及时清理，如 rm -rf $STAGE"

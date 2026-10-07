# SSL 证书部署记录与续期指南（hengciglobal.com）

> 最后更新：2026-09-20
> 服务器：`SERVER_IP_REDACTED`（腾讯云 Ubuntu，nginx/1.24.0）

## 一、本次部署结果

| 项目 | 内容 |
|------|------|
| 证书类型 | TrustAsia DV TLS RSA CA 2024（商业证书，非 Let's Encrypt） |
| 证书主体 | `CN=hengciglobal.com` |
| 覆盖域名 | `hengciglobal.com`、`www.hengciglobal.com` |
| 有效期 | 2026-09-20 17:00 ~ 2026-12-19 16:59（北京时间） |
| 证书链 | 叶证书 + 2 张中间证书（共 3 张，已验证链完整） |
| 证书存放 | `/etc/nginx/ssl/hengciglobal.com/` |
| 证书文件 | `hengciglobal.com_bundle.crt`（644）、`hengciglobal.com.key`（600） |
| 生效配置 | `/etc/nginx/sites-enabled/hengciglobal.com`、`/etc/nginx/sites-available/logistics` |
| SHA256 指纹 | `56:05:5D:AF:4B:06:EA:2C:C4:29:A6:61:58:83:5C:42:C2:2E:C5:49:E1:D2:41:2B:C8:0F:80:26:25:BC:C9:D7` |
| 回滚备份 | `/root/ssl-deploy-backup-20260920-185246/`（含改动前的原配置与旧 Let's Encrypt 证书副本） |

验证结论（部署后实测）：

- `https://hengciglobal.com/` → HTTP 200，`https://www.hengciglobal.com/` → HTTP 200
- `http://hengciglobal.com/` → HTTP 301 跳转 HTTPS
- 「证书链信任校验」`Verify return code: 0 (ok)`（TrustAsia TLS RSA Root CA → Certum Trusted Network CA）
- 公网实测握手：TLS 1.3，服务器返回的证书指纹与上传证书完全一致
- `https://hengciglobal.com/api/news` → HTTP 200（后端 Node 服务正常）

### 本次同时处理的配置问题

`sites-enabled/` 下曾遗留一个手工备份文件 `hengciglobal.com.bak-20260815-115712`，它会被 nginx 一并加载，
导致 4 条 `conflicting server name ... ignored` 告警，并且其 443 段仍指向旧的 Let's Encrypt 证书路径
（一旦 LE 证书被删除/过期，nginx 将无法启动）。该文件已移出 `sites-enabled/`，保存在上述回滚备份目录中，
其承载的 server 块与生效配置完全重复，功能无任何变化。

## 二、日常操作

```bash
# 查看当前线上证书
echo | openssl s_client -connect 127.0.0.1:443 -servername hengciglobal.com 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates

# 查看证书到期时间
openssl x509 -in /etc/nginx/ssl/hengciglobal.com/hengciglobal.com_bundle.crt -noout -enddate

# 修改配置后：先测试再平滑重载
nginx -t && systemctl reload nginx
```

## 三、证书续期 / 更换步骤

证书有效期为 90 天，**请在 2026-12-19 前完成续期**（建议 12 月上旬操作）。
拿到新证书压缩包（如 `hengciglobal.com_nginx.zip`）后按以下步骤执行：

```powershell
# 1) 本地解压，取出 <域名>_bundle.crt 与 <域名>.key

# 2) 上传到服务器暂存目录
ssh -i "~/.ssh/id_ed25519_laos" USER@SERVER_IP_REDACTED "mkdir -p /root/ssl-new"
scp -i "~/.ssh/id_ed25519_laos" `
    .\hengciglobal.com_bundle.crt .\hengciglobal.com.key `
    USER@SERVER_IP_REDACTED:/root/ssl-new/

# 3) 上传仓库中的部署脚本（首次部署后可跳过；脚本已在服务器验证通过）
scp -i "~/.ssh/id_ed25519_laos" `
    .\scripts\deploy-ssl-cert.sh USER@SERVER_IP_REDACTED:/root/ssl-new/
```

```bash
# 4) 服务器上执行部署（自动校验私钥匹配、备份配置、失败回滚、平滑重载、线上复核）
bash /root/ssl-new/deploy-ssl-cert.sh /root/ssl-new hengciglobal.com

# 5) 清理含私钥的暂存目录
rm -rf /root/ssl-new
```

脚本 `scripts/deploy-ssl-cert.sh` 的执行流程：

1. 安装证书到 `/etc/nginx/ssl/<域名>/`（证书 644、私钥 600、root 属主）
2. `openssl modulus` 校验私钥与证书是否匹配，不匹配立即中止且不改配置
3. 打印证书主体/颁发者/有效期/SAN，并统计证书链张数
4. 备份所有 `server_name` 含该域名的 nginx 配置到 `/root/ssl-deploy-backup-<时间戳>/`
5. 改写这些配置中 443 段的 `ssl_certificate` / `ssl_certificate_key` 路径
   （保留 `options-ssl-nginx.conf`、`ssl-dhparams.pem` 等 TLS 参数引用）
6. `nginx -t`：失败则自动回滚配置；成功则 `systemctl reload nginx`（平滑重载，不中断连接）
7. 复核实际生效的证书（含 `www` 子域）与证书链信任状态，并测试 HTTP/HTTPS 访问返回码

> 脚本会自动解析软链接（如 `sites-enabled/logistics` → `sites-available/logistics`），
> 只改写真实文件，并把 `*.bak*` 备份文件排除在外。

## 四、回滚方法

若新证书出现问题，恢复旧配置并重载：

```bash
BK=/root/ssl-deploy-backup-20260920-185246
cp -a $BK/hengciglobal.com.bak /etc/nginx/sites-enabled/hengciglobal.com
cp -a $BK/logistics.bak /etc/nginx/sites-available/logistics
nginx -t && systemctl reload nginx
```

## 五、遗留事项（可选优化）

1. **Let's Encrypt 自动续期仍在运行**：`certbot.timer` 每天检查，续期的 LE 证书（`/etc/letsencrypt/live/hengciglobal.com/`，有效期至 2026-11-15）
   目前已不再被 nginx 使用，仅作为备用保留。如需停用：
   `systemctl disable --now certbot.timer`；如保留，无需任何操作。
2. **HSTS 响应头未实际下发**：`/etc/nginx/sites-enabled/hengciglobal.com` 在 server 段配置了
   `add_header Strict-Transport-Security ...`，但 `location /` 内另有 `add_header`，
   nginx 的 `add_header` 不会跨层级继承，导致该 location 下 HSTS/Referrer-Policy 等头被覆盖。
   如需修复，可在 `location /` 内重复声明这些响应头，或改用 `include` 片段统一维护。
3. **同域多份 server 块**：`sites-enabled/hengciglobal.com` 与 `sites-available/logistics` 都声明了
   `hengciglobal.com:443`，nginx 以先加载者为准（按字母序为 `hengciglobal.com`），另一份被忽略并告警。
   建议后续合并为单一配置文件，避免歧义。

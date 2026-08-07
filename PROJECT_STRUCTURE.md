# 项目结构说明

## 重组后的项目结构

```
Laos shengpeng site/
├── public/                    # 前端静态资源
│   ├── admin/                # 管理后台页面
│   │   ├── admin.html
│   │   ├── admin-login.html
│   │   ├── admin-dashboard.html
│   │   ├── admin-chat.html
│   │   ├── admin-customers.html
│   │   ├── admin-inquiry.html
│   │   ├── admin-orders.html
│   │   ├── admin-quotes.html
│   │   ├── admin-reports.html
│   │   ├── admin-roles.html
│   │   └── admin-logs.html
│   ├── services/             # 服务页面
│   │   ├── service-rail.html
│   │   ├── service-road.html
│   │   ├── service-thai.html
│   │   ├── service-viet.html
│   │   ├── service-thai-rail.html
│   │   └── service-viet-rail.html
│   ├── css/                  # 样式文件
│   │   ├── style.css
│   │   ├── admin.css
│   │   └── chat.css
│   ├── js/                   # JavaScript 文件
│   │   ├── i18n.js
│   │   ├── main.js
│   │   ├── chat.js
│   │   ├── tracking.js
│   │   ├── inquiry.js
│   │   ├── news-api.js
│   │   ├── loading.js
│   │   └── notification.js
│   ├── lang/                 # 语言文件
│   │   ├── zh.js
│   │   ├── en.js
│   │   ├── vi.js
│   │   └── all.js
│   ├── robots.txt
│   └── sitemap.xml
├── backend/                   # 后端服务
│   ├── routes/               # 路由文件
│   ├── middleware/           # 中间件
│   ├── models/               # 数据模型
│   ├── utils/                # 工具函数
│   ├── scripts/              # 数据库脚本
│   ├── database/             # 数据库文件
│   ├── package.json
│   ├── server.js
│   └── .env
├── scripts/                   # 部署/运维脚本
│   └── optimize-images.js
├── docs/                      # 文档
│   └── 项目介绍-pdf.html
├── index.html                 # 主页
├── about.html                 # 关于我们
├── inquiry.html               # 在线询价
├── tracking.html              # 货物追踪
├── news.html                  # 新闻资讯
├── deploy-simple.js           # 部署脚本
├── README.md                  # 项目说明
├── .gitignore                 # Git 忽略文件
└── package.json               # 项目依赖
```

## 结构优化说明

### 清理的文件
- ❌ 删除临时文件: cookies.txt, TODO.html, index.src.html
- ❌ 删除调试文件: deploy-auto.js, deploy_and_restart.js
- ❌ 删除构建文件: vite.config.js, FRONTEND_BUILD.md, DEPLOYMENT_SUMMARY.md
- ❌ 删除配置文件: nginx-optimization.conf
- ❌ 删除依赖文件: node_modules/, package-lock.json

### 重组的目录
- ✅ 静态资源: css/, js/, lang/ → public/css/, public/js/, public/lang/
- ✅ 管理后台: admin*.html → public/admin/
- ✅ 服务页面: service*.html → public/services/
- ✅ 网站资源: robots.txt, sitemap.xml → public/

### 路径更新
- ✅ 所有 HTML 文件中的资源路径已更新
- ✅ CSS 引用: css/ → public/css/
- ✅ JS 引用: js/ → public/js/
- ✅ 语言引用: lang/ → public/lang/
- ✅ 管理后台链接: admin-*.html → public/admin/admin-*.html
- ✅ 服务页面链接: service-*.html → public/services/service-*.html

## 优势

### 1. 清晰的结构
- 静态资源集中在 public/ 目录
- 功能模块按类型分类
- 易于维护和扩展

### 2. 部署友好
- 前端和后端分离
- 静态资源路径明确
- 便于 CDN 部署

### 3. 开发便利
- 文件查找快速
- 代码组织清晰
- 团队协作友好

## 使用说明

### 本地开发
```bash
# 直接打开 index.html 即可访问主页
# 管理后台: 访问 public/admin/admin.html
# 服务页面: 访问 public/services/service-*.html
```

### 部署到服务器
```bash
# 运行部署脚本
node deploy-simple.js

# 脚本会自动上传所有文件到服务器
# 路径会保持相对结构
```

### 维护建议
1. 新增页面按类型放置到对应目录
2. 静态资源统一放在 public/ 目录
3. 保持路径引用的一致性
4. 定期清理临时文件

## 兼容性说明

- ✅ 原有功能完全保留
- ✅ 所有链接已更新
- ✅ 路径引用已修正
- ✅ 网站功能正常

## 后续优化建议

1. **进一步模块化**: 考虑使用组件化框架
2. **构建工具**: 可以重新引入构建系统优化性能
3. **类型检查**: 添加 TypeScript 提升代码质量
4. **测试覆盖**: 添加自动化测试
5. **文档完善**: 补充 API 文档和开发文档
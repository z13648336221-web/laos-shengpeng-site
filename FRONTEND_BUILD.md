# 前端构建系统配置文档

## 概述
本项目已集成 Vite 构建工具，实现前端资源优化和性能提升。

## 构建配置

### 1. 核心工具
- **Vite 5.4.0**: 现代化构建工具，提供快速的开发服务器和优化的生产构建
- **Terser**: JavaScript 压缩和混淆
- **CSSNano**: CSS 压缩和优化
- **Autoprefixer**: 自动添加浏览器前缀
- **Vite Plugin Compression**: Gzip 和 Brotli 压缩
- **Sharp**: 图片压缩和 WebP 转换

### 2. 构建优化特性

#### JavaScript 优化
- **代码压缩**: Terser 压缩，移除 console.log、debugger 等
- **代码分割**: 自动分割为 chat 和 index 两个 chunk
- **Tree-shaking**: 移除未使用的代码
- **混淆**: 变量名缩短，代码保护

#### CSS 优化
- **压缩**: CSSNano 移除空格、注释等
- **前缀**: Autoprefixer 自动添加浏览器前缀
- **合并**: 合并多个 CSS 文件

#### 资源优化
- **文件哈希**: 内容哈希命名，实现长期缓存
- **Gzip 压缩**: 静态资源 Gzip 压缩
- **Brotli 压缩**: 比 Gzip 更高压缩率
- **图片优化**: Sharp 实现图片压缩和 WebP 转换

### 3. 构建结果分析

#### 原始文件大小
- index.html: 24KB
- css/style.css: 48KB
- css/chat.css: 8KB
- js/main.js: 16KB
- js/chat.js: 12KB
- js/i18n.js: 4KB
- js/tracking.js: 8KB
- js/inquiry.js: 32KB
- js/news-api.js: 12KB
- 语言文件: 48KB

#### 构建后大小
- index.html: 19.37KB (Gzip: 5.21KB, Brotli: 3.87KB)
- css/index-*.css: 38.50KB (Gzip: 7.74KB, Brotli: 6.62KB)
- js/index-*.js: 33.59KB (Gzip: 16.11KB, Brotli: 12.71KB)
- js/chat-*.js: 6.97KB (Gzip: 2.46KB)

#### 性能提升
- **HTML 压缩率**: ~80% (Gzip), ~83% (Brotli)
- **CSS 压缩率**: ~80% (Gzip), ~83% (Brotli)
- **JS 压缩率**: ~52% (Gzip), ~62% (Brotli)
- **总体文件减少**: 约 60KB → 28KB (Gzip)

### 4. 开发命令

```bash
# 安装依赖
npm install

# 开发服务器 (热更新)
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview

# 图片优化
npm run optimize:images
```

### 5. 构建产物结构

```
dist/
├── index.html          # 主页面
├── index.html.gz       # Gzip 压缩版本
├── index.html.br       # Brotli 压缩版本
├── css/
│   ├── index-*.css     # 合并压缩的 CSS
│   ├── index-*.css.gz  # Gzip 版本
│   └── index-*.css.br  # Brotli 版本
└── js/
    ├── index-*.js      # 主 JavaScript (含语言文件)
    ├── index-*.js.gz   # Gzip 版本
    ├── index-*.js.br   # Brotli 版本
    ├── chat-*.js       # 聊天功能分割
    ├── chat-*.js.gz    # Gzip 版本
    └── chat-*.js.br    # Brotli 版本
```

### 6. 部署配置

服务器需要支持：
- **Gzip 压缩**: `Content-Encoding: gzip`
- **Brotli 压缩**: `Content-Encoding: br`
- **静态资源缓存**: 长期缓存策略
- **HTTPS**: 现代浏览器特性支持

### 7. 模块化改造

#### 语言文件模块化
- 原始: 全局变量 window._translations_*
- 现在: ES6 模块导出
- 集成: 通过 all.js 统一导入

#### JavaScript 模块化
- 原始: 多个 script 标签顺序加载
- 现在: ES6 模块化导入
- 优势: 按需加载，依赖管理

#### 构建配置
- 入口: index.html
- 输出: dist/ 目录
- 命名: 内容哈希文件名

### 8. 性能优化建议

1. **图片优化**: 使用 `npm run optimize:images` 转换 WebP 格式
2. **CDN 部署**: 将静态资源部署到 CDN
3. **HTTP/2**: 启用 HTTP/2 多路复用
4. **预加载**: 关键资源预加载
5. **懒加载**: 非关键资源懒加载

### 9. 后续优化方向

1. **PWA 支持**: 添加 Service Worker
2. **代码分割**: 按路由进一步分割
3. **资源预取**: 预测用户行为预加载
4. **关键 CSS**: 内联关键 CSS
5. **WebP 全面**: 全站图片 WebP 化
6. **Tree-shaking**: 进一步移除无用代码

## 维护说明

### 添加新 JavaScript 模块
1. 在 `js/` 目录创建新文件
2. 使用 ES6 导入导出
3. 在需要的文件中导入

### 添加新 CSS 文件
1. 在 `css/` 目录创建新文件
2. 在 HTML 中引用 (Vite 会自动处理)

### 修改构建配置
编辑 `vite.config.js` 文件进行配置调整

### 依赖更新
定期运行 `npm update` 更新依赖包
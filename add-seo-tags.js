/**
 * SEO 优化脚本
 * 为所有HTML页面添加 Open Graph、Twitter Card 和 JSON-LD 结构化数据
 */

const fs = require('fs');
const path = require('path');

const pages = [
  {
    file: 'index.html',
    title: '重庆恒慈国际贸易有限公司 - 专业东南亚跨境物流服务',
    description: '专注东南亚跨境物流8年，提供中老铁路陆运、泰国海运、越南海运等全方位物流服务。',
    keywords: '跨境物流,中老铁路,泰国海运,越南海运,国际物流,东南亚物流,重庆恒慈',
    type: 'website'
  },
  {
    file: 'about.html',
    title: '关于我们 - 重庆恒慈国际贸易有限公司',
    description: '重庆恒慈国际贸易有限公司 - 专注东南亚跨境物流8年，深耕中老铁路、泰国海运、越南海运三大通道。',
    keywords: '跨境物流,中老铁路,泰国海运,越南海运,国际物流,东南亚物流',
    type: 'website'
  },
  {
    file: 'tracking.html',
    title: '货物追踪 - 重庆恒慈国际贸易有限公司',
    description: '重庆恒慈国际贸易有限公司货物追踪系统，输入运单号即时查询货物物流轨迹。',
    keywords: '货物追踪,物流查询,运单号查询,跨境物流追踪,快递查询',
    type: 'website'
  },
  {
    file: 'news.html',
    title: '新闻资讯 - 重庆恒慈国际贸易有限公司',
    description: '重庆恒慈国际贸易有限公司新闻资讯 - 最新物流政策、行业动态、公司新闻。',
    keywords: '跨境物流新闻,东南亚物流,中老铁路,泰国海运,越南海运',
    type: 'website'
  },
  {
    file: 'inquiry.html',
    title: '在线询价 - 重庆恒慈国际贸易有限公司',
    description: '在线获取中老铁路、泰国海运、越南海运报价，即时报价，透明收费。',
    keywords: '在线询价,物流报价,中老铁路报价,泰国海运报价,越南海运报价',
    type: 'website'
  },
  {
    file: 'service-rail.html',
    title: '中老铁路陆运 - 重庆恒慈国际贸易有限公司',
    description: '恒慈国际贸易中老铁路陆运服务：昆明至万象铁路直达，5-7天全程，整车/拼箱灵活选择，专业清关团队。',
    keywords: '中老铁路,铁路陆运,跨境物流,昆明到老挝,万象物流',
    type: 'website'
  },
  {
    file: 'service-road.html',
    title: '中老公路运输 - 重庆恒慈国际贸易有限公司',
    description: '恒慈国际贸易中老公路运输服务：门到门直达，时效快，适合紧急货物运输。',
    keywords: '中老公路,公路运输,跨境物流,门到门,快速运输',
    type: 'website'
  },
  {
    file: 'service-thai-rail.html',
    title: '中老泰铁路联运 - 重庆恒慈国际贸易有限公司',
    description: '恒慈国际贸易中老泰铁路联运服务：中国-老挝-泰国全程铁路运输，经济高效。',
    keywords: '中老泰铁路,铁路联运,泰国物流,跨境铁路',
    type: 'website'
  },
  {
    file: 'service-viet-rail.html',
    title: '中越铁路 - 重庆恒慈国际贸易有限公司',
    description: '恒慈国际贸易中越铁路服务：中国至越南铁路运输，稳定可靠。',
    keywords: '中越铁路,越南物流,跨境铁路,铁路运输',
    type: 'website'
  },
  {
    file: 'service-thai.html',
    title: '泰国海运 - 重庆恒慈国际贸易有限公司',
    description: '恒慈国际贸易泰国海运服务：广州/深圳至林查班港，7-12天全程，FCL/LCL，每周多班次发船。',
    keywords: '泰国海运,国际海运,FCL整柜,LCL拼箱,广州到泰国',
    type: 'website'
  },
  {
    file: 'service-viet.html',
    title: '越南海运 - 重庆恒慈国际贸易有限公司',
    description: '恒慈国际贸易越南海运服务：广州/深圳至海防港/胡志明市港，5-8天，每周五班，南北越全覆盖配送。',
    keywords: '越南海运,海防港,胡志明,跨境电商物流,广州到越南',
    type: 'website'
  }
];

// 生成SEO标签HTML
function generateSEOTags(page) {
  const url = `https://hengciglobal.com/${page.file}`;
  
  return `
  <link rel="canonical" href="${url}" />
  <!-- Open Graph -->
  <meta property="og:type" content="${page.type}" />
  <meta property="og:title" content="${page.title}" />
  <meta property="og:description" content="${page.description}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="重庆恒慈国际贸易有限公司" />
  <meta property="og:locale" content="zh_CN" />
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${page.title}" />
  <meta name="twitter:description" content="${page.description}" />
  <!-- JSON-LD 结构化数据 -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "重庆恒慈国际贸易有限公司",
    "alternateName": "CHONGQING HENGCI INTERNATIONAL TRADE CO., LTD.",
    "url": "https://hengciglobal.com",
    "description": "${page.description}",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+86-13648336221",
      "contactType": "customer service",
      "availableLanguage": ["Chinese", "English", "Vietnamese"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "重庆",
      "addressCountry": "CN"
    }
  }
  </script>`;
}

// 处理每个页面
pages.forEach(page => {
  const filePath = path.join(__dirname, page.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ 文件不存在: ${page.file}`);
    return;
  }
  
  let html = fs.readFileSync(filePath, 'utf8');
  
  // 检查是否已添加SEO标签
  if (html.includes('Open Graph')) {
    console.log(`✓ ${page.file} - 已包含SEO标签，跳过`);
    return;
  }
  
  // 找到 <meta name="author" ... /> 标签后插入SEO标签
  const authorMatch = html.match(/<meta name="author"[^>]+\/>/i);
  if (authorMatch) {
    const seoTags = generateSEOTags(page);
    html = html.replace(authorMatch[0], authorMatch[0] + seoTags);
    
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ ${page.file} - SEO标签已添加`);
  } else {
    console.log(`❌ ${page.file} - 未找到author标签，无法插入SEO标签`);
  }
});

console.log('\n🎉 SEO优化完成！');

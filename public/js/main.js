/**
 * 重庆恒慈国际贸易有限公司 - 主交互脚本
 * 包含：导航、在线客服对话框、公共功能
 */

/* =============================================
   导航栏交互
   ============================================= */

// 移动端导航切换
function toggleNav() {
  const menu = document.getElementById('navMenu');
  const toggle = document.getElementById('navToggle');
  menu.classList.toggle('open');
  toggle.classList.toggle('open');
}

// 点击导航外部关闭
document.addEventListener('click', function (e) {
  const menu = document.getElementById('navMenu');
  const toggle = document.getElementById('navToggle');
  if (menu && !menu.contains(e.target) && toggle && !toggle.contains(e.target)) {
    menu.classList.remove('open');
    toggle.classList.remove('open');
  }
});

// 滚动时导航栏增加阴影
window.addEventListener('scroll', function () {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    if (window.scrollY > 10) {
      navbar.style.boxShadow = '0 2px 20px rgba(26,86,168,0.18)';
    } else {
      navbar.style.boxShadow = '0 2px 12px rgba(26,86,168,0.1)';
    }
  }
});

/* =============================================
   在线客服对话框
   ============================================= */

let chatOpen = false;

// 客服自动回复知识库（中文）
const autoRepliesZh = {
  '询价': '您好！请点击页面右上角的"立即询价"按钮，或者告诉我您的货物信息，我来为您初步估算运费 😊',
  '报价': '为您提供三条线路参考报价：\n🚂 中老铁路：约¥2-4元/KG起\n🚢 泰国海运：约$80-120/CBM起\n⚓ 越南海运：约$60-100/CBM起\n具体价格以实际货物信息为准，欢迎提交询价单！',
  '追踪': '请在货物追踪页面输入您的运单号（格式：SP+8位数字）查询。如果有问题请直接发给我运单号，我来帮您核查！',
  '货物追踪': '您好！请访问 <a href="tracking.html">货物追踪页面</a>，输入运单号即可查询全程轨迹。如需帮助，请直接发运单号给我。',
  '时效': '在途时效参考：\n🚂 中老铁路陆运：5-7天（含清关）\n🚢 泰国海运：7-12天（含清关）\n⚓ 越南海运：5-8天（含清关）\n以上为正常情况，节假日可能有所延迟。',
  '运输时效': '在途时效参考：\n🚂 中老铁路陆运：5-7天\n🚢 泰国海运：7-12天\n⚓ 越南海运：5-8天\n（含目的地清关时效）',
  '联系': '您可以通过以下方式联系我们：\n📞 电话：13648336221\n📱 微信：shengpeng_log\n✉️ 邮件：z13648336221@Gmail.com\n⏰ 工作日 09:00-18:00',
  '联系方式': '📞 热线：13648336221\n📱 微信：shengpeng_log\n✉️ 邮件：z13648336221@Gmail.com\n⏰ 工作日 09:00-18:00',
  '中老铁路': '中老铁路陆运是我们的核心优势业务！\n✅ 昆明南站 → 万象，约1000km\n✅ 5-7天门到门\n✅ 整车/拼箱均可\n✅ 持有口岸优先通关资质\n点击了解详情：<a href="service-rail.html">中老铁路陆运</a>',
  '泰国': '泰国海运服务：\n✅ 广州/深圳 → 林查班港 → 曼谷\n✅ 7-12天全程\n✅ 每周三班稳定发船\n✅ FCL/LCL均可\n点击了解详情：<a href="service-thai.html">泰国海运</a>',
  '越南': '越南海运服务：\n✅ 广州/深圳 → 海防/胡志明港\n✅ 5-8天快速到达\n✅ 每周五班高频发船\n✅ 南北越全覆盖配送\n点击了解详情：<a href="service-viet.html">越南海运</a>',
  '清关': '我们提供目的地清关代理服务，覆盖老挝、泰国、越南三国。专业本地团队，熟悉当地海关政策，快速通关，避免货物延误。有清关需求请在询价时勾选"需要代理清关"即可。',
  '保险': '我们可以为您的货物提供一站式货运保险服务。保费约为货值的0.3-0.5%，出险快速理赔，建议高价值货物投保。请在询价时勾选"需要货物保险"。',
};

// 客服自动回复知识库（英文）
const autoRepliesEn = {
  'quote': 'Hello! Please click "Get Quote" button at the top right, or tell me your cargo details and I can estimate the shipping cost for you 😊',
  'price': 'Here are reference prices for our three routes:\n🚂 Laos-China Railway: ~$0.3-0.6/KG\n🚢 Thailand Shipping: ~$80-120/CBM\n⚓ Vietnam Shipping: ~$60-100/CBM\nFinal price depends on actual cargo details. Please submit a quote request!',
  'track': 'Please enter your tracking number (format: SP+8 digits) on the tracking page. If you have issues, just send me the tracking number and I will help you check!',
  'tracking': 'Hello! Please visit <a href="tracking.html">Track Shipment page</a> and enter your tracking number to check the full journey. For assistance, just send me your tracking number.',
  'time': 'Transit time reference:\n🚂 Laos-China Railway: 5-7 days (including customs)\n🚢 Thailand Shipping: 7-12 days (including customs)\n⚓ Vietnam Shipping: 5-8 days (including customs)\nThese are normal conditions; holidays may cause delays.',
  'contact': 'You can reach us through:\n📞 Phone: 13648336221\n📱 WeChat: shengpeng_log\n✉️ Email: z13648336221@Gmail.com\n⏰ Working hours: Mon-Fri 09:00-18:00',
  'railway': 'Laos-China Railway is our core service!\n✅ Kunming → Vientiane, ~1000km\n✅ 5-7 days door-to-door\n✅ FCL/LCL available\n✅ Priority customs clearance\nLearn more: <a href="service-rail.html">Laos-China Railway</a>',
  'thailand': 'Thailand Shipping Service:\n✅ Guangzhou/Shenzhen → Laem Chabang → Bangkok\n✅ 7-12 days total\n✅ Three weekly sailings\n✅ FCL/LCL available\nLearn more: <a href="service-thai.html">Thailand Shipping</a>',
  'vietnam': 'Vietnam Shipping Service:\n✅ Guangzhou/Shenzhen → Hai Phong/Ho Chi Minh\n✅ 5-8 days fast delivery\n✅ Five weekly sailings\n✅ Full coverage North & South Vietnam\nLearn more: <a href="service-viet.html">Vietnam Shipping</a>',
  'customs': 'We provide destination customs clearance services covering Laos, Thailand, and Vietnam. Professional local teams, familiar with local customs policies, fast clearance, avoid cargo delays. Select "Need Customs Clearance" when requesting a quote.',
  'insurance': 'We can provide one-stop cargo insurance for your shipment. Premium is about 0.3-0.5% of cargo value, fast claim settlement. Recommended for high-value goods. Select "Need Cargo Insurance" when requesting a quote.',
};

// 客服自动回复知识库（越南语）
const autoRepliesVi = {
  'báo giá': 'Chào bạn! Vui lòng nhấp vào nút "Yêu Cầu Báo Giá" ở góc trên cùng bên phải, hoặc cho tôi biết thông tin hàng hóa của bạn, tôi sẽ ước tính chi phí vận chuyển cho bạn 😊',
  'giá': 'Dưới đây là báo giá tham khảo cho ba tuyến đường của chúng tôi:\n🚂 Đường sắt Trung-Lào: ~2-4 Yên/KG\n🚢 Vận chuyển Thái Lan: ~80-120 USD/CBM\n⚓ Vận chuyển Việt Nam: ~60-100 USD/CBM\nGiá cuối cùng phụ thuộc vào thông tin hàng hóa thực tế. Vui lòng gửi yêu cầu báo giá!',
  'theo dõi': 'Vui lòng nhập mã vận đơn của bạn (định dạng: SP+8 chữ số) trên trang theo dõi. Nếu có vấn đề, chỉ cần gửi mã vận đơn cho tôi, tôi sẽ giúp bạn kiểm tra!',
  'thời gian': 'Thời gian vận chuyển tham khảo:\n🚂 Đường sắt Trung-Lào: 5-7 ngày (bao gồm khai quan)\n🚢 Vận chuyển Thái Lan: 7-12 ngày (bao gồm khai quan)\n⚓ Vận chuyển Việt Nam: 5-8 ngày (bao gồm khai quan)\nĐây là thời gian bình thường, ngày lễ có thể chậm trễ.',
  'liên hệ': 'Bạn có thể liên hệ với chúng tôi qua:\n📞 Điện thoại: 13648336221\n📱 WeChat: shengpeng_log\n✉️ Email: z13648336221@Gmail.com\n⏰ Giờ làm việc: Thứ 2-6 09:00-18:00',
};

// 获取自动回复
function getAutoReply(text) {
  const lang = window.i18n?.getCurrentLang() || 'zh';
  let replies = autoRepliesZh;
  
  if (lang === 'en') {
    replies = autoRepliesEn;
  } else if (lang === 'vi') {
    replies = autoRepliesVi;
  }
  
  const lowerText = text.toLowerCase();
  for (const [key, reply] of Object.entries(replies)) {
    if (lowerText.includes(key.toLowerCase())) {
      return reply;
    }
  }
  
  if (lang === 'en') {
    return 'Thank you for your inquiry! I have recorded your question and our dedicated team will contact you within 30 minutes.\n\nYou can also call our hotline directly:\n📞 13648336221 (Mon-Fri 09:00-18:00)';
  } else if (lang === 'vi') {
    return 'Cảm ơn bạn đã liên hệ! Tôi đã ghi nhận câu hỏi của bạn và đội ngũ chuyên trách sẽ liên hệ với bạn trong vòng 30 phút.\n\nBạn cũng có thể gọi trực tiếp đến số điện thoại của chúng tôi:\n📞 13648336221 (Thứ 2-6 09:00-18:00)';
  }
  
  return '感谢您的咨询！我已将您的问题记录，专属客服将在30分钟内联系您。\n\n您也可以直接拨打热线：\n📞 13648336221（工作日 09:00-18:00）';
}

// 切换对话框
function toggleChat() {
  const chatBox = document.getElementById('chatBox');
  const badge = document.querySelector('.float-btn .badge');
  chatOpen = !chatOpen;
  if (chatOpen) {
    chatBox.classList.add('open');
    if (badge) badge.style.display = 'none';
  } else {
    chatBox.classList.remove('open');
  }
}

// 打开对话框（供其他页面元素调用）
function openChat() {
  if (window.chatWidget) {
    window.chatWidget.open();
  } else {
    setTimeout(openChat, 100);
  }
}

// 添加消息到对话框
function appendMessage(text, isUser) {
  const list = document.getElementById('chatMessages');
  if (!list) return;

  const div = document.createElement('div');
  div.className = 'chat-msg ' + (isUser ? 'user' : 'bot');

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = isUser ? '👤' : '👩‍💼';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = text.replace(/\n/g, '<br/>');

  div.appendChild(avatar);
  div.appendChild(bubble);
  list.appendChild(div);
  scrollChatToBottom();
}

// 滚动对话框到底部
function scrollChatToBottom() {
  const list = document.getElementById('chatMessages');
  if (list) list.scrollTop = list.scrollHeight;
}

// 发送消息
function sendMessage() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  appendMessage(text, true);
  input.value = '';

  setTimeout(() => {
    const reply = getAutoReply(text);
    appendMessage(reply, false);
  }, 800);
}

// 快捷回复
function sendQuick(btn) {
  const text = btn.textContent.trim();
  appendMessage(text, true);
  setTimeout(() => {
    const reply = getAutoReply(text);
    appendMessage(reply, false);
  }, 600);
}

// 回车发送
function chatEnter(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

/* =============================================
   数字滚动动画
   ============================================= */
function animateCounter(el, target, suffix) {
  let current = 0;
  const increment = target / 60;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString() + (suffix || '');
  }, 16);
}

// Intersection Observer 触发数字动画
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const val = parseInt(el.dataset.val, 10);
      const suffix = el.dataset.suffix || '';
      animateCounter(el, val, suffix);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-counter]').forEach(el => {
  counterObserver.observe(el);
});

/* =============================================
   页面入场动画（简单fade-in）
   ============================================= */
function initFadeInAnimations() {
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.service-card, .adv-card, .feature-item, .case-card, .news-card, .team-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    fadeObserver.observe(el);
  });
}

/* =============================================
   页面加载完成后的初始化
   ============================================= */
document.addEventListener('DOMContentLoaded', function () {
  // Initialize i18n
  if (window.i18n) {
    window.i18n.init();
  }
  
  // Initialize fade-in animations
  initFadeInAnimations();
});
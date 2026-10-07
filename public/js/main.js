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

// 打开对话框（供其他页面元素调用）
function openChat() {
  if (window.chatWidget) {
    window.chatWidget.open();
  } else {
    setTimeout(openChat, 100);
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
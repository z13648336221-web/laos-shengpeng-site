/**
 * 多语言管理模块
 */

class I18n {
  constructor() {
    this.currentLang = 'zh';
    this.translations = {};
    this.loadedLangs = [];
  }

  init(defaultLang = 'zh') {
    this.currentLang = this.getStoredLang() || defaultLang;
    
    if (window.allTranslations && Object.keys(window.allTranslations).length > 0) {
      this.translations = window.allTranslations;
      this.loadedLangs = Object.keys(window.allTranslations);
    }
    
    this.updateDocumentLang();
    this.updatePageContent();
    this.initLangSwitch();
  }

  getStoredLang() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('hengci-lang');
    }
    return null;
  }

  setStoredLang(lang) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hengci-lang', lang);
    }
  }

  updateDocumentLang() {
    document.documentElement.lang = this.currentLang;
  }

  initLangSwitch() {
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = btn.dataset.lang;
        if (lang && lang !== this.currentLang) {
          this.changeLang(lang);
        }
      });
    });
  }

  changeLang(newLang) {
    if (!this.translations[newLang]) {
      console.warn(`Language ${newLang} not loaded`);
      return;
    }
    
    this.currentLang = newLang;
    this.setStoredLang(newLang);
    this.updateDocumentLang();
    this.updatePageContent();
    this.updateLangButtonActive();
    
    const event = new CustomEvent('languageChanged', { detail: { lang: newLang } });
    document.dispatchEvent(event);
  }

  updateLangButtonActive() {
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
    });
  }

  get(key, fallback) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback !== undefined ? fallback : key;
      }
    }

    if (value === undefined || value === null || value === '') {
      return fallback !== undefined ? fallback : key;
    }
    return value;
  }

  updatePageContent() {
    const elements = document.querySelectorAll('[data-i18n], [data-i18n-placeholder]');

    elements.forEach(el => {
      // data-i18n-placeholder：仅设置输入框占位符，不替换元素文本
      const placeholderKey = el.dataset.i18nPlaceholder;
      if (placeholderKey) {
        const translation = this.get(placeholderKey);
        if (translation && translation !== placeholderKey) {
          el.placeholder = translation;
        }
      }

      const key = el.dataset.i18n;
      if (!key) return;
      const translation = this.get(key);

      if (translation && translation !== key) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      }
    });
  }

  getCurrentLang() {
    return this.currentLang;
  }

  // t(key, fallback)：key 缺失时返回 fallback（原实现只接收一个参数，
  // 导致调用方写的默认值全部失效、页面直接显示原始 key）
  t(key, fallback) {
    return this.get(key, fallback);
  }
}

// Create and expose instance
// 注意：页面均以普通 <script> 加载本文件（无 type="module"），
// 因此不能使用 ES Module 的 export 语法，需挂载到 window 供全局使用
const i18n = new I18n();
window.i18n = i18n;

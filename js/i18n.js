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

  get(key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLang];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value || key;
  }

  updatePageContent() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(el => {
      const key = el.dataset.i18n;
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

  t(key) {
    return this.get(key);
  }
}

window.i18n = new I18n();

document.addEventListener('DOMContentLoaded', function() {
  window.i18n.init();
});

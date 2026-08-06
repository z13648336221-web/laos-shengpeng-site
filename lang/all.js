// 多语言合并模块
// 合并所有语言文件到一个对象中

import zhTranslations from './zh.js';
import enTranslations from './en.js';
import viTranslations from './vi.js';

const allTranslations = {
  zh: zhTranslations,
  en: enTranslations,
  vi: viTranslations
};

// Make available globally for compatibility
window.allTranslations = allTranslations;

// Auto-initialize i18n if available
if (window.i18n) {
  window.i18n.init();
}

export default allTranslations;
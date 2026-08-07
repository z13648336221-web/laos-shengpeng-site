// 多语言合并模块
// 在 HTML 中按顺序加载: zh.js -> en.js -> vi.js -> all.js
// 每个语言文件使用独立变量: window._translations_zh, window._translations_en, window._translations_vi

if (!window.allTranslations) {
  window.allTranslations = {};
}

// 注册翻译数据的函数（由各个语言文件调用）
window.registerTranslation = function(lang, data) {
  if (lang && data) {
    window.allTranslations[lang] = JSON.parse(JSON.stringify(data));
    console.log('[i18n] Registered language:', lang);
  }
};

// 自动检测并注册所有已加载的语言数据
(function() {
  // 检查中文翻译
  if (window._translations_zh) {
    window.registerTranslation('zh', window._translations_zh);
  }
  
  // 检查英文翻译
  if (window._translations_en) {
    window.registerTranslation('en', window._translations_en);
  }
  
  // 检查越南语翻译
  if (window._translations_vi) {
    window.registerTranslation('vi', window._translations_vi);
  }
  
  console.log('[i18n] All translations loaded:', Object.keys(window.allTranslations));
})();
document.addEventListener('DOMContentLoaded', function() {
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = `
    <div class="loading-logo">🚢</div>
    <div class="loading-spinner"></div>
    <div class="loading-text" data-i18n="loading.text">加载中...</div>
  `;
  document.body.appendChild(loadingOverlay);

  setTimeout(() => {
    loadingOverlay.classList.add('hidden');
    setTimeout(() => {
      if (loadingOverlay.parentNode) {
        loadingOverlay.parentNode.removeChild(loadingOverlay);
      }
    }, 500);
  }, 800);
});
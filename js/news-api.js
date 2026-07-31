/**
 * 新闻API集成模块
 */

const NEWS_API_URL = '/api/news';
let currentCategory = '';
let currentPage = 1;
let totalPages = 1;

async function loadNews(category = '', page = 1, append = false) {
  const lang = window.i18n?.getCurrentLang() || 'zh';
  const container = document.querySelector('.news-list') || document.querySelector('.news-grid');
  
  if (category !== undefined) {
    currentCategory = category;
  }
  if (page !== undefined) {
    currentPage = page;
  }

  try {
    let fetchUrl = NEWS_API_URL + '?lang=' + lang + '&page=' + currentPage + '&limit=10';
    
    if (currentCategory && currentCategory !== 'all') {
      fetchUrl += '&category=' + encodeURIComponent(currentCategory);
    }

    const response = await fetch(fetchUrl);
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      if (append) {
        appendNewsList(result.data, container);
      } else {
        renderNewsList(result.data, container);
      }
      if (result.pagination) {
        totalPages = result.pagination.totalPages || 1;
      }
      return result.pagination;
    } else {
      console.log('API无数据或返回空，使用静态内容');
    }
  } catch (error) {
    console.log('无法从API加载新闻，使用静态内容:', error.message);
  }
}

function renderNewsList(newsList, container) {
  if (!container || !newsList || newsList.length === 0) {
    return;
  }

  const categoryColors = {
    company: 'linear-gradient(135deg,#e3f2fd,#bbdefb)',
    service: 'linear-gradient(135deg,#fff3e0,#ffe0b2)',
    policy: 'linear-gradient(135deg,#fce4ec,#f8bbd9)',
    industry: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)',
    guide: 'linear-gradient(135deg,#f3e5f5,#e1bee7)'
  };

  const categoryIcons = {
    company: '🏢',
    service: '🚀',
    policy: '⚖️',
    industry: '📊',
    guide: '📋'
  };

  const categoryNames = {
    company: '公司动态',
    service: '服务资讯',
    policy: '政策解读',
    industry: '行业动态',
    guide: '操作指南'
  };

  const lang = window.i18n?.getCurrentLang() || 'zh';
  const moreText = lang === 'zh' ? '阅读全文 →' : lang === 'en' ? 'Read More →' : 'Đọc Thêm →';

  container.innerHTML = newsList.map(news => {
    const bgColor = categoryColors[news.category] || categoryColors.company;
    const icon = categoryIcons[news.category] || '📰';
    const categoryName = lang === 'zh' 
      ? (categoryNames[news.category] || news.category)
      : (news.category_label || categoryNames[news.category] || news.category);
    
    const title = news.title || '无标题';
    const summary = news.summary || '';
    const content = news.content || '';

    return `
      <div class="news-card" data-cat="${news.category}" data-id="${news.id}">
        <div class="news-img" style="background:${bgColor};">
          <span class="news-cat">${categoryName}</span>
          ${icon}
        </div>
        <div class="news-body">
          <div class="news-meta">
            <span>📅 ${news.publish_date || (news.created_at ? news.created_at.split('T')[0] : '')}</span>
            <span>👁 点击查看</span>
          </div>
          <h3>${title}</h3>
          <p>${summary || (content ? content.substring(0, 100) + '...' : '')}</p>
          <span class="news-read-more" onclick="viewNewsDetail(${news.id})" style="cursor:pointer;">${moreText}</span>
        </div>
      </div>
    `;
  }).join('');
}

function viewNewsDetail(newsId) {
  const lang = window.i18n?.getCurrentLang() || 'zh';
  const url = `${NEWS_API_URL}/${newsId}?lang=${lang}`;
  
  fetch(url)
    .then(response => response.json())
    .then(result => {
      if (result.success && result.data) {
        showNewsModal(result.data);
      } else {
        alert('无法加载新闻详情');
      }
    })
    .catch(error => {
      console.error('Error loading news detail:', error);
      alert('加载失败，请稍后重试');
    });
}

function showNewsModal(news) {
  const lang = window.i18n?.getCurrentLang() || 'zh';
  
  const categoryNames = {
    company: '公司动态',
    service: '服务资讯',
    policy: '政策解读',
    industry: '行业动态',
    guide: '操作指南'
  };
  
  const categoryName = lang === 'zh'
    ? (categoryNames[news.category] || news.category)
    : (news.category_label || categoryNames[news.category] || news.category);
  
  const title = news.title || '无标题';
  const content = news.content || '';

  const existingModal = document.querySelector('.news-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.className = 'news-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  const imageUrl = news.image_url ? (news.image_url.startsWith('http') ? news.image_url : news.image_url) : '';
  const imageHtml = imageUrl ? `
    <div style="margin-bottom: 20px;">
      <img src="${imageUrl}" style="width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px;" alt="新闻图片" />
    </div>
  ` : '';
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 12px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative;">
      <button onclick="closeNewsModal()" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 28px; cursor: pointer; color: #666; z-index: 1;">×</button>
      <div style="padding: 32px;">
        <span style="display:inline-block; background: var(--primary); color: white; font-size: 12px; padding: 4px 12px; border-radius: 12px; margin-bottom: 16px;">${categoryName}</span>
        <h2 style="font-size: 24px; font-weight: 700; color: #333; margin-bottom: 16px; line-height: 1.4;">${title}</h2>
        <div style="font-size: 14px; color: #666; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #eee;">
          📅 ${news.publish_date || (news.created_at ? news.created_at.split('T')[0] : '')}
        </div>
        ${imageHtml}
        <div style="font-size: 15px; color: #555; line-height: 1.8; white-space: pre-wrap;">${content}</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeNewsModal();
    }
  });
}

function closeNewsModal() {
  const modal = document.querySelector('.news-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
  }
}

function filterNews(btn, cat) {
  document.querySelectorAll('.news-filter-btn').forEach(b => {
    b.style.background = 'white';
    b.style.color = 'var(--gray-600)';
    b.style.borderColor = 'var(--gray-300)';
  });
  
  btn.style.background = 'var(--primary)';
  btn.style.color = 'white';
  btn.style.borderColor = 'var(--primary)';
  
  loadNews(cat, 1);
}

function appendNewsList(newsList, container) {
  if (!container || !newsList || newsList.length === 0) {
    return;
  }

  const categoryColors = {
    company: 'linear-gradient(135deg,#e3f2fd,#bbdefb)',
    service: 'linear-gradient(135deg,#fff3e0,#ffe0b2)',
    policy: 'linear-gradient(135deg,#fce4ec,#f8bbd9)',
    industry: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)',
    guide: 'linear-gradient(135deg,#f3e5f5,#e1bee7)'
  };

  const categoryIcons = {
    company: '🏢',
    service: '🚀',
    policy: '⚖️',
    industry: '📊',
    guide: '📋'
  };

  const categoryNames = {
    company: '公司动态',
    service: '服务资讯',
    policy: '政策解读',
    industry: '行业动态',
    guide: '操作指南'
  };

  const lang = window.i18n?.getCurrentLang() || 'zh';
  const moreText = lang === 'zh' ? '阅读全文 →' : lang === 'en' ? 'Read More →' : 'Đọc Thêm →';

  const newsHtml = newsList.map(news => {
    const bgColor = categoryColors[news.category] || categoryColors.company;
    const icon = categoryIcons[news.category] || '📰';
    const categoryName = lang === 'zh' 
      ? (categoryNames[news.category] || news.category)
      : (news.category_label || categoryNames[news.category] || news.category);
    
    const title = news.title || '无标题';
    const summary = news.summary || '';
    const content = news.content || '';

    return `
      <div class="news-card" data-cat="${news.category}" data-id="${news.id}">
        <div class="news-img" style="background:${bgColor};">
          <span class="news-cat">${categoryName}</span>
          ${icon}
        </div>
        <div class="news-body">
          <div class="news-meta">
            <span>📅 ${news.publish_date || (news.created_at ? news.created_at.split('T')[0] : '')}</span>
            <span>👁 点击查看</span>
          </div>
          <h3>${title}</h3>
          <p>${summary || (content ? content.substring(0, 100) + '...' : '')}</p>
          <span class="news-read-more" onclick="viewNewsDetail(${news.id})" style="cursor:pointer;">${moreText}</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML += newsHtml;
}

function loadMoreNews() {
  const loadMoreBtn = document.querySelector('.btn-gray[data-i18n="news.loadMore"]') || document.querySelector('.btn.btn-gray');
  
  if (currentPage < totalPages) {
    if (loadMoreBtn) {
      loadMoreBtn.innerHTML = '加载中...';
      loadMoreBtn.disabled = true;
    }
    
    loadNews(currentCategory, currentPage + 1, true).then(() => {
      if (loadMoreBtn) {
        const lang = window.i18n?.getCurrentLang() || 'zh';
        loadMoreBtn.innerHTML = lang === 'zh' ? '加载更多资讯' : lang === 'en' ? 'Load More' : 'Tải Thêm';
        loadMoreBtn.disabled = false;
      }
      
      if (currentPage >= totalPages) {
        if (loadMoreBtn) {
          const lang = window.i18n?.getCurrentLang() || 'zh';
          loadMoreBtn.innerHTML = lang === 'zh' ? '已加载全部' : lang === 'en' ? 'All Loaded' : 'Đã tải hết';
          loadMoreBtn.disabled = true;
          loadMoreBtn.style.opacity = '0.5';
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    loadNews('all', 1);
  }, 500);
});

/**
 * 重庆恒慈国际贸易有限公司 - 货物追踪页面逻辑
 * 集成后端API查询运单信息
 */

const TRACKING_API_URL = '/api/tracking';

// 快速查询（示例单号）
function quickTrack(num) {
  document.getElementById('trackingInput').value = num;
  trackShipment();
  return false;
}

// 主查询函数
async function trackShipment() {
  const input = document.getElementById('trackingInput').value.trim().toUpperCase();

  if (!input) {
    alert('请输入运单号');
    return;
  }

  const trackResult = document.getElementById('trackResult');
  const trackNotFound = document.getElementById('trackNotFound');
  const trackTips = document.getElementById('trackTips');

  try {
    const lang = window.i18n?.getCurrentLang() || 'zh';
    const response = await fetch(`${TRACKING_API_URL}/${input}?lang=${lang}`);
    const result = await response.json();

    if (!result.success) {
      trackResult.classList.remove('show');
      trackNotFound.style.display = 'block';
      if (trackTips) trackTips.style.display = 'none';
      return;
    }

    const data = result.data;
    
    trackNotFound.style.display = 'none';
    if (trackTips) trackTips.style.display = 'none';

    // 填入基础信息
    document.getElementById('ti-num').textContent = data.tracking_number;
    document.getElementById('ti-type').textContent = getServiceLabel(data.service_code, lang);
    document.getElementById('ti-eta').textContent = data.estimated_delivery || '--';

    // 状态徽章
    const statusEl = document.getElementById('ti-status');
    const t = window.i18n?.t.bind(window.i18n) || function(k, d) { return d || k.replace('tracking.', ''); };
    const statusMap = {
      pending: `<span class="track-status-badge status-pending">${t('tracking.statusLabels.pending', '○ 待发运')}</span>`,
      picked_up: `<span class="track-status-badge status-transit">${t('tracking.statusLabels.picked_up', '● 已揽收')}</span>`,
      in_transit: `<span class="track-status-badge status-transit">${t('tracking.statusLabels.in_transit', '● 运输中')}</span>`,
      departed: `<span class="track-status-badge status-transit">${t('tracking.statusLabels.departed', '● 已离港')}</span>`,
      customs: `<span class="track-status-badge status-transit">${t('tracking.statusLabels.customs', '● 清关中')}</span>`,
      delivered: `<span class="track-status-badge status-delivered">${t('tracking.statusLabels.delivered', '✓ 已签收')}</span>`,
      cancelled: `<span class="track-status-badge status-cancelled">${t('tracking.statusLabels.cancelled', '✕ 已取消')}</span>`,
    };
    statusEl.innerHTML = statusMap[data.status] || `<span class="track-status-badge">${data.status_label}</span>`;

    // 货物信息
    const cargoCard = document.getElementById('cargoInfoCard');
    cargoCard.innerHTML = `
      <h4>📦 ${t('tracking.cargoInfo', '货物信息')}</h4>
      <div class="info-item"><span class="dot"></span><span><strong>${t('tracking.cargoName', '品名')}：</strong>${data.cargo.description || '--'}</span></div>
      <div class="info-item"><span class="dot"></span><span><strong>${t('tracking.weight', '重量')}：</strong>${data.cargo.weight ? data.cargo.weight + ' KG' : '--'}</span></div>
      <div class="info-item"><span class="dot"></span><span><strong>${t('tracking.volume', '体积')}：</strong>${data.cargo.volume ? data.cargo.volume + ' CBM' : '--'}</span></div>
      <div class="info-item"><span class="dot"></span><span><strong>${t('tracking.origin', '起运地')}：</strong>${data.cargo.origin || '--'}</span></div>
      <div class="info-item"><span class="dot"></span><span><strong>${t('tracking.destination', '目的地')}：</strong>${data.cargo.destination || '--'}</span></div>
      <div style="border-top:1px solid var(--gray-200);margin:12px 0 12px;"></div>
      <div class="info-item"><span class="dot"></span><span><strong>${t('tracking.sender', '发货方')}：</strong>${data.cargo.sender_name || '--'}</span></div>
      <div class="info-item"><span class="dot"></span><span><strong>${t('tracking.receiver', '收货方')}：</strong>${data.cargo.receiver_name || '--'}</span></div>
    `;

    // 时间线
    const timelineList = document.getElementById('timelineList');
    timelineList.innerHTML = '';
    
    data.timeline.forEach((item, index) => {
      const li = document.createElement('div');
      const isFirst = index === 0;
      const statusClass = isFirst ? 'current' : 'done';
      li.className = 'tl-item ' + statusClass;
      
      const date = new Date(item.time);
      const timeStr = formatDateTime(item.time);
      
      li.innerHTML = `
        <div class="tl-dot"></div>
        <div class="tl-time">${timeStr}</div>
        <div class="tl-title">${item.status_label || item.description}</div>
        <div class="tl-desc">${item.location ? item.location + ' - ' : ''}${item.description}</div>
      `;
      timelineList.appendChild(li);
    });

    trackResult.classList.add('show');
    trackResult.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (error) {
    console.error('Error tracking shipment:', error);
    trackResult.classList.remove('show');
    trackNotFound.style.display = 'block';
    if (trackTips) trackTips.style.display = 'none';
  }
}

function getServiceLabel(serviceCode, lang) {
  const labels = {
    'railway': { zh: '🚂 中老铁路陆运', en: '🚂 Laos-China Railway', vi: '🚂 Đường sắt Trung-Lào' },
    'thailand-sea': { zh: '🚢 泰国海运', en: '🚢 Thailand Sea Freight', vi: '🚢 Vận chuyển biển Thái Lan' },
    'thai_sea': { zh: '🚢 泰国海运', en: '🚢 Thailand Sea Freight', vi: '🚢 Vận chuyển biển Thái Lan' },
    'vietnam-sea': { zh: '⚓ 越南海运', en: '⚓ Vietnam Sea Freight', vi: '⚓ Vận chuyển biển Việt Nam' },
    'viet_sea': { zh: '⚓ 越南海运', en: '⚓ Vietnam Sea Freight', vi: '⚓ Vận chuyển biển Việt Nam' },
  };
  return labels[serviceCode] ? labels[serviceCode][lang] || serviceCode : serviceCode;
}

function formatDateTime(isoString) {
  if (!isoString) return '--';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 回车触发查询
document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('trackingInput');
  if (input) {
    input.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') trackShipment();
    });
  }

  // 响应式时间线布局
  function adjustLayout() {
    const layout = document.querySelector('.track-detail-layout');
    if (!layout) return;
    if (window.innerWidth < 768) {
      layout.style.gridTemplateColumns = '1fr';
    } else {
      layout.style.gridTemplateColumns = '1fr 340px';
    }
  }
  adjustLayout();
  window.addEventListener('resize', adjustLayout);
});
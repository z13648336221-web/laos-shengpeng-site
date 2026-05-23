/**
 * 盛鹏跨境物流 - 货物追踪页面逻辑
 * 包含：运单查询、时间线渲染（模拟数据）
 */

// =============================================
// 模拟物流数据库
// =============================================
const trackingDatabase = {
  'SP20240001': {
    num: 'SP20240001',
    type: '🚂 中老铁路陆运',
    status: 'transit',
    statusLabel: '运输中',
    eta: '2024-12-18',
    cargo: {
      name: '电子产品（手机配件）',
      weight: '386 KG',
      volume: '2.4 CBM',
      origin: '广州',
      destination: '老挝·万象',
      shipper: '广州某科技有限公司',
      consignee: '老挝盛某贸易有限公司',
    },
    timeline: [
      { time: '2024-12-11 09:30', title: '订单已确认', desc: '盛鹏物流已确认您的订单，正在安排提货', status: 'done' },
      { time: '2024-12-12 14:20', title: '货物已揽收', desc: '货物已从广州仓库完成揽收，重量：386KG', status: 'done' },
      { time: '2024-12-12 18:05', title: '出口报关申报', desc: '广州海关出口报关申报提交，等待审核', status: 'done' },
      { time: '2024-12-13 10:15', title: '出口报关放行', desc: '广州海关出口放行，货物准备装车运往昆明', status: 'done' },
      { time: '2024-12-14 07:30', title: '昆明南站装车', desc: '货物已装入中老铁路列车，班列号：C885', status: 'done' },
      { time: '2024-12-14 08:00', title: '列车出发', desc: '列车从昆明南站准时出发，预计17:00到达磨憨', status: 'done' },
      { time: '2024-12-14 17:30', title: '磨憨口岸入境', desc: '列车抵达磨憨/磨丁口岸，正在办理中老两国换乘手续', status: 'current' },
      { time: '预计 2024-12-15 10:00', title: '老挝进口清关', desc: '等待磨丁口岸老挝海关进口清关放行', status: 'pending' },
      { time: '预计 2024-12-16 08:00', title: '万象到达', desc: '货物预计抵达万象站', status: 'pending' },
      { time: '预计 2024-12-18 18:00', title: '签收完成', desc: '本地车辆派送至目的地，等待收货方签收', status: 'pending' },
    ],
  },
  'SP20240088': {
    num: 'SP20240088',
    type: '⚓ 越南海运',
    status: 'delivered',
    statusLabel: '已签收',
    eta: '2024-12-10（已完成）',
    cargo: {
      name: '纺织辅料（纽扣/拉链）',
      weight: '1,240 KG',
      volume: '8.5 CBM',
      origin: '深圳',
      destination: '越南·胡志明市',
      shipper: '深圳某纺织有限公司',
      consignee: '胡志明某服装厂',
    },
    timeline: [
      { time: '2024-12-02 10:00', title: '订单已确认', desc: '盛鹏物流已确认订单', status: 'done' },
      { time: '2024-12-03 14:30', title: '货物已揽收', desc: '深圳仓库揽收，重量：1240KG，体积：8.5CBM', status: 'done' },
      { time: '2024-12-03 17:00', title: '报关申报', desc: '深圳海关出口报关申报完成', status: 'done' },
      { time: '2024-12-04 09:20', title: '出口放行', desc: '深圳海关出口放行，安排集港', status: 'done' },
      { time: '2024-12-04 15:00', title: '装船完成', desc: '货物装入COSCO SHIPPING UNIVERSE船，航次V104E', status: 'done' },
      { time: '2024-12-04 18:00', title: '船舶出发', desc: '船舶从深圳蛇口港出发，目的地：胡志明市港', status: 'done' },
      { time: '2024-12-07 06:30', title: '抵达胡志明港', desc: '船舶抵达胡志明市新港（Cat Lai Port）', status: 'done' },
      { time: '2024-12-08 14:00', title: '越南进口清关', desc: '越南海关进口清关完成，关税已缴纳', status: 'done' },
      { time: '2024-12-09 09:00', title: '提柜派送', desc: '本地车辆提柜，前往目的地工厂', status: 'done' },
      { time: '2024-12-10 10:30', title: '✅ 签收完成', desc: '货物已由收货方签收确认，物流完结。感谢您选择盛鹏物流！', status: 'done' },
    ],
  },
  'SP20240156': {
    num: 'SP20240156',
    type: '🚢 泰国海运',
    status: 'transit',
    statusLabel: '海运途中',
    eta: '2024-12-20',
    cargo: {
      name: '家具（沙发/茶几）',
      weight: '3,800 KG',
      volume: '28 CBM',
      origin: '广州（佛山起运）',
      destination: '泰国·曼谷',
      shipper: '佛山某家具有限公司',
      consignee: '曼谷某家居贸易公司',
    },
    timeline: [
      { time: '2024-12-08 09:00', title: '订单已确认', desc: '整柜40HQ订单已确认，安排拖车提货', status: 'done' },
      { time: '2024-12-09 10:30', title: '拖车提货', desc: '佛山工厂提取货物，整柜40HQ，已完成装柜', status: 'done' },
      { time: '2024-12-10 08:00', title: '出口报关', desc: '广州海关出口报关申报，货物品名：家具', status: 'done' },
      { time: '2024-12-10 16:00', title: '出口放行', desc: '广州南沙港出口放行，货柜已到港', status: 'done' },
      { time: '2024-12-11 10:00', title: '船舶出发', desc: '货柜装入MAERSK SKAGENBANK船，从南沙港出发', status: 'done' },
      { time: '2024-12-13 08:00', title: '新加坡中转', desc: '船舶抵达新加坡港中转换船，等待泰国直航班轮', status: 'current' },
      { time: '预计 2024-12-16 00:00', title: '离开新加坡', desc: '换乘泰国直航班轮，驶往林查班港', status: 'pending' },
      { time: '预计 2024-12-18 06:00', title: '抵达林查班港', desc: '船舶预计到达泰国林查班港', status: 'pending' },
      { time: '预计 2024-12-19 12:00', title: '泰国清关', desc: '泰国海关进口清关及关税缴纳', status: 'pending' },
      { time: '预计 2024-12-20 18:00', title: '派送签收', desc: '本地车辆提柜配送至曼谷目的地仓库', status: 'pending' },
    ],
  },
};

// =============================================
// 追踪查询功能
// =============================================

// 快速查询（示例单号）
function quickTrack(num) {
  document.getElementById('trackingInput').value = num;
  trackShipment();
  return false;
}

// 主查询函数
function trackShipment() {
  const input = document.getElementById('trackingInput').value.trim().toUpperCase();

  if (!input) {
    alert('请输入运单号');
    return;
  }

  const trackResult = document.getElementById('trackResult');
  const trackNotFound = document.getElementById('trackNotFound');
  const trackTips = document.getElementById('trackTips');

  // 查找数据
  const data = trackingDatabase[input];

  if (!data) {
    trackResult.classList.remove('show');
    trackNotFound.style.display = 'block';
    if (trackTips) trackTips.style.display = 'none';
    return;
  }

  trackNotFound.style.display = 'none';
  if (trackTips) trackTips.style.display = 'none';

  // 填入基础信息
  document.getElementById('ti-num').textContent = data.num;
  document.getElementById('ti-type').textContent = data.type;
  document.getElementById('ti-eta').textContent = data.eta;

  // 状态徽章
  const statusEl = document.getElementById('ti-status');
  const statusMap = {
    transit: '<span class="track-status-badge status-transit">● 运输中</span>',
    delivered: '<span class="track-status-badge status-delivered">✓ 已签收</span>',
    pending: '<span class="track-status-badge status-pending">○ 待发运</span>',
  };
  statusEl.innerHTML = statusMap[data.status] || data.statusLabel;

  // 货物信息
  const cargoCard = document.getElementById('cargoInfoCard');
  cargoCard.innerHTML = `
    <h4>📦 货物信息</h4>
    <div class="info-item"><span class="dot"></span><span><strong>品名：</strong>${data.cargo.name}</span></div>
    <div class="info-item"><span class="dot"></span><span><strong>重量：</strong>${data.cargo.weight}</span></div>
    <div class="info-item"><span class="dot"></span><span><strong>体积：</strong>${data.cargo.volume}</span></div>
    <div class="info-item"><span class="dot"></span><span><strong>起运地：</strong>${data.cargo.origin}</span></div>
    <div class="info-item"><span class="dot"></span><span><strong>目的地：</strong>${data.cargo.destination}</span></div>
    <div style="border-top:1px solid var(--gray-200);margin:12px 0 12px;"></div>
    <div class="info-item"><span class="dot"></span><span><strong>发货方：</strong>${data.cargo.shipper}</span></div>
    <div class="info-item"><span class="dot"></span><span><strong>收货方：</strong>${data.cargo.consignee}</span></div>
  `;

  // 时间线
  const timelineList = document.getElementById('timelineList');
  timelineList.innerHTML = '';
  data.timeline.forEach(item => {
    const li = document.createElement('div');
    li.className = 'tl-item ' + item.status;
    li.innerHTML = `
      <div class="tl-dot"></div>
      <div class="tl-time">${item.time}</div>
      <div class="tl-title">${item.title}</div>
      <div class="tl-desc">${item.desc}</div>
    `;
    timelineList.appendChild(li);
  });

  trackResult.classList.add('show');
  trackResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

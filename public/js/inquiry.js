/**
 * 重庆恒慈国际贸易有限公司 - 在线询价页面逻辑
 * 集成智能推荐、价格对比、运费明细、优惠券功能
 */

const INQUIRY_API_URL = '/api/inquiry';
const COUPON_API_URL = '/api/coupon';

let selectedTransport = 'rail';
let appliedCoupon = null;

// =============================================
// 城市名称映射
// =============================================
const cityNames = {
  KM: '昆明', CQ: '重庆', CD: '成都', GZ: '广州', SZ: '深圳',
  DG: '东莞', FO: '佛山', YW: '义乌', SH: '上海', NJ: '宁波',
  VTE: '老挝·万象', LPQ: '老挝·琅勃拉邦', VANG: '老挝·万荣',
  BKK: '泰国·曼谷', LCH: '泰国·林查班', CM: '泰国·清迈', PHUKET: '泰国·普吉岛',
  HCM: '越南·胡志明市', HPH: '越南·海防', HAN: '越南·河内', DAN: '越南·岘港',
};

// =============================================
// 起运地距离系数（以昆明为基准，越远越贵）
// 基于实际市场价：云南最近，华南中等，华东最远
// =============================================
const originAdjust = {
  KM: 0,     // 昆明（基准，最近）
  CQ: 0.10,  // 重庆
  CD: 0.12,  // 成都
  GZ: 0.20,  // 广州
  SZ: 0.20,  // 深圳
  DG: 0.20,  // 东莞
  FO: 0.20,  // 佛山
  YW: 0.28,  // 义乌
  SH: 0.35,  // 上海
  NJ: 0.30,  // 宁波
};

// =============================================
// 目的地系数（不同目的地操作成本不同）
// =============================================
const destAdjust = {
  VTE: 0,      // 万象（基准）
  LPQ: 0.08,   // 琅勃拉邦
  VANG: 0.05,  // 万荣
  BKK: 0.12,   // 曼谷
  LCH: 0.10,   // 林查班
  CM: 0.18,    // 清迈（偏远）
  PHUKET: 0.20,// 普吉（偏远）
  HCM: 0.05,   // 胡志明
  HPH: 0.03,   // 海防
  HAN: 0.08,   // 河内
  DAN: 0.12,   // 岘港
};

// =============================================
// 运输方式配置（6种）- 阶梯定价
// 基于2025-2026年市场实际报价
// 定位为“纯运费参考”（不含清关/关税/派送）
// =============================================
const transportConfig = {
  rail: {
    name: '中老铁路陆运',
    icon: '🚂',
    // 市场价：铁路拼箱8-12元/KG(含清关DDP)
    // 纯运费：3-6元/KG，量大从优
    tiers: [
      { maxWeight: 100,   price: 5.0 },
      { maxWeight: 500,   price: 4.0 },
      { maxWeight: 2000,  price: 3.2 },
      { maxWeight: 5000,  price: 2.6 },
      { maxWeight: Infinity, price: 2.0 },
    ],
    minPricePerUnit: 1.8,  // 最低价/KG
    maxPricePerUnit: 5.5,  // 最高价/KG
    customsFee: 100,
    insuranceRate: 0.003,
    transitDays: '5-7天',
    transitDaysNum: 6,
    origins: ['KM', 'CQ', 'CD', 'GZ', 'SZ', 'DG', 'FO', 'YW', 'SH', 'NJ'],
    destinations: ['VTE', 'LPQ', 'VANG'],
    description: '性价比高，时效稳定',
    fuelRate: 0.05,        // 燃油附加费5%
    fixedFee: 50,          // 站场操作费
    fixedFeeLabel: '站场操作费',
  },
  road: {
    name: '中老公路运输',
    icon: '🚛',
    // 市场价：云南→万象 9-11元/KG(DDP)
    // 纯运费：4-7元/KG
    tiers: [
      { maxWeight: 100,   price: 5.5 },
      { maxWeight: 500,   price: 4.5 },
      { maxWeight: 2000,  price: 3.5 },
      { maxWeight: 5000,  price: 2.8 },
      { maxWeight: Infinity, price: 2.2 },
    ],
    minPricePerUnit: 2.0,
    maxPricePerUnit: 6.0,
    customsFee: 100,
    insuranceRate: 0.003,
    transitDays: '4-6天',
    transitDaysNum: 5,
    origins: ['KM', 'CQ', 'CD', 'GZ', 'SZ', 'DG', 'FO'],
    destinations: ['VTE', 'LPQ', 'VANG'],
    description: '灵活门到门，适合中小批量',
    fuelRate: 0.05,
    fixedFee: 40,
    fixedFeeLabel: '装卸操作费',
  },
  'thai-rail': {
    name: '中老泰铁路联运',
    icon: '🚂',
    // 市场价：铁路联运到泰国约5-8元/KG
    tiers: [
      { maxWeight: 100,   price: 6.5 },
      { maxWeight: 500,   price: 5.0 },
      { maxWeight: 2000,  price: 4.0 },
      { maxWeight: 5000,  price: 3.2 },
      { maxWeight: Infinity, price: 2.5 },
    ],
    minPricePerUnit: 2.2,
    maxPricePerUnit: 7.0,
    customsFee: 120,
    insuranceRate: 0.003,
    transitDays: '8-12天',
    transitDaysNum: 10,
    origins: ['KM', 'CQ', 'CD', 'GZ', 'SZ', 'DG', 'FO', 'YW', 'SH', 'NJ'],
    destinations: ['BKK', 'LCH', 'CM', 'PHUKET'],
    description: '铁路联运直达泰国，安全高效',
    fuelRate: 0.05,
    fixedFee: 80,
    fixedFeeLabel: '换装操作费',
  },
  'viet-rail': {
    name: '中越铁路联运',
    icon: '🚂',
    // 市场价：铁路到越南4-6元/KG
    tiers: [
      { maxWeight: 100,   price: 5.5 },
      { maxWeight: 500,   price: 4.5 },
      { maxWeight: 2000,  price: 3.5 },
      { maxWeight: 5000,  price: 2.8 },
      { maxWeight: Infinity, price: 2.2 },
    ],
    minPricePerUnit: 2.0,
    maxPricePerUnit: 6.0,
    customsFee: 120,
    insuranceRate: 0.003,
    transitDays: '6-9天',
    transitDaysNum: 7,
    origins: ['KM', 'CQ', 'CD', 'GZ', 'SZ', 'DG', 'FO', 'YW', 'SH', 'NJ'],
    destinations: ['HCM', 'HPH', 'HAN', 'DAN'],
    description: '铁路直达越南，通关便捷',
    fuelRate: 0.05,
    fixedFee: 70,
    fixedFeeLabel: '换装操作费',
  },
  thai: {
    name: '泰国海运',
    icon: '🚢',
    // 市场价：海运拼箱50-100元/CBM(纯运费)
    // DDP: 150-350元/CBM
    tiers: [
      { maxWeight: 500,   price: 80 },
      { maxWeight: 2000,  price: 65 },
      { maxWeight: 5000,  price: 55 },
      { maxWeight: Infinity, price: 45 },
    ],
    minPricePerUnit: 40,
    maxPricePerUnit: 85,
    customsFee: 120,
    insuranceRate: 0.0025,
    transitDays: '7-12天',
    transitDaysNum: 10,
    origins: ['GZ', 'SZ', 'DG', 'FO', 'YW', 'SH', 'NJ'],
    destinations: ['BKK', 'LCH', 'CM', 'PHUKET'],
    description: '大批量首选，价格优惠',
    fuelRate: 0,
    fixedFee: 80,
    fixedFeeLabel: '港口杂费',
    priceUnit: 'CBM',
  },
  viet: {
    name: '越南海运',
    icon: '⚓',
    // 市场价：海运到越南 3-6元/KG，约60-100元/CBM
    tiers: [
      { maxWeight: 500,   price: 70 },
      { maxWeight: 2000,  price: 55 },
      { maxWeight: 5000,  price: 45 },
      { maxWeight: Infinity, price: 35 },
    ],
    minPricePerUnit: 30,
    maxPricePerUnit: 75,
    customsFee: 120,
    insuranceRate: 0.0025,
    transitDays: '5-8天',
    transitDaysNum: 7,
    origins: ['GZ', 'SZ', 'DG', 'FO', 'YW', 'SH', 'NJ'],
    destinations: ['HCM', 'HPH', 'HAN', 'DAN'],
    description: '海运直达，通关快捷',
    fuelRate: 0,
    fixedFee: 60,
    fixedFeeLabel: '港口杂费',
    priceUnit: 'CBM',
  },
};

const priceConfig = transportConfig;

// =============================================
// 获取阶梯单价（根据重量）
// =============================================
function getTierPrice(config, weight) {
  for (const tier of config.tiers) {
    if (weight <= tier.maxWeight) return tier.price;
  }
  return config.tiers[config.tiers.length - 1].price;
}

// =============================================
// 计算基础运费（含距离调整）
// =============================================
function calcBaseFee(config, weight, volume, origin) {
  const isSea = config.priceUnit === 'CBM';
  let unitPrice, calcAmount, priceUnit;

  if (isSea) {
    // 海运：按CBM计价 = max(体积, 重量/1000)
    const weightVolume = weight / 1000;
    calcAmount = Math.max(volume, weightVolume);
    unitPrice = getTierPrice(config, weight);
    priceUnit = 'CBM';
  } else {
    // 陆运/铁路：按KG计价
    calcAmount = weight;
    unitPrice = getTierPrice(config, weight);
    priceUnit = 'KG';
  }

  let baseFee = calcAmount * unitPrice;

  // 起运地距离加价
  const oAdj = originAdjust[origin] || 0;
  if (oAdj > 0) {
    baseFee *= (1 + oAdj);
  }

  return { baseFee: Math.round(baseFee), unitPrice, calcAmount, priceUnit, oAdj };
}

// =============================================
// 表单验证规则
// =============================================
const validationRules = {
  originCity: { required: true, message: '请选择起运城市' },
  destCity: { required: true, message: '请选择目的城市' },
  cargoName: { required: true, minLength: 2, maxLength: 50, message: '请输入货物品名（2-50个字符）' },
  weight: { required: true, min: 1, max: 999999, message: '请输入有效重量（1-999999KG）' },
  volume: { min: 0, max: 9999, message: '请输入有效体积（0-9999 CBM）' },
  contactName: { required: true, minLength: 2, maxLength: 20, pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/, message: '请输入有效姓名（2-20个字符，支持中文和英文）' },
  contactPhone: { required: true, pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
};

// =============================================
// 显示/清除错误提示
// =============================================
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  const existingError = field.parentElement.querySelector('.field-error');
  if (existingError) existingError.remove();
  field.classList.add('error');
  const errorEl = document.createElement('div');
  errorEl.className = 'field-error';
  errorEl.textContent = message;
  field.parentElement.appendChild(errorEl);
}

function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove('error');
  const errorEl = field.parentElement.querySelector('.field-error');
  if (errorEl) errorEl.remove();
}

function validateField(fieldId) {
  const field = document.getElementById(fieldId);
  const value = field.value;
  const rules = validationRules[fieldId];
  if (!rules) return true;
  clearError(fieldId);
  if (rules.required && (!value || value.trim() === '')) { showError(fieldId, rules.message); return false; }
  if (rules.minLength && value.length < rules.minLength) { showError(fieldId, rules.message); return false; }
  if (rules.maxLength && value.length > rules.maxLength) { showError(fieldId, rules.message); return false; }
  if (rules.min !== undefined && !isNaN(value) && parseFloat(value) < rules.min) { showError(fieldId, rules.message); return false; }
  if (rules.max !== undefined && !isNaN(value) && parseFloat(value) > rules.max) { showError(fieldId, rules.message); return false; }
  if (rules.pattern && !rules.pattern.test(value)) { showError(fieldId, rules.message); return false; }
  return true;
}

function validateForm() {
  let isValid = true;
  if (!selectedTransport) { alert('请选择运输方式'); return false; }
  Object.keys(validationRules).forEach(fieldId => { if (!validateField(fieldId)) isValid = false; });
  if (!isValid) {
    const firstError = document.querySelector('.field-error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return isValid;
}

// =============================================
// 运输方式选择
// =============================================
function selectTransport(el, type) {
  selectedTransport = type;
  document.querySelectorAll('.t-tab').forEach(tab => tab.classList.remove('active'));
  el.classList.add('active');
  updateDestOptions();
  hideRecommendations();
}

function updateDestOptions() {
  const config = transportConfig[selectedTransport];
  if (!config) return;
  const originSelect = document.getElementById('originCity');
  const destSelect = document.getElementById('destCity');
  originSelect.querySelectorAll('option').forEach(opt => {
    if (opt.value === '') { opt.style.display = 'block'; }
    else { opt.style.display = config.origins.includes(opt.value) ? 'block' : 'none'; }
  });
  destSelect.querySelectorAll('option').forEach(opt => {
    if (opt.value === '') { opt.style.display = 'block'; }
    else { opt.style.display = config.destinations.includes(opt.value) ? 'block' : 'none'; }
  });
  originSelect.value = '';
  destSelect.value = '';
}

// =============================================
// 智能推荐：根据起运地+目的地匹配所有可用方案
// =============================================
function getAvailableOptions(origin, dest) {
  if (!origin || !dest) return [];
  const options = [];
  for (const [key, config] of Object.entries(transportConfig)) {
    if (config.origins.includes(origin) && config.destinations.includes(dest)) {
      options.push({ key, ...config });
    }
  }
  return options;
}

function showRecommendations() {
  const origin = document.getElementById('originCity').value;
  const dest = document.getElementById('destCity').value;
  const weight = parseFloat(document.getElementById('weight').value) || 0;
  const volume = parseFloat(document.getElementById('volume').value) || 0;
  const recContainer = document.getElementById('recommendContainer');
  if (!recContainer) return;

  if (!origin || !dest || weight <= 0) {
    recContainer.style.display = 'none';
    return;
  }

  const options = getAvailableOptions(origin, dest);
  if (options.length === 0) {
    recContainer.style.display = 'none';
    return;
  }

  // 计算每种方案的价格
  const priced = options.map(opt => {
    const baseResult = calcBaseFee(opt, weight, volume, origin);
    let baseFee = baseResult.baseFee;
    // 燃油附加费
    const fuelFee = opt.fuelRate > 0 ? Math.round(baseFee * opt.fuelRate) : 0;
    // 固定操作费
    const fixedFee = opt.fixedFee || 0;
    const surcharges = fuelFee + fixedFee;
    const total = baseFee + surcharges;
    // 推荐评分：价格越低越好，时效越快越好
    const score = (1 / total) * 10000 + (1 / opt.transitDaysNum) * 500;
    return { ...opt, total, baseFee, surcharges, priceUnit: baseResult.priceUnit, score };
  });

  // 按评分排序
  priced.sort((a, b) => b.score - a.score);
  const best = priced[0].key;

  let html = '<div style="font-size:13px;font-weight:600;color:var(--gray-800);margin-bottom:10px;">🔍 为您找到 ' + priced.length + ' 个可用方案</div>';
  html += '<div class="recommend-cards">';
  priced.forEach((opt, idx) => {
    const isBest = opt.key === best;
    const isSelected = opt.key === selectedTransport;
    html += `
      <div class="recommend-card ${isBest ? 'best' : ''} ${isSelected ? 'selected' : ''}" onclick="selectRecommend('${opt.key}')">
        ${isBest ? '<div class="recommend-badge">推荐</div>' : ''}
        <div class="rc-header">
          <span class="rc-icon">${opt.icon}</span>
          <span class="rc-name">${opt.name}</span>
        </div>
        <div class="rc-price">¥${opt.total.toLocaleString()}</div>
        <div class="rc-info">
          <span>📦 ${opt.priceUnit}计价</span>
          <span>🕐 ${opt.transitDays}</span>
        </div>
        <div class="rc-desc">${opt.description}</div>
      </div>`;
  });
  html += '</div>';

  recContainer.innerHTML = html;
  recContainer.style.display = 'block';
}

function selectRecommend(type) {
  selectedTransport = type;
  document.querySelectorAll('.t-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.type === type);
  });
  updateDestOptions();
  // 恢复起运地目的地选择
  const origin = document.getElementById('originCity');
  const dest = document.getElementById('destCity');
  const originVal = origin.value;
  const destVal = dest.value;
  // 重新设置（updateDestOptions会清空）
  setTimeout(() => {
    if (originVal) origin.value = originVal;
    if (destVal) dest.value = destVal;
    showRecommendations();
  }, 10);
}

function hideRecommendations() {
  const recContainer = document.getElementById('recommendContainer');
  if (recContainer) recContainer.style.display = 'none';
}

// =============================================
// 价格对比展示
// =============================================
function showPriceComparison() {
  const weight = parseFloat(document.getElementById('weight').value) || 0;
  const volume = parseFloat(document.getElementById('volume').value) || 0;
  const origin = document.getElementById('originCity').value;
  const needCustoms = document.getElementById('needCustoms').value;
  const needInsurance = document.getElementById('needInsurance').value;
  const compareContainer = document.getElementById('priceCompareContainer');
  if (!compareContainer) return;

  if (weight <= 0) {
    compareContainer.style.display = 'none';
    return;
  }

  const config = transportConfig[selectedTransport];
  const baseResult = calcBaseFee(config, weight, volume, origin);
  const fuelFee = config.fuelRate > 0 ? Math.round(baseResult.baseFee * config.fuelRate) : 0;
  const fixedFee = config.fixedFee || 0;

  let html = '<div class="compare-table-wrap"><table class="compare-table"><thead><tr>';
  html += '<th>费用项目</th><th>' + config.name + '</th></tr></thead><tbody>';

  // 基础运费
  const tierLabel = baseResult.oAdj > 0 ? `（含${cityNames[origin] || ''}距离加价${Math.round(baseResult.oAdj * 100)}%）` : '';
  html += `<tr><td>基础运费（${baseResult.unitPrice}元/${baseResult.priceUnit} × ${baseResult.calcAmount.toFixed(baseResult.priceUnit === 'CBM' ? 2 : 0)}${baseResult.priceUnit}）${tierLabel}</td><td>¥${baseResult.baseFee.toLocaleString()}</td></tr>`;

  // 燃油附加费
  if (fuelFee > 0) {
    html += `<tr><td>燃油附加费（${(config.fuelRate * 100).toFixed(0)}%）</td><td>¥${fuelFee.toLocaleString()}</td></tr>`;
  }
  // 固定操作费
  if (fixedFee > 0) {
    html += `<tr><td>${config.fixedFeeLabel}</td><td>¥${fixedFee.toLocaleString()}</td></tr>`;
  }

  // 清关费
  if (needCustoms === 'yes') {
    html += `<tr><td>目的地清关（代理清关）</td><td>¥${config.customsFee.toLocaleString()}</td></tr>`;
  }

  // 保险
  if (needInsurance === 'yes') {
    const estimatedValue = (baseResult.baseFee + fuelFee + fixedFee) * 10;
    const insFee = Math.round(estimatedValue * config.insuranceRate);
    html += `<tr><td>货物保险（货值的${(config.insuranceRate * 100).toFixed(1)}%）</td><td>¥${insFee.toLocaleString()}</td></tr>`;
  }

  // 合计
  const quote = calculateQuote();
  if (quote) {
    html += `<tr class="compare-total"><td>预估合计</td><td>¥${quote.price.toLocaleString()}</td></tr>`;
  }

  html += '</tbody></table></div>';
  compareContainer.innerHTML = html;
  compareContainer.style.display = 'block';
}

// =============================================
// 计算报价（含明细）
// =============================================
function calculateQuote() {
  const config = priceConfig[selectedTransport];
  if (!config) return null;
  const weight = parseFloat(document.getElementById('weight').value) || 0;
  const volume = parseFloat(document.getElementById('volume').value) || 0;
  const origin = document.getElementById('originCity').value;
  const needCustoms = document.getElementById('needCustoms').value;
  const needInsurance = document.getElementById('needInsurance').value;

  if (weight <= 0) return null;

  // 基础运费（含阶梯+距离调整）
  const baseResult = calcBaseFee(config, weight, volume, origin);
  let baseFee = baseResult.baseFee;
  const priceUnit = baseResult.priceUnit;

  // 燃油附加费（按基础运费比例）
  const fuelFee = config.fuelRate > 0 ? Math.round(baseFee * config.fuelRate) : 0;

  // 固定操作费
  const fixedFee = config.fixedFee || 0;

  // 清关费
  let customsFee = 0;
  if (needCustoms === 'yes') {
    customsFee = config.customsFee;
  }

  // 保险费（货值 = 运费总额×10，费率0.25%-0.3%）
  let insuranceFee = 0;
  if (needInsurance === 'yes') {
    const estimatedValue = (baseFee + fuelFee + fixedFee) * 10;
    insuranceFee = Math.round(estimatedValue * config.insuranceRate);
  }

  let totalPrice = baseFee + fuelFee + fixedFee + customsFee + insuranceFee;

  // 优惠券折扣
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discount = Math.round(totalPrice * appliedCoupon.value / 100);
    } else if (appliedCoupon.type === 'fixed') {
      discount = Math.min(appliedCoupon.value, totalPrice);
    }
    totalPrice -= discount;
  }

  // 价格区间（基于阶梯最低/最高价）
  const minUnitPrice = config.minPricePerUnit;
  const maxUnitPrice = config.maxPricePerUnit;
  const calcAmount = baseResult.calcAmount;
  const minPrice = Math.round(calcAmount * minUnitPrice);
  const maxPrice = Math.round(calcAmount * maxUnitPrice);

  // 附加费明细
  const surchargeDetails = [];
  if (fuelFee > 0) surchargeDetails.push({ name: `燃油附加费（${(config.fuelRate * 100).toFixed(0)}%）`, amount: fuelFee });
  if (fixedFee > 0) surchargeDetails.push({ name: config.fixedFeeLabel, amount: fixedFee });

  return {
    price: totalPrice,
    minPrice, maxPrice,
    unit: priceUnit,
    transitDays: config.transitDays,
    customs: needCustoms === 'yes',
    insurance: needInsurance === 'yes',
    baseFee: Math.round(baseFee),
    surchargeDetails,
    surchargeTotal: fuelFee + fixedFee,
    customsFee,
    insuranceFee,
    discount,
    coupon: appliedCoupon,
    unitPrice: baseResult.unitPrice,
    originAdj: baseResult.oAdj,
  };
}

// =============================================
// 显示报价结果（含明细）
// =============================================
function displayQuote(quote) {
  const resultEl = document.getElementById('quoteResult');
  const priceEl = document.getElementById('quotePriceMain');
  const unitEl = document.getElementById('quotePriceUnit');
  const detailsEl = document.getElementById('quoteDetails');

  resultEl.style.opacity = '0';
  resultEl.style.transform = 'translateY(20px)';

  if (quote.minPrice === quote.maxPrice) {
    priceEl.textContent = '¥' + quote.price.toLocaleString();
  } else {
    priceEl.textContent = '¥' + quote.minPrice.toLocaleString() + ' - ¥' + quote.maxPrice.toLocaleString();
  }
  unitEl.textContent = '（按' + quote.unit + '计算）';

  // 费用明细
  let detailHtml = '';
  detailHtml += `<div class="quote-detail-row"><span class="detail-label">运输方式</span><span class="detail-value">${transportConfig[selectedTransport].name}</span></div>`;
  detailHtml += `<div class="quote-detail-row"><span class="detail-label">预计时效</span><span class="detail-value">${quote.transitDays}（含清关）</span></div>`;

  // 费用 breakdown
  detailHtml += '<div class="quote-breakdown">';
  detailHtml += '<div class="breakdown-title">💰 费用明细</div>';
  detailHtml += `<div class="breakdown-row"><span>基础运费</span><span>¥${quote.baseFee.toLocaleString()}</span></div>`;
  if (quote.surchargeDetails && quote.surchargeDetails.length > 0) {
    quote.surchargeDetails.forEach(s => {
      detailHtml += `<div class="breakdown-row"><span>${s.name}</span><span>¥${s.amount.toLocaleString()}</span></div>`;
    });
  }
  if (quote.customs) {
    detailHtml += `<div class="breakdown-row"><span>目的地清关</span><span>¥${quote.customsFee.toLocaleString()}</span></div>`;
  }
  if (quote.insurance) {
    detailHtml += `<div class="breakdown-row"><span>货物保险</span><span>¥${quote.insuranceFee.toLocaleString()}</span></div>`;
  }
  if (quote.discount > 0) {
    detailHtml += `<div class="breakdown-row discount"><span>优惠券折扣${quote.coupon ? '（' + quote.coupon.code + '）' : ''}</span><span>-¥${quote.discount.toLocaleString()}</span></div>`;
  }
  detailHtml += `<div class="breakdown-row total"><span>预估合计</span><span>¥${quote.price.toLocaleString()}</span></div>`;
  detailHtml += '</div>';

  // 清关和保险状态
  detailHtml += `<div class="quote-detail-row"><span class="detail-label">目的地清关</span><span class="detail-value">${quote.customs ? '<span style="color:#28a745;">包含（代理清关）</span>' : '<span style="color:#6c757d;">不包含</span>'}</span></div>`;
  detailHtml += `<div class="quote-detail-row"><span class="detail-label">货物保险</span><span class="detail-value">${quote.insurance ? '<span style="color:#28a745;">包含（货值的0.3%）</span>' : '<span style="color:#6c757d;">不包含</span>'}</span></div>`;

  detailsEl.innerHTML = detailHtml;

  resultEl.classList.add('show');
  setTimeout(() => {
    resultEl.style.opacity = '1';
    resultEl.style.transform = 'translateY(0)';
  }, 50);
}

// =============================================
// 优惠券功能
// =============================================
async function applyCoupon() {
  const codeInput = document.getElementById('couponCode');
  const code = codeInput ? codeInput.value.trim() : '';
  if (!code) { alert('请输入优惠码'); return; }

  const btn = document.getElementById('applyCouponBtn');
  if (btn) { btn.disabled = true; btn.textContent = '验证中...'; }

  try {
    const resp = await fetch(COUPON_API_URL + '/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const result = await resp.json();
    if (result.success) {
      appliedCoupon = result.data;
      const statusEl = document.getElementById('couponStatus');
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#28a745;">✅ 优惠码已生效：${result.data.description}</span>`;
      }
      // 重新计算报价（如果已有报价）
      if (document.getElementById('quoteResult').classList.contains('show')) {
        const quote = calculateQuote();
        if (quote) displayQuote(quote);
      }
    } else {
      appliedCoupon = null;
      const statusEl = document.getElementById('couponStatus');
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#e53935;">❌ ${result.message}</span>`;
      }
    }
  } catch (e) {
    console.error('优惠券验证失败:', e);
    // 离线模式：使用本地验证
    const localCoupons = {
      'HENGCI10': { code: 'HENGCI10', type: 'percent', value: 10, description: '9折优惠' },
      'NEWCUSTOMER': { code: 'NEWCUSTOMER', type: 'fixed', value: 50, description: '立减50元' },
      'VIP200': { code: 'VIP200', type: 'fixed', value: 200, description: '立减200元' },
    };
    if (localCoupons[code.toUpperCase()]) {
      appliedCoupon = localCoupons[code.toUpperCase()];
      const statusEl = document.getElementById('couponStatus');
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#28a745;">✅ 优惠码已生效：${appliedCoupon.description}</span>`;
      }
      if (document.getElementById('quoteResult').classList.contains('show')) {
        const quote = calculateQuote();
        if (quote) displayQuote(quote);
      }
    } else {
      const statusEl = document.getElementById('couponStatus');
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:#e53935;">❌ 优惠码无效</span>`;
      }
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '使用'; }
  }
}

function removeCoupon() {
  appliedCoupon = null;
  const codeInput = document.getElementById('couponCode');
  if (codeInput) codeInput.value = '';
  const statusEl = document.getElementById('couponStatus');
  if (statusEl) statusEl.innerHTML = '';
  if (document.getElementById('quoteResult').classList.contains('show')) {
    const quote = calculateQuote();
    if (quote) displayQuote(quote);
  }
}

// =============================================
// 提交询价
// =============================================
async function submitInquiry(event) {
  event.preventDefault();
  if (!validateForm()) return;

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '⏳ 提交中...';
  submitBtn.disabled = true;

  try {
    const quote = calculateQuote();
    if (!quote) { alert('请输入有效的货物重量'); submitBtn.innerHTML = originalText; submitBtn.disabled = false; return; }

    displayQuote(quote);
    document.getElementById('quoteResult').scrollIntoView({ behavior: 'smooth', block: 'center' });

    const formData = {
      transport_type: selectedTransport,
      origin_city: document.getElementById('originCity').value,
      dest_city: document.getElementById('destCity').value,
      cargo_name: document.getElementById('cargoName').value,
      weight: parseFloat(document.getElementById('weight').value),
      volume: parseFloat(document.getElementById('volume').value) || 0,
      need_customs: document.getElementById('needCustoms').value,
      need_insurance: document.getElementById('needInsurance').value,
      contact_name: document.getElementById('contactName').value,
      contact_phone: document.getElementById('contactPhone').value,
      remark: document.getElementById('remarks').value,
      coupon_code: appliedCoupon ? appliedCoupon.code : '',
      estimated_price: quote.price,
    };

    const response = await fetch(INQUIRY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    if (result.success) {
      const successEl = document.getElementById('submitSuccess');
      if (successEl) {
        successEl.innerHTML = `<div class="success-message">✅ ${result.message}</div>`;
        successEl.style.display = 'block';
      }
    } else {
      alert(result.message || '提交失败，请稍后重试');
    }
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    alert('提交失败，请检查网络连接后重试');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// =============================================
// 重置表单
// =============================================
function resetForm() {
  document.getElementById('inquiryForm').reset();
  document.getElementById('quoteResult').classList.remove('show');
  document.querySelectorAll('.t-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelector('.t-tab[data-type="rail"]').classList.add('active');
  selectedTransport = 'rail';
  appliedCoupon = null;
  const successEl = document.getElementById('submitSuccess');
  if (successEl) { successEl.style.display = 'none'; successEl.innerHTML = ''; }
  Object.keys(validationRules).forEach(fieldId => clearError(fieldId));
  hideRecommendations();
  const compareEl = document.getElementById('priceCompareContainer');
  if (compareEl) compareEl.style.display = 'none';
  const couponStatus = document.getElementById('couponStatus');
  if (couponStatus) couponStatus.innerHTML = '';
  const couponCode = document.getElementById('couponCode');
  if (couponCode) couponCode.value = '';
}

// =============================================
// 初始化
// =============================================
document.addEventListener('DOMContentLoaded', function () {
  const defaultTab = document.querySelector('.t-tab[data-type="rail"]');
  if (defaultTab) defaultTab.classList.add('active');
  updateDestOptions();

  Object.keys(validationRules).forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('blur', () => validateField(fieldId));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) validateField(fieldId);
      });
    }
  });

  const resultEl = document.getElementById('quoteResult');
  if (resultEl) resultEl.style.transition = 'all 0.3s ease';

  // 起运地/目的地/重量变化时触发智能推荐
  ['originCity', 'destCity', 'weight', 'volume'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => { showRecommendations(); showPriceComparison(); });
      el.addEventListener('input', () => { showRecommendations(); showPriceComparison(); });
    }
  });
});

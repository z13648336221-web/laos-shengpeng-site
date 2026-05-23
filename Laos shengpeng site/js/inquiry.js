/**
 * 盛鹏跨境物流 - 在线询价页面逻辑
 * 包含：运输方式切换、表单提交、模拟报价计算
 */

// 当前选择的运输方式
let currentTransport = 'rail';

// 运输方式配置
const transportConfig = {
  rail: {
    name: '中老铁路陆运',
    emoji: '🚂',
    // 基础运价（元/KG）
    baseRateKg: 3.5,
    // 基础运价（元/CBM）
    baseRateCbm: 280,
    // 最低消费
    minCharge: 500,
    // 时效
    transitTime: '5-7天',
    // 清关费
    customsFee: 800,
    // 保险费率
    insuranceRate: 0.004,
    // 出发地限制
    origins: ['KM'],
    originLabel: '昆明',
  },
  thai: {
    name: '泰国海运',
    emoji: '🚢',
    baseRateKg: 2.8,
    baseRateCbm: 480,
    minCharge: 800,
    transitTime: '7-12天',
    customsFee: 1200,
    insuranceRate: 0.003,
    origins: ['GZ', 'SZ', 'DG', 'FO'],
    originLabel: '广州/深圳',
  },
  viet: {
    name: '越南海运',
    emoji: '⚓',
    baseRateKg: 2.2,
    baseRateCbm: 380,
    minCharge: 600,
    transitTime: '5-8天',
    customsFee: 900,
    insuranceRate: 0.003,
    origins: ['GZ', 'SZ', 'DG', 'FO'],
    originLabel: '广州/深圳',
  },
};

// 目的地配置
const destConfig = {
  VTE: { name: '老挝·万象', surcharge: 0 },
  LPQ: { name: '老挝·琅勃拉邦', surcharge: 200 },
  BKK: { name: '泰国·曼谷', surcharge: 0 },
  CM: { name: '泰国·清迈', surcharge: 300 },
  HCM: { name: '越南·胡志明市', surcharge: 0 },
  HAN: { name: '越南·河内', surcharge: 150 },
  DAN: { name: '越南·岘港', surcharge: 100 },
};

// 选择运输方式
function selectTransport(el, type) {
  document.querySelectorAll('.t-tab').forEach(tab => tab.classList.remove('active'));
  el.classList.add('active');
  currentTransport = type;

  // 更新起运地选项
  updateOriginOptions(type);
}

// 更新起运地选项
function updateOriginOptions(type) {
  const select = document.getElementById('originCity');
  if (!select) return;
  const config = transportConfig[type];
  Array.from(select.options).forEach(opt => {
    if (opt.value === '') return;
    opt.disabled = !config.origins.includes(opt.value);
    if (opt.disabled && select.value === opt.value) {
      select.value = '';
    }
  });
}

// 计算运费
function calculateFreight(type, weight, volume, destKey, needCustoms, needInsurance) {
  const config = transportConfig[type];
  const dest = destConfig[destKey] || { surcharge: 0 };

  // 重量计费 vs 体积计费（取大值）
  const weightCharge = weight * config.baseRateKg;
  const volumeCharge = (volume || 0) * config.baseRateCbm;
  let freightBase = Math.max(weightCharge, volumeCharge, config.minCharge);

  // 目的地附加费
  freightBase += dest.surcharge;

  // 清关费
  let customsCharge = 0;
  if (needCustoms === 'yes') {
    customsCharge = config.customsFee;
  }

  // 保险费（按货值估算：取运费的20倍作为货值）
  let insuranceCharge = 0;
  if (needInsurance === 'yes') {
    const estimatedValue = freightBase * 20;
    insuranceCharge = Math.max(estimatedValue * config.insuranceRate, 150);
  }

  const total = freightBase + customsCharge + insuranceCharge;

  return {
    freightBase: Math.round(freightBase),
    customsCharge: Math.round(customsCharge),
    insuranceCharge: Math.round(insuranceCharge),
    total: Math.round(total),
    config,
    dest,
  };
}

// 提交询价
function submitInquiry(e) {
  e.preventDefault();

  const originCity = document.getElementById('originCity').value;
  const destCity = document.getElementById('destCity').value;
  const cargoName = document.getElementById('cargoName').value;
  const weight = parseFloat(document.getElementById('weight').value) || 0;
  const volume = parseFloat(document.getElementById('volume').value) || 0;
  const loadType = document.getElementById('loadType').value;
  const needCustoms = document.getElementById('needCustoms').value;
  const needInsurance = document.getElementById('needInsurance').value;

  if (!originCity || !destCity || weight <= 0) {
    alert('请填写必填项：起运地、目的地和货物重量');
    return;
  }

  // 计算运费
  const result = calculateFreight(currentTransport, weight, volume, destCity, needCustoms, needInsurance);
  const config = result.config;
  const dest = result.dest;

  // 显示结果
  const quoteResult = document.getElementById('quoteResult');
  const priceMain = document.getElementById('quotePriceMain');
  const priceUnit = document.getElementById('quotePriceUnit');
  const quoteDetails = document.getElementById('quoteDetails');

  priceMain.textContent = '¥' + result.total.toLocaleString();
  priceUnit.textContent = `参考总价（${config.name} | 运输时效：${config.transitTime}）`;

  // 明细
  const originLabels = {
    GZ: '广州', SZ: '深圳', KM: '昆明', DG: '东莞', FO: '佛山', YW: '义乌', SH: '上海', NJ: '宁波'
  };

  quoteDetails.innerHTML = `
    <div class="quote-detail-row">
      <span class="label">运输路线</span>
      <span class="value">${originLabels[originCity] || originCity} → ${dest.name || destCity}</span>
    </div>
    <div class="quote-detail-row">
      <span class="label">货物信息</span>
      <span class="value">${cargoName}  |  ${weight}KG${volume > 0 ? ' / ' + volume + 'CBM' : ''}</span>
    </div>
    <div class="quote-detail-row">
      <span class="label">装载方式</span>
      <span class="value">${{ lcl: '拼箱LCL', fcl20: '整柜20GP', fcl40: '整柜40GP', fcl40hq: '整柜40HQ' }[loadType] || loadType}</span>
    </div>
    <div class="quote-detail-row">
      <span class="label">基础运费</span>
      <span class="value" style="color:var(--primary);">¥${result.freightBase.toLocaleString()}</span>
    </div>
    ${result.customsCharge > 0 ? `
    <div class="quote-detail-row">
      <span class="label">目的地清关费</span>
      <span class="value">¥${result.customsCharge.toLocaleString()}</span>
    </div>` : ''}
    ${result.insuranceCharge > 0 ? `
    <div class="quote-detail-row">
      <span class="label">货物保险费</span>
      <span class="value">¥${result.insuranceCharge.toLocaleString()}</span>
    </div>` : ''}
    <div class="quote-detail-row" style="font-weight:700;font-size:14px;">
      <span class="label">参考总价</span>
      <span class="value" style="color:var(--primary);font-size:16px;">¥${result.total.toLocaleString()}</span>
    </div>
    <div class="quote-detail-row">
      <span class="label">预计时效</span>
      <span class="value">${config.transitTime}（含清关）</span>
    </div>
  `;

  quoteResult.classList.add('show');
  quoteResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 重置表单
function resetForm() {
  document.getElementById('inquiryForm').reset();
  document.getElementById('quoteResult').classList.remove('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function () {
  // 设置今日为默认发货日期
  const shipDate = document.getElementById('shipDate');
  if (shipDate) {
    const today = new Date();
    today.setDate(today.getDate() + 3); // 默认3天后
    shipDate.value = today.toISOString().split('T')[0];
  }
  updateOriginOptions('rail');
});

const express = require('express');
const router = express.Router();

// 优惠券数据（实际项目应存在数据库中）
const coupons = [
  {
    code: 'HENGCI10',
    type: 'percent',
    value: 10,
    description: '9折优惠（立减10%）',
    minAmount: 500,
    maxDiscount: 500,
    validUntil: '2026-12-31',
    active: true,
  },
  {
    code: 'NEWCUSTOMER',
    type: 'fixed',
    value: 50,
    description: '新客户立减50元',
    minAmount: 200,
    maxDiscount: 50,
    validUntil: '2026-12-31',
    active: true,
  },
  {
    code: 'VIP200',
    type: 'fixed',
    value: 200,
    description: 'VIP客户立减200元',
    minAmount: 1000,
    maxDiscount: 200,
    validUntil: '2026-12-31',
    active: true,
  },
  {
    code: 'LAOS100',
    type: 'fixed',
    value: 100,
    description: '中老铁路专线立减100元',
    minAmount: 300,
    maxDiscount: 100,
    validUntil: '2026-12-31',
    active: true,
  },
];

// 验证优惠券
router.post('/verify', (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) {
      return res.json({ success: false, message: '请输入优惠码' });
    }

    const coupon = coupons.find(c => c.code === code.toUpperCase());
    if (!coupon) {
      return res.json({ success: false, message: '优惠码无效' });
    }

    if (!coupon.active) {
      return res.json({ success: false, message: '优惠码已失效' });
    }

    const validUntil = new Date(coupon.validUntil);
    if (validUntil < new Date()) {
      return res.json({ success: false, message: '优惠码已过期' });
    }

    if (orderAmount !== undefined && orderAmount !== null) {
      const amount = parseFloat(orderAmount);
      if (isNaN(amount)) {
        return res.json({ success: false, message: '订单金额格式无效' });
      }
      if (amount < coupon.minAmount) {
        return res.json({ 
          success: false, 
          message: `订单金额需满 ${coupon.minAmount} 元才能使用此优惠码` 
        });
      }
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        minAmount: coupon.minAmount,
        maxDiscount: coupon.maxDiscount,
      },
    });
  } catch (err) {
    console.error('优惠券验证失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取可用优惠券列表（公开）
router.get('/available', (req, res) => {
  const available = coupons
    .filter(c => c.active && new Date(c.validUntil) >= new Date())
    .map(c => ({
      code: c.code,
      description: c.description,
      type: c.type,
      value: c.value,
      minAmount: c.minAmount,
    }));
  res.json({ success: true, data: available });
});

module.exports = router;

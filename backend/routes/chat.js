const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');
const { checkContentSafety, getSafetyWarning } = require('../utils/content-filter');
const { validateVisitorId, normalizeVisitorId, checkVisitorIdAbuse } = require('../utils/visitor-validator');

// 获取所有聊天会话（管理员）
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const chats = await db.query('chats');
    const uniqueVisitorIds = [...new Set(chats.map(c => c.visitorId))];
    
    const sessions = uniqueVisitorIds.map(visitorId => {
      const visitorChats = chats.filter(c => c.visitorId === visitorId);
      const lastChat = visitorChats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const unreadCount = visitorChats.filter(c => !c.isRead && c.sender === 'visitor').length;
      
      return {
        visitorId,
        visitorName: lastChat.visitorName || '访客',
        lastMessage: lastChat.message,
        lastMessageTime: lastChat.createdAt,
        unreadCount,
        messageCount: visitorChats.length
      };
    }).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    
    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error('获取会话列表失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 获取单个会话的消息
router.get('/session/:visitorId', authMiddleware, async (req, res) => {
  try {
    const chats = await db.query('chats');
    const visitorChats = chats
      .filter(c => c.visitorId === req.params.visitorId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // 标记消息为已读
    visitorChats.forEach(chat => {
      if (!chat.isRead && chat.sender === 'visitor') {
        chat.isRead = true;
        chat.readAt = new Date().toISOString();
      }
    });
    
    res.json({ success: true, data: visitorChats });
  } catch (err) {
    console.error('获取会话消息失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 自动回复规则
const autoReplyRules = [
  { keywords: ['价格', '费用', '多少钱', '报价', '计算', '运费', '收费'], reply: '您好！运费根据货物重量、体积、运输方式和目的地计算。中老铁路约850-1200元/CBM，中老公路约1200-1800元/CBM，中老泰铁路约1500-2000元/CBM，中越铁路约1000-1500元/CBM，泰国海运约900-1500元/CBM，越南海运约800-1300元/CBM。建议您访问在线询价页面获取精确报价！' },
  { keywords: ['多久', '时间', '时效', '到达', '几天', '几天到'], reply: '您好！中老铁路运输需要5-7天，中老公路需要7-10天，中老泰铁路需要9-12天，中越铁路需要5-8天，泰国海运需要10-15天，越南海运需要8-12天。加急服务可缩短2-3天，但会增加费用。具体时效请根据实际情况而定。' },
  { keywords: ['铁路', '中老铁路', '火车', '陆运'], reply: '您好！中老铁路是连接中国昆明到老挝万象的国际铁路，全程1035公里。提供快速、安全、经济的跨境运输服务，支持整柜和散货拼箱，我们提供门到门一站式服务。' },
  { keywords: ['公路', '卡车', '货车', '汽车运输'], reply: '您好！中老公路运输提供灵活的门到门服务，支持9.6米、13米、13.75米、17.5米等多种车型，适合大件货物和特殊要求的运输需求。' },
  { keywords: ['泰国铁路', '中老泰', '老挝转关'], reply: '您好！中老泰铁路联运是中国铁路经老挝转关到泰国的一站式服务，一票直达，全程无缝衔接，运输时间短，清关便捷。' },
  { keywords: ['越南铁路', '中越铁路', '南宁', '河内'], reply: '您好！中越铁路运输连接中国南宁与越南河内，提供跨境铁路货运服务，安全可靠，运输时效快。' },
  { keywords: ['海运', '船', '港口', '船舶'], reply: '您好！我们提供泰国和越南的海运服务，包括整柜(FCL)和拼箱(LCL)运输。泰国覆盖曼谷(BKK)、林查班(LCH)、清迈(CM)；越南覆盖海防(HPH)、胡志明(HCM)、岘港(DAD)等主要港口。' },
  { keywords: ['清关', '报关', '海关', '关税'], reply: '您好！我们提供专业的清关服务，帮助您顺利完成中老、中泰、中越之间的货物清关手续。需要提供商业发票、装箱单、原产地证明等文件。特殊货物可能需要额外证件。' },
  { keywords: ['追踪', '查询', '物流', '货物', '运单'], reply: '您好！您可以在货物追踪页面输入运单号查询货物状态，或提供运单号我来帮您查询。运单号格式为SP+数字，例如：SP260001。' },
  { keywords: ['服务', '业务', '主营', '做什么'], reply: '您好！恒慈国际贸易主营六大业务：1)中老铁路运输 2)中老公路运输 3)中老泰铁路联运 4)中越铁路 5)泰国海运专线 6)越南海运专线。提供门到门一站式跨境物流服务，包括运输、清关、仓储、派送等全链条服务。' },
  { keywords: ['联系', '电话', '地址', '联系方式', '客服'], reply: '您好！客服热线：400-888-8888（工作日 9:00-18:00），邮箱：service@shengpeng.com，地址：云南省昆明市官渡区国际物流园区A栋301室。' },
  { keywords: ['包装', '打包', '包装要求'], reply: '您好！货物包装要求：易碎品需加固包装，电子产品需防静电包装，液体需密封防漏，大件货物需打托盘。我们也提供专业包装服务，费用另计。' },
  { keywords: ['付款', '支付', '结算', '发票'], reply: '您好！支持电汇(T/T)、支付宝、微信支付等方式。预付30%定金，货到付款70%。可开具增值税专用发票，税率9%。' },
  { keywords: ['保险', '保价', '理赔'], reply: '您好！我们提供货物运输保险服务，费率为货值的0.3%-0.5%。覆盖运输途中的意外损失、破损、丢失等风险。理赔需提供相关证明文件。' },
  { keywords: ['仓储', '仓库', '存储'], reply: '您好！我们在昆明、万象、曼谷、海防设有仓库，提供短期和长期仓储服务。仓储费根据货物体积和存储时间计算。可提供入库、出库、分拣、贴标等增值服务。' },
  { keywords: ['危险品', '特殊货物', '电池', '液体'], reply: '您好！危险品运输需要提供MSDS报告和相关资质证明。电池类货物需符合UN38.3标准。部分危险品可能限制运输，建议提前咨询。' },
  { keywords: ['优惠', '折扣', '促销'], reply: '您好！新客户首单享9折优惠，长期合作客户可享受VIP折扣。大宗货物（10吨以上）可议价。节日期间可能有额外优惠活动，请关注我们的新闻资讯。' },
  { keywords: ['公司', '介绍', '关于', '实力'], reply: '您好！恒慈国际贸易成立于2018年，专注于中国与东盟国家的跨境物流服务。拥有专业的操作团队和完善的物流网络，年运输量超过10万吨，服务客户超过2000家。' },
  { keywords: ['感谢', '谢谢', '辛苦了'], reply: '不客气！很高兴为您服务！如有任何问题随时联系我们，祝您生活愉快！' },
  { keywords: ['你好', '您好', 'hi', 'hello'], reply: '您好！欢迎咨询重庆恒慈国际贸易有限公司！请问有什么可以帮到您？' },
];

function getAutoReply(message) {
  const lowerMessage = message.toLowerCase();
  for (const rule of autoReplyRules) {
    for (const keyword of rule.keywords) {
      if (lowerMessage.includes(keyword)) {
        return rule.reply;
      }
    }
  }
  return null;
}

// 用户发送消息（无需认证）
router.post('/user', async (req, res) => {
  try {
    const { visitorId, visitorName, message } = req.body;
    
    if (!visitorId || !message) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    // 标准化访客 ID
    const normalizedVisitorId = normalizeVisitorId(visitorId);
    
    // 验证访客 ID
    const visitorValidation = validateVisitorId(normalizedVisitorId, { strictMode: true });
    if (!visitorValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: visitorValidation.error || '访客 ID 无效' 
      });
    }
    
    // 检查访客 ID 滥用
    const abuseCheck = await checkVisitorIdAbuse(normalizedVisitorId, db);
    if (abuseCheck.isAbused) {
      return res.status(429).json({ 
        success: false, 
        message: abuseCheck.reason || '消息发送过于频繁，请稍后再试' 
      });
    }
    
    // 内容安全检查
    const contentCheck = checkContentSafety(message, {
      checkSensitive: true,
      checkSpam: true,
      maxLength: 500,
      minLength: 1
    });
    
    if (!contentCheck.safe) {
      return res.status(400).json({ 
        success: false, 
        message: getSafetyWarning(contentCheck) || '消息内容不符合要求' 
      });
    }
    
    const newChat = {
      id: null,
      visitorId: normalizedVisitorId,
      visitorName: visitorName || '访客',
      sender: 'visitor',
      message: message.trim(),
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    await db.insert('chats', newChat);
    
    // 自动回复
    const autoReply = getAutoReply(message);
    if (autoReply) {
      setTimeout(async () => {
        const replyChat = {
          id: null,
          visitorId: normalizedVisitorId,
          visitorName: '客服',
          sender: 'admin',
          adminName: '智能客服',
          message: autoReply,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        await db.insert('chats', replyChat);
      }, 1000);
    }
    
    res.status(201).json({ success: true, data: { ...newChat, id: null } });
  } catch (err) {
    console.error('发送消息失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 管理员回复消息
router.post('/admin/reply', authMiddleware, async (req, res) => {
  try {
    const { visitorId, message } = req.body;
    
    if (!visitorId || !message) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const newChat = {
      id: null,
      visitorId,
      visitorName: '客服',
      sender: 'admin',
      adminName: req.user?.username || '管理员',
      message: message.trim(),
      isRead: true,
      createdAt: new Date().toISOString()
    };
    
    const result = await db.insert('chats', newChat);
    res.status(201).json({ success: true, data: { ...newChat, id: result.lastID } });
  } catch (err) {
    console.error('回复消息失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 用户获取自己的消息
router.get('/user/:visitorId', async (req, res) => {
  try {
    const chats = await db.query('chats');
    const visitorChats = chats
      .filter(c => c.visitorId === req.params.visitorId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // 标记客服消息为已读
    visitorChats.forEach(chat => {
      if (!chat.isRead && chat.sender === 'admin') {
        chat.isRead = true;
        chat.readAt = new Date().toISOString();
      }
    });
    
    res.json({ success: true, data: visitorChats });
  } catch (err) {
    console.error('获取消息失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 删除会话
router.delete('/session/:visitorId', authMiddleware, async (req, res) => {
  try {
    const chats = await db.query('chats');
    const visitorChats = chats.filter(c => c.visitorId === req.params.visitorId);
    
    // 删除该访客的所有消息
    for (const chat of visitorChats) {
      await db.deleteRow('chats', { id: chat.id });
    }
    
    res.json({ success: true, message: '会话已删除' });
  } catch (err) {
    console.error('删除会话失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// 获取未读消息数量
router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const chats = await db.query('chats');
    const unreadCount = chats.filter(c => !c.isRead && c.sender === 'visitor').length;
    res.json({ success: true, data: { count: unreadCount } });
  } catch (err) {
    console.error('获取未读数量失败:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

module.exports = router;
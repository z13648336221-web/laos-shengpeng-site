/**
 * 内容过滤工具
 * 包含敏感词过滤、垃圾信息检测、恶意内容识别等功能
 */

/**
 * 敏感词列表
 * 包含政治敏感词、违法词汇、广告词等
 */
const SENSITIVE_WORDS = [
  // 政治敏感词
  '政治', '政治敏感', '反政府', '推翻', '暴动', '暴乱', '造反',
  '恐怖主义', '恐怖分子', '炸弹', '爆炸', '袭击', '攻击',
  
  // 违法词汇
  '毒品', '海洛因', '冰毒', '大麻', '摇头丸', 'K粉',
  '赌博', '赌场', '博彩', '六合彩', '时时彩', '百家乐',
  '卖淫', '嫖娼', '性服务', '援交', '一夜情',
  '枪支', '炸药', '管制刀具', '违禁品',
  '假钞', '假币', '伪造证件', '伪造发票',
  '诈骗', '传销', '非法集资', '庞氏骗局',
  
  // 广告和营销词
  '代开发票', '办理证件', '刻章', '办证', '各种证件',
  '贷款', '小额贷款', '无抵押贷款', '快速放款', '黑户贷款',
  '套现', '信用卡套现', '花呗套现', '白条套现',
  '兼职', '日结', '在家工作', '刷单', '刷信誉',
  '减肥', '瘦身', '丰胸', '增大', '增高', '壮阳',
  '彩票', '中奖', '幸运', '大奖', '一等奖',
  '微信', 'QQ', '加我', '私聊', '联系', '电话', '手机',
  '客服', '咨询热线', '服务热线',
  
  // 色情词汇
  '色情', '黄色', '成人', 'AV', '视频', '激情',
  '裸聊', '裸体', '裸照', '性感', '诱惑',
  
  // 垃圾信息特征
  '点击这里', '免费领取', '限时优惠', '错过不再有',
  '马上行动', '立即咨询', '马上联系', '速速联系',
  'http://', 'https://', 'www.', '.com', '.cn', '.net',
  
  // 恶意脚本
  '<script', 'javascript:', 'eval(', 'document.write', 'alert(',
  'onclick', 'onerror', 'onload', 'iframe', 'embed', 'object'
];

/**
 * 垃圾信息特征模式
 */
const SPAM_PATTERNS = [
  // 连续重复字符
  /(.)\1{4,}/g,
  // 过多的特殊字符
  /[^a-zA-Z0-9\u4e00-\u9fa5\s]{5,}/g,
  // 电话号码模式
  /\d{11}/g,
  /\d{3,4}[-\s]?\d{7,8}/g,
  // QQ号模式
  /[Qq][Qq]?\s*[:：]?\s*\d{5,11}/g,
  // 微信号模式
  /[Ww][Xx]?\s*[:：]?\s*[a-zA-Z][a-zA-Z0-9_-]{5,19}/g,
  // 邮箱模式
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
];

/**
 * 检查文本是否包含敏感词
 * @param {string} text - 待检查的文本
 * @returns {object} 检查结果
 */
function checkSensitiveWords(text) {
  if (!text || typeof text !== 'string') {
    return { hasSensitive: false, words: [] };
  }
  
  const foundWords = [];
  const lowerText = text.toLowerCase();
  
  for (const word of SENSITIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      foundWords.push(word);
    }
  }
  
  return {
    hasSensitive: foundWords.length > 0,
    words: foundWords,
    count: foundWords.length
  };
}

/**
 * 检查文本是否为垃圾信息
 * @param {string} text - 待检查的文本
 * @returns {object} 检查结果
 */
function checkSpamPatterns(text) {
  if (!text || typeof text !== 'string') {
    return { isSpam: false, patterns: [] };
  }
  
  const foundPatterns = [];
  
  for (const pattern of SPAM_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      foundPatterns.push({
        pattern: pattern.toString(),
        matches: matches.slice(0, 3) // 只保留前3个匹配
      });
    }
  }
  
  // 检查文本长度异常
  if (text.length > 500) {
    foundPatterns.push({
      pattern: 'text_too_long',
      matches: [`长度: ${text.length}`]
    });
  }
  
  // 检查纯数字或纯特殊字符
  if (/^[\d\s]+$/.test(text) || /^[^\w\u4e00-\u9fa5\s]+$/.test(text)) {
    foundPatterns.push({
      pattern: 'invalid_characters',
      matches: ['包含无效字符']
    });
  }
  
  return {
    isSpam: foundPatterns.length > 0,
    patterns: foundPatterns,
    count: foundPatterns.length
  };
}

/**
 * 综合内容安全检查
 * @param {string} text - 待检查的文本
 * @param {object} options - 检查选项
 * @returns {object} 检查结果
 */
function checkContentSafety(text, options = {}) {
  const {
    checkSensitive = true,
    checkSpam = true,
    maxLength = 500,
    minLength = 1
  } = options;
  
  const result = {
    safe: true,
    blocked: false,
    reasons: [],
    details: {}
  };
  
  // 基本长度检查
  if (!text || text.length < minLength) {
    result.safe = false;
    result.blocked = true;
    result.reasons.push('消息内容过短');
    return result;
  }
  
  if (text.length > maxLength) {
    result.safe = false;
    result.blocked = true;
    result.reasons.push('消息内容过长');
    return result;
  }
  
  // 敏感词检查
  if (checkSensitive) {
    const sensitiveResult = checkSensitiveWords(text);
    result.details.sensitive = sensitiveResult;
    
    if (sensitiveResult.hasSensitive) {
      result.safe = false;
      result.blocked = true;
      result.reasons.push(`包含敏感词: ${sensitiveResult.words.join(', ')}`);
    }
  }
  
  // 垃圾信息检查
  if (checkSpam) {
    const spamResult = checkSpamPatterns(text);
    result.details.spam = spamResult;
    
    if (spamResult.isSpam) {
      result.safe = false;
      result.blocked = true;
      result.reasons.push('包含垃圾信息特征');
    }
  }
  
  return result;
}

/**
 * 过滤敏感词（替换为星号）
 * @param {string} text - 待过滤的文本
 * @returns {string} 过滤后的文本
 */
function filterSensitiveWords(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  let filteredText = text;
  
  for (const word of SENSITIVE_WORDS) {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  }
  
  return filteredText;
}

/**
 * 生成内容安全警告消息
 * @param {object} checkResult - 内容检查结果
 * @returns {string} 警告消息
 */
function getSafetyWarning(checkResult) {
  if (checkResult.safe) {
    return '';
  }
  
  const warnings = {
    '消息内容过短': '消息内容不能为空',
    '消息内容过长': '消息内容过长，请控制在500字以内',
    '包含敏感词': '消息包含敏感词汇，请修改后重试',
    '包含垃圾信息特征': '消息包含垃圾信息特征，请检查后重试'
  };
  
  return checkResult.reasons.map(reason => warnings[reason] || reason).join('；');
}

/**
 * 添加自定义敏感词
 * @param {string[]} words - 要添加的敏感词数组
 */
function addSensitiveWords(words) {
  if (Array.isArray(words)) {
    SENSITIVE_WORDS.push(...words);
  }
}

/**
 * 添加自定义垃圾信息模式
 * @param {RegExp[]} patterns - 要添加的正则表达式数组
 */
function addSpamPatterns(patterns) {
  if (Array.isArray(patterns)) {
    SPAM_PATTERNS.push(...patterns);
  }
}

module.exports = {
  checkSensitiveWords,
  checkSpamPatterns,
  checkContentSafety,
  filterSensitiveWords,
  getSafetyWarning,
  addSensitiveWords,
  addSpamPatterns,
  SENSITIVE_WORDS,
  SPAM_PATTERNS
};
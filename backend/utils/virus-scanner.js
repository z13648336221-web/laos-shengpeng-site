/**
 * 病毒扫描工具
 * 支持多种病毒扫描引擎的集成
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 病毒扫描器配置
 */
const SCANNER_CONFIG = {
  // 启用病毒扫描
  enabled: process.env.VIRUS_SCAN_ENABLED === 'true',
  
  // 扫描引擎类型: 'clamav', 'windows-defender', 'none'
  engine: process.env.VIRUS_SCAN_ENGINE || 'none',
  
  // ClamAV 配置
  clamav: {
    // clamdscan 命令路径
    command: process.env.CLAMAV_COMMAND || 'clamdscan',
    // 扫描超时时间（毫秒）
    timeout: parseInt(process.env.CLAMAV_TIMEOUT) || 30000,
    // 临时文件清理
    cleanTemp: true
  },
  
  // Windows Defender 配置
  windowsDefender: {
    // MpCmdRun.exe 路径
    command: process.env.WIN_DEFENDER_COMMAND || 'C:\\Program Files\\Windows Defender\\MpCmdRun.exe',
    // 扫描类型: 1=快速, 2=完全, 3=自定义
    scanType: parseInt(process.env.WIN_DEFENDER_SCAN_TYPE) || 1
  }
};

/**
 * 执行命令的Promise包装
 */
function executeCommand(command, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('命令执行超时'));
    }, timeout);
    
    exec(command, (error, stdout, stderr) => {
      clearTimeout(timer);
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * 使用 ClamAV 扫描文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<object>} 扫描结果
 */
async function scanWithClamAV(filePath) {
  try {
    const config = SCANNER_CONFIG.clamav;
    const command = `${config.command} --no-summary ${filePath}`;
    
    const result = await executeCommand(command, config.timeout);
    
    // 检查扫描结果
    if (result.stdout.includes('FOUND') || result.stdout.includes('Infected files')) {
      return {
        safe: false,
        engine: 'clamav',
        threat: 'Virus detected',
        details: result.stdout
      };
    }
    
    if (result.stdout.includes('OK') || result.stdout.includes('Infected files: 0')) {
      return {
        safe: true,
        engine: 'clamav',
        threat: null,
        details: result.stdout
      };
    }
    
    // 无法确定结果，默认为不安全
    return {
      safe: false,
      engine: 'clamav',
      threat: 'Unknown scan result',
      details: result.stdout
    };
    
  } catch (error) {
    console.error('ClamAV 扫描失败:', error.message);
    return {
      safe: false,
      engine: 'clamav',
      threat: 'Scan failed',
      details: error.message
    };
  }
}

/**
 * 使用 Windows Defender 扫描文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<object>} 扫描结果
 */
async function scanWithWindowsDefender(filePath) {
  try {
    const config = SCANNER_CONFIG.windowsDefender;
    const command = `"${config.command}" -Scan -ScanType ${config.scanType} -File "${filePath}"`;
    
    const result = await executeCommand(command, 60000); // Windows Defender 可能需要更长时间
    
    // 检查扫描结果
    if (result.stdout.includes('found no threats') || result.stdout.includes('threats: 0')) {
      return {
        safe: true,
        engine: 'windows-defender',
        threat: null,
        details: result.stdout
      };
    }
    
    if (result.stdout.includes('found') || result.stdout.includes('threat')) {
      return {
        safe: false,
        engine: 'windows-defender',
        threat: 'Threat detected',
        details: result.stdout
      };
    }
    
    // 无法确定结果，默认为不安全
    return {
      safe: false,
      engine: 'windows-defender',
      threat: 'Unknown scan result',
      details: result.stdout
    };
    
  } catch (error) {
    console.error('Windows Defender 扫描失败:', error.message);
    return {
      safe: false,
      engine: 'windows-defender',
      threat: 'Scan failed',
      details: error.message
    };
  }
}

/**
 * 基础文件内容检查（不使用外部杀毒软件）
 * 检查常见的恶意文件特征
 * @param {string} filePath - 文件路径
 * @returns {Promise<object>} 检查结果
 */
async function basicFileCheck(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
    
    // 检查可疑的脚本内容
    const suspiciousPatterns = [
      /<script[^>]*>.*?eval\s*\(/i,
      /<script[^>]*>.*?document\.write/i,
      /<iframe[^>]*>/i,
      /javascript:/i,
      /data:text\/html/i,
      /<\?php/i,
      /<%/i,
      /#!/,
      /eval\s*\(/i,
      /exec\s*\(/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        return {
          safe: false,
          engine: 'basic-check',
          threat: 'Suspicious content detected',
          details: 'File contains potentially malicious script content'
        };
      }
    }
    
    return {
      safe: true,
      engine: 'basic-check',
      threat: null,
      details: 'Basic content check passed'
    };
    
  } catch (error) {
    console.error('基础文件检查失败:', error.message);
    return {
      safe: false,
      engine: 'basic-check',
      threat: 'Check failed',
      details: error.message
    };
  }
}

/**
 * 主扫描函数
 * @param {string} filePath - 文件路径
 * @returns {Promise<object>} 扫描结果
 */
async function scanFile(filePath) {
  // 检查是否启用病毒扫描
  if (!SCANNER_CONFIG.enabled) {
    console.log('病毒扫描已禁用，跳过扫描');
    return {
      safe: true,
      engine: 'disabled',
      threat: null,
      details: 'Virus scanning is disabled'
    };
  }
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return {
      safe: false,
      engine: 'none',
      threat: 'File not found',
      details: 'File does not exist'
    };
  }
  
  // 根据配置选择扫描引擎
  const engine = SCANNER_CONFIG.engine;
  
  switch (engine) {
    case 'clamav':
      return await scanWithClamAV(filePath);
    
    case 'windows-defender':
      return await scanWithWindowsDefender(filePath);
    
    case 'basic':
      return await basicFileCheck(filePath);
    
    case 'none':
    default:
      // 使用基础检查作为后备
      console.log('未配置病毒扫描引擎，使用基础检查');
      return await basicFileCheck(filePath);
  }
}

/**
 * 批量扫描文件
 * @param {string[]} filePaths - 文件路径数组
 * @returns {Promise<object[]>} 扫描结果数组
 */
async function scanFiles(filePaths) {
  const results = [];
  
  for (const filePath of filePaths) {
    const result = await scanFile(filePath);
    results.push({
      file: filePath,
      ...result
    });
  }
  
  return results;
}

/**
 * 检查扫描器是否可用
 * @param {string} engine - 扫描引擎类型
 * @returns {Promise<boolean>} 是否可用
 */
async function checkScannerAvailability(engine = SCANNER_CONFIG.engine) {
  try {
    switch (engine) {
      case 'clamav':
        await executeCommand('clamdscan --version', 5000);
        return true;
      
      case 'windows-defender':
        await executeCommand(`"${SCANNER_CONFIG.windowsDefender.command}" -Help`, 5000);
        return true;
      
      default:
        return true; // 基础检查总是可用
    }
  } catch (error) {
    console.error(`扫描器 ${engine} 不可用:`, error.message);
    return false;
  }
}

/**
 * 获取扫描器状态
 * @returns {object} 扫描器状态信息
 */
function getScannerStatus() {
  return {
    enabled: SCANNER_CONFIG.enabled,
    engine: SCANNER_CONFIG.engine,
    config: SCANNER_CONFIG
  };
}

module.exports = {
  scanFile,
  scanFiles,
  checkScannerAvailability,
  getScannerStatus,
  SCANNER_CONFIG
};
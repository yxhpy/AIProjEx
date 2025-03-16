/**
 * 服务器配置文件
 * 管理服务器相关的环境变量和配置信息
 */

require('dotenv').config();

// 从环境变量获取服务器配置
const config = {
  // 服务器基本配置
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  
  // 安全配置
  security: {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000, // 默认15分钟
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 默认每个IP最多100个请求
    },
  },
  
  // 上传配置
  upload: {
    directory: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 默认10MB
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  // AI配置
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiApiModel: process.env.OPENAI_API_MODEL || 'gpt-4o',
    aiProxyUrl: process.env.AI_PROXY_URL || '',
  }
};

module.exports = config; 
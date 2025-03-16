/**
 * AIProjEx 服务器入口文件
 * 配置和启动Express服务器
 */

// 加载环境变量
require('dotenv').config();

const path = require('path');
const fs = require('fs');

// 导入配置
const config = require('./config/server');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');

// 导入Express应用
const app = require('./app');

// 创建必要的目录
const uploadsDir = path.join(__dirname, '..', config.upload.directory);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const logsDir = path.dirname(path.join(__dirname, '..', config.logging.file));
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 启动服务器
const PORT = config.port;

const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 启动服务器
    app.listen(PORT, () => {
      logger.info(`🚀 服务器运行在端口 ${PORT} - 环境: ${config.env}`);
      logger.info(`API地址: http://localhost:${PORT}${config.apiPrefix}`);
    });
  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
});

// 启动应用
startServer(); 
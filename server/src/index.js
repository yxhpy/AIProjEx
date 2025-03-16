/**
 * AIProjEx 服务器入口文件
 * 配置和启动Express服务器，加载所有中间件和路由
 */

// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// 导入配置
const config = require('./config/server');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');

// 创建Express应用
const app = express();

// 创建必要的目录
const uploadsDir = path.join(__dirname, '..', config.upload.directory);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const logsDir = path.dirname(path.join(__dirname, '..', config.logging.file));
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 应用中间件
app.use(helmet()); // 安全头
app.use(cors({
  origin: config.clientUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.directory)));

// 速率限制
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: '请求过于频繁，请稍后再试'
});
app.use(limiter);

// API健康检查路由
app.get(`${config.apiPrefix}/health`, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API服务正常运行',
    timestamp: new Date(),
    environment: config.env
  });
});

// 加载API路由 (未实现，待添加)
// const routes = require('./routes');
// app.use(config.apiPrefix, routes);

// 404处理
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: '请求的资源不存在'
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(config.env === 'development' && { stack: err.stack })
  });
});

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
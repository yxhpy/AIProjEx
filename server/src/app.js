/**
 * AIProjEx Express应用配置
 * 用于配置Express应用，便于测试
 */

// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 导入配置
const config = require('./config/server');
const logger = require('./utils/logger');

// 导入路由
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const requirementRoutes = require('./routes/requirementRoutes');
const taskRoutes = require('./routes/taskRoutes');

// 创建Express应用
const app = express();

// 应用中间件
app.use(helmet()); // 安全头
app.use(cors({
  origin: config.clientUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 在测试环境中禁用日志
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

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

// 加载API路由
app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/projects`, projectRoutes);
app.use(`${config.apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${config.apiPrefix}/tasks`, taskRoutes);
app.use(`${config.apiPrefix}`, requirementRoutes);

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

module.exports = app; 
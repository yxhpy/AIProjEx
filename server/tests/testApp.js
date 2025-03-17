/**
 * AIProjEx Express测试应用配置
 * 用于测试的Express应用实例
 */

// 设置测试环境
process.env.NODE_ENV = 'test';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// 导入配置
const config = require('../src/config/server');

// 导入路由
const authRoutes = require('../src/routes/authRoutes');
const projectRoutes = require('../src/routes/projectRoutes');
const dashboardRoutes = require('../src/routes/dashboardRoutes');
const requirementRoutes = require('../src/routes/requirementRoutes');
const taskRoutes = require('../src/routes/taskRoutes');

// 创建Express应用
const app = express();

// 应用中间件
app.use(helmet()); // 安全头
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API健康检查路由
app.get(`${config.apiPrefix}/health`, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API测试服务正常运行',
    timestamp: new Date(),
    environment: 'test'
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
  console.error(`${err.name}: ${err.message}\n${err.stack}`);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    stack: err.stack
  });
});

module.exports = app; 
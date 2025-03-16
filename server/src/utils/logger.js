/**
 * 日志工具
 * 使用Winston库处理应用程序的日志记录
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/server');

// 确保日志目录存在
const logDir = path.dirname(path.join(__dirname, '../..', config.logging.file));
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 创建Winston日志记录器
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'aiprojex-api' },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp, ...meta }) => 
            `${timestamp} ${level}: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
            }`
        )
      )
    }),
    // 文件输出
    new winston.transports.File({ 
      filename: path.join(__dirname, '../..', config.logging.file),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // 错误日志单独保存
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ],
  // 未捕获的异常也记录到日志
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ],
  // 是否退出进程当出现未捕获的异常
  exitOnError: false
});

module.exports = logger; 
/**
 * 日志工具
 * 使用winston库进行日志记录
 */

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, json } = format;
const path = require('path');
const config = require('../config/server');

// 自定义日志格式
const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// 配置日志文件路径
const logFilePath = path.resolve(path.join(__dirname, '../../', config.logging.file));

// 创建日志记录器
const logger = createLogger({
  level: config.logging.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: 'aiproj-ex-api' },
  transports: [
    // 写入所有日志到文件
    new transports.File({ filename: logFilePath }),
    
    // 写入错误日志到单独的文件
    new transports.File({
      filename: path.join(path.dirname(logFilePath), 'error.log'),
      level: 'error'
    })
  ]
});

// 在开发环境添加控制台输出
if (config.env === 'development') {
  logger.add(new transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      customFormat
    )
  }));
}

module.exports = logger; 
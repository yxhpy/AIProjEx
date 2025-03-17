/**
 * 自定义API错误类
 */
class ApiError extends Error {
  /**
   * 创建一个API错误实例
   * @param {number} statusCode - HTTP状态码
   * @param {string} message - 错误消息
   * @param {boolean} isOperational - 是否是操作性错误
   */
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

const logger = require('./logger');

/**
 * 错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
const errorHandler = (err, req, res, next) => {
  // 默认错误状态码和消息
  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';
  
  // 处理Sequelize错误
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join(', ');
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = '数据已存在，请确保提供的信息唯一';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = '提供的关联数据不存在';
  }
  
  // 记录错误日志
  logger.error(`[错误] ${err.name}: ${err.message}`, { stack: err.stack });
  
  // 生产环境下不返回实际错误堆栈
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };
  
  res.status(statusCode).json(response);
};

module.exports = {
  ApiError,
  errorHandler
}; 
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * 验证请求中间件
 * 使用express-validator验证请求数据
 * 如果验证失败，返回400错误和错误信息
 */
const validate = (validations) => {
  return async (req, res, next) => {
    try {
      // 执行所有验证
      await Promise.all(validations.map(validation => validation.run(req)));

      // 获取验证结果
      const errors = validationResult(req);
      
      // 如果没有错误，继续下一个中间件
      if (errors.isEmpty()) {
        return next();
      }

      // 格式化错误信息
      const formattedErrors = errors.array().map(error => ({
        field: error.param,
        message: error.msg
      }));

      // 记录验证错误
      logger.warn('验证错误', { errors: formattedErrors });

      // 返回400错误和错误信息
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: formattedErrors
      });
    } catch (error) {
      // 记录未预期的错误
      logger.error('未预期的错误', { error });
      return res.status(500).json({
        success: false,
        message: '服务器错误，请稍后再试',
      });
    }
  };
};

module.exports = validate; 
const { validationResult } = require('express-validator');

/**
 * 验证请求中间件
 * 使用express-validator验证请求数据
 * 如果验证失败，返回400错误和错误信息
 */
const validate = (validations) => {
  return async (req, res, next) => {
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

    // 返回400错误和错误信息
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: formattedErrors
    });
  };
};

module.exports = validate; 
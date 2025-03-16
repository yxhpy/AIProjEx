const Joi = require('joi');

/**
 * 验证请求中间件工厂函数
 * @param {Object} schema - Joi验证模式
 * @returns {Function} - 验证中间件
 */
exports.validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({ message: errorMessage });
    }
    
    next();
  };
};

/**
 * 用户注册请求验证模式
 */
exports.registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required()
    .messages({
      'string.base': '用户名必须是字符串',
      'string.empty': '用户名不能为空',
      'string.min': '用户名至少需要{#limit}个字符',
      'string.max': '用户名不能超过{#limit}个字符',
      'any.required': '用户名是必填项'
    }),
  
  email: Joi.string().email().required()
    .messages({
      'string.base': '邮箱必须是字符串',
      'string.empty': '邮箱不能为空',
      'string.email': '邮箱格式无效',
      'any.required': '邮箱是必填项'
    }),
  
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/).required()
    .messages({
      'string.base': '密码必须是字符串',
      'string.empty': '密码不能为空',
      'string.min': '密码至少需要{#limit}个字符',
      'string.pattern.base': '密码必须包含至少一个小写字母、一个大写字母和一个数字',
      'any.required': '密码是必填项'
    })
});

/**
 * 用户登录请求验证模式
 */
exports.loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.base': '邮箱必须是字符串',
      'string.empty': '邮箱不能为空',
      'string.email': '邮箱格式无效',
      'any.required': '邮箱是必填项'
    }),
  
  password: Joi.string().required()
    .messages({
      'string.base': '密码必须是字符串',
      'string.empty': '密码不能为空',
      'any.required': '密码是必填项'
    })
});

/**
 * 更新用户信息请求验证模式
 */
exports.updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(30)
    .messages({
      'string.base': '用户名必须是字符串',
      'string.empty': '用户名不能为空',
      'string.min': '用户名至少需要{#limit}个字符',
      'string.max': '用户名不能超过{#limit}个字符'
    }),
  
  email: Joi.string().email()
    .messages({
      'string.base': '邮箱必须是字符串',
      'string.empty': '邮箱不能为空',
      'string.email': '邮箱格式无效'
    }),
  
  avatar_url: Joi.string().uri().allow(null, '')
    .messages({
      'string.base': '头像URL必须是字符串',
      'string.uri': '头像URL格式无效'
    })
});

/**
 * 更新密码请求验证模式
 */
exports.updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({
      'string.base': '当前密码必须是字符串',
      'string.empty': '当前密码不能为空',
      'any.required': '当前密码是必填项'
    }),
  
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/).required()
    .messages({
      'string.base': '新密码必须是字符串',
      'string.empty': '新密码不能为空',
      'string.min': '新密码至少需要{#limit}个字符',
      'string.pattern.base': '新密码必须包含至少一个小写字母、一个大写字母和一个数字',
      'any.required': '新密码是必填项'
    })
}); 
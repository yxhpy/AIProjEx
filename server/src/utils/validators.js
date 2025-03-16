/**
 * 验证邮箱格式
 * @param {string} email - 要验证的邮箱
 * @returns {boolean} - 验证结果
 */
exports.validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证密码强度
 * 密码必须至少8个字符，且包含数字、小写字母和大写字母
 * @param {string} password - 要验证的密码
 * @returns {boolean} - 验证结果
 */
exports.validatePassword = (password) => {
  // 密码长度至少8位
  if (password.length < 8) {
    return false;
  }

  // 检查是否包含数字
  const hasNumber = /[0-9]/.test(password);
  
  // 检查是否包含小写字母
  const hasLowercase = /[a-z]/.test(password);
  
  // 检查是否包含大写字母
  const hasUppercase = /[A-Z]/.test(password);
  
  // 密码必须包含数字、小写字母和大写字母
  return hasNumber && hasLowercase && hasUppercase;
};

/**
 * 验证项目数据
 * @param {Object} project - 项目数据
 * @param {boolean} isUpdate - 是否为更新操作
 * @returns {Object} - 验证结果，包含error和value
 */
exports.validateProject = (project, isUpdate = false) => {
  const Joi = require('joi');
  
  // 定义验证规则
  const schema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().allow('', null),
    status: Joi.string().valid('planning', 'in_progress', 'completed', 'on_hold', 'cancelled'),
    start_date: Joi.date().allow(null),
    end_date: Joi.date().allow(null).greater(Joi.ref('start_date'))
      .messages({
        'date.greater': '结束日期必须晚于开始日期'
      })
  });
  
  // 更新操作时，所有字段都是可选的
  const validationSchema = isUpdate 
    ? schema.fork(Object.keys(schema.describe().keys), (field) => field.optional())
    : schema;
  
  return validationSchema.validate(project, { abortEarly: false });
}; 
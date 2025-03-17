/**
 * 认证相关测试辅助工具
 */
const jwt = require('jsonwebtoken');
const { User } = require('../../src/models');
const authConfig = require('../../src/config/auth.config');

/**
 * 创建测试用户并返回JWT令牌
 * @returns {Promise<string>} JWT令牌
 */
const getTestUserToken = async () => {
  // 创建或查找测试用户
  let testUser = await User.findOne({ where: { email: 'test@example.com' } });
  
  if (!testUser) {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'password123',
      role: 'user'
    });
  }

  // 生成JWT令牌
  return jwt.sign(
    { id: testUser.id, role: testUser.role },
    authConfig.jwtSecret || 'testSecret',
    { expiresIn: '1h' }
  );
};

/**
 * 创建测试管理员并返回JWT令牌
 * @returns {Promise<string>} JWT令牌
 */
const getTestAdminToken = async () => {
  // 创建或查找测试管理员
  let testAdmin = await User.findOne({ where: { email: 'admin@example.com' } });
  
  if (!testAdmin) {
    testAdmin = await User.create({
      username: 'testadmin',
      email: 'admin@example.com',
      password_hash: 'admin123',
      role: 'admin'
    });
  }

  // 生成JWT令牌
  return jwt.sign(
    { id: testAdmin.id, role: testAdmin.role },
    authConfig.jwtSecret || 'testSecret',
    { expiresIn: '1h' }
  );
};

module.exports = {
  getTestUserToken,
  getTestAdminToken
}; 
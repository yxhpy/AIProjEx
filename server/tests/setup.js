/**
 * 测试设置脚本
 * 用于在运行测试前设置测试数据库
 */

// 设置测试环境
process.env.NODE_ENV = 'test';

const { sequelize } = require('./config/database');

/**
 * 设置测试数据库
 */
async function setupTestDatabase() {
  try {
    // 同步测试数据库模型
    await sequelize.sync({ force: true });
    console.log('测试数据库模型已同步');

    return true;
  } catch (error) {
    console.error('设置测试数据库失败:', error);
    throw error;
  }
}

module.exports = {
  setupTestDatabase
}; 
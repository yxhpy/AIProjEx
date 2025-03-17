/**
 * 测试环境数据库配置文件
 * 使用SQLite内存数据库进行集成测试
 */

const { Sequelize } = require('sequelize');

// 创建Sequelize实例，使用SQLite内存数据库
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true
  }
});

/**
 * 测试数据库连接
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('测试数据库连接成功');
    return true;
  } catch (error) {
    console.error('测试数据库连接失败:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection
}; 
/**
 * 数据库配置文件
 * 管理数据库连接配置和连接测试
 */

const { Sequelize } = require('sequelize');
const dbConfig = require('./db.config');
const logger = require('../utils/logger');

// 创建Sequelize实例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    timezone: dbConfig.timezone,
    pool: dbConfig.pool
  }
);

/**
 * 测试数据库连接
 * @returns {Promise<void>}
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('数据库连接成功');
    return true;
  } catch (error) {
    logger.error('数据库连接失败:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection
}; 
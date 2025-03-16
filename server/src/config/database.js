/**
 * 数据库配置文件
 * 使用Sequelize ORM连接MySQL数据库
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// 从环境变量获取数据库配置
const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'aiprojex_db',
  NODE_ENV = 'development'
} = process.env;

// 创建Sequelize实例
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    underscored: true,
    timestamps: true,
    paranoid: true // 软删除
  },
  timezone: '+08:00' // 设置时区
});

/**
 * 测试数据库连接
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功！');
    return true;
  } catch (error) {
    console.error('无法连接到数据库:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  Sequelize
}; 
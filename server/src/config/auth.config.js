require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'aiproj-ex-secret-key',
  jwtExpiration: 86400, // 24小时
  jwtRefreshExpiration: 604800, // 7天
}; 
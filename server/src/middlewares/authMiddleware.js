const { verifyToken, isAdmin, isOwnerOrAdmin } = require('./authJwt');

// 导出函数，保持原有函数名称并添加别名
module.exports = {
  authenticate: verifyToken,  // 重命名verifyToken为authenticate，用于兼容现有路由
  verifyToken,               // 保留原始函数名
  isAdmin,
  isOwnerOrAdmin
}; 
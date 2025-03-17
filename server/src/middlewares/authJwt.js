const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/auth.config');
const logger = require('../utils/logger');

/**
 * 验证JWT令牌中间件
 */
exports.verifyToken = (req, res, next) => {
  // 从请求头中获取authorization字段
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  // 从Authorization头中提取令牌（格式：Bearer <token>）
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ message: '认证令牌格式无效' });
  }

  const token = tokenParts[1];

  // 验证令牌
  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: '认证令牌无效或已过期' });
    }

    // 将用户信息存储在请求对象中，供后续中间件使用
    req.user = { id: decoded.id };
    next();
  });
};

/**
 * 检查是否为管理员中间件
 */
exports.isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: '需要管理员权限' });
    }

    next();
  } catch (error) {
    logger.error('检查管理员权限失败:', { error });
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
};

/**
 * 检查是否为资源所有者或管理员中间件
 * @param {Function} getOwnerId - 从请求中获取资源所有者ID的函数
 */
exports.isOwnerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      // 如果是管理员，无需进一步检查
      if (user.role === 'admin') {
        return next();
      }

      // 获取资源所有者ID
      const ownerId = await getOwnerId(req);
      
      // 如果当前用户是资源所有者，允许访问
      if (req.user.id === ownerId) {
        return next();
      }

      // 既不是管理员也不是所有者，拒绝访问
      return res.status(403).json({ message: '没有权限访问此资源' });
    } catch (error) {
      logger.error('检查所有者或管理员权限失败:', { error });
      res.status(500).json({ message: '服务器错误，请稍后再试' });
    }
  };
}; 
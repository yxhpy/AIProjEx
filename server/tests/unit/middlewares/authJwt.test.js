// 移除Chai和Sinon依赖
jest.mock('jsonwebtoken');

// 模拟依赖
jest.mock('../../../src/models', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

jest.mock('../../../src/config/auth.config', () => ({
  jwtSecret: 'test-secret'
}));

// 模拟logger
jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn()
}));

// 导入被测试的模块
const authJwt = require('../../../src/middlewares/authJwt');
const { User } = require('../../../src/models');
const logger = require('../../../src/utils/logger');
const jwt = require('jsonwebtoken');

describe('认证中间件 (authJwt.js)', () => {
  let req, res, next;

  beforeEach(() => {
    // 创建请求、响应和下一个函数的模拟
    req = {
      headers: {},
      user: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    // 重置所有模拟
    jest.clearAllMocks();
  });

  describe('verifyToken 中间件', () => {
    it('当未提供认证令牌时应返回401错误', () => {
      // 设置headers为空
      req.headers = {};
      
      // 执行中间件
      authJwt.verifyToken(req, res, next);
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: '未提供认证令牌' });
      expect(next).not.toHaveBeenCalled();
    });

    it('当令牌格式无效时应返回401错误', () => {
      // 设置无效令牌格式
      req.headers.authorization = 'invalid-token-format';
      
      // 执行中间件
      authJwt.verifyToken(req, res, next);
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: '认证令牌格式无效' });
      expect(next).not.toHaveBeenCalled();
    });

    it('当令牌无效时应返回401错误', () => {
      // 设置有效令牌格式但内容无效
      req.headers.authorization = 'Bearer invalid-token';
      
      // 模拟jwt.verify回调错误
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('无效令牌'), null);
      });
      
      // 执行中间件
      authJwt.verifyToken(req, res, next);
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: '认证令牌无效或已过期' });
      expect(next).not.toHaveBeenCalled();
    });

    it('当令牌有效时应设置user对象并调用next', () => {
      // 设置有效令牌
      req.headers.authorization = 'Bearer valid-token';
      
      // 模拟jwt.verify回调成功
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 123 });
      });
      
      // 执行中间件
      authJwt.verifyToken(req, res, next);
      
      // 验证结果
      expect(req.user).toEqual({ id: 123 });
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin 中间件', () => {
    beforeEach(() => {
      // 设置默认用户ID
      req.user = { id: 123 };
    });

    it('当用户不存在时应返回404错误', async () => {
      // 模拟用户不存在
      User.findByPk.mockResolvedValue(null);
      
      // 执行中间件
      await authJwt.isAdmin(req, res, next);
      
      // 验证结果
      expect(User.findByPk).toHaveBeenCalled();
      expect(User.findByPk).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: '用户不存在' });
      expect(next).not.toHaveBeenCalled();
    });

    it('当用户不是管理员时应返回403错误', async () => {
      // 模拟用户存在但不是管理员
      User.findByPk.mockResolvedValue({
        role: 'user'
      });
      
      // 执行中间件
      await authJwt.isAdmin(req, res, next);
      
      // 验证结果
      expect(User.findByPk).toHaveBeenCalled();
      expect(User.findByPk).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: '需要管理员权限' });
      expect(next).not.toHaveBeenCalled();
    });

    it('当用户是管理员时应调用next', async () => {
      // 模拟用户是管理员
      User.findByPk.mockResolvedValue({
        role: 'admin'
      });
      
      // 执行中间件
      await authJwt.isAdmin(req, res, next);
      
      // 验证结果
      expect(User.findByPk).toHaveBeenCalled();
      expect(User.findByPk).toHaveBeenCalledWith(123);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('当查询出错时应返回500错误', async () => {
      // 模拟数据库错误
      User.findByPk.mockRejectedValue(new Error('数据库错误'));
      
      // 执行中间件
      await authJwt.isAdmin(req, res, next);
      
      // 验证结果
      expect(User.findByPk).toHaveBeenCalled();
      expect(User.findByPk).toHaveBeenCalledWith(123);
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: '服务器错误，请稍后再试' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isOwnerOrAdmin 中间件', () => {
    let ownerMiddleware, getOwnerIdStub;
    
    beforeEach(() => {
      // 设置默认用户ID
      req.user = { id: 123 };
      
      // 创建getOwnerId函数的存根
      getOwnerIdStub = jest.fn();
      
      // 创建isOwnerOrAdmin中间件实例
      ownerMiddleware = authJwt.isOwnerOrAdmin(getOwnerIdStub);
    });

    it('当用户不存在时应返回404错误', async () => {
      // 模拟用户不存在
      User.findByPk.mockResolvedValue(null);
      
      // 执行中间件
      await ownerMiddleware(req, res, next);
      
      // 验证结果
      expect(User.findByPk).toHaveBeenCalled();
      expect(User.findByPk).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: '用户不存在' });
      expect(next).not.toHaveBeenCalled();
      expect(getOwnerIdStub).not.toHaveBeenCalled();
    });

    it('当用户是管理员时应直接调用next', async () => {
      // 模拟用户是管理员
      User.findByPk.mockResolvedValue({
        role: 'admin'
      });
      
      // 执行中间件
      await ownerMiddleware(req, res, next);
      
      // 验证结果
      expect(User.findByPk).toHaveBeenCalled();
      expect(User.findByPk).toHaveBeenCalledWith(123);
      expect(next).toHaveBeenCalledTimes(1);
      expect(getOwnerIdStub).not.toHaveBeenCalled(); // 不应该调用getOwnerId
      expect(res.status).not.toHaveBeenCalled();
    });

    it('当用户是资源所有者时应调用next', async () => {
      // 模拟用户存在但不是管理员
      User.findByPk.mockResolvedValue({
        role: 'user',
        id: 123
      });
      
      // 设置资源所有者ID与用户ID相同
      getOwnerIdStub.mockResolvedValue(123);
      
      // 执行中间件
      await ownerMiddleware(req, res, next);
      
      // 验证结果
      expect(User.findByPk).toHaveBeenCalled();
      expect(getOwnerIdStub).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('当用户不是资源所有者时应返回403错误', async () => {
      // 模拟用户存在但不是管理员
      User.findByPk.mockResolvedValue({
        role: 'user',
        id: 123
      });
      
      // 设置资源所有者ID与用户ID不同
      getOwnerIdStub.mockResolvedValue(456);
      
      // 执行中间件
      await ownerMiddleware(req, res, next);
      
      // 验证结果
      expect(User.findByPk).toHaveBeenCalled();
      expect(getOwnerIdStub).toHaveBeenCalledWith(req);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: '没有权限访问此资源' });
      expect(next).not.toHaveBeenCalled();
    });

    it('当getOwnerId函数抛出错误时应返回500错误', async () => {
      // 模拟用户存在但不是管理员
      User.findByPk.mockResolvedValue({
        role: 'user',
        id: 123
      });
      
      // 模拟getOwnerId抛出错误
      getOwnerIdStub.mockRejectedValue(new Error('获取所有者ID失败'));
      
      // 执行中间件
      await ownerMiddleware(req, res, next);
      
      // 验证结果
      expect(User.findByPk).toHaveBeenCalled();
      expect(getOwnerIdStub).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: '服务器错误，请稍后再试' });
      expect(next).not.toHaveBeenCalled();
    });
  });
}); 
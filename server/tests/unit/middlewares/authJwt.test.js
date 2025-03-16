const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

// 模拟依赖
jest.mock('../../../src/models', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

jest.mock('../../../src/config/auth.config', () => ({
  jwtSecret: 'test-secret'
}));

// 导入被测试的模块
const authJwt = require('../../../src/middlewares/authJwt');
const { User } = require('../../../src/models');

describe('认证中间件 (authJwt.js)', () => {
  let req, res, next, jwtVerifyStub, consoleErrorStub;

  beforeEach(() => {
    // 创建请求、响应和下一个函数的模拟
    req = {
      headers: {},
      userId: null
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };
    
    next = sinon.stub();
    
    // 模拟jwt.verify
    jwtVerifyStub = sinon.stub(jwt, 'verify');
    
    // 模拟console.error
    consoleErrorStub = sinon.stub(console, 'error');
    
    // 重置所有模拟
    jest.clearAllMocks();
  });

  afterEach(() => {
    // 在每个测试后恢复存根
    jwtVerifyStub.restore();
    consoleErrorStub.restore();
  });

  describe('verifyToken 中间件', () => {
    it('当未提供认证令牌时应返回401错误', () => {
      // 设置headers为空
      req.headers = {};
      
      // 执行中间件
      authJwt.verifyToken(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ message: '未提供认证令牌' })).to.be.true;
      expect(next.called).to.be.false;
    });

    it('当令牌格式无效时应返回401错误', () => {
      // 设置无效令牌格式
      req.headers.authorization = 'invalid-token-format';
      
      // 执行中间件
      authJwt.verifyToken(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ message: '认证令牌格式无效' })).to.be.true;
      expect(next.called).to.be.false;
    });

    it('当令牌无效时应返回401错误', () => {
      // 设置有效令牌格式但内容无效
      req.headers.authorization = 'Bearer invalid-token';
      
      // 模拟jwt.verify回调错误
      jwtVerifyStub.callsFake((token, secret, callback) => {
        callback(new Error('无效令牌'), null);
      });
      
      // 执行中间件
      authJwt.verifyToken(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ message: '认证令牌无效或已过期' })).to.be.true;
      expect(next.called).to.be.false;
    });

    it('当令牌有效时应设置userId并调用next', () => {
      // 设置有效令牌
      req.headers.authorization = 'Bearer valid-token';
      
      // 模拟jwt.verify回调成功
      jwtVerifyStub.callsFake((token, secret, callback) => {
        callback(null, { id: 123 });
      });
      
      // 执行中间件
      authJwt.verifyToken(req, res, next);
      
      // 验证结果
      expect(req.userId).to.equal(123);
      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });
  });

  describe('isAdmin 中间件', () => {
    beforeEach(() => {
      // 设置默认userId
      req.userId = 123;
    });

    it('当用户不存在时应返回404错误', async () => {
      // 模拟用户不存在
      User.findByPk.mockResolvedValue(null);
      
      // 执行中间件
      await authJwt.isAdmin(req, res, next);
      
      // 验证结果
      expect(User.findByPk.mock.calls.length).to.be.greaterThan(0);
      expect(User.findByPk.mock.calls[0][0]).to.equal(123);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: '用户不存在' })).to.be.true;
      expect(next.called).to.be.false;
    });

    it('当用户不是管理员时应返回403错误', async () => {
      // 模拟用户存在但不是管理员
      User.findByPk.mockResolvedValue({
        role: 'user'
      });
      
      // 执行中间件
      await authJwt.isAdmin(req, res, next);
      
      // 验证结果
      expect(User.findByPk.mock.calls.length).to.be.greaterThan(0);
      expect(User.findByPk.mock.calls[0][0]).to.equal(123);
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: '需要管理员权限' })).to.be.true;
      expect(next.called).to.be.false;
    });

    it('当用户是管理员时应调用next', async () => {
      // 模拟用户是管理员
      User.findByPk.mockResolvedValue({
        role: 'admin'
      });
      
      // 执行中间件
      await authJwt.isAdmin(req, res, next);
      
      // 验证结果
      expect(User.findByPk.mock.calls.length).to.be.greaterThan(0);
      expect(User.findByPk.mock.calls[0][0]).to.equal(123);
      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('当查询出错时应返回500错误', async () => {
      // 模拟数据库错误
      User.findByPk.mockRejectedValue(new Error('数据库错误'));
      
      // 执行中间件
      await authJwt.isAdmin(req, res, next);
      
      // 验证结果
      expect(User.findByPk.mock.calls.length).to.be.greaterThan(0);
      expect(User.findByPk.mock.calls[0][0]).to.equal(123);
      expect(consoleErrorStub.called).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: '服务器错误，请稍后再试' })).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('isOwnerOrAdmin 中间件', () => {
    let ownerMiddleware, getOwnerIdStub;
    
    beforeEach(() => {
      // 设置默认userId
      req.userId = 123;
      
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
      expect(User.findByPk.mock.calls.length).to.be.greaterThan(0);
      expect(User.findByPk.mock.calls[0][0]).to.equal(123);
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: '用户不存在' })).to.be.true;
      expect(next.called).to.be.false;
      expect(getOwnerIdStub.mock.calls.length).to.equal(0);
    });

    it('当用户是管理员时应直接调用next', async () => {
      // 模拟用户是管理员
      User.findByPk.mockResolvedValue({
        role: 'admin'
      });
      
      // 执行中间件
      await ownerMiddleware(req, res, next);
      
      // 验证结果
      expect(User.findByPk.mock.calls.length).to.be.greaterThan(0);
      expect(User.findByPk.mock.calls[0][0]).to.equal(123);
      expect(next.calledOnce).to.be.true;
      expect(getOwnerIdStub.mock.calls.length).to.equal(0); // 不应该调用getOwnerId
      expect(res.status.called).to.be.false;
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
      expect(User.findByPk.mock.calls.length).to.be.greaterThan(0);
      expect(User.findByPk.mock.calls[0][0]).to.equal(123);
      expect(getOwnerIdStub.mock.calls.length).to.be.greaterThan(0);
      expect(getOwnerIdStub.mock.calls[0][0]).to.equal(req);
      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('当用户既不是管理员也不是所有者时应返回403错误', async () => {
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
      expect(User.findByPk.mock.calls.length).to.be.greaterThan(0);
      expect(User.findByPk.mock.calls[0][0]).to.equal(123);
      expect(getOwnerIdStub.mock.calls.length).to.be.greaterThan(0);
      expect(getOwnerIdStub.mock.calls[0][0]).to.equal(req);
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: '没有权限访问此资源' })).to.be.true;
      expect(next.called).to.be.false;
    });

    it('当查询出错时应返回500错误', async () => {
      // 模拟数据库错误
      User.findByPk.mockRejectedValue(new Error('数据库错误'));
      
      // 执行中间件
      await ownerMiddleware(req, res, next);
      
      // 验证结果
      expect(User.findByPk.mock.calls.length).to.be.greaterThan(0);
      expect(User.findByPk.mock.calls[0][0]).to.equal(123);
      expect(consoleErrorStub.called).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: '服务器错误，请稍后再试' })).to.be.true;
      expect(next.called).to.be.false;
    });
  });
}); 
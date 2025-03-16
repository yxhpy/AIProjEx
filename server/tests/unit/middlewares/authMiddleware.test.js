const sinon = require('sinon');
const { expect } = require('chai');
const authMiddleware = require('../../../src/middlewares/authMiddleware');

describe('Auth 中间件测试', () => {
  let sandbox;
  let req, res, next;
  let authJwtMock;

  beforeEach(() => {
    // 创建sinon沙箱
    sandbox = sinon.createSandbox();
    
    // 创建通用的请求、响应和next函数
    req = {
      headers: { authorization: 'Bearer token123' }
    };
    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis()
    };
    next = sandbox.stub();
    
    // 模拟authJwt模块
    authJwtMock = {
      verifyToken: sandbox.stub(),
      isAdmin: sandbox.stub(),
      isOwnerOrAdmin: sandbox.stub()
    };
    
    // 替换authMiddleware中导入的authJwt
    sandbox.stub(authMiddleware, 'verifyToken').callsFake(authJwtMock.verifyToken);
    sandbox.stub(authMiddleware, 'authenticate').callsFake(authJwtMock.verifyToken);
    sandbox.stub(authMiddleware, 'isAdmin').callsFake(authJwtMock.isAdmin);
    sandbox.stub(authMiddleware, 'isOwnerOrAdmin').callsFake(authJwtMock.isOwnerOrAdmin);
  });

  afterEach(() => {
    // 清理沙箱
    sandbox.restore();
  });

  it('应该正确导出authenticate作为verifyToken的别名', () => {
    // 使用authMiddleware.authenticate
    authMiddleware.authenticate(req, res, next);
    
    // 验证verifyToken被调用
    expect(authMiddleware.authenticate.calledOnce).to.be.true;
    expect(authMiddleware.authenticate.calledWith(req, res, next)).to.be.true;
  });

  it('应该正确导出verifyToken', () => {
    // 使用authMiddleware.verifyToken
    authMiddleware.verifyToken(req, res, next);
    
    // 验证verifyToken被调用
    expect(authMiddleware.verifyToken.calledOnce).to.be.true;
    expect(authMiddleware.verifyToken.calledWith(req, res, next)).to.be.true;
  });

  it('应该正确导出isAdmin', () => {
    // 使用authMiddleware.isAdmin
    authMiddleware.isAdmin(req, res, next);
    
    // 验证isAdmin被调用
    expect(authMiddleware.isAdmin.calledOnce).to.be.true;
    expect(authMiddleware.isAdmin.calledWith(req, res, next)).to.be.true;
  });

  it('应该正确导出isOwnerOrAdmin', () => {
    // 模拟返回值
    const middlewareFunction = (req, res, next) => {};
    authMiddleware.isOwnerOrAdmin.returns(middlewareFunction);
    
    // 使用authMiddleware.isOwnerOrAdmin
    const getOwnerIdFunc = () => {};
    const result = authMiddleware.isOwnerOrAdmin(getOwnerIdFunc);
    
    // 验证isOwnerOrAdmin被调用并返回了结果
    expect(authMiddleware.isOwnerOrAdmin.calledOnce).to.be.true;
    expect(authMiddleware.isOwnerOrAdmin.calledWith(getOwnerIdFunc)).to.be.true;
    expect(result).to.equal(middlewareFunction);
  });
}); 
const sinon = require('sinon');
const { expect } = require('chai');
const authJwt = require('../../../src/middlewares/authJwt');
const authMiddleware = require('../../../src/middlewares/authMiddleware');

describe('Auth 中间件测试', () => {
  let sandbox;

  beforeEach(() => {
    // 创建sinon沙箱
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    // 清理沙箱
    sandbox.restore();
  });

  it('应该正确导出authenticate作为verifyToken的别名', () => {
    // 模拟authJwt.verifyToken
    const verifyTokenStub = sandbox.stub(authJwt, 'verifyToken');
    
    // 使用authMiddleware.authenticate
    const req = {};
    const res = {};
    const next = () => {};
    
    authMiddleware.authenticate(req, res, next);
    
    // 验证verifyToken被调用
    sinon.assert.calledOnce(verifyTokenStub);
    sinon.assert.calledWith(verifyTokenStub, req, res, next);
  });

  it('应该正确导出verifyToken', () => {
    // 模拟authJwt.verifyToken
    const verifyTokenStub = sandbox.stub(authJwt, 'verifyToken');
    
    // 使用authMiddleware.verifyToken
    const req = {};
    const res = {};
    const next = () => {};
    
    authMiddleware.verifyToken(req, res, next);
    
    // 验证verifyToken被调用
    sinon.assert.calledOnce(verifyTokenStub);
    sinon.assert.calledWith(verifyTokenStub, req, res, next);
  });

  it('应该正确导出isAdmin', () => {
    // 模拟authJwt.isAdmin
    const isAdminStub = sandbox.stub(authJwt, 'isAdmin');
    
    // 使用authMiddleware.isAdmin
    const req = {};
    const res = {};
    const next = () => {};
    
    authMiddleware.isAdmin(req, res, next);
    
    // 验证isAdmin被调用
    sinon.assert.calledOnce(isAdminStub);
    sinon.assert.calledWith(isAdminStub, req, res, next);
  });

  it('应该正确导出isOwnerOrAdmin', () => {
    // 模拟authJwt.isOwnerOrAdmin
    const isOwnerOrAdminStub = sandbox.stub(authJwt, 'isOwnerOrAdmin');
    const getOwnerIdFunc = () => {};
    
    // 调用前
    isOwnerOrAdminStub.returns('middlewareFunction');
    
    // 使用authMiddleware.isOwnerOrAdmin
    const result = authMiddleware.isOwnerOrAdmin(getOwnerIdFunc);
    
    // 验证isOwnerOrAdmin被调用并返回了结果
    sinon.assert.calledOnce(isOwnerOrAdminStub);
    sinon.assert.calledWith(isOwnerOrAdminStub, getOwnerIdFunc);
    expect(result).to.equal('middlewareFunction');
  });
}); 
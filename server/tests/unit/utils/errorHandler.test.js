const sinon = require('sinon');
const { expect } = require('chai');
const { ApiError, errorHandler } = require('../../../src/utils/errorHandler');

describe('错误处理工具测试', () => {
  describe('ApiError类', () => {
    it('应该创建一个带有正确属性的ApiError实例', () => {
      const statusCode = 400;
      const message = '请求参数错误';
      const error = new ApiError(statusCode, message);
      
      expect(error).to.be.instanceOf(Error);
      expect(error).to.be.instanceOf(ApiError);
      expect(error.statusCode).to.equal(statusCode);
      expect(error.message).to.equal(message);
      expect(error.isOperational).to.be.true;
      expect(error.name).to.equal('ApiError');
      expect(error.stack).to.exist;
    });
    
    it('应该允许设置isOperational属性', () => {
      const error = new ApiError(500, '服务器错误', false);
      expect(error.isOperational).to.be.false;
    });
  });
  
  describe('errorHandler中间件', () => {
    let req, res, next, sandbox;
    let originalNodeEnv;
    
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      req = {};
      res = {
        status: sandbox.stub().returnsThis(),
        json: sandbox.stub()
      };
      next = sandbox.stub();
      
      // 模拟console.error以避免测试输出中的错误日志
      sandbox.stub(console, 'error');
      
      // 保存原始环境变量
      originalNodeEnv = process.env.NODE_ENV;
    });
    
    afterEach(() => {
      // 恢复环境变量
      process.env.NODE_ENV = originalNodeEnv;
      
      // 恢复所有存根
      sandbox.restore();
    });
    
    it('应该处理ApiError并返回正确的状态码和消息', () => {
      const error = new ApiError(400, '请求参数错误');
      
      errorHandler(error, req, res, next);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', false);
      expect(res.json.firstCall.args[0]).to.have.property('message', '请求参数错误');
    });
    
    it('应该处理普通Error并返回500状态码', () => {
      const error = new Error('未知错误');
      
      errorHandler(error, req, res, next);
      
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', false);
      expect(res.json.firstCall.args[0]).to.have.property('message', '未知错误');
    });
    
    it('应该处理Sequelize验证错误', () => {
      const error = new Error('验证错误');
      error.name = 'SequelizeValidationError';
      error.errors = [
        { message: '名称不能为空' },
        { message: '邮箱格式不正确' }
      ];
      
      errorHandler(error, req, res, next);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', false);
      expect(res.json.firstCall.args[0]).to.have.property('message', '名称不能为空, 邮箱格式不正确');
    });
    
    it('应该处理Sequelize唯一约束错误', () => {
      const error = new Error('唯一约束错误');
      error.name = 'SequelizeUniqueConstraintError';
      
      errorHandler(error, req, res, next);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', false);
      expect(res.json.firstCall.args[0]).to.have.property('message', '数据已存在，请确保提供的信息唯一');
    });
    
    it('应该处理Sequelize外键约束错误', () => {
      const error = new Error('外键约束错误');
      error.name = 'SequelizeForeignKeyConstraintError';
      
      errorHandler(error, req, res, next);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', false);
      expect(res.json.firstCall.args[0]).to.have.property('message', '提供的关联数据不存在');
    });
    
    it('在开发环境中应该包含错误堆栈', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('测试错误');
      error.stack = 'Error: 测试错误\n    at Test.fn';
      
      errorHandler(error, req, res, next);
      
      expect(res.json.firstCall.args[0]).to.have.property('stack', error.stack);
    });
    
    it('在生产环境中不应该包含错误堆栈', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('测试错误');
      
      errorHandler(error, req, res, next);
      
      expect(res.json.firstCall.args[0]).to.not.have.property('stack');
    });
  });
}); 
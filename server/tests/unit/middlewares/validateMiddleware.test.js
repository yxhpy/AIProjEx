const sinon = require('sinon');
const { expect } = require('chai');
const validate = require('../../../src/middlewares/validateMiddleware');

describe('Validation 中间件测试', () => {
  let sandbox;
  let req;
  let res;
  let next;
  let validationStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // 创建请求、响应和next函数的模拟
    req = {};
    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis()
    };
    next = sandbox.stub();
    
    // 创建验证函数的模拟
    validationStub = {
      run: sandbox.stub().resolves()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('应该在没有验证函数的情况下直接调用next', async () => {
    // 创建验证中间件，不传递验证函数
    const middleware = validate([]);
    
    // 执行中间件
    await middleware(req, res, next);
    
    // 验证next被调用
    expect(next.calledOnce).to.be.true;
    
    // 验证res.status和res.json没有被调用
    expect(res.status.called).to.be.false;
    expect(res.json.called).to.be.false;
  });

  it('应该处理验证函数执行失败的情况', async () => {
    // 创建抛出错误的验证函数
    const failingValidation = { 
      run: sandbox.stub().rejects(new Error('验证执行失败')) 
    };
    
    // 创建验证中间件
    const middleware = validate([failingValidation]);
    
    // 执行中间件，并捕获错误
    try {
      await middleware(req, res, next);
      
      // 如果没有抛出错误，测试应该失败
      expect.fail('应该抛出错误');
    } catch (error) {
      // 验证错误被正确抛出
      expect(error.message).to.equal('验证执行失败');
    }
    
    // 验证next没有被调用
    expect(next.called).to.be.false;
  });
}); 
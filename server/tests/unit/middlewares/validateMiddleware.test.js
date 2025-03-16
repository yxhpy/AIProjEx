const sinon = require('sinon');
const { expect } = require('chai');
const mock = require('mock-require');

describe('Validation 中间件测试', () => {
  let sandbox;
  let req;
  let res;
  let next;
  let validationStub;
  let validationResultStub;
  let validate;

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
    
    // 创建validationResult模拟
    validationResultStub = sandbox.stub();
    
    // 模拟express-validator
    mock('express-validator', {
      validationResult: validationResultStub
    });
    
    // 加载validateMiddleware模块
    validate = require('../../../src/middlewares/validateMiddleware');
  });

  afterEach(() => {
    // 清理模拟
    mock.stopAll();
    sandbox.restore();
  });

  it('应该在没有错误时调用next', async () => {
    // 模拟validationResult返回空错误
    validationResultStub.withArgs(req).returns({
      isEmpty: () => true,
      array: () => []
    });
    
    // 创建验证中间件
    const middleware = validate([validationStub]);
    
    // 执行中间件
    await middleware(req, res, next);
    
    // 验证validationResult被调用
    expect(validationResultStub.calledOnce).to.be.true;
    
    // 验证next被调用
    expect(next.calledOnce).to.be.true;
    
    // 验证res.status和res.json没有被调用
    expect(res.status.called).to.be.false;
    expect(res.json.called).to.be.false;
  });

  it('应该在有错误时返回400和格式化的错误信息', async () => {
    // 模拟验证错误
    const errors = [
      { param: 'email', msg: '无效的邮箱格式' },
      { param: 'password', msg: '密码长度必须至少为8个字符' }
    ];
    
    // 模拟validationResult返回错误
    validationResultStub.withArgs(req).returns({
      isEmpty: () => false,
      array: () => errors
    });
    
    // 创建验证中间件
    const middleware = validate([validationStub]);
    
    // 执行中间件
    await middleware(req, res, next);
    
    // 验证validationResult被调用
    expect(validationResultStub.calledOnce).to.be.true;
    
    // 验证next没有被调用
    expect(next.called).to.be.false;
    
    // 验证res.status被调用并且状态码为400
    expect(res.status.calledOnce).to.be.true;
    expect(res.status.calledWith(400)).to.be.true;
    
    // 验证res.json被调用并且包含正确的错误信息
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.firstCall.args[0]).to.have.property('success', false);
    expect(res.json.firstCall.args[0]).to.have.property('message', '输入验证失败');
    expect(res.json.firstCall.args[0]).to.have.property('errors').that.is.an('array');
    expect(res.json.firstCall.args[0].errors).to.have.lengthOf(2);
    expect(res.json.firstCall.args[0].errors[0]).to.have.property('field', 'email');
    expect(res.json.firstCall.args[0].errors[0]).to.have.property('message', '无效的邮箱格式');
  });

  it('应该运行所有验证并正确处理Promise.all', async () => {
    // 创建多个验证函数的模拟
    const validation1 = { run: sandbox.stub().resolves() };
    const validation2 = { run: sandbox.stub().resolves() };
    const validation3 = { run: sandbox.stub().resolves() };
    
    // 模拟validationResult返回空错误
    validationResultStub.withArgs(req).returns({
      isEmpty: () => true,
      array: () => []
    });
    
    // 创建验证中间件
    const middleware = validate([validation1, validation2, validation3]);
    
    // 执行中间件
    await middleware(req, res, next);
    
    // 验证所有验证函数都被调用
    expect(validation1.run.calledOnce).to.be.true;
    expect(validation2.run.calledOnce).to.be.true;
    expect(validation3.run.calledOnce).to.be.true;
    
    // 验证validationResult被调用
    expect(validationResultStub.calledOnce).to.be.true;
    
    // 验证next被调用
    expect(next.calledOnce).to.be.true;
  });
}); 
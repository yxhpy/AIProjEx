// 模拟express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

// 导入被测试模块和依赖
const { validationResult } = require('express-validator');
const validate = require('../../../src/middlewares/validateMiddleware');

// 模拟logger
jest.mock('../../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Validation 中间件测试', () => {
  let req;
  let res;
  let next;
  let validationStub;

  beforeEach(() => {
    // 创建请求、响应和next函数的模拟
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    
    // 创建验证函数的模拟
    validationStub = {
      run: jest.fn().mockResolvedValue()
    };
    
    // 重置所有模拟
    jest.clearAllMocks();
  });

  it('应该在验证通过时调用next', async () => {
    // 设置validationResult返回空错误
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
    
    // 创建验证中间件
    const middleware = validate([validationStub]);
    
    // 执行中间件
    await middleware(req, res, next);
    
    // 验证验证函数被调用
    expect(validationStub.run).toHaveBeenCalledWith(req);
    
    // 验证validationResult被调用
    expect(validationResult).toHaveBeenCalledWith(req);
    
    // 验证next被调用
    expect(next).toHaveBeenCalled();
    
    // 验证res.status和res.json没有被调用
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('应该在验证失败时返回400错误和格式化的错误信息', async () => {
    // 模拟验证错误
    const validationErrors = [
      { param: 'username', msg: '用户名不能为空' },
      { param: 'email', msg: '请提供有效的电子邮件地址' }
    ];
    
    // 设置validationResult返回非空错误
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => validationErrors
    });
    
    // 创建验证中间件
    const middleware = validate([validationStub]);
    
    // 执行中间件
    await middleware(req, res, next);
    
    // 验证验证函数被调用
    expect(validationStub.run).toHaveBeenCalled();
    
    // 验证validationResult被调用
    expect(validationResult).toHaveBeenCalled();
    
    // 验证next没有被调用
    expect(next).not.toHaveBeenCalled();
    
    // 验证res.status被调用，并且状态码为400
    expect(res.status).toHaveBeenCalledWith(400);
    
    // 验证res.json被调用，并且返回正确的错误信息
    const expectedResponse = {
      success: false,
      message: '输入验证失败',
      errors: [
        { field: 'username', message: '用户名不能为空' },
        { field: 'email', message: '请提供有效的电子邮件地址' }
      ]
    };
    
    expect(res.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('应该处理多个验证函数', async () => {
    // 创建另一个验证函数
    const anotherValidationStub = {
      run: jest.fn().mockResolvedValue()
    };
    
    // 设置validationResult返回空错误
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
    
    // 创建验证中间件，包含多个验证函数
    const middleware = validate([validationStub, anotherValidationStub]);
    
    // 执行中间件
    await middleware(req, res, next);
    
    // 验证所有验证函数都被调用
    expect(validationStub.run).toHaveBeenCalled();
    expect(anotherValidationStub.run).toHaveBeenCalled();
    
    // 验证validationResult被调用
    expect(validationResult).toHaveBeenCalled();
    
    // 验证next被调用
    expect(next).toHaveBeenCalled();
  });

  it('应该处理验证函数执行失败的情况', async () => {
    // 创建抛出错误的验证函数
    const failingValidation = { 
      run: jest.fn().mockRejectedValue(new Error('验证执行失败')) 
    };
    
    // 创建验证中间件
    const middleware = validate([failingValidation]);
    
    // 执行中间件
    await middleware(req, res, next);
    
    // 验证status和json被调用，返回500错误
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: '服务器错误，请稍后再试',
    });
    
    // 验证next没有被调用
    expect(next).not.toHaveBeenCalled();
  });
}); 
// 模拟authJwt模块
jest.mock('../../../src/middlewares/authJwt', () => ({
  verifyToken: jest.fn(),
  isAdmin: jest.fn(),
  isOwnerOrAdmin: jest.fn()
}));

// 导入被测试的模块
const authMiddleware = require('../../../src/middlewares/authMiddleware');
const authJwt = require('../../../src/middlewares/authJwt');

describe('认证中间件 (authMiddleware.js)', () => {
  let req, res, next;

  beforeEach(() => {
    // 创建请求、响应和next函数的模拟
    req = { headers: { authorization: 'Bearer token' }, userId: 123 };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    
    // 重置所有模拟
    jest.clearAllMocks();
  });

  it('应该导出authenticate作为verifyToken的别名', () => {
    // 调用authenticate
    authMiddleware.authenticate(req, res, next);
    
    // 验证verifyToken被调用
    expect(authJwt.verifyToken).toHaveBeenCalledWith(req, res, next);
  });

  it('应该导出原始的verifyToken函数', () => {
    // 调用verifyToken
    authMiddleware.verifyToken(req, res, next);
    
    // 验证verifyToken被调用
    expect(authJwt.verifyToken).toHaveBeenCalledWith(req, res, next);
  });

  it('应该导出isAdmin函数', () => {
    // 调用isAdmin
    authMiddleware.isAdmin(req, res, next);
    
    // 验证isAdmin被调用
    expect(authJwt.isAdmin).toHaveBeenCalledWith(req, res, next);
  });

  it('应该导出isOwnerOrAdmin函数', () => {
    // 创建测试参数
    const getOwnerId = jest.fn();
    
    // 调用isOwnerOrAdmin
    const middleware = authMiddleware.isOwnerOrAdmin(getOwnerId);
    
    // 验证isOwnerOrAdmin被调用
    expect(authJwt.isOwnerOrAdmin).toHaveBeenCalledWith(getOwnerId);
  });
}); 
const sinon = require('sinon');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');

// 导入被测试的模块
const authJwt = require('../../../src/middlewares/authJwt');

describe('认证中间件 (authJwt.js)', () => {
  let req;
  let res;
  let next;
  let jwtVerifyStub;

  beforeEach(() => {
    // 设置请求、响应和next函数的模拟
    req = {
      headers: {},
      userId: null
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };
    
    next = sinon.stub();
    
    // 模拟 jwt.verify
    jwtVerifyStub = sinon.stub(jwt, 'verify');
  });

  afterEach(() => {
    // 恢复 jwt.verify 存根
    jwtVerifyStub.restore();
  });

  describe('verifyToken 中间件', () => {
    it('当未提供认证令牌时应返回401错误', () => {
      // 执行中间件
      authJwt.verifyToken(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ message: '未提供认证令牌' })).to.be.true;
      expect(next.called).to.be.false;
    });

    it('当令牌格式无效时应返回401错误', () => {
      // 设置无效格式的令牌
      req.headers.authorization = 'InvalidFormat';
      
      // 执行中间件
      authJwt.verifyToken(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ message: '认证令牌格式无效' })).to.be.true;
      expect(next.called).to.be.false;
    });

    it('当令牌无效时应返回401错误', () => {
      // 设置有效格式但内容无效的令牌
      req.headers.authorization = 'Bearer invalid-token';
      
      // 模拟 jwt.verify 返回错误
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
      
      // 模拟 jwt.verify 返回解码后的数据
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
}); 
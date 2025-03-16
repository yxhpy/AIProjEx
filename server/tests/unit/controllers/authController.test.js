const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../../../src/controllers/authController');
const { User } = require('../../../src/models');

describe('Auth Controller', () => {
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    // 模拟请求对象
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: '123e4567-e89b-12d3-a456-426614174000' }
    };
    
    // 模拟响应对象
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy(),
      cookie: sinon.spy()
    };
    
    // 模拟next函数
    next = sinon.spy();
  });
  
  afterEach(() => {
    // 清理所有stub/spy等
    sinon.restore();
  });
  
  describe('register', () => {
    it('应该成功注册新用户', async () => {
      // 准备请求数据
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };
      
      // 模拟User.findOne - 检查用户是否存在（返回null表示不存在）
      sinon.stub(User, 'findOne').resolves(null);
      
      // 模拟bcrypt.hash - 密码哈希
      sinon.stub(bcrypt, 'hash').resolves('hashed_password');
      
      // 模拟User.create - 创建新用户
      const newUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: req.body.username,
        email: req.body.email,
        role: 'user',
        createdAt: new Date()
      };
      sinon.stub(User, 'create').resolves(newUser);
      
      // 模拟jwt.sign - 生成令牌
      sinon.stub(jwt, 'sign').returns('test_token');
      
      // 调用控制器方法
      await authController.register(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0]).to.have.property('user');
      expect(res.json.args[0][0]).to.have.property('token', 'test_token');
    });
    
    it('用户名已存在时应返回400错误', async () => {
      // 准备请求数据
      req.body = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };
      
      // 模拟User.findOne - 用户名已存在
      sinon.stub(User, 'findOne').resolves({ id: '123', username: 'existinguser' });
      
      // 调用控制器方法
      await authController.register(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('已被使用');
    });
    
    it('密码和确认密码不匹配时应返回400错误', async () => {
      // 模拟请求参数
      req.body = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPassword123'
      };
      
      // 调用控制器方法
      await authController.register(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('密码和确认密码不匹配');
    });
  });
  
  describe('login', () => {
    it('应该成功登录并返回令牌', async () => {
      // 模拟请求参数
      req.body = {
        email: 'test@example.com',
        password: 'Password123'
      };
      
      // 模拟查询结果 - 找到用户
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user',
        validatePassword: sinon.stub().resolves(true)
      };
      
      // 模拟User.findOne
      sinon.stub(User, 'findOne').resolves(user);
      
      // 模拟jwt.sign
      sinon.stub(jwt, 'sign').returns('fake_token');
      
      // 调用控制器方法
      await authController.login(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0]).to.have.property('user');
      expect(res.json.args[0][0]).to.have.property('token', 'fake_token');
    });
    
    it('用户不存在时应返回401错误', async () => {
      // 模拟请求参数
      req.body = {
        email: 'nonexistent@example.com',
        password: 'Password123'
      };
      
      // 模拟User.findOne
      sinon.stub(User, 'findOne').resolves(null);
      
      // 调用控制器方法
      await authController.login(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('邮箱或密码不正确');
    });
    
    it('密码错误时应返回401错误', async () => {
      // 模拟请求参数
      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };
      
      // 模拟查询结果 - 找到用户但密码不匹配
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user',
        validatePassword: sinon.stub().resolves(false)
      };
      
      // 模拟User.findOne
      sinon.stub(User, 'findOne').resolves(user);
      
      // 调用控制器方法
      await authController.login(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('邮箱或密码不正确');
    });
  });
  
  describe('getUserProfile', () => {
    it('应该返回当前登录用户的个人资料', async () => {
      // 模拟User.findByPk
      const user = {
        id: req.user.id,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        password: 'hashed_password', // 这个不应该返回给客户端
        createdAt: new Date(),
        updatedAt: new Date()
      };
      sinon.stub(User, 'findByPk').resolves(user);
      
      // 调用控制器方法
      await authController.getCurrentUser(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('user');
      expect(res.json.args[0][0].user).to.not.have.property('password'); // 不应该包含密码
    });
    
    it('用户不存在时应返回404错误', async () => {
      // 模拟User.findByPk - 用户不存在
      sinon.stub(User, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await authController.getCurrentUser(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('未找到');
    });
  });
  
  describe('updateUserProfile', () => {
    it('应该成功更新用户个人资料', async () => {
      // 准备请求数据
      req.body = {
        username: 'updateduser',
        email: 'updated@example.com'
      };
      
      // 模拟User.findByPk
      const updateStub = sinon.stub().resolves();
      const user = {
        id: req.user.id,
        username: 'testuser',
        email: 'test@example.com',
        update: updateStub
      };
      sinon.stub(User, 'findByPk').resolves(user);
      
      // 模拟User.findOne - 检查用户名和邮箱是否已被使用
      sinon.stub(User, 'findOne').resolves(null);
      
      // 调用控制器方法
      await authController.updateCurrentUser(req, res, next);
      
      // 验证结果
      expect(updateStub.calledWith(req.body)).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('更新成功');
    });
    
    it('用户不存在时应返回404错误', async () => {
      // 准备请求数据
      req.body = {
        username: 'updateduser'
      };
      
      // 模拟User.findByPk - 用户不存在
      sinon.stub(User, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await authController.updateCurrentUser(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('未找到');
    });
    
    it('用户名已被使用时应返回400错误', async () => {
      // 准备请求数据
      req.body = {
        username: 'existinguser'
      };
      
      // 模拟User.findByPk
      const user = {
        id: req.user.id,
        username: 'testuser'
      };
      sinon.stub(User, 'findByPk').resolves(user);
      
      // 模拟User.findOne - 用户名已被使用
      sinon.stub(User, 'findOne').resolves({ id: 'otheruserid', username: 'existinguser' });
      
      // 调用控制器方法
      await authController.updateCurrentUser(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('已被使用');
    });
  });
  
  describe('changePassword', () => {
    it('应该成功更改密码', async () => {
      // 模拟请求参数
      req.body = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      };
      
      // 模拟查询结果 - 找到用户
      const updateStub = sinon.stub().resolves();
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_old_password',
        validatePassword: sinon.stub().resolves(true),
        save: sinon.stub().resolves()
      };
      
      // 模拟User.findByPk
      sinon.stub(User, 'findByPk').resolves(user);
      
      // 模拟bcrypt.hash
      sinon.stub(bcrypt, 'hash').resolves('hashed_new_password');
      
      // 调用控制器方法
      await authController.updatePassword(req, res, next);
      
      // 验证结果
      expect(user.validatePassword.calledWith(req.body.currentPassword)).to.be.true;
      expect(user.save.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('密码更新成功');
    });
    
    it('用户不存在时应返回404错误', async () => {
      // 模拟请求参数
      req.body = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      };
      
      // 模拟User.findByPk - 用户不存在
      sinon.stub(User, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await authController.updatePassword(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('用户不存在');
    });
    
    it('当前密码错误时应返回401错误', async () => {
      // 模拟请求参数
      req.body = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      };
      
      // 模拟查询结果 - 找到用户但当前密码不匹配
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_old_password',
        validatePassword: sinon.stub().resolves(false)
      };
      
      // 模拟User.findByPk
      sinon.stub(User, 'findByPk').resolves(user);
      
      // 调用控制器方法
      await authController.updatePassword(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('当前密码不正确');
    });
    
    it('新密码和确认密码不匹配时应返回400错误', async () => {
      // 模拟请求参数
      req.body = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'DifferentNewPassword123'
      };
      
      // 调用控制器方法
      await authController.updatePassword(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('新密码和确认密码不匹配');
    });
  });
}); 
// 移除Chai和Sinon依赖
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
}));

// 导入被测试模块
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../../src/models');
const authController = require('../../../src/controllers/authController');
const { ApiError } = require('../../../src/utils/errorHandler');

// 模拟logger
jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn()
}));

const logger = require('../../../src/utils/logger');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // 创建请求和响应对象
    req = {
      body: {},
      user: { id: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // 重置所有模拟
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('应该成功注册用户并返回成功信息', async () => {
      // 设置请求体
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      };

      // 模拟用户不存在
      User.findOne.mockResolvedValue(null);

      // 模拟bcrypt
      bcrypt.genSalt = jest.fn().mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed_password');

      // 模拟创建用户
      User.create.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        avatar_url: null,
        created_at: '2023-01-01T00:00:00.000Z'
      });

      // 模拟JWT
      jwt.sign.mockReturnValue('test_token');

      // 调用控制器方法
      await authController.register(req, res, next);

      // 验证结果
      expect(User.findOne).toHaveBeenCalledTimes(2);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 'salt');
      expect(User.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user'
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1 },
        expect.anything(),
        { expiresIn: expect.anything() }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: '注册成功',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          avatarUrl: null,
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        token: 'test_token'
      });
    });

    it('当用户名已存在时应返回409错误', async () => {
      // 设置请求体
      req.body = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'Password123'
      };

      // 模拟用户名已存在
      User.findOne.mockResolvedValueOnce({
        id: 1,
        username: 'existinguser'
      });

      // 调用控制器方法
      await authController.register(req, res, next);

      // 验证结果
      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'existinguser' } });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 409,
        message: '用户名已存在'
      }));
    });

    it('当邮箱已存在时应返回409错误', async () => {
      // 设置请求体
      req.body = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'Password123'
      };

      // 模拟用户名不存在但邮箱已存在
      User.findOne.mockResolvedValueOnce(null);
      User.findOne.mockResolvedValueOnce({
        id: 1,
        email: 'existing@example.com'
      });

      // 调用控制器方法
      await authController.register(req, res, next);

      // 验证结果
      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'existing@example.com' } });
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 409,
        message: '邮箱已被注册'
      }));
    });

    it('当数据库操作失败时应调用next并传递错误', async () => {
      // 设置请求体
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      };

      // 模拟数据库错误
      const dbError = new Error('数据库错误');
      User.findOne.mockRejectedValue(dbError);

      // 调用控制器方法
      await authController.register(req, res, next);

      // 验证结果
      expect(User.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  describe('login', () => {
    it('应该成功登录用户并返回JWT令牌', async () => {
      // 设置请求体
      req.body = {
        email: 'test@example.com',
        password: 'Password123'
      };

      // 模拟用户存在
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        avatar_url: null,
        created_at: '2023-01-01T00:00:00.000Z',
        validatePassword: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockResolvedValue(mockUser);

      // 模拟JWT
      jwt.sign.mockReturnValue('test_token');

      // 调用控制器方法
      await authController.login(req, res, next);

      // 验证结果
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockUser.validatePassword).toHaveBeenCalledWith('Password123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1 },
        expect.anything(),
        { expiresIn: expect.anything() }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: '登录成功',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          avatarUrl: null,
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        token: 'test_token'
      });
    });

    it('当用户不存在时应返回401错误', async () => {
      // 设置请求体
      req.body = {
        email: 'nonexistent@example.com',
        password: 'Password123'
      };

      // 模拟用户不存在
      User.findOne.mockResolvedValue(null);

      // 调用控制器方法
      await authController.login(req, res, next);

      // 验证结果
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
        message: '邮箱或密码不正确'
      }));
    });

    it('当密码不正确时应返回401错误', async () => {
      // 设置请求体
      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword123'
      };

      // 模拟用户存在但密码验证失败
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        validatePassword: jest.fn().mockResolvedValue(false)
      };
      User.findOne.mockResolvedValue(mockUser);

      // 调用控制器方法
      await authController.login(req, res, next);

      // 验证结果
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockUser.validatePassword).toHaveBeenCalledWith('WrongPassword123');
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
        message: '邮箱或密码不正确'
      }));
    });

    it('当JWT生成失败时应调用next并传递错误', async () => {
      // 设置请求体
      req.body = {
        email: 'test@example.com',
        password: 'Password123'
      };

      // 模拟用户存在
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        avatar_url: null,
        created_at: '2023-01-01T00:00:00.000Z',
        validatePassword: jest.fn().mockResolvedValue(true)
      };
      User.findOne.mockResolvedValue(mockUser);

      // 模拟JWT签名错误
      const jwtError = new Error('JWT签名失败');
      jwt.sign.mockImplementation(() => {
        throw jwtError;
      });

      // 调用控制器方法
      await authController.login(req, res, next);

      // 验证结果
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockUser.validatePassword).toHaveBeenCalledWith('Password123');
      expect(jwt.sign).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(jwtError);
    });
  });

  describe('getCurrentUser', () => {
    it('应该返回当前登录用户的信息', async () => {
      // 设置请求和user
      req.user = { id: 1 };

      // 模拟用户存在
      User.findByPk.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        avatar_url: 'avatar.jpg',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z'
      });

      // 调用控制器方法
      await authController.getCurrentUser(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          avatarUrl: 'avatar.jpg',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-02T00:00:00.000Z'
        }
      });
    });

    it('当用户不存在时应返回404错误', async () => {
      // 设置请求和userId
      req.user = { id: 999 };

      // 模拟用户不存在
      User.findByPk.mockResolvedValue(null);

      // 调用控制器方法
      await authController.getCurrentUser(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(999);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: '用户不存在'
      }));
    });

    it('当数据库操作失败时应调用next并传递错误', async () => {
      // 设置请求和userId
      req.user = { id: 1 };

      // 模拟数据库错误
      const dbError = new Error('数据库错误');
      User.findByPk.mockRejectedValue(dbError);

      // 调用控制器方法
      await authController.getCurrentUser(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(logger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });

  describe('updateCurrentUser', () => {
    it('应该成功更新用户信息', async () => {
      // 设置请求体和userId
      req.user = { id: 1 };
      req.body = {
        username: 'updateduser',
        email: 'updated@example.com',
        avatar_url: 'new-avatar.jpg'
      };

      // 模拟用户存在
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        avatar_url: 'avatar.jpg',
        role: 'user',
        updated_at: '2023-01-02T00:00:00.000Z',
        save: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUser);

      // 模拟 findOne 对于用户名和邮箱检查均返回 null (不存在)
      User.findOne.mockResolvedValue(null);

      // 调用控制器方法
      await authController.updateCurrentUser(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.username).toBe('updateduser');
      expect(mockUser.email).toBe('updated@example.com');
      expect(mockUser.avatar_url).toBe('new-avatar.jpg');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: '用户信息更新成功',
        user: {
          id: 1,
          username: 'updateduser',
          email: 'updated@example.com',
          role: 'user',
          avatarUrl: 'new-avatar.jpg',
          updatedAt: '2023-01-02T00:00:00.000Z'
        }
      });
    });

    it('当用户名已存在时应返回409错误', async () => {
      // 设置请求体和userId
      req.user = { id: 1 };
      req.body = {
        username: 'existinguser',
        email: 'updated@example.com'
      };

      // 模拟用户存在
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        save: jest.fn()
      };
      User.findByPk.mockResolvedValue(mockUser);

      // 模拟用户名已存在
      User.findOne.mockResolvedValueOnce({
        id: 2,
        username: 'existinguser'
      });

      // 调用控制器方法
      await authController.updateCurrentUser(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(User.findOne).toHaveBeenCalledWith({ where: { username: 'existinguser' } });
      expect(mockUser.save).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 409,
        message: '用户名已被使用'
      }));
    });

    it('当邮箱格式无效时应返回400错误', async () => {
      // 设置请求体和userId
      req.user = { id: 1 };
      req.body = {
        email: 'invalid-email'
      };

      // 模拟用户存在
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        save: jest.fn()
      };
      User.findByPk.mockResolvedValue(mockUser);

      // 调用控制器方法
      await authController.updateCurrentUser(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.save).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '邮箱格式无效' });
    });

    it('当邮箱已被注册时应返回400错误', async () => {
      // 设置请求体和userId
      req.user = { id: 1 };
      req.body = {
        email: 'existing@example.com'
      };

      // 模拟用户存在
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        save: jest.fn()
      };
      User.findByPk.mockResolvedValue(mockUser);

      // 模拟邮箱已存在
      User.findOne.mockResolvedValueOnce({
        id: 2,
        email: 'existing@example.com'
      });

      // 调用控制器方法
      await authController.updateCurrentUser(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'existing@example.com' } });
      expect(mockUser.save).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '邮箱已被注册' });
    });

    it('当用户不存在时应返回404错误', async () => {
      // 设置请求体和userId
      req.user = { id: 999 };
      req.body = {
        username: 'updateduser',
        email: 'updated@example.com',
        avatar_url: 'new-avatar.jpg'
      };

      // 模拟用户不存在
      User.findByPk.mockResolvedValue(null);

      // 调用控制器方法
      await authController.updateCurrentUser(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(999);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: '用户不存在'
      }));
    });

    it('当更新操作失败时应调用next并传递错误', async () => {
      // 设置请求体和userId
      req.user = { id: 1 };
      req.body = {
        username: 'updateduser',
        email: 'updated@example.com',
        avatar_url: 'new-avatar.jpg'
      };

      // 模拟用户存在但保存失败
      const saveError = new Error('保存失败');
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        avatar_url: 'avatar.jpg',
        save: jest.fn().mockRejectedValue(saveError)
      };
      
      User.findByPk.mockResolvedValue(mockUser);
      User.findOne.mockResolvedValue(null);

      // 调用控制器方法
      await authController.updateCurrentUser(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.save).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(saveError);
    });
  });

  describe('updatePassword', () => {
    it('应该成功更新用户密码', async () => {
      // 设置请求体和userId
      req.user = { id: 1 };
      req.body = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123'
      };

      // 模拟用户存在
      const mockUser = {
        id: 1,
        validatePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };
      User.findByPk.mockResolvedValue(mockUser);

      // 调用控制器方法
      await authController.updatePassword(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.validatePassword).toHaveBeenCalledWith('OldPassword123');
      expect(mockUser.password_hash).toBe('NewPassword123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: '密码更新成功' });
    });

    it('当用户不存在时应返回404错误', async () => {
      // 设置请求体和userId
      req.user = { id: 999 };
      req.body = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123'
      };

      // 模拟用户不存在
      User.findByPk.mockResolvedValue(null);

      // 调用控制器方法
      await authController.updatePassword(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(999);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 404,
        message: '用户不存在'
      }));
    });

    it('当当前密码不正确时应返回401错误', async () => {
      // 设置请求体和userId
      req.user = { id: 1 };
      req.body = {
        currentPassword: 'WrongPassword123',
        newPassword: 'NewPassword123'
      };

      // 模拟用户存在但密码验证失败
      const mockUser = {
        id: 1,
        validatePassword: jest.fn().mockResolvedValue(false),
        save: jest.fn()
      };
      User.findByPk.mockResolvedValue(mockUser);

      // 调用控制器方法
      await authController.updatePassword(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.validatePassword).toHaveBeenCalledWith('WrongPassword123');
      expect(mockUser.save).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
        message: '当前密码不正确'
      }));
    });

    it('当新密码强度不够时应返回400错误', async () => {
      // 设置请求体和userId
      req.user = { id: 1 };
      req.body = {
        currentPassword: 'OldPassword123',
        newPassword: 'weak'
      };

      // 模拟用户存在
      const mockUser = {
        id: 1,
        validatePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn()
      };
      User.findByPk.mockResolvedValue(mockUser);

      // 调用控制器方法
      await authController.updatePassword(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.validatePassword).toHaveBeenCalledWith('OldPassword123');
      expect(mockUser.save).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: '新密码必须至少8个字符，包含数字、小写字母和大写字母' 
      });
    });

    it('当更新密码时出现错误应调用next并传递错误', async () => {
      // 设置请求体和userId
      req.user = { id: 1 };
      req.body = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123'
      };

      // 模拟用户存在但保存失败
      const saveError = new Error('保存失败');
      const mockUser = {
        id: 1,
        validatePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockRejectedValue(saveError)
      };
      User.findByPk.mockResolvedValue(mockUser);

      // 调用控制器方法
      await authController.updatePassword(req, res, next);

      // 验证结果
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.validatePassword).toHaveBeenCalledWith('OldPassword123');
      expect(mockUser.password_hash).toBe('NewPassword123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(saveError);
    });
  });
}); 
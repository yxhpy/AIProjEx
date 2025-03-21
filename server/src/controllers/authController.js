const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/auth.config');
const { validateEmail, validatePassword } = require('../utils/validators');
const bcrypt = require('bcryptjs');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// 注册新用户
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return res.status(400).json({ message: '邮箱格式无效' });
    }

    // 验证密码强度
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: '密码必须至少8个字符，包含数字、小写字母和大写字母' 
      });
    }

    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new ApiError(409, '用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new ApiError(409, '邮箱已被注册');
    }

    // 创建新用户
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      role: 'user'
    });

    // 生成JWT令牌
    const token = jwt.sign({ id: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiration
    });

    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    logger.error('注册失败', { error });
    next(error);
  }
};

// 用户登录
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new ApiError(401, '邮箱或密码不正确');
    }

    // 验证密码
    const passwordIsValid = await user.validatePassword(password);
    if (!passwordIsValid) {
      throw new ApiError(401, '邮箱或密码不正确');
    }

    // 生成JWT令牌
    const token = jwt.sign({ id: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiration
    });

    res.status(200).json({
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    logger.error('登录失败', { error });
    next(error);
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 查找用户
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    logger.error('获取用户信息失败', { error });
    next(error);
  }
};

// 更新当前用户信息
exports.updateCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, email, avatar_url } = req.body;

    // 查找用户
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    // 检查是否有其他用户使用相同的用户名（如果提供了新用户名）
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        throw new ApiError(409, '用户名已被使用');
      }
      user.username = username;
    }

    // 检查是否有其他用户使用相同的邮箱（如果提供了新邮箱）
    if (email && email !== user.email) {
      // 验证邮箱格式
      if (!validateEmail(email)) {
        return res.status(400).json({ message: '邮箱格式无效' });
      }

      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ message: '邮箱已被注册' });
      }
      user.email = email;
    }

    // 更新头像URL（如果提供）
    if (avatar_url) {
      user.avatar_url = avatar_url;
    }

    // 保存更新
    await user.save();

    res.status(200).json({
      message: '用户信息更新成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    logger.error('更新用户信息失败', { error });
    next(error);
  }
};

// 更新密码
exports.updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // 查找用户
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError(404, '用户不存在');
    }

    // 验证当前密码
    const passwordIsValid = await user.validatePassword(currentPassword);
    if (!passwordIsValid) {
      throw new ApiError(401, '当前密码不正确');
    }

    // 验证新密码强度
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        message: '新密码必须至少8个字符，包含数字、小写字母和大写字母' 
      });
    }

    // 更新密码
    user.password_hash = newPassword;
    await user.save();

    res.status(200).json({ message: '密码更新成功' });
  } catch (error) {
    logger.error('更新密码失败', { error });
    next(error);
  }
}; 
const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authJwt');
const validator = require('../middlewares/validator');

const router = express.Router();

/**
 * @route POST /api/v1/auth/register
 * @desc 用户注册
 * @access Public
 */
router.post(
  '/register',
  validator.validate(validator.registerSchema),
  authController.register
);

/**
 * @route POST /api/v1/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post(
  '/login',
  validator.validate(validator.loginSchema),
  authController.login
);

/**
 * @route GET /api/v1/auth/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get(
  '/me',
  verifyToken,
  authController.getCurrentUser
);

/**
 * @route PUT /api/v1/auth/me
 * @desc 更新当前用户信息
 * @access Private
 */
router.put(
  '/me',
  verifyToken,
  validator.validate(validator.updateUserSchema),
  authController.updateCurrentUser
);

/**
 * @route PUT /api/v1/auth/change-password
 * @desc 更新密码
 * @access Private
 */
router.put(
  '/change-password',
  verifyToken,
  validator.validate(validator.updatePasswordSchema),
  authController.updatePassword
);

module.exports = router; 
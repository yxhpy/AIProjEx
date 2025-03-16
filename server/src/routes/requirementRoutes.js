const express = require('express');
const router = express.Router();
const requirementController = require('../controllers/requirementController');
const { authenticate } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { body } = require('express-validator');

// 验证需求输入
const validateRequirement = [
  body('title')
    .notEmpty().withMessage('标题不能为空')
    .isLength({ max: 200 }).withMessage('标题最多200个字符'),
  body('description')
    .optional(),
  body('priority')
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('优先级无效'),
  body('status')
    .isIn(['draft', 'review', 'approved', 'rejected', 'implemented']).withMessage('状态无效'),
  body('acceptance_criteria')
    .optional()
];

// 获取项目的需求列表
router.get('/projects/:projectId/requirements', authenticate, requirementController.getRequirementsByProject);

// 获取单个需求详情
router.get('/requirements/:id', authenticate, requirementController.getRequirementById);

// 创建新需求
router.post(
  '/projects/:projectId/requirements', 
  authenticate, 
  validateRequirement,
  validate,
  requirementController.createRequirement
);

// 更新需求
router.put(
  '/requirements/:id', 
  authenticate, 
  validateRequirement,
  validate,
  requirementController.updateRequirement
);

// 删除需求
router.delete('/requirements/:id', authenticate, requirementController.deleteRequirement);

module.exports = router; 
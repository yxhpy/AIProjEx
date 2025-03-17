const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// 所有任务路由都需要认证
router.use(authenticate);

// 获取任务列表（按项目或需求筛选）
router.get('/', taskController.getTasks);

// 获取单个任务详情
router.get('/:id', taskController.getTaskById);

// 创建新任务
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('任务标题不能为空'),
    body('description').optional(),
    body('status').isIn(['todo', 'in_progress', 'review', 'done']).withMessage('无效的任务状态'),
    body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('无效的任务优先级'),
    body('estimated_hours').optional().isNumeric().withMessage('预计工时必须是数字'),
    body('start_date').optional().isISO8601().withMessage('无效的开始日期格式'),
    body('due_date').optional().isISO8601().withMessage('无效的截止日期格式'),
    body('project_id').optional().isInt().withMessage('项目ID必须是整数'),
    body('requirement_id').optional().isInt().withMessage('需求ID必须是整数'),
    body('assignee_id').optional().isInt().withMessage('负责人ID必须是整数'),
    body('dependencies').optional().isArray().withMessage('依赖项必须是数组')
  ],
  taskController.createTask
);

// 更新任务
router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('任务标题不能为空'),
    body('description').optional(),
    body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']).withMessage('无效的任务状态'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('无效的任务优先级'),
    body('estimated_hours').optional().isNumeric().withMessage('预计工时必须是数字'),
    body('actual_hours').optional().isNumeric().withMessage('实际工时必须是数字'),
    body('start_date').optional().isISO8601().withMessage('无效的开始日期格式'),
    body('due_date').optional().isISO8601().withMessage('无效的截止日期格式'),
    body('assignee_id').optional().isInt().withMessage('负责人ID必须是整数'),
    body('dependencies').optional().isArray().withMessage('依赖项必须是数组')
  ],
  taskController.updateTask
);

// 删除任务
router.delete('/:id', taskController.deleteTask);

// 批量更新任务状态
router.patch(
  '/status',
  [
    body('taskIds').isArray().withMessage('任务ID必须是数组'),
    body('status').isIn(['todo', 'in_progress', 'review', 'done']).withMessage('无效的任务状态')
  ],
  taskController.updateTasksStatus
);

// 获取项目的任务统计信息
router.get('/stats/:projectId', taskController.getTaskStats);

module.exports = router; 
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/authMiddleware');

// 所有仪表盘路由都需要认证
router.use(authenticate);

// 获取仪表盘统计信息
router.get('/stats', dashboardController.getDashboardStats);

// 获取项目统计信息
router.get('/projects/:id/stats', dashboardController.getProjectStats);

// 获取项目活动记录
router.get('/projects/:id/activities', dashboardController.getProjectActivities);

// 获取任务分布统计
router.get('/tasks/distribution', dashboardController.getTaskDistribution);

// 获取团队活动统计
router.get('/team/activities', dashboardController.getTeamActivities);

module.exports = router; 
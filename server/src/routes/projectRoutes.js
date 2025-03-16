const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middlewares/authMiddleware');

// 所有项目路由都需要认证
router.use(authenticate);

// 项目列表
router.get('/', projectController.getProjects);

// 创建项目
router.post('/', projectController.createProject);

// 获取项目详情
router.get('/:id', projectController.getProjectById);

// 更新项目
router.put('/:id', projectController.updateProject);

// 删除项目
router.delete('/:id', projectController.deleteProject);

// 获取项目成员列表
router.get('/:id/members', projectController.getProjectMembers);

// 添加项目成员
router.post('/:id/members', projectController.addProjectMember);

// 移除项目成员
router.delete('/:id/members/:userId', projectController.removeProjectMember);

module.exports = router; 
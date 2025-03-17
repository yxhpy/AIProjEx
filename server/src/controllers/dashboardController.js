const { Project, User, ProjectMember } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * 获取仪表盘统计信息
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户参与的项目数量
    const projectCount = await ProjectMember.count({
      where: { user_id: userId }
    });

    // 获取进行中的任务数量（模拟数据，实际需要任务模型）
    const inProgressTasks = 8;
    
    // 获取已完成的任务数量（模拟数据，实际需要任务模型）
    const completedTasks = 15;
    
    // 获取原型数量（模拟数据，实际需要原型模型）
    const prototypeCount = 4;

    res.json({
      totalProjects: projectCount,
      inProgressTasks,
      completedTasks,
      totalPrototypes: prototypeCount
    });
  } catch (error) {
    logger.error('获取仪表盘统计信息失败', { error });
    res.status(500).json({ message: '获取仪表盘统计信息失败' });
  }
};

/**
 * 获取项目统计信息
 */
exports.getProjectStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查项目是否存在
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: '项目不存在' });
    }
    
    // 检查用户是否有权限访问该项目
    const isMember = await ProjectMember.findOne({
      where: {
        project_id: id,
        user_id: req.user.id
      }
    });
    
    if (!isMember) {
      return res.status(403).json({ message: '无权访问该项目' });
    }
    
    // 获取项目成员数量
    const teamMembers = await ProjectMember.count({
      where: { project_id: id }
    });
    
    // 模拟任务数据（实际需要任务模型）
    const totalTasks = 24;
    const completedTasks = 10;
    const pendingTasks = 14;
    const progress = 42; // 百分比
    
    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      progress,
      teamMembers
    });
  } catch (error) {
    logger.error('获取项目统计信息失败', { error });
    res.status(500).json({ message: '获取项目统计信息失败' });
  }
};

/**
 * 获取项目活动记录
 */
exports.getProjectActivities = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查项目是否存在
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: '项目不存在' });
    }
    
    // 检查用户是否有权限访问该项目
    const isMember = await ProjectMember.findOne({
      where: {
        project_id: id,
        user_id: req.user.id
      }
    });
    
    if (!isMember) {
      return res.status(403).json({ message: '无权访问该项目' });
    }
    
    // 模拟活动数据（实际需要活动模型）
    const activities = [
      { id: 1, type: 'task_completed', user: '张三', description: '完成了任务"设计登录页面"', timestamp: '2023-10-15T14:30:00' },
      { id: 2, type: 'comment_added', user: '李四', description: '在任务"实现用户认证"中添加了评论', timestamp: '2023-10-14T10:15:00' },
      { id: 3, type: 'member_joined', user: '王五', description: '加入了项目团队', timestamp: '2023-10-13T09:00:00' },
      { id: 4, type: 'task_created', user: '赵六', description: '创建了新任务"实现数据库连接"', timestamp: '2023-10-12T16:45:00' }
    ];
    
    res.json(activities);
  } catch (error) {
    logger.error('获取项目活动记录失败', { error });
    res.status(500).json({ message: '获取项目活动记录失败' });
  }
};

/**
 * 获取任务分布统计
 */
exports.getTaskDistribution = async (req, res) => {
  try {
    // 模拟任务分布数据（实际需要任务模型）
    const distribution = {
      'not_started': 5,
      'in_progress': 8,
      'completed': 15,
      'blocked': 2,
      'cancelled': 1
    };
    
    res.json(distribution);
  } catch (error) {
    logger.error('获取任务分布统计失败', { error });
    res.status(500).json({ message: '获取任务分布统计失败' });
  }
};

/**
 * 获取团队活动统计
 */
exports.getTeamActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取用户参与的项目
    const userProjects = await ProjectMember.findAll({
      where: { user_id: userId },
      attributes: ['project_id']
    });
    
    const projectIds = userProjects.map(p => p.project_id);
    
    // 获取这些项目的所有成员
    const projectMembers = await ProjectMember.findAll({
      where: {
        project_id: {
          [Op.in]: projectIds
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatar_url']
        }
      ]
    });
    
    // 模拟成员贡献数据（实际需要活动或贡献模型）
    const members = [
      { id: 1, name: '张三', role: 'owner', contributions: 24, avatar: '' },
      { id: 2, name: '李四', role: 'admin', contributions: 18, avatar: '' },
      { id: 3, name: '王五', role: 'member', contributions: 12, avatar: '' },
      { id: 4, name: '赵六', role: 'member', contributions: 8, avatar: '' },
      { id: 5, name: '钱七', role: 'viewer', contributions: 3, avatar: '' }
    ];
    
    res.json(members);
  } catch (error) {
    logger.error('获取团队活动统计失败', { error });
    res.status(500).json({ message: '获取团队活动统计失败' });
  }
}; 
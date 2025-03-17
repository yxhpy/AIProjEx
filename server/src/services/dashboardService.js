const { Project, Task, User, Requirement, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * 获取仪表盘统计数据
 */
exports.getDashboardStats = async (userId) => {
  try {
    // 获取用户参与的项目数量
    const projectCount = await Project.count({
      include: {
        model: User,
        as: 'members',
        where: { id: userId },
        attributes: []
      }
    });

    // 获取用户的任务数量
    const taskCount = await Task.count({
      where: {
        assignee_id: userId
      }
    });

    // 获取用户的未完成任务数量
    const pendingTaskCount = await Task.count({
      where: {
        assignee_id: userId,
        status: {
          [Op.notIn]: ['completed', 'cancelled']
        }
      }
    });

    return {
      projectCount,
      taskCount,
      pendingTaskCount
    };
  } catch (error) {
    logger.error('获取仪表盘统计数据失败', { error });
    throw error;
  }
};

/**
 * 获取项目统计数据
 */
exports.getProjectStats = async (projectId) => {
  try {
    // 获取项目信息
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'avatar_url']
        }
      ]
    });

    if (!project) {
      throw new Error('项目不存在');
    }

    // 获取项目任务统计
    const taskStats = await Task.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { project_id: projectId },
      group: ['status']
    });

    // 获取项目需求统计
    const requirementStats = await Requirement.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { project_id: projectId },
      group: ['status']
    });

    return {
      project,
      taskStats: taskStats.map(stat => ({
        status: stat.status,
        count: parseInt(stat.getDataValue('count'))
      })),
      requirementStats: requirementStats.map(stat => ({
        status: stat.status,
        count: parseInt(stat.getDataValue('count'))
      }))
    };
  } catch (error) {
    logger.error('获取项目统计数据失败', { error });
    throw error;
  }
};

/**
 * 获取项目活动数据
 */
exports.getProjectActivities = async (projectId, limit = 10) => {
  try {
    // 获取最近更新的任务
    const recentTasks = await Task.findAll({
      where: { project_id: projectId },
      order: [['updated_at', 'DESC']],
      limit,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'avatar_url']
        },
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'username', 'avatar_url']
        }
      ]
    });

    // 获取最近更新的需求
    const recentRequirements = await Requirement.findAll({
      where: { project_id: projectId },
      order: [['updated_at', 'DESC']],
      limit,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'avatar_url']
        }
      ]
    });

    // 合并活动并按更新时间排序
    const activities = [
      ...recentTasks.map(task => ({
        type: 'task',
        id: task.id,
        title: task.title,
        status: task.status,
        updatedAt: task.updated_at,
        user: task.assignee
      })),
      ...recentRequirements.map(req => ({
        type: 'requirement',
        id: req.id,
        title: req.title,
        status: req.status,
        updatedAt: req.updated_at,
        user: req.creator
      }))
    ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, limit);

    return activities;
  } catch (error) {
    logger.error('获取项目活动数据失败', { error });
    throw error;
  }
};

/**
 * 获取任务分布数据
 */
exports.getTaskDistribution = async (projectId) => {
  try {
    // 获取项目成员
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'avatar_url']
        }
      ]
    });

    if (!project) {
      throw new Error('项目不存在');
    }

    // 获取每个成员的任务数量
    const memberIds = project.members.map(member => member.id);
    
    const taskDistribution = await Task.findAll({
      attributes: [
        'assignee_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'taskCount']
      ],
      where: { 
        project_id: projectId,
        assignee_id: {
          [Op.in]: memberIds
        }
      },
      group: ['assignee_id']
    });

    // 将结果与成员信息合并
    const result = project.members.map(member => {
      const memberStats = taskDistribution.find(t => t.assignee_id === member.id);
      return {
        id: member.id,
        username: member.username,
        avatar_url: member.avatar_url,
        taskCount: memberStats ? parseInt(memberStats.getDataValue('taskCount')) : 0
      };
    });

    return result;
  } catch (error) {
    logger.error('获取任务分布数据失败', { error });
    throw error;
  }
};

/**
 * 获取团队活动数据
 */
exports.getTeamActivities = async (projectId, limit = 10) => {
  try {
    // 获取项目成员
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'avatar_url']
        }
      ]
    });

    if (!project) {
      throw new Error('项目不存在');
    }

    // 获取成员ID列表
    const memberIds = project.members.map(member => member.id);

    // 获取成员最近完成的任务
    const completedTasks = await Task.findAll({
      where: { 
        project_id: projectId,
        assignee_id: {
          [Op.in]: memberIds
        },
        status: 'completed'
      },
      order: [['updated_at', 'DESC']],
      limit: limit * 2, // 获取更多数据以便筛选
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'avatar_url']
        }
      ]
    });

    // 按成员分组并获取每个成员的最新活动
    const memberActivities = {};
    
    completedTasks.forEach(task => {
      const memberId = task.assignee_id;
      if (!memberActivities[memberId] || 
          new Date(task.updated_at) > new Date(memberActivities[memberId].updated_at)) {
        memberActivities[memberId] = {
          type: 'task_completed',
          taskId: task.id,
          taskTitle: task.title,
          memberId: memberId,
          memberName: task.assignee.username,
          memberAvatar: task.assignee.avatar_url,
          updated_at: task.updated_at
        };
      }
    });

    // 转换为数组并排序
    const activities = Object.values(memberActivities)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, limit);

    return activities;
  } catch (error) {
    logger.error('获取团队活动数据失败', { error });
    throw error;
  }
}; 
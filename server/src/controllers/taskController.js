const { Task, User, Project, Requirement } = require('../models');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * 获取项目或需求下的所有任务
 */
exports.getTasks = async (req, res, next) => {
  try {
    const { projectId, requirementId } = req.query;
    const where = {};
    
    if (projectId) {
      where.project_id = projectId;
    }
    
    if (requirementId) {
      where.requirement_id = requirementId;
    }
    
    // 没有提供过滤条件时返回错误
    if (!projectId && !requirementId) {
      return res.status(400).json({ message: '必须提供projectId或requirementId' });
    }
    
    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        },
        {
          model: Requirement,
          as: 'requirement',
          attributes: ['id', 'title']
        }
      ],
      order: [
        ['status', 'ASC'],
        ['priority', 'DESC'],
        ['due_date', 'ASC'],
        ['created_at', 'DESC']
      ]
    });
    
    res.json(tasks);
  } catch (error) {
    logger.error('获取任务列表失败', { error });
    res.status(500).json({ message: '获取任务列表失败' });
  }
};

/**
 * 获取单个任务详情
 */
exports.getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        },
        {
          model: Requirement,
          as: 'requirement',
          attributes: ['id', 'title']
        }
      ]
    });
    
    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    res.json(task);
  } catch (error) {
    logger.error('获取任务详情失败', { error });
    res.status(500).json({ message: '获取任务详情失败' });
  }
};

/**
 * 创建新任务
 */
exports.createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      title,
      description,
      status,
      priority,
      estimated_hours,
      start_date,
      due_date,
      project_id,
      requirement_id,
      assignee_id,
      dependencies
    } = req.body;
    
    // 验证项目存在性
    if (project_id) {
      const project = await Project.findByPk(project_id);
      if (!project) {
        return res.status(404).json({ message: '项目不存在' });
      }
    }
    
    // 验证需求存在性
    if (requirement_id) {
      const requirement = await Requirement.findByPk(requirement_id);
      if (!requirement) {
        return res.status(404).json({ message: '需求不存在' });
      }
    }
    
    // 验证任务负责人存在性
    if (assignee_id) {
      const assignee = await User.findByPk(assignee_id);
      if (!assignee) {
        return res.status(404).json({ message: '指定的任务负责人不存在' });
      }
    }
    
    // 创建任务
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      estimated_hours,
      start_date,
      due_date,
      project_id,
      requirement_id,
      assignee_id,
      creator_id: req.user.id, // 从JWT中获取当前用户ID
      dependencies: dependencies || []
    });
    
    // 重新查询任务以获取关联数据
    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        },
        {
          model: Requirement,
          as: 'requirement',
          attributes: ['id', 'title']
        }
      ]
    });
    
    res.status(201).json(createdTask);
  } catch (error) {
    logger.error('创建任务失败', { error });
    res.status(500).json({ message: '创建任务失败' });
  }
};

/**
 * 更新任务
 */
exports.updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    
    // 查找任务
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    const {
      title,
      description,
      status,
      priority,
      estimated_hours,
      actual_hours,
      start_date,
      due_date,
      assignee_id,
      dependencies
    } = req.body;
    
    // 如果状态变为"done"，自动设置完成日期
    let completed_date = task.completed_date;
    if (status === 'done' && task.status !== 'done') {
      completed_date = new Date();
    } else if (status !== 'done' && task.status === 'done') {
      completed_date = null;
    }
    
    // 验证任务负责人存在性
    if (assignee_id && assignee_id !== task.assignee_id) {
      const assignee = await User.findByPk(assignee_id);
      if (!assignee) {
        return res.status(404).json({ message: '指定的任务负责人不存在' });
      }
    }
    
    // 更新任务
    await task.update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      status: status || task.status,
      priority: priority || task.priority,
      estimated_hours: estimated_hours !== undefined ? estimated_hours : task.estimated_hours,
      actual_hours: actual_hours !== undefined ? actual_hours : task.actual_hours,
      start_date: start_date !== undefined ? start_date : task.start_date,
      due_date: due_date !== undefined ? due_date : task.due_date,
      completed_date,
      assignee_id: assignee_id !== undefined ? assignee_id : task.assignee_id,
      dependencies: dependencies || task.dependencies
    });
    
    // 重新查询任务以获取关联数据
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name']
        },
        {
          model: Requirement,
          as: 'requirement',
          attributes: ['id', 'title']
        }
      ]
    });
    
    res.json(updatedTask);
  } catch (error) {
    logger.error('更新任务失败', { error });
    res.status(500).json({ message: '更新任务失败' });
  }
};

/**
 * 删除任务
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 查找任务
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: '任务不存在' });
    }
    
    // 删除任务
    await task.destroy();
    
    res.json({ message: '任务已成功删除' });
  } catch (error) {
    logger.error('删除任务失败', { error });
    res.status(500).json({ message: '删除任务失败' });
  }
};

/**
 * 批量更新任务状态
 */
exports.updateTasksStatus = async (req, res, next) => {
  try {
    const { taskIds, status } = req.body;
    
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: '必须提供有效的任务ID数组' });
    }
    
    if (!['todo', 'in_progress', 'review', 'done'].includes(status)) {
      return res.status(400).json({ message: '无效的任务状态' });
    }
    
    // 为"done"状态设置完成日期
    const completed_date = status === 'done' ? new Date() : null;
    
    // 批量更新任务
    await Task.update(
      {
        status,
        completed_date: status === 'done' ? completed_date : null
      },
      {
        where: {
          id: taskIds
        }
      }
    );
    
    res.json({ message: `已成功将${taskIds.length}个任务更新为${status}状态` });
  } catch (error) {
    logger.error('批量更新任务状态失败', { error });
    res.status(500).json({ message: '批量更新任务状态失败' });
  }
};

/**
 * 获取任务统计信息
 */
exports.getTaskStats = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    // 验证项目存在性
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: '项目不存在' });
    }
    
    // 获取项目所有任务
    const tasks = await Task.findAll({
      where: { project_id: projectId },
      attributes: ['status', 'priority']
    });
    
    // 统计各状态任务数量
    const statusCounts = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0
    };
    
    // 统计各优先级任务数量
    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };
    
    tasks.forEach(task => {
      statusCounts[task.status]++;
      priorityCounts[task.priority]++;
    });
    
    // 计算总任务数和完成率
    const totalTasks = tasks.length;
    const completedTasks = statusCounts.done;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    res.json({
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate * 100) / 100, // 保留两位小数
      statusCounts,
      priorityCounts
    });
  } catch (error) {
    logger.error('获取任务统计信息失败', { error });
    res.status(500).json({ message: '获取任务统计信息失败' });
  }
}; 
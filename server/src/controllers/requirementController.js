const { Requirement, Project, User } = require('../models');
const { Op } = require('sequelize');
const { ApiError, errorHandler } = require('../utils/errorHandler');

/**
 * 获取项目的需求列表
 */
exports.getRequirementsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, search } = req.query;
    
    // 构建查询条件
    let where = {
      project_id: projectId
    };
    
    // 添加状态过滤
    if (status) {
      where.status = status;
    }
    
    // 添加优先级过滤
    if (priority) {
      where.priority = priority;
    }
    
    // 添加搜索功能
    if (search) {
      where = {
        ...where,
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ]
      };
    }
    
    // 获取需求列表
    const requirements = await Requirement.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'avatar_url']
        }
      ],
      order: [['updated_at', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: requirements
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

/**
 * 获取单个需求详情
 */
exports.getRequirementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const requirement = await Requirement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email', 'avatar_url']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status']
        }
      ]
    });
    
    if (!requirement) {
      throw new ApiError(404, '需求不存在');
    }
    
    return res.status(200).json({
      success: true,
      data: requirement
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

/**
 * 创建新需求
 */
exports.createRequirement = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, status, acceptance_criteria } = req.body;
    
    // 验证项目是否存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new ApiError(404, '项目不存在');
    }
    
    // 创建新需求
    const requirement = await Requirement.create({
      title,
      description,
      priority,
      status,
      acceptance_criteria,
      project_id: projectId,
      created_by: req.user.id
    });
    
    return res.status(201).json({
      success: true,
      message: '需求创建成功',
      data: requirement
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

/**
 * 更新需求
 */
exports.updateRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, acceptance_criteria } = req.body;
    
    // 查找需求
    const requirement = await Requirement.findByPk(id);
    if (!requirement) {
      throw new ApiError(404, '需求不存在');
    }
    
    // 更新需求信息
    await requirement.update({
      title,
      description,
      priority,
      status,
      acceptance_criteria
    });
    
    return res.status(200).json({
      success: true,
      message: '需求更新成功',
      data: requirement
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

/**
 * 删除需求
 */
exports.deleteRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找需求
    const requirement = await Requirement.findByPk(id);
    if (!requirement) {
      throw new ApiError(404, '需求不存在');
    }
    
    // 软删除需求
    await requirement.destroy();
    
    return res.status(200).json({
      success: true,
      message: '需求删除成功'
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}; 
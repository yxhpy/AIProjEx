const projectService = require('../services/projectService');
const { validateProject } = require('../utils/validators');

// 获取项目列表
exports.getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, sort = 'createdAt', order = 'desc' } = req.query;
    const userId = req.user.id;
    
    const result = await projectService.getProjects({
      userId,
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sort,
      order
    });
    
    return res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};

// 获取项目详情
exports.getProjectById = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    
    const project = await projectService.getProjectById(projectId, userId);
    
    if (!project) {
      return res.status(404).json({ message: '项目不存在或您没有权限访问' });
    }
    
    return res.status(200).json({ data: project });
  } catch (error) {
    next(error);
  }
};

// 创建项目
exports.createProject = async (req, res, next) => {
  try {
    const { error, value } = validateProject(req.body);
    
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const userId = req.user.id;
    const project = await projectService.createProject(value, userId);
    
    return res.status(201).json({ data: project });
  } catch (error) {
    next(error);
  }
};

// 更新项目
exports.updateProject = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    
    // 验证请求体
    const { error, value } = validateProject(req.body, true);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // 检查项目是否存在且用户是否有权限
    const existingProject = await projectService.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({ message: '项目不存在或您没有权限访问' });
    }
    
    // 检查用户是否是项目所有者
    if (existingProject.created_by !== userId) {
      return res.status(403).json({ message: '只有项目创建者可以更新项目信息' });
    }
    
    // 更新项目
    const updatedProject = await projectService.updateProject(projectId, value);
    
    return res.status(200).json({ data: updatedProject });
  } catch (error) {
    next(error);
  }
};

// 删除项目
exports.deleteProject = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    
    // 检查项目是否存在且用户是否有权限
    const existingProject = await projectService.getProjectById(projectId, userId);
    if (!existingProject) {
      return res.status(404).json({ message: '项目不存在或您没有权限访问' });
    }
    
    // 检查用户是否是项目所有者
    if (existingProject.created_by !== userId) {
      return res.status(403).json({ message: '只有项目创建者可以删除项目' });
    }
    
    // 删除项目
    await projectService.deleteProject(projectId);
    
    return res.status(200).json({ message: '项目已成功删除', data: { id: projectId } });
  } catch (error) {
    next(error);
  }
};

// 获取项目成员
exports.getProjectMembers = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    
    // 检查用户是否有权限访问项目
    const hasAccess = await projectService.checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return res.status(403).json({ message: '您没有权限访问此项目' });
    }
    
    const members = await projectService.getProjectMembers(projectId);
    
    return res.status(200).json({ data: members });
  } catch (error) {
    next(error);
  }
};

// 添加项目成员
exports.addProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { userId: memberUserId, role = 'member' } = req.body;
    const currentUserId = req.user.id;
    
    // 验证请求体
    if (!memberUserId) {
      return res.status(400).json({ message: '用户ID不能为空' });
    }
    
    // 检查当前用户是否是项目所有者
    const isOwner = await projectService.isProjectOwner(projectId, currentUserId);
    if (!isOwner) {
      return res.status(403).json({ message: '只有项目所有者可以添加成员' });
    }
    
    // 添加成员
    const member = await projectService.addProjectMember(projectId, memberUserId, role);
    
    return res.status(201).json({ data: member });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: '该用户已经是项目成员' });
    }
    next(error);
  }
};

// 移除项目成员
exports.removeProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const memberId = req.params.userId;
    
    // 不能移除自己（项目拥有者）
    if (memberId === userId) {
      return res.status(400).json({ message: '项目拥有者不能被移除' });
    }
    
    // 检查调用者是否为项目拥有者
    const isOwner = await projectService.isProjectOwner(projectId, userId);
    
    if (!isOwner) {
      return res.status(403).json({ message: '只有项目拥有者可以移除成员' });
    }
    
    const result = await projectService.removeProjectMember(projectId, memberId, userId);
    
    if (!result) {
      return res.status(404).json({ 
        message: '项目不存在、成员不存在或您没有权限移除成员' 
      });
    }
    
    return res.status(200).json({ message: '成员已成功移除' });
  } catch (error) {
    next(error);
  }
}; 
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
    
    return res.status(200).json(result);
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
    
    return res.status(200).json(project);
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
    
    return res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// 更新项目
exports.updateProject = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    
    const { error, value } = validateProject(req.body, true);
    
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const updatedProject = await projectService.updateProject(projectId, value, userId);
    
    if (!updatedProject) {
      return res.status(404).json({ message: '项目不存在或您没有权限修改' });
    }
    
    return res.status(200).json(updatedProject);
  } catch (error) {
    next(error);
  }
};

// 删除项目
exports.deleteProject = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    
    const result = await projectService.deleteProject(projectId, userId);
    
    if (!result) {
      return res.status(404).json({ message: '项目不存在或您没有权限删除' });
    }
    
    return res.status(200).json({ message: '项目已成功删除' });
  } catch (error) {
    next(error);
  }
};

// 获取项目成员列表
exports.getProjectMembers = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    
    const members = await projectService.getProjectMembers(projectId, userId);
    
    if (!members) {
      return res.status(404).json({ message: '项目不存在或您没有权限查看成员' });
    }
    
    return res.status(200).json(members);
  } catch (error) {
    next(error);
  }
};

// 添加项目成员
exports.addProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { userId, role } = req.body;
    const currentUserId = req.user.id;
    
    if (!userId || !role) {
      return res.status(400).json({ message: '用户ID和角色不能为空' });
    }
    
    const result = await projectService.addProjectMember(projectId, userId, role, currentUserId);
    
    if (!result) {
      return res.status(404).json({ message: '项目不存在、您没有权限添加成员或用户已存在于项目中' });
    }
    
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// 移除项目成员
exports.removeProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const memberUserId = req.params.userId;
    const currentUserId = req.user.id;
    
    const result = await projectService.removeProjectMember(projectId, memberUserId, currentUserId);
    
    if (!result) {
      return res.status(404).json({ message: '项目不存在、成员不存在或您没有权限移除成员' });
    }
    
    return res.status(200).json({ message: '成员已成功移除' });
  } catch (error) {
    next(error);
  }
}; 
const { Project, User, ProjectMember, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取项目列表
 * @param {Object} options - 查询选项
 * @returns {Object} - 包含项目列表和分页信息的对象
 */
exports.getProjects = async (options) => {
  const { userId, page, limit, status, sort, order } = options;
  
  // 构建查询条件
  const where = {};
  if (status) {
    where.status = status;
  }
  
  // 查询用户有权限访问的项目
  const { rows, count } = await Project.findAndCountAll({
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'email', 'avatar_url']
      },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'username', 'email', 'avatar_url'],
        through: {
          attributes: ['role', 'joined_at']
        },
        required: false
      }
    ],
    where,
    distinct: true,
    order: [[sort, order]],
    limit,
    offset: (page - 1) * limit,
    subQuery: false
  });
  
  // 过滤出用户有权限访问的项目
  const projects = rows.filter(project => {
    // 创建者可以访问
    if (project.created_by === userId) return true;
    
    // 项目成员可以访问
    const isMember = project.members.some(member => member.id === userId);
    return isMember;
  });
  
  return {
    projects,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
};

/**
 * 获取项目详情
 * @param {string} projectId - 项目ID
 * @param {string} userId - 用户ID
 * @returns {Object|null} - 项目详情或null
 */
exports.getProjectById = async (projectId, userId) => {
  const project = await Project.findByPk(projectId, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'email', 'avatar_url']
      },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'username', 'email', 'avatar_url'],
        through: {
          attributes: ['role', 'joined_at']
        }
      }
    ]
  });
  
  if (!project) return null;
  
  // 检查用户是否有权限访问该项目
  const isCreator = project.created_by === userId;
  const isMember = project.members.some(member => member.id === userId);
  
  if (!isCreator && !isMember) return null;
  
  return project;
};

/**
 * 创建项目
 * @param {Object} projectData - 项目数据
 * @param {string} userId - 创建者ID
 * @returns {Object} - 创建的项目
 */
exports.createProject = async (projectData, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    // 创建项目
    const project = await Project.create({
      ...projectData,
      created_by: userId
    }, { transaction });
    
    // 将创建者添加为项目所有者
    await ProjectMember.create({
      project_id: project.id,
      user_id: userId,
      role: 'owner',
      joined_at: new Date()
    }, { transaction });
    
    await transaction.commit();
    
    // 返回包含创建者信息的项目
    return exports.getProjectById(project.id, userId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * 更新项目
 * @param {string} projectId - 项目ID
 * @param {Object} projectData - 项目更新数据
 * @param {string} userId - 用户ID
 * @returns {Object|null} - 更新后的项目或null
 */
exports.updateProject = async (projectId, projectData, userId) => {
  // 检查用户是否有权限更新项目
  const member = await ProjectMember.findOne({
    where: {
      project_id: projectId,
      user_id: userId,
      role: {
        [Op.in]: ['owner', 'admin']
      }
    }
  });
  
  if (!member) return null;
  
  // 更新项目
  await Project.update(projectData, {
    where: { id: projectId }
  });
  
  // 返回更新后的项目
  return exports.getProjectById(projectId, userId);
};

/**
 * 删除项目
 * @param {string} projectId - 项目ID
 * @param {string} userId - 用户ID
 * @returns {boolean} - 是否成功删除
 */
exports.deleteProject = async (projectId, userId) => {
  // 检查用户是否有权限删除项目
  const member = await ProjectMember.findOne({
    where: {
      project_id: projectId,
      user_id: userId,
      role: 'owner'
    }
  });
  
  if (!member) return false;
  
  // 软删除项目
  const result = await Project.destroy({
    where: { id: projectId }
  });
  
  return result > 0;
};

/**
 * 获取项目成员列表
 * @param {string} projectId - 项目ID
 * @param {string} userId - 用户ID
 * @returns {Array|null} - 成员列表或null
 */
exports.getProjectMembers = async (projectId, userId) => {
  // 检查用户是否有权限查看项目成员
  const project = await Project.findByPk(projectId);
  if (!project) return null;
  
  const member = await ProjectMember.findOne({
    where: {
      project_id: projectId,
      user_id: userId
    }
  });
  
  if (!member) return null;
  
  // 获取项目成员列表
  const members = await ProjectMember.findAll({
    where: { project_id: projectId },
    include: [
      {
        model: User,
        attributes: ['id', 'username', 'email', 'avatar_url']
      }
    ]
  });
  
  return members;
};

/**
 * 添加项目成员
 * @param {string} projectId - 项目ID
 * @param {string} newUserId - 新成员ID
 * @param {string} role - 成员角色
 * @param {string} currentUserId - 当前用户ID
 * @returns {Object|null} - 添加的成员或null
 */
exports.addProjectMember = async (projectId, newUserId, role, currentUserId) => {
  // 检查当前用户是否有权限添加成员
  const currentMember = await ProjectMember.findOne({
    where: {
      project_id: projectId,
      user_id: currentUserId,
      role: {
        [Op.in]: ['owner', 'admin']
      }
    }
  });
  
  if (!currentMember) return null;
  
  // 检查用户是否已经是项目成员
  const existingMember = await ProjectMember.findOne({
    where: {
      project_id: projectId,
      user_id: newUserId
    }
  });
  
  if (existingMember) return null;
  
  // 检查用户是否存在
  const user = await User.findByPk(newUserId);
  if (!user) return null;
  
  // 添加成员
  const member = await ProjectMember.create({
    project_id: projectId,
    user_id: newUserId,
    role,
    joined_at: new Date()
  });
  
  return {
    ...member.toJSON(),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url
    }
  };
};

/**
 * 移除项目成员
 * @param {string} projectId - 项目ID
 * @param {string} memberUserId - 要移除的成员ID
 * @param {string} currentUserId - 当前用户ID
 * @returns {boolean} - 是否成功移除
 */
exports.removeProjectMember = async (projectId, memberUserId, currentUserId) => {
  // 不能移除项目所有者
  const memberToRemove = await ProjectMember.findOne({
    where: {
      project_id: projectId,
      user_id: memberUserId
    }
  });
  
  if (!memberToRemove) return false;
  
  // 项目所有者不能被移除
  if (memberToRemove.role === 'owner') return false;
  
  // 检查当前用户是否有权限移除成员
  const currentMember = await ProjectMember.findOne({
    where: {
      project_id: projectId,
      user_id: currentUserId,
      role: {
        [Op.in]: ['owner', 'admin']
      }
    }
  });
  
  // 只有管理员和所有者可以移除成员，或者用户自己退出
  if (!currentMember && currentUserId !== memberUserId) return false;
  
  // 管理员不能移除其他管理员，只有所有者可以
  if (
    memberToRemove.role === 'admin' && 
    currentMember.role !== 'owner' && 
    currentUserId !== memberUserId
  ) {
    return false;
  }
  
  // 移除成员
  const result = await ProjectMember.destroy({
    where: {
      project_id: projectId,
      user_id: memberUserId
    }
  });
  
  return result > 0;
};

/**
 * 更新项目成员角色
 * @param {string} projectId - 项目ID
 * @param {string} memberUserId - 要更新的成员ID
 * @param {Object} updateData - 更新数据，包含role字段
 * @param {string} currentUserId - 当前用户ID
 * @returns {Object|null} - 更新后的成员或null
 */
exports.updateProjectMember = async (projectId, memberUserId, updateData, currentUserId) => {
  // 检查当前用户是否有权限更新成员
  const currentMember = await ProjectMember.findOne({
    where: {
      project_id: projectId,
      user_id: currentUserId,
      role: {
        [Op.in]: ['owner', 'admin']
      }
    }
  });
  
  if (!currentMember) return null;
  
  // 查找要更新的成员
  const memberToUpdate = await ProjectMember.findOne({
    where: {
      project_id: projectId,
      user_id: memberUserId
    }
  });
  
  if (!memberToUpdate) return null;
  
  // 不能更改owner角色
  if (memberToUpdate.role === 'owner') return null;
  
  // 只有owner可以更改admin角色
  if (
    memberToUpdate.role === 'admin' && 
    currentMember.role !== 'owner'
  ) {
    return null;
  }
  
  // 更新成员
  const updatedMember = await memberToUpdate.update(updateData);
  
  // 获取成员关联的用户信息
  const user = await User.findByPk(memberUserId);
  
  // 安全地获取更新后的成员数据
  const memberData = typeof updatedMember.toJSON === 'function' 
    ? updatedMember.toJSON() 
    : updatedMember;
  
  return {
    ...memberData,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url
    }
  };
}; 
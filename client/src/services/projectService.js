import api from './api';

/**
 * 获取项目列表
 * @param {Object} params - 查询参数
 * @returns {Promise} - 返回项目列表和分页信息
 */
export const getProjects = async (params = {}) => {
  const response = await api.get('/projects', { params });
  return response.data;
};

/**
 * 获取项目详情
 * @param {string} id - 项目ID
 * @returns {Promise} - 返回项目详情
 */
export const getProjectById = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

/**
 * 创建项目
 * @param {Object} projectData - 项目数据
 * @returns {Promise} - 返回创建的项目
 */
export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data;
};

/**
 * 更新项目
 * @param {string} id - 项目ID
 * @param {Object} projectData - 项目更新数据
 * @returns {Promise} - 返回更新后的项目
 */
export const updateProject = async (id, projectData) => {
  const response = await api.put(`/projects/${id}`, projectData);
  return response.data;
};

/**
 * 删除项目
 * @param {string} id - 项目ID
 * @returns {Promise} - 返回删除结果
 */
export const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

/**
 * 获取项目成员列表
 * @param {string} projectId - 项目ID
 * @returns {Promise} - 返回项目成员列表
 */
export const getProjectMembers = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/members`);
  return response.data;
};

/**
 * 添加项目成员
 * @param {string} projectId - 项目ID
 * @param {Object} memberData - 成员数据 {userId, role}
 * @returns {Promise} - 返回添加的成员
 */
export const addProjectMember = async (projectId, memberData) => {
  const response = await api.post(`/projects/${projectId}/members`, memberData);
  return response.data;
};

/**
 * 移除项目成员
 * @param {string} projectId - 项目ID
 * @param {string} userId - 用户ID
 * @returns {Promise} - 返回移除结果
 */
export const removeProjectMember = async (projectId, userId) => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
}; 
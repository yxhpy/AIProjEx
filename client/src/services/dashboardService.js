import api from './api';

/**
 * 获取仪表盘统计信息
 * @returns {Promise} 返回统计数据
 */
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('获取仪表盘统计信息失败:', error);
    throw error;
  }
};

/**
 * 获取项目统计信息
 * @param {string} projectId 项目ID
 * @returns {Promise} 返回项目统计数据
 */
export const getProjectStats = async (projectId) => {
  try {
    const response = await api.get(`/dashboard/projects/${projectId}/stats`);
    return response.data;
  } catch (error) {
    console.error(`获取项目(${projectId})统计信息失败:`, error);
    throw error;
  }
};

/**
 * 获取项目活动记录
 * @param {string} projectId 项目ID
 * @returns {Promise} 返回项目活动数据
 */
export const getProjectActivities = async (projectId) => {
  try {
    const response = await api.get(`/dashboard/projects/${projectId}/activities`);
    return response.data;
  } catch (error) {
    console.error(`获取项目(${projectId})活动记录失败:`, error);
    throw error;
  }
};

/**
 * 获取任务分布统计
 * @returns {Promise} 返回任务分布数据
 */
export const getTaskDistribution = async () => {
  try {
    const response = await api.get('/dashboard/tasks/distribution');
    return response.data;
  } catch (error) {
    console.error('获取任务分布统计失败:', error);
    throw error;
  }
};

/**
 * 获取团队活动统计
 * @returns {Promise} 返回团队活动数据
 */
export const getTeamActivities = async () => {
  try {
    const response = await api.get('/dashboard/team/activities');
    return response.data;
  } catch (error) {
    console.error('获取团队活动统计失败:', error);
    throw error;
  }
}; 
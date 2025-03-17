import API from './api';

/**
 * 任务服务
 * 处理与任务相关的API请求
 */
const taskService = {
  /**
   * 获取项目或需求下的任务列表
   * @param {Object} params - 查询参数
   * @param {number} params.projectId - 项目ID（可选）
   * @param {number} params.requirementId - 需求ID（可选）
   * @returns {Promise} 包含任务列表的Promise
   */
  getTasks: async (params) => {
    return API.get('/tasks', { params });
  },

  /**
   * 获取单个任务详情
   * @param {number} taskId - 任务ID
   * @returns {Promise} 包含任务详情的Promise
   */
  getTaskById: async (taskId) => {
    return API.get(`/tasks/${taskId}`);
  },

  /**
   * 创建新任务
   * @param {Object} taskData - 任务数据
   * @returns {Promise} 包含创建的任务的Promise
   */
  createTask: async (taskData) => {
    return API.post('/tasks', taskData);
  },

  /**
   * 更新任务
   * @param {number} taskId - 任务ID
   * @param {Object} taskData - 更新的任务数据
   * @returns {Promise} 包含更新后的任务的Promise
   */
  updateTask: async (taskId, taskData) => {
    return API.put(`/tasks/${taskId}`, taskData);
  },

  /**
   * 删除任务
   * @param {number} taskId - 任务ID
   * @returns {Promise} 包含操作结果的Promise
   */
  deleteTask: async (taskId) => {
    return API.delete(`/tasks/${taskId}`);
  },

  /**
   * 批量更新任务状态
   * @param {Array<number>} taskIds - 任务ID数组
   * @param {string} status - 新状态
   * @returns {Promise} 包含操作结果的Promise
   */
  updateTasksStatus: async (taskIds, status) => {
    return API.patch('/tasks/status', { taskIds, status });
  },

  /**
   * 获取项目的任务统计信息
   * @param {number} projectId - 项目ID
   * @returns {Promise} 包含任务统计信息的Promise
   */
  getTaskStats: async (projectId) => {
    return API.get(`/tasks/stats/${projectId}`);
  }
};

export default taskService; 
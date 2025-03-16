import api from './api';

/**
 * 需求服务
 * 提供与需求相关的API调用
 */
class RequirementService {
  /**
   * 获取项目的需求列表
   * @param {string} projectId - 项目ID
   * @param {Object} filters - 过滤条件
   * @returns {Promise} - 返回需求列表
   */
  async getRequirementsByProject(projectId, filters = {}) {
    const params = new URLSearchParams();
    
    // 添加过滤参数
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    
    const url = `/projects/${projectId}/requirements${params.toString() ? '?' + params.toString() : ''}`;
    const response = await api.get(url);
    return response.data;
  }

  /**
   * 获取需求详情
   * @param {string} id - 需求ID
   * @returns {Promise} - 返回需求详情
   */
  async getRequirementById(id) {
    const response = await api.get(`/requirements/${id}`);
    return response.data;
  }

  /**
   * 创建新需求
   * @param {string} projectId - 项目ID
   * @param {Object} requirementData - 需求数据
   * @returns {Promise} - 返回创建结果
   */
  async createRequirement(projectId, requirementData) {
    const response = await api.post(`/projects/${projectId}/requirements`, requirementData);
    return response.data;
  }

  /**
   * 更新需求
   * @param {string} id - 需求ID
   * @param {Object} requirementData - 需求数据
   * @returns {Promise} - 返回更新结果
   */
  async updateRequirement(id, requirementData) {
    const response = await api.put(`/requirements/${id}`, requirementData);
    return response.data;
  }

  /**
   * 删除需求
   * @param {string} id - 需求ID
   * @returns {Promise} - 返回删除结果
   */
  async deleteRequirement(id) {
    const response = await api.delete(`/requirements/${id}`);
    return response.data;
  }

  /**
   * 获取需求状态选项
   * @returns {Array} - 状态选项列表
   */
  getStatusOptions() {
    return [
      { value: 'draft', label: '草稿', color: 'gray' },
      { value: 'review', label: '审核中', color: 'blue' },
      { value: 'approved', label: '已批准', color: 'green' },
      { value: 'rejected', label: '已拒绝', color: 'red' },
      { value: 'implemented', label: '已实现', color: 'purple' }
    ];
  }

  /**
   * 获取需求优先级选项
   * @returns {Array} - 优先级选项列表
   */
  getPriorityOptions() {
    return [
      { value: 'low', label: '低', color: 'gray' },
      { value: 'medium', label: '中', color: 'blue' },
      { value: 'high', label: '高', color: 'orange' },
      { value: 'critical', label: '紧急', color: 'red' }
    ];
  }
}

export default new RequirementService(); 
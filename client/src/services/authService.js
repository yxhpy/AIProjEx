import api from './api';

/**
 * 认证相关的API服务
 */
export const authService = {
  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @param {string} userData.username - 用户名
   * @param {string} userData.email - 邮箱
   * @param {string} userData.password - 密码
   * @returns {Promise<Object>} - 包含用户信息和令牌的对象
   */
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || '注册失败');
      }
      throw error;
    }
  },

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭据
   * @param {string} credentials.email - 邮箱
   * @param {string} credentials.password - 密码
   * @returns {Promise<Object>} - 包含用户信息和令牌的对象
   */
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || '登录失败');
      }
      throw error;
    }
  },

  /**
   * 获取当前登录用户信息
   * @returns {Promise<Object>} - 用户信息
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || '获取用户信息失败');
      }
      throw error;
    }
  },

  /**
   * 更新用户信息
   * @param {Object} userData - 要更新的用户数据
   * @returns {Promise<Object>} - 更新后的用户信息
   */
  async updateUser(userData) {
    try {
      const response = await api.put('/auth/me', userData);
      return response.data.user;
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || '更新用户信息失败');
      }
      throw error;
    }
  },

  /**
   * 更新用户密码
   * @param {Object} passwordData - 密码数据
   * @param {string} passwordData.currentPassword - 当前密码
   * @param {string} passwordData.newPassword - 新密码
   * @returns {Promise<Object>} - 响应结果
   */
  async updatePassword(passwordData) {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || '更新密码失败');
      }
      throw error;
    }
  }
}; 
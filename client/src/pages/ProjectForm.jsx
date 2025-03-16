import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  createProject, 
  getProjectById, 
  updateProject 
} from '../services/projectService';

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    start_date: '',
    end_date: ''
  });

  // 表单错误
  const [errors, setErrors] = useState({});
  
  // 加载项目数据（编辑模式）
  const { data: project, isLoading: isLoadingProject } = useQuery(
    ['project', id],
    () => getProjectById(id),
    {
      enabled: isEditMode,
      onSuccess: (data) => {
        // 格式化日期为YYYY-MM-DD格式
        const formattedData = {
          ...data,
          start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
          end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : ''
        };
        setFormData(formattedData);
      }
    }
  );

  // 创建项目
  const createMutation = useMutation(createProject, {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
      navigate('/projects');
    },
    onError: (error) => {
      console.error('创建项目失败:', error);
      setErrors({ submit: error.response?.data?.message || '创建项目失败，请重试' });
    }
  });

  // 更新项目
  const updateMutation = useMutation(
    (data) => updateProject(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projects']);
        queryClient.invalidateQueries(['project', id]);
        navigate('/projects');
      },
      onError: (error) => {
        console.error('更新项目失败:', error);
        setErrors({ submit: error.response?.data?.message || '更新项目失败，请重试' });
      }
    }
  );

  // 处理输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除字段错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // 验证表单
  const validateForm = () => {
    const newErrors = {};
    
    // 验证项目名称
    if (!formData.name.trim()) {
      newErrors.name = '项目名称不能为空';
    } else if (formData.name.length > 100) {
      newErrors.name = '项目名称不能超过100个字符';
    }
    
    // 验证开始日期和结束日期
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate < startDate) {
        newErrors.end_date = '结束日期不能早于开始日期';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // 准备提交数据
    const submitData = {
      ...formData,
      // 转换空字符串为null
      description: formData.description.trim() || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null
    };
    
    if (isEditMode) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  // 处理取消
  const handleCancel = () => {
    navigate('/projects');
  };

  // 加载中状态
  if (isEditMode && isLoadingProject) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEditMode ? '编辑项目' : '创建新项目'}
        </h1>
        
        <form onSubmit={handleSubmit}>
          {/* 提交错误 */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.submit}
            </div>
          )}
          
          {/* 项目名称 */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="输入项目名称"
            />
            {errors.name && (
              <p className="mt-1 text-red-500 text-sm">{errors.name}</p>
            )}
          </div>
          
          {/* 项目描述 */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
              项目描述
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="输入项目描述"
            ></textarea>
          </div>
          
          {/* 项目状态 */}
          <div className="mb-4">
            <label htmlFor="status" className="block text-gray-700 font-medium mb-2">
              项目状态
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="planning">规划中</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="on_hold">已暂停</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          
          {/* 日期选择 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* 开始日期 */}
            <div>
              <label htmlFor="start_date" className="block text-gray-700 font-medium mb-2">
                开始日期
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            {/* 结束日期 */}
            <div>
              <label htmlFor="end_date" className="block text-gray-700 font-medium mb-2">
                结束日期
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.end_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end_date && (
                <p className="mt-1 text-red-500 text-sm">{errors.end_date}</p>
              )}
            </div>
          </div>
          
          {/* 按钮 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {createMutation.isLoading || updateMutation.isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  处理中...
                </span>
              ) : (
                isEditMode ? '更新项目' : '创建项目'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm; 
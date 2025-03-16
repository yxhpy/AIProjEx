import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import requirementService from '../../services/requirementService';

/**
 * 需求表单组件
 */
const RequirementForm = ({ projectId, requirement, onSubmit, isEditing = false }) => {
  const navigate = useNavigate();
  const statusOptions = requirementService.getStatusOptions();
  const priorityOptions = requirementService.getPriorityOptions();
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'draft',
    acceptance_criteria: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 如果是编辑模式，加载需求数据
  useEffect(() => {
    if (isEditing && requirement) {
      setFormData({
        title: requirement.title || '',
        description: requirement.description || '',
        priority: requirement.priority || 'medium',
        status: requirement.status || 'draft',
        acceptance_criteria: requirement.acceptance_criteria || ''
      });
    }
  }, [isEditing, requirement]);
  
  // 处理输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // 表单验证
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '标题不能为空';
    }
    
    if (formData.title.length > 200) {
      newErrors.title = '标题不能超过200个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      
      // 提交成功后返回
      if (isEditing) {
        navigate(`/requirements/${requirement.id}`);
      } else {
        navigate(`/projects/${projectId}/requirements`);
      }
    } catch (error) {
      console.error('提交需求失败:', error);
      
      // 处理后端验证错误
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert('提交失败，请稍后重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 取消操作
  const handleCancel = () => {
    if (isEditing) {
      navigate(`/requirements/${requirement.id}`);
    } else {
      navigate(`/projects/${projectId}/requirements`);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md shadow-sm">
      {/* 标题 */}
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
          placeholder="需求标题"
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
      </div>
      
      {/* 描述 */}
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          描述
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="需求详细描述"
        ></textarea>
      </div>
      
      {/* 优先级和状态 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            优先级
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            状态
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* 验收标准 */}
      <div className="mb-6">
        <label htmlFor="acceptance_criteria" className="block text-sm font-medium text-gray-700 mb-1">
          验收标准
        </label>
        <textarea
          id="acceptance_criteria"
          name="acceptance_criteria"
          value={formData.acceptance_criteria}
          onChange={handleChange}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="需求验收标准，可使用Markdown格式"
        ></textarea>
        <p className="mt-1 text-xs text-gray-500">
          提示：可以使用Markdown格式编写验收标准，例如使用"-"创建列表项
        </p>
      </div>
      
      {/* 按钮组 */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          disabled={isSubmitting}
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? '提交中...' : isEditing ? '更新需求' : '创建需求'}
        </button>
      </div>
    </form>
  );
};

export default RequirementForm; 
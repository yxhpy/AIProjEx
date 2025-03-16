import React from 'react';
import requirementService from '../../services/requirementService';

/**
 * 需求过滤器组件
 */
const RequirementFilter = ({ filters, onFilterChange }) => {
  const statusOptions = requirementService.getStatusOptions();
  const priorityOptions = requirementService.getPriorityOptions();
  
  // 处理状态过滤变化
  const handleStatusChange = (e) => {
    onFilterChange({
      ...filters,
      status: e.target.value || null
    });
  };
  
  // 处理优先级过滤变化
  const handlePriorityChange = (e) => {
    onFilterChange({
      ...filters,
      priority: e.target.value || null
    });
  };
  
  // 处理搜索变化
  const handleSearchChange = (e) => {
    onFilterChange({
      ...filters,
      search: e.target.value || null
    });
  };
  
  // 重置所有过滤器
  const handleReset = () => {
    onFilterChange({
      status: null,
      priority: null,
      search: null
    });
  };
  
  return (
    <div className="bg-white p-4 rounded-md shadow-sm mb-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 搜索框 */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            搜索
          </label>
          <input
            type="text"
            id="search"
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="搜索需求标题或描述"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        {/* 状态过滤 */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            状态
          </label>
          <select
            id="status"
            value={filters.status || ''}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* 优先级过滤 */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            优先级
          </label>
          <select
            id="priority"
            value={filters.priority || ''}
            onChange={handlePriorityChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">全部优先级</option>
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* 重置按钮 */}
        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            重置过滤器
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequirementFilter; 
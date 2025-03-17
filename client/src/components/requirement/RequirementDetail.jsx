import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import requirementService from '../../services/requirementService';
import { CheckSquare } from 'lucide-react';

/**
 * 需求详情组件
 */
const RequirementDetail = ({ requirement, onDelete }) => {
  if (!requirement) {
    return null;
  }
  
  // 获取状态和优先级选项
  const statusOptions = requirementService.getStatusOptions();
  const priorityOptions = requirementService.getPriorityOptions();
  
  // 查找对应的状态和优先级
  const statusOption = statusOptions.find(option => option.value === requirement.status) || {};
  const priorityOption = priorityOptions.find(option => option.value === requirement.priority) || {};
  
  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未设置';
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 处理删除需求
  const handleDelete = () => {
    if (window.confirm('确定要删除这个需求吗？此操作不可撤销。')) {
      onDelete(requirement.id);
    }
  };
  
  return (
    <div className="bg-white rounded-md shadow-sm overflow-hidden">
      {/* 需求头部 */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{requirement.title}</h1>
            <div className="flex space-x-2 mb-4">
              <Badge color={statusOption.color}>{statusOption.label}</Badge>
              <Badge color={priorityOption.color}>{priorityOption.label}</Badge>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/requirements/${requirement.id}/edit`}
              className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              编辑
            </Link>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
            >
              删除
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap text-sm text-gray-500 gap-x-6 gap-y-2">
          <div>
            <span className="font-medium">创建人：</span>
            <span>{requirement.creator?.username || '未知'}</span>
          </div>
          <div>
            <span className="font-medium">创建时间：</span>
            <span>{formatDate(requirement.created_at)}</span>
          </div>
          <div>
            <span className="font-medium">最后更新：</span>
            <span>{formatDate(requirement.updated_at)}</span>
          </div>
          <div>
            <span className="font-medium">所属项目：</span>
            {requirement.project ? (
              <Link 
                to={`/projects/${requirement.project.id}`}
                className="text-blue-600 hover:underline"
              >
                {requirement.project.name}
              </Link>
            ) : (
              <span>未知项目</span>
            )}
          </div>
        </div>
      </div>
      
      {/* 需求描述 */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">描述</h2>
        <div className="prose max-w-none">
          {requirement.description ? (
            <p className="whitespace-pre-line">{requirement.description}</p>
          ) : (
            <p className="text-gray-500 italic">暂无描述</p>
          )}
        </div>
      </div>
      
      {/* 验收标准 */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">验收标准</h2>
        <div className="prose max-w-none">
          {requirement.acceptance_criteria ? (
            <div className="whitespace-pre-line">{requirement.acceptance_criteria}</div>
          ) : (
            <p className="text-gray-500 italic">暂无验收标准</p>
          )}
        </div>
      </div>
      
      {/* 相关任务 */}
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">相关任务</h2>
        <div className="flex flex-col space-y-3">
          <Link
            to={`/requirements/${requirement.id}/tasks`}
            className="inline-flex items-center px-4 py-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors w-fit"
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            查看任务列表
          </Link>
          
          <Link
            to={`/requirements/${requirement.id}/tasks/new`}
            className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors w-fit"
          >
            <span className="mr-2">+</span>
            创建新任务
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RequirementDetail; 
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import requirementService from '../../services/requirementService';

/**
 * 需求卡片组件
 */
const RequirementCard = ({ requirement }) => {
  // 获取状态和优先级选项
  const statusOptions = requirementService.getStatusOptions();
  const priorityOptions = requirementService.getPriorityOptions();
  
  // 查找对应的状态和优先级
  const statusOption = statusOptions.find(option => option.value === requirement.status) || {};
  const priorityOption = priorityOptions.find(option => option.value === requirement.priority) || {};
  
  return (
    <Card className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <Link 
            to={`/requirements/${requirement.id}`}
            className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate"
          >
            {requirement.title}
          </Link>
          <div className="flex space-x-1">
            <Badge color={priorityOption.color}>{priorityOption.label}</Badge>
            <Badge color={statusOption.color}>{statusOption.label}</Badge>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-3">
          {requirement.description || '暂无描述'}
        </p>
        
        <div className="mt-auto pt-2 flex justify-between items-center text-sm text-gray-500 border-t border-gray-100">
          <div>
            <span className="inline-block mr-2">创建人:</span>
            <span>{requirement.creator?.username || '未知'}</span>
          </div>
          <div>
            <span>更新于: </span>
            <span>{new Date(requirement.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RequirementCard; 
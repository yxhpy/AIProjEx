import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RequirementCard from './RequirementCard';
import requirementService from '../../services/requirementService';

/**
 * 需求列表组件
 */
const RequirementList = ({ projectId, filters = {} }) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // 加载需求列表
  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        setLoading(true);
        const response = await requirementService.getRequirementsByProject(projectId, filters);
        setRequirements(response.data);
        setError(null);
      } catch (err) {
        console.error('获取需求列表失败:', err);
        setError('获取需求列表失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequirements();
  }, [projectId, filters]);
  
  // 创建新需求
  const handleCreateRequirement = () => {
    navigate(`/projects/${projectId}/requirements/new`);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-600">
        <p>{error}</p>
      </div>
    );
  }
  
  if (requirements.length === 0) {
    return (
      <div className="bg-gray-50 p-8 rounded-md text-center">
        <h3 className="text-lg font-medium text-gray-600 mb-4">暂无需求</h3>
        <p className="text-gray-500 mb-6">该项目还没有添加任何需求，点击下方按钮创建第一个需求。</p>
        <button
          onClick={handleCreateRequirement}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          创建需求
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requirements.map(requirement => (
          <div key={requirement.id} className="h-full">
            <RequirementCard requirement={requirement} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequirementList; 
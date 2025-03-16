import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import RequirementDetail from '../components/requirement/RequirementDetail';
import requirementService from '../services/requirementService';

/**
 * 需求详情页面
 */
const RequirementDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [requirement, setRequirement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 加载需求详情
  useEffect(() => {
    const fetchRequirement = async () => {
      try {
        setLoading(true);
        const response = await requirementService.getRequirementById(id);
        setRequirement(response.data);
        setError(null);
      } catch (err) {
        console.error('获取需求详情失败:', err);
        setError('获取需求详情失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequirement();
  }, [id]);
  
  // 处理删除需求
  const handleDelete = async (requirementId) => {
    try {
      await requirementService.deleteRequirement(requirementId);
      // 删除成功后返回项目需求列表页面
      if (requirement && requirement.project) {
        navigate(`/projects/${requirement.project.id}/requirements`);
      } else {
        navigate('/projects');
      }
    } catch (err) {
      console.error('删除需求失败:', err);
      alert('删除需求失败，请稍后重试');
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (!requirement) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-600">
          <p>需求不存在或已被删除</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 导航链接 */}
      <div className="mb-6">
        <div className="text-gray-600">
          <Link to={`/projects/${requirement.project?.id}`} className="hover:underline">
            {requirement.project?.name || '未知项目'}
          </Link>
          <span> / </span>
          <Link to={`/projects/${requirement.project?.id}/requirements`} className="hover:underline">
            需求列表
          </Link>
          <span> / 需求详情</span>
        </div>
      </div>
      
      {/* 需求详情 */}
      <RequirementDetail 
        requirement={requirement} 
        onDelete={handleDelete} 
      />
    </div>
  );
};

export default RequirementDetailPage; 
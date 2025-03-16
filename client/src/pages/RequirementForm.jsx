import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import RequirementForm from '../components/requirement/RequirementForm';
import requirementService from '../services/requirementService';
import projectService from '../services/projectService';

/**
 * 需求表单页面
 */
const RequirementFormPage = () => {
  const { projectId, id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [requirement, setRequirement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isEditing = !!id;
  
  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (isEditing) {
          // 编辑模式：加载需求详情
          const response = await requirementService.getRequirementById(id);
          setRequirement(response.data);
          
          // 加载项目信息
          if (response.data.project) {
            const projectResponse = await projectService.getProjectById(response.data.project.id);
            setProject(projectResponse.data);
          }
        } else {
          // 创建模式：加载项目信息
          const response = await projectService.getProjectById(projectId);
          setProject(response.data);
        }
        
        setError(null);
      } catch (err) {
        console.error('加载数据失败:', err);
        setError('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isEditing, id, projectId]);
  
  // 处理表单提交
  const handleSubmit = async (formData) => {
    if (isEditing) {
      // 更新需求
      return await requirementService.updateRequirement(id, formData);
    } else {
      // 创建需求
      return await requirementService.createRequirement(projectId, formData);
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {isEditing ? '编辑需求' : '创建需求'}
        </h1>
        <div className="text-gray-600">
          <Link to={`/projects/${isEditing ? requirement?.project?.id : projectId}`} className="hover:underline">
            {project?.name || '未知项目'}
          </Link>
          <span> / </span>
          <Link 
            to={`/projects/${isEditing ? requirement?.project?.id : projectId}/requirements`} 
            className="hover:underline"
          >
            需求列表
          </Link>
          <span> / {isEditing ? '编辑需求' : '创建需求'}</span>
        </div>
      </div>
      
      {/* 需求表单 */}
      <RequirementForm 
        projectId={isEditing ? requirement?.project?.id : projectId}
        requirement={requirement}
        onSubmit={handleSubmit}
        isEditing={isEditing}
      />
    </div>
  );
};

export default RequirementFormPage; 
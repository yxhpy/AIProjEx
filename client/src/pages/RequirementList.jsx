import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import RequirementFilter from '../components/requirement/RequirementFilter';
import RequirementList from '../components/requirement/RequirementList';
import requirementService from '../services/requirementService';
import projectService from '../services/projectService';

/**
 * 需求列表页面
 */
const RequirementListPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: null,
    priority: null,
    search: null
  });
  
  // 加载项目信息
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await projectService.getProjectById(projectId);
        setProject(response.data);
        setError(null);
      } catch (err) {
        console.error('获取项目信息失败:', err);
        setError('获取项目信息失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId]);
  
  // 处理过滤器变化
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };
  
  // 创建新需求
  const handleCreateRequirement = () => {
    navigate(`/projects/${projectId}/requirements/new`);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">项目需求</h1>
            <div className="mt-1 text-gray-600">
              <Link to={`/projects/${projectId}`} className="hover:underline">
                {project?.name || '未知项目'}
              </Link>
              <span> / 需求列表</span>
            </div>
          </div>
          <button
            onClick={handleCreateRequirement}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            创建需求
          </button>
        </div>
      </div>
      
      {/* 过滤器 */}
      <RequirementFilter 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      {/* 需求列表 */}
      <RequirementList 
        projectId={projectId} 
        filters={filters} 
      />
    </div>
  );
};

export default RequirementListPage; 
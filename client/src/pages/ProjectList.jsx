import React, { useState } from "react";
import { useQuery } from "react-query";
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Hourglass,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProjects } from "../services/projectService";
import { formatDate } from "../utils/dateUtils";

// 项目状态映射
const STATUS_MAP = {
  'planning': { label: '规划中', color: 'bg-purple-100 text-purple-600', icon: <AlertCircle className="h-5 w-5 text-purple-500" /> },
  'in_progress': { label: '进行中', color: 'bg-blue-100 text-blue-600', icon: <Hourglass className="h-5 w-5 text-blue-500" /> },
  'completed': { label: '已完成', color: 'bg-green-100 text-green-600', icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
  'on_hold': { label: '已暂停', color: 'bg-amber-100 text-amber-600', icon: <AlertCircle className="h-5 w-5 text-amber-500" /> },
  'cancelled': { label: '已取消', color: 'bg-red-100 text-red-600', icon: <AlertCircle className="h-5 w-5 text-red-500" /> }
};

const ProjectList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // 获取项目列表
  const { data, isLoading, error } = useQuery(
    ['projects', currentPage, pageSize, statusFilter],
    () => getProjects({ 
      page: currentPage, 
      limit: pageSize,
      status: statusFilter || undefined,
      sort: 'createdAt',
      order: 'desc'
    }),
    {
      keepPreviousData: true
    }
  );

  // 处理搜索
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // 处理状态筛选
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // 创建新项目
  const handleCreateProject = () => {
    navigate('/projects/create');
  };

  // 查看项目详情
  const handleViewProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  // 本地过滤项目（基于搜索查询）
  const filteredProjects = data?.projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // 渲染状态徽章
  const renderStatusBadge = (status) => {
    const statusInfo = STATUS_MAP[status] || { label: '未知', color: 'bg-gray-100 text-gray-600' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  // 计算项目进度（基于开始日期和结束日期）
  const calculateProgress = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const totalDuration = end - start;
    const elapsedDuration = now - start;
    
    return Math.round((elapsedDuration / totalDuration) * 100);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>加载项目列表失败: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">项目列表</h1>
        <button 
          onClick={handleCreateProject}
          className="bg-primary text-white px-4 py-2 rounded-md flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          创建项目
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索项目..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <select
          className="w-full md:w-[180px] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          value={statusFilter}
          onChange={handleStatusChange}
        >
          <option value="">全部状态</option>
          <option value="planning">规划中</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="on_hold">已暂停</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">暂无项目数据</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const progress = calculateProgress(project.start_date, project.end_date);
            const statusInfo = STATUS_MAP[project.status] || {};
            
            return (
              <div 
                key={project.id} 
                className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden cursor-pointer"
                onClick={() => handleViewProject(project.id)}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start w-full mb-3">
                    <div>
                      {renderStatusBadge(project.status)}
                      <h3 className="text-xl font-semibold mt-2">{project.name}</h3>
                    </div>
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100">
                      {statusInfo.icon || <AlertCircle className="h-5 w-5 text-gray-500" />}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 line-clamp-2 h-12 mb-4">
                    {project.description || '暂无描述'}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>进度</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{project.start_date ? formatDate(project.start_date) : '未设置'}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{project.end_date ? formatDate(project.end_date) : '未设置'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 px-5 py-3 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                      {project.creator?.avatar_url ? (
                        <img 
                          src={project.creator.avatar_url} 
                          alt={project.creator.username} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {project.creator?.username?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {project.creator?.username || '未知用户'}
                    </span>
                  </div>
                  
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 3).map((member, index) => (
                      <div 
                        key={member.id || index} 
                        className="h-8 w-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center overflow-hidden"
                        title={member.username}
                      >
                        {member.avatar_url ? (
                          <img 
                            src={member.avatar_url} 
                            alt={member.username} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {member.username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                    ))}
                    {project.members?.length > 3 && (
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-600">+{project.members.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {data && data.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <button
              className="p-2 border border-gray-300 rounded-md disabled:opacity-50"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
              .filter(page => {
                // 显示第一页、最后一页，以及当前页附近的页码
                return page === 1 || 
                       page === data.pagination.totalPages || 
                       Math.abs(page - currentPage) <= 1;
              })
              .map((page, index, array) => {
                // 添加省略号
                if (index > 0 && array[index - 1] !== page - 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <span className="px-2">...</span>
                      <button
                        className={`w-8 h-8 rounded-md ${
                          currentPage === page 
                            ? 'bg-primary text-white' 
                            : 'border border-gray-300'
                        }`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                }
                
                return (
                  <button
                    key={page}
                    className={`w-8 h-8 rounded-md ${
                      currentPage === page 
                        ? 'bg-primary text-white' 
                        : 'border border-gray-300'
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}
            
            <button
              className="p-2 border border-gray-300 rounded-md disabled:opacity-50"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, data.pagination.totalPages))}
              disabled={currentPage === data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList; 
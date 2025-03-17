import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Plus, 
  Filter,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  CheckSquare
} from 'lucide-react';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import requirementService from '../services/requirementService';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';

// 任务状态映射
const STATUS_MAP = {
  'todo': { label: '待处理', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  'in_progress': { label: '进行中', color: 'bg-blue-100 text-blue-600', icon: ClockIcon },
  'review': { label: '审核中', color: 'bg-yellow-100 text-yellow-600', icon: CheckSquare },
  'done': { label: '已完成', color: 'bg-green-100 text-green-600', icon: CheckCircle }
};

// 任务优先级映射
const PRIORITY_MAP = {
  'low': { label: '低', color: 'bg-gray-100 text-gray-600' },
  'medium': { label: '中', color: 'bg-blue-100 text-blue-600' },
  'high': { label: '高', color: 'bg-orange-100 text-orange-600' },
  'urgent': { label: '紧急', color: 'bg-red-100 text-red-600' }
};

const TaskList = () => {
  const { projectId, requirementId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // 状态
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [parent, setParent] = useState(null);
  
  // 获取任务列表
  const { 
    data: tasks, 
    isLoading: isLoadingTasks,
    error: tasksError
  } = useQuery(
    ['tasks', { projectId, requirementId, ...filters }], 
    () => taskService.getTasks({ 
      projectId, 
      requirementId,
      ...filters
    }).then(res => res.data),
    {
      enabled: !!projectId || !!requirementId
    }
  );
  
  // 获取父级信息（项目或需求）
  useEffect(() => {
    const fetchParent = async () => {
      try {
        if (projectId) {
          const response = await projectService.getProjectById(projectId);
          setParent({
            type: 'project',
            data: response.data
          });
        } else if (requirementId) {
          const response = await requirementService.getRequirementById(requirementId);
          setParent({
            type: 'requirement',
            data: response.data
          });
        }
      } catch (error) {
        console.error('获取父级信息失败:', error);
      }
    };
    
    if (projectId || requirementId) {
      fetchParent();
    }
  }, [projectId, requirementId]);
  
  // 删除任务
  const deleteMutation = useMutation(
    (taskId) => taskService.deleteTask(taskId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks', { projectId, requirementId }]);
      }
    }
  );
  
  // 批量更新任务状态
  const updateStatusMutation = useMutation(
    ({ taskIds, status }) => taskService.updateTasksStatus(taskIds, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks', { projectId, requirementId }]);
      }
    }
  );
  
  // 处理删除任务
  const handleDeleteTask = (taskId) => {
    if (window.confirm('确定要删除此任务吗？')) {
      deleteMutation.mutate(taskId);
    }
  };
  
  // 处理更新任务状态
  const handleUpdateStatus = (taskId, status) => {
    updateStatusMutation.mutate({ taskIds: [taskId], status });
  };
  
  // 处理筛选变更
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 重置筛选
  const resetFilters = () => {
    setFilters({
      status: '',
      priority: '',
      assignee: ''
    });
  };
  
  // 加载中状态
  if (isLoadingTasks) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // 错误状态
  if (tasksError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          <p>加载任务列表失败: {tasksError.message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* 标题和导航 */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {parent?.type === 'project' ? `${parent.data.name} - 任务列表` : 
               parent?.type === 'requirement' ? `${parent.data.title} - 任务列表` : 
               '任务列表'}
            </h1>
            <div className="text-gray-600 mb-4">
              {parent?.type === 'project' && (
                <Link to={`/projects/${parent.data.id}`} className="hover:underline">
                  返回项目详情
                </Link>
              )}
              {parent?.type === 'requirement' && (
                <>
                  <Link to={`/projects/${parent.data.project?.id}`} className="hover:underline">
                    {parent.data.project?.name || '项目'}
                  </Link>
                  <span> / </span>
                  <Link to={`/requirements/${parent.data.id}`} className="hover:underline">
                    返回需求详情
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
            >
              <Filter className="mr-1 h-4 w-4" />
              筛选
            </button>
            
            <button
              onClick={() => navigate(
                projectId ? 
                `/projects/${projectId}/tasks/new` : 
                requirementId ? 
                `/requirements/${requirementId}/tasks/new` :
                '/tasks/new'
              )}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="mr-1 h-4 w-4" />
              新建任务
            </button>
          </div>
        </div>
        
        {/* 筛选面板 */}
        {showFilters && (
          <div className="bg-white p-4 rounded-md shadow-md mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">全部状态</option>
                  <option value="todo">待处理</option>
                  <option value="in_progress">进行中</option>
                  <option value="review">审核中</option>
                  <option value="done">已完成</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                <select
                  name="priority"
                  value={filters.priority}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">全部优先级</option>
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
                <select
                  name="assignee"
                  value={filters.assignee}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">全部负责人</option>
                  <option value="me">我负责的</option>
                  <option value="unassigned">未分配</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                重置筛选
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 任务列表 */}
      {tasks && tasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map(task => {
            const statusInfo = STATUS_MAP[task.status] || { label: '未知', color: 'bg-gray-100 text-gray-600' };
            const priorityInfo = PRIORITY_MAP[task.priority] || { label: '未知', color: 'bg-gray-100 text-gray-600' };
            const StatusIcon = statusInfo.icon;
            
            return (
              <div key={task.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold mr-2">
                        <Link to={`/tasks/${task.id}`} className="hover:text-blue-600">
                          {task.title}
                        </Link>
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex items-center`}>
                        {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                        {statusInfo.label}
                      </span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {task.description || '无描述'}
                    </p>
                    
                    <div className="flex flex-wrap items-center text-sm text-gray-500 mt-2">
                      {task.due_date && (
                        <div className="flex items-center mr-4 mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>截止: {formatDate(task.due_date)}</span>
                        </div>
                      )}
                      
                      {task.estimated_hours && (
                        <div className="flex items-center mr-4 mb-1">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>预计: {task.estimated_hours}小时</span>
                        </div>
                      )}
                      
                      {task.assignee && (
                        <div className="flex items-center mb-1">
                          <div className="flex items-center">
                            {task.assignee.avatar ? (
                              <img 
                                src={task.assignee.avatar} 
                                alt={task.assignee.username} 
                                className="h-5 w-5 rounded-full mr-1"
                              />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center mr-1">
                                <span className="text-xs">{task.assignee.username.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                            <span>{task.assignee.username}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-4 md:mt-0">
                    {/* 状态更新下拉菜单 */}
                    <div className="mr-2">
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                        className="p-1 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="todo">待处理</option>
                        <option value="in_progress">进行中</option>
                        <option value="review">审核中</option>
                        <option value="done">已完成</option>
                      </select>
                    </div>
                    
                    {/* 操作按钮 */}
                    <Link
                      to={`/tasks/${task.id}/edit`}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 p-8 rounded-md text-center">
          <p className="text-gray-600 mb-4">暂无任务</p>
          <button
            onClick={() => navigate(
              projectId ? 
              `/projects/${projectId}/tasks/new` : 
              requirementId ? 
              `/requirements/${requirementId}/tasks/new` :
              '/tasks/new'
            )}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
          >
            <Plus className="mr-1 h-4 w-4" />
            创建第一个任务
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList; 
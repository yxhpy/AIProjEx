import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  CheckSquare,
  User,
  Clipboard,
  Link as LinkIcon
} from 'lucide-react';
import taskService from '../services/taskService';
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

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // 状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // 获取任务详情
  const { 
    data: task, 
    isLoading,
    error
  } = useQuery(
    ['task', id], 
    () => taskService.getTaskById(id).then(res => res.data),
    {
      enabled: !!id
    }
  );
  
  // 删除任务
  const deleteMutation = useMutation(
    () => taskService.deleteTask(id),
    {
      onSuccess: () => {
        // 删除成功后返回任务列表
        if (task?.project_id) {
          navigate(`/projects/${task.project_id}/tasks`);
        } else if (task?.requirement_id) {
          navigate(`/requirements/${task.requirement_id}/tasks`);
        } else {
          navigate('/tasks');
        }
      }
    }
  );
  
  // 更新任务状态
  const updateStatusMutation = useMutation(
    (status) => taskService.updateTask(id, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['task', id]);
      }
    }
  );
  
  // 处理删除任务
  const handleDelete = () => {
    deleteMutation.mutate();
  };
  
  // 处理更新任务状态
  const handleUpdateStatus = (status) => {
    updateStatusMutation.mutate(status);
  };
  
  // 加载中状态
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // 错误状态
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          <p>加载任务详情失败: {error.message}</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  }
  
  // 任务不存在
  if (!task) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-600">
          <p>任务不存在或已被删除</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  }
  
  const statusInfo = STATUS_MAP[task.status] || { label: '未知', color: 'bg-gray-100 text-gray-600' };
  const priorityInfo = PRIORITY_MAP[task.priority] || { label: '未知', color: 'bg-gray-100 text-gray-600' };
  const StatusIcon = statusInfo.icon;
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* 导航链接 */}
      <div className="mb-6">
        <div className="text-gray-600">
          {task.project && (
            <>
              <Link to={`/projects/${task.project.id}`} className="hover:underline">
                {task.project.name}
              </Link>
              <span> / </span>
            </>
          )}
          
          {task.requirement && (
            <>
              <Link to={`/requirements/${task.requirement.id}`} className="hover:underline">
                {task.requirement.title}
              </Link>
              <span> / </span>
            </>
          )}
          
          <Link 
            to={task.project_id ? `/projects/${task.project_id}/tasks` : 
                task.requirement_id ? `/requirements/${task.requirement_id}/tasks` : 
                '/tasks'} 
            className="hover:underline"
          >
            任务列表
          </Link>
          <span> / 任务详情</span>
        </div>
      </div>
      
      {/* 任务标题和操作 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{task.title}</h1>
          <div className="flex items-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex items-center`}>
              {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
              {statusInfo.label}
            </span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
              {priorityInfo.label}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Link
            to={`/tasks/${task.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Edit className="mr-1 h-4 w-4" />
            编辑
          </Link>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            删除
          </button>
        </div>
      </div>
      
      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">确认删除</h3>
            <p className="mb-6">确定要删除任务 "{task.title}" 吗？此操作无法撤销。</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 任务详情 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧：任务信息 */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">任务详情</h2>
            
            {/* 任务描述 */}
            <div className="mb-6">
              <h3 className="text-gray-700 font-medium mb-2">描述</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                {task.description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                ) : (
                  <p className="text-gray-500 italic">暂无描述</p>
                )}
              </div>
            </div>
            
            {/* 任务时间信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-gray-700 font-medium mb-2">时间信息</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">开始日期</p>
                      <p className="text-gray-700">{task.start_date ? formatDate(task.start_date) : '未设置'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">截止日期</p>
                      <p className="text-gray-700">{task.due_date ? formatDate(task.due_date) : '未设置'}</p>
                    </div>
                  </div>
                  
                  {task.completed_date && (
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">完成日期</p>
                        <p className="text-gray-700">{formatDate(task.completed_date)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-gray-700 font-medium mb-2">工时信息</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">预计工时</p>
                      <p className="text-gray-700">{task.estimated_hours ? `${task.estimated_hours} 小时` : '未设置'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">实际工时</p>
                      <p className="text-gray-700">{task.actual_hours ? `${task.actual_hours} 小时` : '未记录'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 任务依赖 */}
            {task.dependencies && task.dependencies.length > 0 && (
              <div className="mb-6">
                <h3 className="text-gray-700 font-medium mb-2">依赖任务</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <ul className="list-disc list-inside">
                    {task.dependencies.map(depId => (
                      <li key={depId} className="mb-1">
                        <Link to={`/tasks/${depId}`} className="text-blue-600 hover:underline">
                          任务 #{depId}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧：任务状态和人员信息 */}
        <div>
          {/* 任务状态 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-gray-700 font-medium mb-4">任务状态</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">更新状态</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateStatus('todo')}
                  className={`p-2 rounded-md flex items-center justify-center ${
                    task.status === 'todo' ? 'bg-gray-200 font-medium' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  待处理
                </button>
                
                <button
                  onClick={() => handleUpdateStatus('in_progress')}
                  className={`p-2 rounded-md flex items-center justify-center ${
                    task.status === 'in_progress' ? 'bg-blue-200 font-medium' : 'bg-blue-100 hover:bg-blue-200'
                  }`}
                >
                  <ClockIcon className="h-4 w-4 mr-1" />
                  进行中
                </button>
                
                <button
                  onClick={() => handleUpdateStatus('review')}
                  className={`p-2 rounded-md flex items-center justify-center ${
                    task.status === 'review' ? 'bg-yellow-200 font-medium' : 'bg-yellow-100 hover:bg-yellow-200'
                  }`}
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  审核中
                </button>
                
                <button
                  onClick={() => handleUpdateStatus('done')}
                  className={`p-2 rounded-md flex items-center justify-center ${
                    task.status === 'done' ? 'bg-green-200 font-medium' : 'bg-green-100 hover:bg-green-200'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  已完成
                </button>
              </div>
            </div>
          </div>
          
          {/* 人员信息 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-gray-700 font-medium mb-4">人员信息</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">负责人</p>
              {task.assignee ? (
                <div className="flex items-center">
                  {task.assignee.avatar ? (
                    <img 
                      src={task.assignee.avatar} 
                      alt={task.assignee.username} 
                      className="h-8 w-8 rounded-full mr-2"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                      <span>{task.assignee.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <span>{task.assignee.username}</span>
                </div>
              ) : (
                <p className="text-gray-500 italic">未分配</p>
              )}
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">创建者</p>
              {task.creator ? (
                <div className="flex items-center">
                  {task.creator.avatar ? (
                    <img 
                      src={task.creator.avatar} 
                      alt={task.creator.username} 
                      className="h-8 w-8 rounded-full mr-2"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                      <span>{task.creator.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <span>{task.creator.username}</span>
                </div>
              ) : (
                <p className="text-gray-500 italic">未知</p>
              )}
            </div>
          </div>
          
          {/* 相关链接 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-700 font-medium mb-4">相关链接</h3>
            
            <ul className="space-y-2">
              {task.project && (
                <li>
                  <Link to={`/projects/${task.project.id}`} className="flex items-center text-blue-600 hover:underline">
                    <Clipboard className="h-4 w-4 mr-2" />
                    项目: {task.project.name}
                  </Link>
                </li>
              )}
              
              {task.requirement && (
                <li>
                  <Link to={`/requirements/${task.requirement.id}`} className="flex items-center text-blue-600 hover:underline">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    需求: {task.requirement.title}
                  </Link>
                </li>
              )}
              
              <li>
                <Link 
                  to={task.project_id ? `/projects/${task.project_id}/tasks` : 
                      task.requirement_id ? `/requirements/${task.requirement_id}/tasks` : 
                      '/tasks'} 
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回任务列表
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail; 
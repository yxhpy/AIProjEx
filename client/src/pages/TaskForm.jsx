import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft,
  Save,
  AlertCircle
} from 'lucide-react';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import requirementService from '../services/requirementService';
import userService from '../services/userService';
import { formatDateForInput } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';

const TaskForm = () => {
  const { id, projectId, requirementId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditMode = !!id;
  
  // 表单状态
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      estimated_hours: '',
      actual_hours: '',
      start_date: '',
      due_date: '',
      project_id: projectId || '',
      requirement_id: requirementId || '',
      assignee_id: '',
      dependencies: []
    }
  });
  
  // 其他状态
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedDependencies, setSelectedDependencies] = useState([]);
  
  // 监听项目ID变化，加载对应项目的需求列表
  const watchProjectId = watch('project_id');
  
  // 获取任务详情（编辑模式）
  const { isLoading: isLoadingTask } = useQuery(
    ['task', id],
    () => taskService.getTaskById(id).then(res => res.data),
    {
      enabled: isEditMode,
      onSuccess: (data) => {
        // 填充表单数据
        setValue('title', data.title);
        setValue('description', data.description || '');
        setValue('status', data.status);
        setValue('priority', data.priority);
        setValue('estimated_hours', data.estimated_hours || '');
        setValue('actual_hours', data.actual_hours || '');
        setValue('start_date', data.start_date ? formatDateForInput(data.start_date) : '');
        setValue('due_date', data.due_date ? formatDateForInput(data.due_date) : '');
        setValue('project_id', data.project_id || '');
        setValue('requirement_id', data.requirement_id || '');
        setValue('assignee_id', data.assignee_id || '');
        
        // 设置依赖任务
        if (data.dependencies && data.dependencies.length > 0) {
          setSelectedDependencies(data.dependencies);
        }
      },
      onError: (err) => {
        setError('加载任务详情失败: ' + (err.response?.data?.message || err.message));
      }
    }
  );
  
  // 创建任务
  const createMutation = useMutation(
    (data) => taskService.createTask(data),
    {
      onSuccess: (response) => {
        const createdTask = response.data;
        queryClient.invalidateQueries(['tasks']);
        navigate(`/tasks/${createdTask.id}`);
      },
      onError: (err) => {
        setError('创建任务失败: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    }
  );
  
  // 更新任务
  const updateMutation = useMutation(
    (data) => taskService.updateTask(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['task', id]);
        queryClient.invalidateQueries(['tasks']);
        navigate(`/tasks/${id}`);
      },
      onError: (err) => {
        setError('更新任务失败: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    }
  );
  
  // 加载项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectService.getProjects();
        setProjects(response.data);
      } catch (err) {
        console.error('获取项目列表失败:', err);
      }
    };
    
    fetchProjects();
  }, []);
  
  // 加载用户列表
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getUsers();
        setUsers(response.data);
      } catch (err) {
        console.error('获取用户列表失败:', err);
      }
    };
    
    fetchUsers();
  }, []);
  
  // 根据项目ID加载需求列表
  useEffect(() => {
    if (!watchProjectId) {
      setRequirements([]);
      return;
    }
    
    const fetchRequirements = async () => {
      try {
        const response = await requirementService.getRequirementsByProject(watchProjectId);
        setRequirements(response.data);
      } catch (err) {
        console.error('获取需求列表失败:', err);
      }
    };
    
    fetchRequirements();
  }, [watchProjectId]);
  
  // 加载任务列表（用于依赖选择）
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // 如果有项目ID，则获取该项目下的所有任务
        if (watchProjectId) {
          const response = await taskService.getTasks({ projectId: watchProjectId });
          // 过滤掉当前任务（编辑模式下）
          const filteredTasks = isEditMode 
            ? response.data.filter(task => task.id !== parseInt(id)) 
            : response.data;
          setTasks(filteredTasks);
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error('获取任务列表失败:', err);
      }
    };
    
    fetchTasks();
  }, [watchProjectId, id, isEditMode]);
  
  // 处理表单提交
  const onSubmit = (data) => {
    setLoading(true);
    setError(null);
    
    // 处理依赖任务
    const formData = {
      ...data,
      dependencies: selectedDependencies
    };
    
    // 转换数字字段
    if (formData.estimated_hours) {
      formData.estimated_hours = parseFloat(formData.estimated_hours);
    }
    
    if (formData.actual_hours) {
      formData.actual_hours = parseFloat(formData.actual_hours);
    }
    
    if (formData.project_id) {
      formData.project_id = parseInt(formData.project_id);
    }
    
    if (formData.requirement_id) {
      formData.requirement_id = parseInt(formData.requirement_id);
    }
    
    if (formData.assignee_id) {
      formData.assignee_id = parseInt(formData.assignee_id);
    }
    
    // 创建或更新任务
    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };
  
  // 处理依赖任务选择
  const handleDependencyChange = (taskId) => {
    const id = parseInt(taskId);
    if (selectedDependencies.includes(id)) {
      setSelectedDependencies(selectedDependencies.filter(depId => depId !== id));
    } else {
      setSelectedDependencies([...selectedDependencies, id]);
    }
  };
  
  // 加载中状态
  if (isEditMode && isLoadingTask) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* 标题和导航 */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <button 
            onClick={() => navigate(-1)}
            className="mr-2 p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? '编辑任务' : '创建新任务'}
          </h1>
        </div>
        
        <div className="text-gray-600">
          {projectId && (
            <Link to={`/projects/${projectId}`} className="hover:underline">
              返回项目
            </Link>
          )}
          {requirementId && (
            <Link to={`/requirements/${requirementId}`} className="hover:underline">
              返回需求
            </Link>
          )}
        </div>
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-600 mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {/* 表单 */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左侧：基本信息 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">基本信息</h2>
            
            {/* 任务标题 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                任务标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('title', { required: '任务标题不能为空' })}
                className={`w-full p-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="输入任务标题"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
            
            {/* 任务描述 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                任务描述
              </label>
              <textarea
                {...register('description')}
                rows="5"
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="输入任务描述"
              ></textarea>
            </div>
            
            {/* 状态和优先级 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  {...register('status')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="todo">待处理</option>
                  <option value="in_progress">进行中</option>
                  <option value="review">审核中</option>
                  <option value="done">已完成</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优先级
                </label>
                <select
                  {...register('priority')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
            </div>
            
            {/* 工时信息 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  预计工时（小时）
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  {...register('estimated_hours')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="预计工时"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  实际工时（小时）
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  {...register('actual_hours')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="实际工时"
                />
              </div>
            </div>
          </div>
          
          {/* 右侧：关联信息和日期 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">关联信息</h2>
            
            {/* 项目和需求 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所属项目
                </label>
                <select
                  {...register('project_id')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={!!projectId}
                >
                  <option value="">选择项目</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  关联需求
                </label>
                <select
                  {...register('requirement_id')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={!!requirementId || !watchProjectId}
                >
                  <option value="">选择需求</option>
                  {requirements.map(requirement => (
                    <option key={requirement.id} value={requirement.id}>
                      {requirement.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 负责人 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                负责人
              </label>
              <select
                {...register('assignee_id')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">选择负责人</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 日期信息 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期
                </label>
                <input
                  type="date"
                  {...register('start_date')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  截止日期
                </label>
                <input
                  type="date"
                  {...register('due_date')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            {/* 依赖任务 */}
            {watchProjectId && tasks.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  依赖任务
                </label>
                <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
                  {tasks.map(task => (
                    <div key={task.id} className="mb-1 flex items-center">
                      <input
                        type="checkbox"
                        id={`dep-${task.id}`}
                        checked={selectedDependencies.includes(task.id)}
                        onChange={() => handleDependencyChange(task.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`dep-${task.id}`} className="text-sm">
                        {task.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 提交按钮 */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 mr-2"
          >
            取消
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                处理中...
              </>
            ) : (
              <>
                <Save className="mr-1 h-4 w-4" />
                {isEditMode ? '保存修改' : '创建任务'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm; 
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  getProjectById, 
  deleteProject, 
  getProjectMembers,
  addProjectMember,
  removeProjectMember
} from '../services/projectService';
import { formatDate, daysBetween } from '../utils/dateUtils';
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Users, 
  Plus,
  X,
  AlertTriangle,
  FileText,
  CheckSquare
} from 'lucide-react';

// 项目状态映射
const STATUS_MAP = {
  'planning': { label: '规划中', color: 'bg-purple-100 text-purple-600' },
  'in_progress': { label: '进行中', color: 'bg-blue-100 text-blue-600' },
  'completed': { label: '已完成', color: 'bg-green-100 text-green-600' },
  'on_hold': { label: '已暂停', color: 'bg-amber-100 text-amber-600' },
  'cancelled': { label: '已取消', color: 'bg-red-100 text-red-600' }
};

// 成员角色映射
const ROLE_MAP = {
  'owner': { label: '所有者', color: 'bg-purple-100 text-purple-600' },
  'admin': { label: '管理员', color: 'bg-blue-100 text-blue-600' },
  'member': { label: '成员', color: 'bg-green-100 text-green-600' },
  'viewer': { label: '观察者', color: 'bg-gray-100 text-gray-600' }
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // 删除确认状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // 添加成员状态
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ userId: '', role: 'member' });
  const [addMemberError, setAddMemberError] = useState('');
  
  // 获取项目详情
  const { 
    data: project, 
    isLoading: isLoadingProject,
    error: projectError
  } = useQuery(['project', id], () => getProjectById(id));
  
  // 获取项目成员
  const {
    data: members,
    isLoading: isLoadingMembers,
    error: membersError
  } = useQuery(['projectMembers', id], () => getProjectMembers(id));
  
  // 删除项目
  const deleteMutation = useMutation(deleteProject, {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
      navigate('/projects');
    }
  });
  
  // 添加成员
  const addMemberMutation = useMutation(
    (data) => addProjectMember(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projectMembers', id]);
        setShowAddMember(false);
        setNewMember({ userId: '', role: 'member' });
        setAddMemberError('');
      },
      onError: (error) => {
        setAddMemberError(error.response?.data?.message || '添加成员失败');
      }
    }
  );
  
  // 移除成员
  const removeMemberMutation = useMutation(
    (userId) => removeProjectMember(id, userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projectMembers', id]);
      }
    }
  );
  
  // 处理编辑项目
  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };
  
  // 处理删除项目
  const handleDelete = () => {
    deleteMutation.mutate(id);
  };
  
  // 处理添加成员
  const handleAddMember = (e) => {
    e.preventDefault();
    
    if (!newMember.userId.trim()) {
      setAddMemberError('请输入用户ID');
      return;
    }
    
    addMemberMutation.mutate(newMember);
  };
  
  // 处理移除成员
  const handleRemoveMember = (userId) => {
    if (window.confirm('确定要移除该成员吗？')) {
      removeMemberMutation.mutate(userId);
    }
  };
  
  // 计算项目进度
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
  
  // 加载中状态
  if (isLoadingProject) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // 错误状态
  if (projectError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>加载项目详情失败: {projectError.message}</p>
          <button 
            onClick={() => navigate('/projects')}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            返回项目列表
          </button>
        </div>
      </div>
    );
  }
  
  // 项目不存在
  if (!project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>项目不存在或您没有权限访问</p>
          <button 
            onClick={() => navigate('/projects')}
            className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            返回项目列表
          </button>
        </div>
      </div>
    );
  }
  
  const progress = calculateProgress(project.start_date, project.end_date);
  const duration = daysBetween(project.start_date, project.end_date);
  const statusInfo = STATUS_MAP[project.status] || { label: '未知', color: 'bg-gray-100 text-gray-600' };
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* 项目标题和操作 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <div className="flex items-center mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {project.creator && (
              <span className="ml-4 text-gray-600 text-sm">
                创建者: {project.creator.username}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Edit className="mr-1 h-4 w-4" />
            编辑
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            删除
          </button>
        </div>
      </div>
      
      {/* 项目详情卡片 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 左侧：项目信息 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">项目信息</h2>
            
            {/* 项目描述 */}
            <div className="mb-6">
              <h3 className="text-gray-700 font-medium mb-2">描述</h3>
              <p className="text-gray-600">
                {project.description || '暂无描述'}
              </p>
            </div>
            
            {/* 项目日期 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">开始日期</p>
                  <p className="font-medium">
                    {project.start_date ? formatDate(project.start_date) : '未设置'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">结束日期</p>
                  <p className="font-medium">
                    {project.end_date ? formatDate(project.end_date) : '未设置'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 项目进度 */}
            {project.start_date && project.end_date && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-gray-700 font-medium">项目进度</h3>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  项目周期: {duration} 天
                </p>
              </div>
            )}
            
            {/* 项目功能链接 */}
            <div className="mt-6">
              <h3 className="text-gray-700 font-medium mb-3">项目功能</h3>
              <div className="space-y-2">
                <Link
                  to={`/projects/${project.id}/requirements`}
                  className="w-full text-left px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 flex items-center"
                >
                  <FileText className="mr-1 h-4 w-4" />
                  需求列表
                </Link>
                <Link
                  to={`/projects/${project.id}/tasks`}
                  className="w-full text-left px-4 py-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 flex items-center"
                >
                  <CheckSquare className="mr-1 h-4 w-4" />
                  任务列表
                </Link>
              </div>
            </div>
          </div>
          
          {/* 右侧：项目成员 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">项目成员</h2>
              <button
                onClick={() => setShowAddMember(true)}
                className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-dark text-sm flex items-center"
              >
                <Plus className="mr-1 h-3 w-3" />
                添加成员
              </button>
            </div>
            
            {isLoadingMembers ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : membersError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>加载成员列表失败</p>
              </div>
            ) : members && members.length > 0 ? (
              <div className="space-y-3">
                {members.map((member) => {
                  const roleInfo = ROLE_MAP[member.role] || { label: '未知', color: 'bg-gray-100 text-gray-600' };
                  
                  return (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mr-3">
                          {member.user?.avatar_url ? (
                            <img 
                              src={member.user.avatar_url} 
                              alt={member.user.username} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {member.user?.username?.charAt(0).toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{member.user?.username || '未知用户'}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        </div>
                      </div>
                      
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="text-red-500 hover:text-red-700"
                          title="移除成员"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">暂无项目成员</p>
              </div>
            )}
            
            {/* 添加成员表单 */}
            {showAddMember && (
              <div className="mt-4 p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">添加新成员</h3>
                  <button
                    onClick={() => {
                      setShowAddMember(false);
                      setNewMember({ userId: '', role: 'member' });
                      setAddMemberError('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {addMemberError && (
                  <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    {addMemberError}
                  </div>
                )}
                
                <form onSubmit={handleAddMember}>
                  <div className="mb-3">
                    <label htmlFor="userId" className="block text-gray-700 text-sm font-medium mb-1">
                      用户ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="userId"
                      value={newMember.userId}
                      onChange={(e) => setNewMember({ ...newMember, userId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="输入用户ID"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="role" className="block text-gray-700 text-sm font-medium mb-1">
                      角色
                    </label>
                    <select
                      id="role"
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="admin">管理员</option>
                      <option value="member">成员</option>
                      <option value="viewer">观察者</option>
                    </select>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                    disabled={addMemberMutation.isLoading}
                  >
                    {addMemberMutation.isLoading ? '添加中...' : '添加成员'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-bold">确认删除</h3>
            </div>
            
            <p className="mb-6">
              您确定要删除项目 <span className="font-semibold">"{project.name}"</span> 吗？此操作无法撤销。
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={deleteMutation.isLoading}
              >
                {deleteMutation.isLoading ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail; 
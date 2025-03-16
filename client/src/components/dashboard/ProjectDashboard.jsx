import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export const ProjectDashboard = ({ projectId }) => {
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    progress: 0,
    teamMembers: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        // 获取项目信息
        const projectResponse = await api.get(`/api/v1/projects/${projectId}`);
        setProject(projectResponse.data);

        // 获取项目统计信息
        const statsResponse = await api.get(`/api/v1/projects/${projectId}/stats`);
        setStats(statsResponse.data);

        // 获取项目活动记录
        const activitiesResponse = await api.get(`/api/v1/projects/${projectId}/activities`);
        setActivities(activitiesResponse.data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('加载项目数据时出错');
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    } else {
      // 如果没有projectId，使用模拟数据（开发阶段）
      setProject({
        id: 'demo-project',
        name: '演示项目',
        description: '这是一个演示项目，用于展示仪表盘功能',
        status: 'in_progress',
        start_date: '2023-01-01',
        end_date: '2023-12-31'
      });
      
      setStats({
        totalTasks: 24,
        completedTasks: 10,
        pendingTasks: 14,
        progress: 42,
        teamMembers: 5
      });
      
      setActivities([
        { id: 1, type: 'task_completed', user: '张三', description: '完成了任务"设计登录页面"', timestamp: '2023-10-15T14:30:00' },
        { id: 2, type: 'comment_added', user: '李四', description: '在任务"实现用户认证"中添加了评论', timestamp: '2023-10-14T10:15:00' },
        { id: 3, type: 'member_joined', user: '王五', description: '加入了项目团队', timestamp: '2023-10-13T09:00:00' },
        { id: 4, type: 'task_created', user: '赵六', description: '创建了新任务"实现数据库连接"', timestamp: '2023-10-12T16:45:00' }
      ]);
      
      setLoading(false);
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">错误!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  // 函数：格式化日期
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('zh-CN', options);
  };

  // 函数：格式化时间戳为相对时间
  const formatRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} 天前`;
    } else if (diffHours > 0) {
      return `${diffHours} 小时前`;
    } else if (diffMins > 0) {
      return `${diffMins} 分钟前`;
    } else {
      return '刚刚';
    }
  };

  // 状态徽章颜色映射
  const statusVariantMap = {
    planning: 'primary',
    in_progress: 'warning',
    completed: 'success',
    on_hold: 'default',
    cancelled: 'danger'
  };

  // 状态显示名称映射
  const statusNameMap = {
    planning: '规划中',
    in_progress: '进行中',
    completed: '已完成',
    on_hold: '已暂停',
    cancelled: '已取消'
  };

  return (
    <div className="space-y-6">
      {/* 项目信息卡片 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Badge variant={statusVariantMap[project.status]}>{statusNameMap[project.status]}</Badge>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">{project.name}</h2>
            </div>
            <div className="flex space-x-2">
              <Link 
                to={`/projects/${project.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                编辑
              </Link>
              <Link 
                to={`/projects/${project.id}/tasks/new`}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                添加任务
              </Link>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">{project.description}</p>
        </CardHeader>
        <CardContent>
          <div className="mt-4">
            <Progress value={stats.progress} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-indigo-500">总任务</div>
              <div className="mt-1 text-3xl font-semibold">{stats.totalTasks}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-500">已完成</div>
              <div className="mt-1 text-3xl font-semibold">{stats.completedTasks}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-yellow-500">进行中</div>
              <div className="mt-1 text-3xl font-semibold">{stats.pendingTasks}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-500">团队成员</div>
              <div className="mt-1 text-3xl font-semibold">{stats.teamMembers}</div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex justify-between w-full text-sm">
            <div>起始日期: <span className="font-medium">{formatDate(project.start_date)}</span></div>
            <div>结束日期: <span className="font-medium">{formatDate(project.end_date)}</span></div>
          </div>
        </CardFooter>
      </Card>

      {/* 近期活动 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">近期活动</h3>
        </CardHeader>
        <CardContent>
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== activities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">{activity.user}</span> {activity.description}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {formatRelativeTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Link 
            to={`/projects/${project.id}/activities`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            查看所有活动
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}; 
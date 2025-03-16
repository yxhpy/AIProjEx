import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProjectDashboard } from '../components/dashboard/ProjectDashboard';
import { TaskDistributionChart } from '../components/dashboard/TaskDistributionChart';
import { TeamActivitySummary } from '../components/dashboard/TeamActivitySummary';
import api from '../services/api';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    totalPrototypes: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // 获取用户项目和统计信息
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // 尝试从API获取数据
        try {
          // 获取用户项目
          const projectsResponse = await api.get('/api/v1/projects');
          setProjects(projectsResponse.data);
          
          // 获取用户统计信息
          const statsResponse = await api.get('/api/v1/dashboard/stats');
          setStats(statsResponse.data);
          
          // 如果有项目，默认选择第一个
          if (projectsResponse.data.length > 0) {
            setSelectedProject(projectsResponse.data[0].id);
          }
        } catch (error) {
          console.error('无法从API获取数据，使用演示数据', error);
          
          // 使用演示数据
          const demoProjects = [
            { 
              id: 'demo-project-1', 
              name: '企业网站重构', 
              description: '对公司官网进行全新设计和技术栈升级',
              status: 'in_progress',
              progress: 65
            },
            { 
              id: 'demo-project-2', 
              name: '移动应用开发', 
              description: '开发基于React Native的跨平台移动应用',
              status: 'planning',
              progress: 25
            },
            { 
              id: 'demo-project-3', 
              name: '数据分析平台', 
              description: '构建内部使用的数据分析和可视化平台',
              status: 'completed',
              progress: 100
            }
          ];
          
          setProjects(demoProjects);
          setStats({
            totalProjects: 3,
            inProgressTasks: 8,
            completedTasks: 15,
            totalPrototypes: 4
          });
          
          // 默认选择第一个项目
          setSelectedProject('demo-project-1');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('获取数据出错:', err);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // 处理项目选择
  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">AIProjEx</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  仪表盘
                </Link>
                <Link
                  to="/projects"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  项目
                </Link>
                <Link
                  to="/tasks"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  任务
                </Link>
                <Link
                  to="/prototypes"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  原型
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <button
                    className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                  >
                    <span className="sr-only">查看通知</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                  <div className="text-sm font-medium text-gray-700 mr-3">
                    {currentUser?.username || currentUser?.email}
                  </div>
                  <button
                    onClick={logout}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    退出
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 欢迎区域 */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                欢迎回来，{currentUser?.username || '用户'}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                这是您的项目管理仪表盘，您可以在这里查看和管理您的项目。
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    项目数量
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {stats.totalProjects}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    进行中的任务
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {stats.inProgressTasks}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    已完成的任务
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {stats.completedTasks}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    原型数量
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {stats.totalPrototypes}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* 项目创建卡片 */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">创建新项目</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      开始一个新的项目，并添加需求和任务。
                    </p>
                    <div className="mt-3">
                      <Link
                        to="/projects/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        创建项目
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">添加任务</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      为您的项目添加新任务和跟踪进度。
                    </p>
                    <div className="mt-3">
                      <Link
                        to="/tasks/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        添加任务
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">设计原型</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      创建和预览项目原型，可以使用AI辅助生成。
                    </p>
                    <div className="mt-3">
                      <Link
                        to="/prototypes/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        创建原型
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 项目选择器 */}
          {projects.length > 0 && (
            <div className="mt-8">
              <div className="sm:flex sm:items-center sm:justify-between">
                <h3 className="text-lg font-medium leading-6 text-gray-900">项目概览</h3>
                <div className="mt-3 sm:mt-0 sm:ml-4">
                  <select
                    id="project-select"
                    name="project-select"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedProject}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* 项目仪表盘 */}
          {selectedProject && (
            <div className="mt-4">
              <ProjectDashboard projectId={selectedProject} />
            </div>
          )}
          
          {/* 数据分析图表 */}
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <TaskDistributionChart />
            <TeamActivitySummary />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
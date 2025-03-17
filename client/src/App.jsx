import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// 引入页面组件
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserSettings from './pages/UserSettings';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import ProjectForm from './pages/ProjectForm';
import RequirementList from './pages/RequirementList';
import RequirementDetail from './pages/RequirementDetail';
import RequirementForm from './pages/RequirementForm';
import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';
import TaskForm from './pages/TaskForm';

// 加载中组件
const PageLoader = () => (
  <div className="flex items-center justify-center w-full h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* 公共路由 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 需要认证的路由 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <UserSettings />
              </ProtectedRoute>
            } 
          />
          
          {/* 项目相关路由 */}
          <Route 
            path="/projects" 
            element={
              <ProtectedRoute>
                <ProjectList />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/projects/create" 
            element={
              <ProtectedRoute>
                <ProjectForm />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/projects/:id" 
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/projects/:id/edit" 
            element={
              <ProtectedRoute>
                <ProjectForm />
              </ProtectedRoute>
            } 
          />
          
          {/* 需求相关路由 */}
          <Route 
            path="/projects/:projectId/requirements" 
            element={
              <ProtectedRoute>
                <RequirementList />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/projects/:projectId/requirements/new" 
            element={
              <ProtectedRoute>
                <RequirementForm />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/requirements/:id" 
            element={
              <ProtectedRoute>
                <RequirementDetail />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/requirements/:id/edit" 
            element={
              <ProtectedRoute>
                <RequirementForm />
              </ProtectedRoute>
            } 
          />
          
          {/* 任务相关路由 */}
          <Route 
            path="/tasks" 
            element={
              <ProtectedRoute>
                <TaskList />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/projects/:projectId/tasks" 
            element={
              <ProtectedRoute>
                <TaskList />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/requirements/:requirementId/tasks" 
            element={
              <ProtectedRoute>
                <TaskList />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/tasks/:id" 
            element={
              <ProtectedRoute>
                <TaskDetail />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/tasks/:id/edit" 
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/projects/:projectId/tasks/new" 
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/requirements/:requirementId/tasks/new" 
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/prototypes" 
            element={
              <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-2xl font-bold text-gray-700">原型功能开发中...</h1>
                </div>
              </ProtectedRoute>
            } 
          />

          {/* 404页面 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-indigo-600">404</h1>
                <p className="text-xl mt-4">页面未找到</p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  返回首页
                </button>
              </div>
            </div>
          } />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App; 
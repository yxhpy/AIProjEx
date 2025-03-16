import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from '@/components/Layout/Layout';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

// 懒加载页面组件
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Login = lazy(() => import('@/pages/Auth/Login'));
const Register = lazy(() => import('@/pages/Auth/Register'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Projects = lazy(() => import('@/pages/Projects/Projects'));
const ProjectDetail = lazy(() => import('@/pages/Projects/ProjectDetail'));
const RequirementsAnalysis = lazy(() => import('@/pages/Requirements/RequirementsAnalysis'));
const TaskManagement = lazy(() => import('@/pages/Tasks/TaskManagement'));
const Prototypes = lazy(() => import('@/pages/Prototypes/Prototypes'));
const PrototypePreview = lazy(() => import('@/pages/Prototypes/PrototypePreview'));
const Settings = lazy(() => import('@/pages/Settings/Settings'));

// 加载中组件
const PageLoader = () => (
  <div className="flex items-center justify-center w-full h-[calc(100vh-64px)]">
    <LoadingSpinner size="large" />
  </div>
);

function App() {
  // 这里将来可添加认证逻辑
  const isAuthenticated = false;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 公共路由 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 需要认证的路由 */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/requirements" element={<RequirementsAnalysis />} />
          <Route path="/projects/:id/tasks" element={<TaskManagement />} />
          <Route path="/projects/:id/prototypes" element={<Prototypes />} />
          <Route path="/projects/:id/prototypes/:prototypeId" element={<PrototypePreview />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* 404页面 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App; 
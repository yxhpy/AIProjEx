import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * 受保护路由组件
 * 用于保护需要用户登录才能访问的路由
 * 未认证用户将被重定向到登录页面
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading: isLoading } = useAuth();
  const location = useLocation();

  // 认证状态加载中时显示加载中提示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-indigo-600 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果用户未登录，重定向到登录页面，并传递当前位置信息
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果用户已登录，渲染子元素
  return children;
};

export default ProtectedRoute; 
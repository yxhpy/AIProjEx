import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserSettings = () => {
  const { user, updateUser, updatePassword, error: authError } = useAuth();
  
  // 个人信息表单状态
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    avatarUrl: '',
  });
  
  // 密码更改表单状态
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // 错误和成功消息状态
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // 加载状态
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  
  // 初始化个人信息表单
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        avatarUrl: user.avatar_url || '',
      });
    }
  }, [user]);
  
  // 个人信息表单变更处理函数
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
    
    // 清除错误消息
    if (profileErrors[name]) {
      setProfileErrors({
        ...profileErrors,
        [name]: '',
      });
    }
    
    // 清除成功消息
    if (profileSuccess) {
      setProfileSuccess('');
    }
  };
  
  // 密码表单变更处理函数
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
    
    // 清除错误消息
    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: '',
      });
    }
    
    // 清除成功消息
    if (passwordSuccess) {
      setPasswordSuccess('');
    }
  };
  
  // 验证个人信息表单
  const validateProfileForm = () => {
    const errors = {};
    
    if (!profileData.username) {
      errors.username = '请输入用户名';
    } else if (profileData.username.length < 3) {
      errors.username = '用户名至少需要3个字符';
    }
    
    if (!profileData.email) {
      errors.email = '请输入邮箱';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = '请输入有效的邮箱地址';
    }
    
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 验证密码表单
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = '请输入当前密码';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = '请输入新密码';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = '密码至少需要6个字符';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = '请确认新密码';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不匹配';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 提交个人信息表单
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setIsProfileLoading(true);
    setProfileSuccess('');
    
    try {
      await updateUser(profileData);
      setProfileSuccess('个人信息更新成功！');
    } catch (error) {
      setProfileErrors({
        general: error.message || '更新个人信息失败，请重试',
      });
    } finally {
      setIsProfileLoading(false);
    }
  };
  
  // 提交密码表单
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsPasswordLoading(true);
    setPasswordSuccess('');
    
    try {
      await updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      // 重置密码表单
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setPasswordSuccess('密码修改成功！');
    } catch (error) {
      setPasswordErrors({
        general: error.message || '更新密码失败，请重试',
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">用户设置</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">个人信息</h2>
        
        {profileSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <p className="text-sm text-green-700">{profileSuccess}</p>
          </div>
        )}
        
        {profileErrors.general && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-sm text-red-700">{profileErrors.general}</p>
          </div>
        )}
        
        <form onSubmit={handleProfileSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={profileData.username}
              onChange={handleProfileChange}
              className={`block w-full px-3 py-2 border ${
                profileErrors.username ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {profileErrors.username && (
              <p className="mt-1 text-sm text-red-600">{profileErrors.username}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              电子邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={profileData.email}
              onChange={handleProfileChange}
              className={`block w-full px-3 py-2 border ${
                profileErrors.email ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {profileErrors.email && (
              <p className="mt-1 text-sm text-red-600">{profileErrors.email}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-2">
              头像URL（可选）
            </label>
            <input
              id="avatarUrl"
              name="avatarUrl"
              type="text"
              value={profileData.avatarUrl}
              onChange={handleProfileChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isProfileLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
            >
              {isProfileLoading ? '保存中...' : '保存更改'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">更改密码</h2>
        
        {passwordSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <p className="text-sm text-green-700">{passwordSuccess}</p>
          </div>
        )}
        
        {passwordErrors.general && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-sm text-red-700">{passwordErrors.general}</p>
          </div>
        )}
        
        <form onSubmit={handlePasswordSubmit}>
          <div className="mb-4">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              当前密码
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className={`block w-full px-3 py-2 border ${
                passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              新密码
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className={`block w-full px-3 py-2 border ${
                passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              确认新密码
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className={`block w-full px-3 py-2 border ${
                passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
            )}
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isPasswordLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
            >
              {isPasswordLoading ? '更新中...' : '更新密码'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserSettings; 
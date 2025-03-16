import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

// 创建认证上下文
const AuthContext = createContext(null);

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 检查本地存储的令牌和用户信息
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
          
          // 验证令牌有效性（可选）
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } catch (err) {
            // 令牌可能已经过期，清除本地存储
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('检查认证状态失败', err);
        setError('检查认证状态失败');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 用户注册
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const { user, token } = await authService.register(userData);
      
      // 存储用户信息和令牌
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message || '注册失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 用户登录
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const { user, token } = await authService.login(credentials);
      
      // 存储用户信息和令牌
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message || '登录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 用户退出登录
  const logout = () => {
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setUser(null);
  };

  // 更新用户信息
  const updateUser = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await authService.updateUser(userData);
      
      // 更新本地存储的用户信息
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const newUser = { ...storedUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError(err.message || '更新用户信息失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 更新密码
  const updatePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);
      await authService.updatePassword(passwordData);
    } catch (err) {
      setError(err.message || '更新密码失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 提供的上下文值
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateUser,
    updatePassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子，方便使用认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return context;
}; 
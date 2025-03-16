/**
 * 格式化日期为本地字符串
 * @param {string|Date} date - 日期字符串或Date对象
 * @param {Object} options - 格式化选项
 * @returns {string} - 格式化后的日期字符串
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // 默认选项
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  // 合并选项
  const formatOptions = { ...defaultOptions, ...options };
  
  return dateObj.toLocaleDateString('zh-CN', formatOptions);
};

/**
 * 格式化日期时间为本地字符串
 * @param {string|Date} date - 日期字符串或Date对象
 * @param {Object} options - 格式化选项
 * @returns {string} - 格式化后的日期时间字符串
 */
export const formatDateTime = (date, options = {}) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // 默认选项
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  // 合并选项
  const formatOptions = { ...defaultOptions, ...options };
  
  return dateObj.toLocaleString('zh-CN', formatOptions);
};

/**
 * 计算两个日期之间的天数差
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @returns {number} - 天数差
 */
export const daysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // 转换为UTC时间戳并计算差值（毫秒）
  const diffTime = Math.abs(end.getTime() - start.getTime());
  
  // 转换为天数
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * 检查日期是否已过期
 * @param {string|Date} date - 要检查的日期
 * @returns {boolean} - 是否已过期
 */
export const isExpired = (date) => {
  if (!date) return false;
  
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  // 设置时间为当天的结束时间
  today.setHours(23, 59, 59, 999);
  
  return checkDate < today;
};

/**
 * 获取相对时间描述（例如：3天前，刚刚）
 * @param {string|Date} date - 日期
 * @returns {string} - 相对时间描述
 */
export const getRelativeTimeDescription = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const pastDate = typeof date === 'string' ? new Date(date) : date;
  const diffTime = now.getTime() - pastDate.getTime();
  
  // 转换为秒
  const diffSeconds = Math.floor(diffTime / 1000);
  
  if (diffSeconds < 60) {
    return '刚刚';
  }
  
  // 转换为分钟
  const diffMinutes = Math.floor(diffSeconds / 60);
  
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }
  
  // 转换为小时
  const diffHours = Math.floor(diffMinutes / 60);
  
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }
  
  // 转换为天
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays < 30) {
    return `${diffDays}天前`;
  }
  
  // 转换为月
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffMonths < 12) {
    return `${diffMonths}个月前`;
  }
  
  // 转换为年
  const diffYears = Math.floor(diffMonths / 12);
  
  return `${diffYears}年前`;
}; 
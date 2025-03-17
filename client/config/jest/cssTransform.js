/**
 * CSS文件转换器
 * 将CSS文件转换为空模块
 */
module.exports = {
  process() {
    return 'module.exports = {};';
  },
  getCacheKey() {
    return 'cssTransform';
  },
}; 
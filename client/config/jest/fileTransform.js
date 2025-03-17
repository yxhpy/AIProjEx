/**
 * 文件转换器
 * 将静态资源文件转换为文件名
 */
const path = require('path');

module.exports = {
  process(src, filename) {
    return `module.exports = ${JSON.stringify(path.basename(filename))};`;
  },
  getCacheKey() {
    return 'fileTransform';
  },
}; 
/**
 * 测试设置文件
 * 配置测试环境
 */

// 添加Jest DOM扩展
import '@testing-library/jest-dom';

// 模拟全局对象
global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
}; 
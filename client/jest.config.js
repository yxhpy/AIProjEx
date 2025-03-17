/**
 * 客户端测试Jest配置
 */
module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 测试文件匹配模式
  testMatch: ['**/*.test.{js,jsx}'],
  
  // 转换器配置
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|css|json)$)': '<rootDir>/config/jest/fileTransform.js'
  },
  
  // 转换器忽略模式
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  
  // 模块名称映射
  moduleNameMapper: {
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 测试覆盖率收集
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/**/*.d.ts'],
  
  // 设置覆盖率目录
  coverageDirectory: '../coverage/client',
  
  // 测试设置文件
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // 解析器配置
  resolveSnapshotPath: (testPath, snapExtension) => 
    testPath.replace(/\.test\.[^.]+?$/, snapExtension),
    
  // Babel配置
  globals: {
    'babel-jest': {
      presets: [
        '@babel/preset-env', 
        ['@babel/preset-react', { runtime: 'automatic' }]
      ],
      plugins: ['@babel/plugin-transform-runtime']
    }
  }
}; 
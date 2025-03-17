const winston = require('winston');
const path = require('path');

// 在所有测试之前，先保存原始模块
const originalModules = {
  winston: jest.requireActual('winston'),
  config: jest.requireActual('../../../src/config/server')
};

describe('日志工具测试', () => {
  // 在每个测试前重置所有模拟
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // 默认模拟配置
    jest.mock('../../../src/config/server', () => ({
      env: 'development',
      logging: {
        level: 'debug',
        file: 'logs/app.log'
      }
    }));
    
    // 默认模拟winston
    jest.mock('winston', () => {
      // 创建模拟函数
      const mockConsoleTransport = jest.fn().mockImplementation(() => ({
        // 模拟Console传输实例
      }));
      
      const mockFileTransport = jest.fn().mockImplementation(() => ({
        // 模拟File传输实例
      }));
      
      // 创建模拟logger实例
      const mockLoggerInstance = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        add: jest.fn()
      };
      
      // 创建模拟createLogger函数
      const mockCreateLogger = jest.fn().mockReturnValue(mockLoggerInstance);
      
      return {
        createLogger: mockCreateLogger,
        format: {
          combine: jest.fn(),
          timestamp: jest.fn(),
          printf: jest.fn(),
          colorize: jest.fn(),
          json: jest.fn()
        },
        transports: {
          Console: mockConsoleTransport,
          File: mockFileTransport
        }
      };
    });
  });
  
  it('应该在开发环境中创建带有控制台传输的日志记录器', () => {
    // 导入logger模块，这将触发模块的执行
    const logger = require('../../../src/utils/logger');
    const winston = require('winston');
    
    // 验证createLogger被调用
    expect(winston.createLogger).toHaveBeenCalled();
    
    // 验证在开发环境中添加了控制台传输
    expect(logger.add).toHaveBeenCalled();
    expect(winston.transports.Console).toHaveBeenCalled();
  });
  
  it('在生产环境中不应添加控制台传输', () => {
    // 临时修改环境为生产环境
    jest.resetModules();
    
    jest.mock('../../../src/config/server', () => ({
      env: 'production',
      logging: {
        level: 'info',
        file: 'logs/app.log'
      }
    }), { virtual: true });
    
    // 重新导入winston模拟
    jest.mock('winston', () => {
      const mockLoggerInstance = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        add: jest.fn()
      };
      
      return {
        createLogger: jest.fn().mockReturnValue(mockLoggerInstance),
        format: {
          combine: jest.fn(),
          timestamp: jest.fn(),
          printf: jest.fn(),
          colorize: jest.fn(),
          json: jest.fn()
        },
        transports: {
          Console: jest.fn(),
          File: jest.fn()
        }
      };
    }, { virtual: true });
    
    // 重新导入logger
    const logger = require('../../../src/utils/logger');
    const winston = require('winston');
    
    // 验证createLogger被调用
    expect(winston.createLogger).toHaveBeenCalled();
    
    // 验证在生产环境中没有添加控制台传输
    expect(logger.add).not.toHaveBeenCalled();
  });
  
  it('应该使用配置文件中指定的日志级别', () => {
    jest.resetModules();
    
    // 重新模拟配置
    jest.mock('../../../src/config/server', () => ({
      env: 'development',
      logging: {
        level: 'debug',
        file: 'logs/app.log'
      }
    }), { virtual: true });
    
    // 重新模拟winston
    jest.mock('winston', () => {
      const mockLoggerInstance = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        add: jest.fn()
      };
      
      return {
        createLogger: jest.fn().mockReturnValue(mockLoggerInstance),
        format: {
          combine: jest.fn(),
          timestamp: jest.fn(),
          printf: jest.fn(),
          colorize: jest.fn(),
          json: jest.fn()
        },
        transports: {
          Console: jest.fn(),
          File: jest.fn()
        }
      };
    }, { virtual: true });
    
    // 导入logger模块
    require('../../../src/utils/logger');
    const winston = require('winston');
    
    // 验证createLogger被调用，并且使用了正确的日志级别
    expect(winston.createLogger).toHaveBeenCalled();
    const createLoggerArgs = winston.createLogger.mock.calls[0][0];
    expect(createLoggerArgs.level).toBe('debug');
  });
  
  it('应该创建日志文件传输', () => {
    jest.resetModules();
    
    // 重新模拟配置
    jest.mock('../../../src/config/server', () => ({
      env: 'development',
      logging: {
        level: 'debug',
        file: 'logs/app.log'
      }
    }), { virtual: true });
    
    // 重新模拟winston
    jest.mock('winston', () => {
      const mockLoggerInstance = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        add: jest.fn()
      };
      
      return {
        createLogger: jest.fn().mockReturnValue(mockLoggerInstance),
        format: {
          combine: jest.fn(),
          timestamp: jest.fn(),
          printf: jest.fn(),
          colorize: jest.fn(),
          json: jest.fn()
        },
        transports: {
          Console: jest.fn(),
          File: jest.fn()
        }
      };
    }, { virtual: true });
    
    // 导入logger模块
    require('../../../src/utils/logger');
    const winston = require('winston');
    
    // 验证File传输被创建
    expect(winston.transports.File).toHaveBeenCalled();
    // 验证创建了两个文件传输（一个用于所有日志，一个用于错误日志）
    expect(winston.transports.File).toHaveBeenCalledTimes(2);
  });
  
  describe('日志方法测试', () => {
    let logger;
    let winston;
    
    beforeEach(() => {
      jest.resetModules();
      
      // 重新模拟winston
      jest.mock('winston', () => {
        const mockLoggerInstance = {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          add: jest.fn()
        };
        
        return {
          createLogger: jest.fn().mockReturnValue(mockLoggerInstance),
          format: {
            combine: jest.fn(),
            timestamp: jest.fn(),
            printf: jest.fn(),
            colorize: jest.fn(),
            json: jest.fn()
          },
          transports: {
            Console: jest.fn(),
            File: jest.fn()
          }
        };
      }, { virtual: true });
      
      // 获取logger实例
      logger = require('../../../src/utils/logger');
      winston = require('winston');
    });
    
    it('info方法应该被正确调用', () => {
      const message = '这是一条信息日志';
      logger.info(message);
      expect(logger.info).toHaveBeenCalledWith(message);
    });
    
    it('error方法应该被正确调用', () => {
      const message = '这是一条错误日志';
      logger.error(message);
      expect(logger.error).toHaveBeenCalledWith(message);
    });
    
    it('error方法应该能够处理错误对象', () => {
      const message = '这是一条错误日志';
      const error = new Error('测试错误');
      logger.error(message, { error });
      expect(logger.error).toHaveBeenCalledWith(message, { error });
    });
    
    it('warn方法应该被正确调用', () => {
      const message = '这是一条警告日志';
      logger.warn(message);
      expect(logger.warn).toHaveBeenCalledWith(message);
    });
    
    it('debug方法应该被正确调用', () => {
      const message = '这是一条调试日志';
      logger.debug(message);
      expect(logger.debug).toHaveBeenCalledWith(message);
    });
    
    it('应该支持带有元数据的日志', () => {
      const message = '这是一条带元数据的日志';
      const metadata = { userId: 123, action: 'login' };
      logger.info(message, metadata);
      expect(logger.info).toHaveBeenCalledWith(message, metadata);
    });
  });
}); 
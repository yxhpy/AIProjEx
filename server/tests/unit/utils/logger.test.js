const sinon = require('sinon');
const { expect } = require('chai');
const mock = require('mock-require');
const path = require('path');

describe('日志工具测试', () => {
  let sandbox;
  let winstonMock;
  let configMock;
  let consoleTransportStub;
  let fileTransportStub;
  let createLoggerStub;
  let addStub;
  let loggerInstance;
  let logger;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // 创建模拟
    addStub = sandbox.stub();
    
    // 创建日志方法存根
    loggerInstance = {
      add: addStub,
      info: sandbox.stub(),
      error: sandbox.stub(),
      warn: sandbox.stub(),
      debug: sandbox.stub(),
      log: sandbox.stub()
    };
    
    consoleTransportStub = sandbox.stub();
    fileTransportStub = sandbox.stub();
    createLoggerStub = sandbox.stub().returns(loggerInstance);
    
    // 创建winston模拟
    winstonMock = {
      format: {
        combine: sandbox.stub().returns('combinedFormat'),
        timestamp: sandbox.stub().returns('timestampFormat'),
        printf: sandbox.stub().returns('printfFormat'),
        colorize: sandbox.stub().returns('colorizeFormat'),
        json: sandbox.stub().returns('jsonFormat')
      },
      transports: {
        Console: consoleTransportStub,
        File: fileTransportStub
      },
      createLogger: createLoggerStub
    };
    
    // 创建config模拟
    configMock = {
      env: 'development',
      logging: {
        level: 'info',
        file: 'logs/app.log'
      }
    };
    
    // 模拟依赖
    mock('winston', winstonMock);
    mock(path.resolve(__dirname, '../../../src/config/server'), configMock);
  });

  afterEach(() => {
    // 清理模拟
    mock.stopAll();
    sandbox.restore();
  });

  it('应该在开发环境中创建带有控制台传输的日志记录器', () => {
    // 设置为开发环境
    configMock.env = 'development';
    
    // 加载logger模块
    logger = require('../../../src/utils/logger');
    
    // 验证createLogger被调用
    expect(createLoggerStub.calledOnce).to.be.true;
    
    // 验证File传输被创建
    expect(fileTransportStub.called).to.be.true;
    
    // 验证控制台传输被添加
    expect(consoleTransportStub.calledOnce).to.be.true;
    expect(addStub.calledOnce).to.be.true;
  });

  it('在生产环境中不应添加控制台传输', () => {
    // 设置为生产环境
    configMock.env = 'production';
    
    // 加载logger模块
    logger = require('../../../src/utils/logger');
    
    // 验证createLogger被调用
    expect(createLoggerStub.calledOnce).to.be.true;
    
    // 验证File传输被创建
    expect(fileTransportStub.called).to.be.true;
    
    // 验证控制台传输没有被添加
    expect(addStub.called).to.be.false;
  });
  
  it('应该使用配置文件中指定的日志级别', () => {
    // 设置日志级别为debug
    configMock.logging.level = 'debug';
    
    // 加载logger模块
    logger = require('../../../src/utils/logger');
    
    // 验证createLogger被调用，并且使用了正确的日志级别
    expect(createLoggerStub.calledOnce).to.be.true;
    expect(createLoggerStub.firstCall.args[0]).to.have.property('level', 'debug');
  });
  
  it('应该创建日志文件传输', () => {
    // 设置日志文件路径
    configMock.logging.file = 'custom/path/app.log';
    
    // 加载logger模块
    logger = require('../../../src/utils/logger');
    
    // 验证File传输被创建，并且使用了正确的文件路径
    expect(fileTransportStub.called).to.be.true;
    expect(fileTransportStub.firstCall.args[0]).to.have.property('filename');
    // 由于路径拼接的复杂性，我们只检查文件名部分
    expect(fileTransportStub.firstCall.args[0].filename).to.include('custom/path/app.log');
  });
  
  it('应该为错误日志创建单独的文件传输', () => {
    // 加载logger模块
    logger = require('../../../src/utils/logger');
    
    // 验证错误日志File传输被创建，并且使用了正确的日志级别
    expect(fileTransportStub.calledTwice).to.be.true;
    expect(fileTransportStub.secondCall.args[0]).to.have.property('level', 'error');
    expect(fileTransportStub.secondCall.args[0].filename).to.include('error.log');
  });
  
  describe('日志方法测试', () => {
    beforeEach(() => {
      // 加载logger模块
      logger = require('../../../src/utils/logger');
    });
    
    it('info方法应该被正确调用', () => {
      const message = '这是一条信息日志';
      logger.info(message);
      
      expect(loggerInstance.info.calledWith(message)).to.be.true;
    });
    
    it('error方法应该被正确调用', () => {
      const message = '这是一条错误日志';
      const error = new Error('测试错误');
      logger.error(message, error);
      
      expect(loggerInstance.error.calledWith(message, error)).to.be.true;
    });
    
    it('warn方法应该被正确调用', () => {
      const message = '这是一条警告日志';
      logger.warn(message);
      
      expect(loggerInstance.warn.calledWith(message)).to.be.true;
    });
    
    it('debug方法应该被正确调用', () => {
      const message = '这是一条调试日志';
      logger.debug(message);
      
      expect(loggerInstance.debug.calledWith(message)).to.be.true;
    });
    
    it('应该支持带有元数据的日志', () => {
      const message = '这是一条带元数据的日志';
      const metadata = { userId: 123, action: 'login' };
      logger.info(message, metadata);
      
      expect(loggerInstance.info.calledWith(message, metadata)).to.be.true;
    });
  });
}); 
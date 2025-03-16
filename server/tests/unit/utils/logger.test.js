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
  let logger;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    
    // 创建模拟
    addStub = sandbox.stub();
    consoleTransportStub = sandbox.stub();
    fileTransportStub = sandbox.stub();
    createLoggerStub = sandbox.stub().returns({
      add: addStub
    });
    
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
    const logger = require('../../../src/utils/logger');
    
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
    const logger = require('../../../src/utils/logger');
    
    // 验证createLogger被调用
    expect(createLoggerStub.calledOnce).to.be.true;
    
    // 验证File传输被创建
    expect(fileTransportStub.called).to.be.true;
    
    // 验证控制台传输没有被添加
    expect(addStub.called).to.be.false;
  });
}); 
const { expect } = require('chai');
const sinon = require('sinon');
const projectController = require('../../../src/controllers/projectController');
const projectService = require('../../../src/services/projectService');
const { Project, User, ProjectMember } = require('../../../src/models');

describe('Project Controller', () => {
  let req;
  let res;
  let next;
  let serviceStub;
  
  beforeEach(() => {
    // 模拟请求对象
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: '123e4567-e89b-12d3-a456-426614174000' }
    };
    
    // 模拟响应对象
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
    
    // 模拟next函数
    next = sinon.spy();
  });
  
  afterEach(() => {
    // 清理所有stub/spy等
    sinon.restore();
  });
  
  describe('createProject', () => {
    it('应该成功创建项目', async () => {
      // 准备请求数据
      req.body = {
        name: '测试项目',
        description: '这是一个测试项目',
        status: 'planning'
      };
      
      // 模拟项目服务
      const newProject = {
        id: '456e7890-e89b-12d3-a456-426614174000',
        name: '测试项目',
        description: '这是一个测试项目',
        status: 'planning',
        owner_id: req.user.id
      };
      
      serviceStub = sinon.stub(projectService, 'createProject').resolves(newProject);
      
      // 调用控制器方法
      await projectController.createProject(req, res, next);
      
      // 验证结果
      expect(serviceStub.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.deep.equal(newProject);
    });
    
    it('用户不存在时应返回404错误', async () => {
      // 准备请求数据
      req.body = {
        name: '测试项目',
        description: '这是一个测试项目'
      };
      
      // 模拟服务抛出错误
      const error = new Error('用户不存在');
      error.statusCode = 404;
      serviceStub = sinon.stub(projectService, 'createProject').rejects(error);
      
      // 调用控制器方法
      await projectController.createProject(req, res, next);
      
      // 验证结果
      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.equal(error);
    });
    
    it('发生错误时应传递给错误处理中间件', async () => {
      // 准备请求数据
      req.body = {
        name: '测试项目',
        description: '这是一个测试项目'
      };
      
      // 模拟User.findByPk
      sinon.stub(User, 'findByPk').resolves({
        id: req.user.id,
        username: 'testuser'
      });
      
      // 模拟Project.create抛出错误
      const error = new Error('数据库错误');
      sinon.stub(Project, 'create').rejects(error);
      
      // 调用控制器方法
      await projectController.createProject(req, res, next);
      
      // 验证结果
      expect(next.calledWith(error)).to.be.true;
    });
  });
  
  describe('getProjects', () => {
    it('应该返回所有项目', async () => {
      // 模拟查询参数
      req.query = { page: '1', limit: '10' };
      
      // 模拟项目服务
      const projects = [
        { id: '1', name: '项目1', status: 'active' },
        { id: '2', name: '项目2', status: 'planning' }
      ];
      
      const result = {
        projects,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      
      serviceStub = sinon.stub(projectService, 'getProjects').resolves(result);
      
      // 调用控制器方法
      await projectController.getProjects(req, res, next);
      
      // 验证结果
      expect(serviceStub.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.deep.equal(result);
    });
    
    it('发生错误时应传递给错误处理中间件', async () => {
      // 模拟Project.findAll抛出错误
      const error = new Error('数据库错误');
      sinon.stub(Project, 'findAll').rejects(error);
      
      // 调用控制器方法
      await projectController.getProjects(req, res, next);
      
      // 验证结果
      expect(next.calledWith(error)).to.be.true;
    });
  });
  
  describe('getProjectById', () => {
    it('应该返回指定ID的项目', async () => {
      // 设置项目ID
      req.params.id = '123';
      
      // 模拟项目服务
      const project = {
        id: '123',
        name: '测试项目',
        description: '这是一个测试项目'
      };
      
      serviceStub = sinon.stub(projectService, 'getProjectById').resolves(project);
      
      // 调用控制器方法
      await projectController.getProjectById(req, res, next);
      
      // 验证结果
      expect(serviceStub.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.deep.equal(project);
    });
    
    it('项目不存在时应返回404错误', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Project.findByPk返回null（项目不存在）
      sinon.stub(Project, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await projectController.getProjectById(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('不存在');
    });
  });
  
  describe('updateProject', () => {
    it('应该成功更新项目', async () => {
      // 设置项目ID和请求体
      req.params.id = '123';
      req.body = {
        name: '更新后的项目名称',
        description: '更新后的项目描述'
      };
      
      // 模拟项目服务
      const updatedProject = {
        id: '123',
        name: '更新后的项目名称',
        description: '更新后的项目描述'
      };
      
      serviceStub = sinon.stub(projectService, 'updateProject').resolves(updatedProject);
      
      // 调用控制器方法
      await projectController.updateProject(req, res, next);
      
      // 验证结果
      expect(serviceStub.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.deep.equal(updatedProject);
    });
    
    it('项目不存在时应返回404错误', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      req.body = { name: '更新的项目名称' };
      
      // 模拟Project.findByPk返回null（项目不存在）
      sinon.stub(Project, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await projectController.updateProject(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('不存在');
    });
    
    it('非项目所有者应返回403错误', async () => {
      // 设置项目ID和请求体
      req.params.id = '123';
      req.body = {
        name: '更新后的项目名称',
        description: '更新后的项目描述'
      };
      
      // 模拟服务抛出权限错误
      const error = new Error('没有权限更新项目');
      error.statusCode = 403;
      serviceStub = sinon.stub(projectService, 'updateProject').rejects(error);
      
      // 调用控制器方法
      await projectController.updateProject(req, res, next);
      
      // 验证结果
      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.equal(error);
    });
  });
  
  describe('deleteProject', () => {
    it('应该成功删除项目', async () => {
      // 设置项目ID
      req.params.id = '123';
      
      // 模拟项目服务
      serviceStub = sinon.stub(projectService, 'deleteProject').resolves(true);
      
      // 调用控制器方法
      await projectController.deleteProject(req, res, next);
      
      // 验证结果
      expect(serviceStub.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('项目已成功删除');
    });
    
    it('项目不存在时应返回404错误', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Project.findByPk返回null（项目不存在）
      sinon.stub(Project, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await projectController.deleteProject(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('不存在');
    });
    
    it('非项目所有者应返回403错误', async () => {
      // 设置项目ID
      req.params.id = '123';
      
      // 模拟服务抛出权限错误
      const error = new Error('没有权限删除项目');
      error.statusCode = 403;
      serviceStub = sinon.stub(projectService, 'deleteProject').rejects(error);
      
      // 调用控制器方法
      await projectController.deleteProject(req, res, next);
      
      // 验证结果
      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.equal(error);
    });
  });
  
  describe('getUserProjectsById', () => {
    it('应该返回用户参与的所有项目', async () => {
      // 设置用户ID参数
      req.params.userId = req.user.id;
      
      // 模拟项目服务
      const projects = [
        { id: '1', name: '项目1', role: 'owner' },
        { id: '2', name: '项目2', role: 'member' }
      ];
      
      const result = {
        projects,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      
      serviceStub = sinon.stub(projectService, 'getProjects').resolves(result);
      
      // 调用控制器方法
      await projectController.getProjects(req, res, next);
      
      // 验证结果
      expect(serviceStub.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.deep.equal(result);
    });
    
    it('发生错误时应传递给错误处理中间件', async () => {
      // 模拟error
      const error = new Error('测试错误');
      serviceStub = sinon.stub(projectService, 'getProjects').rejects(error);
      
      // 调用控制器方法
      await projectController.getProjects(req, res, next);
      
      // 验证结果
      expect(next.calledWith(error)).to.be.true;
    });
  });
  
  describe('addProjectMember', () => {
    it('应该成功添加项目成员', async () => {
      // 设置项目ID和请求体
      req.params.id = '123';
      req.body = {
        userId: '456',
        role: 'member'
      };
      
      // 模拟项目服务
      const member = {
        id: '789',
        project_id: '123',
        user_id: '456',
        role: 'member'
      };
      
      serviceStub = sinon.stub(projectService, 'addProjectMember').resolves(member);
      
      // 调用控制器方法
      await projectController.addProjectMember(req, res, next);
      
      // 验证结果
      expect(serviceStub.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.deep.equal(member);
    });
    
    it('项目不存在时应返回404错误', async () => {
      // 设置项目ID和请求体
      req.params.id = '123';
      req.body = {
        userId: '456',
        role: 'member'
      };
      
      // 模拟服务抛出错误
      const error = new Error('项目不存在');
      error.statusCode = 404;
      serviceStub = sinon.stub(projectService, 'addProjectMember').rejects(error);
      
      // 调用控制器方法
      await projectController.addProjectMember(req, res, next);
      
      // 验证结果
      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.equal(error);
    });
    
    it('非项目所有者应返回403错误', async () => {
      // 设置项目ID和请求体
      req.params.id = '123';
      req.body = {
        userId: '456',
        role: 'member'
      };
      
      // 模拟服务抛出权限错误
      const error = new Error('没有权限添加成员');
      error.statusCode = 403;
      serviceStub = sinon.stub(projectService, 'addProjectMember').rejects(error);
      
      // 调用控制器方法
      await projectController.addProjectMember(req, res, next);
      
      // 验证结果
      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.equal(error);
    });
    
    it('要添加的用户不存在时应返回404错误', async () => {
      // 设置项目ID和请求体
      req.params.id = '123';
      req.body = {
        userId: '456',
        role: 'member'
      };
      
      // 模拟服务抛出错误
      const error = new Error('用户不存在');
      error.statusCode = 404;
      serviceStub = sinon.stub(projectService, 'addProjectMember').rejects(error);
      
      // 调用控制器方法
      await projectController.addProjectMember(req, res, next);
      
      // 验证结果
      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.equal(error);
    });
    
    it('用户已是项目成员时应返回400错误', async () => {
      // 设置项目ID和请求体
      req.params.id = '123';
      req.body = {
        userId: '456',
        role: 'member'
      };
      
      // 模拟服务抛出错误
      const error = new Error('用户已是项目成员');
      error.statusCode = 400;
      serviceStub = sinon.stub(projectService, 'addProjectMember').rejects(error);
      
      // 调用控制器方法
      await projectController.addProjectMember(req, res, next);
      
      // 验证结果
      expect(next.calledOnce).to.be.true;
      expect(next.args[0][0]).to.equal(error);
    });
  });
}); 
const { expect } = require('chai');
const sinon = require('sinon');
const projectController = require('../../../src/controllers/projectController');
const { Project, User, ProjectMember } = require('../../../src/models');

describe('Project Controller', () => {
  let req;
  let res;
  let next;
  
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
      
      // 模拟User.findByPk - 查找用户
      sinon.stub(User, 'findByPk').resolves({
        id: req.user.id,
        username: 'testuser'
      });
      
      // 模拟Project.create - 创建项目
      const newProject = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        ...req.body,
        owner_id: req.user.id
      };
      const projectCreateStub = sinon.stub(Project, 'create').resolves(newProject);
      
      // 模拟ProjectMember.create - 创建项目成员关系
      const memberCreateStub = sinon.stub(ProjectMember, 'create').resolves({
        project_id: newProject.id,
        user_id: req.user.id,
        role: 'owner'
      });
      
      // 调用控制器方法
      await projectController.createProject(req, res, next);
      
      // 验证结果
      expect(projectCreateStub.calledWith({
        ...req.body,
        owner_id: req.user.id
      })).to.be.true;
      expect(memberCreateStub.calledWith({
        project_id: newProject.id,
        user_id: req.user.id,
        role: 'owner'
      })).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0]).to.have.property('project');
    });
    
    it('用户不存在时应返回404错误', async () => {
      // 准备请求数据
      req.body = {
        name: '测试项目',
        description: '这是一个测试项目'
      };
      
      // 模拟User.findByPk - 用户不存在
      sinon.stub(User, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await projectController.createProject(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('不存在');
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
      // 模拟查询结果 - 所有项目
      const projects = [
        { id: '1', name: '项目1', status: 'active' },
        { id: '2', name: '项目2', status: 'planning' }
      ];
      
      // 模拟Project.findAll
      sinon.stub(Project, 'findAll').resolves(projects);
      
      // 调用控制器方法
      await projectController.getProjects(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('projects');
      expect(res.json.args[0][0].projects).to.deep.equal(projects);
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
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Project.findByPk
      const project = { 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        name: '测试项目',
        owner_id: '123e4567-e89b-12d3-a456-426614174000'
      };
      sinon.stub(Project, 'findByPk').resolves(project);
      
      // 调用控制器方法
      await projectController.getProjectById(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('project');
      expect(res.json.args[0][0].project).to.deep.equal(project);
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
      // 设置请求参数和请求体
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      req.body = {
        name: '更新的项目名称',
        status: 'active',
        description: '更新的项目描述'
      };
      
      // 模拟Project.findByPk
      const updateStub = sinon.stub().resolves();
      const project = { 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        name: '原项目名称',
        status: 'planning',
        description: '原项目描述',
        owner_id: req.user.id,
        update: updateStub
      };
      sinon.stub(Project, 'findByPk').resolves(project);
      
      // 调用控制器方法
      await projectController.updateProject(req, res, next);
      
      // 验证结果
      expect(updateStub.calledWith(req.body)).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('更新成功');
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
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      req.body = { name: '更新的项目名称' };
      
      // 模拟Project.findByPk - 项目存在但用户不是所有者
      const project = { 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        name: '项目名称',
        owner_id: 'different-user-id' // 不同于当前用户的ID
      };
      sinon.stub(Project, 'findByPk').resolves(project);
      
      // 调用控制器方法
      await projectController.updateProject(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('权限');
    });
  });
  
  describe('deleteProject', () => {
    it('应该成功删除项目', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Project.findByPk和destroy方法
      const destroyStub = sinon.stub().resolves();
      const project = { 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        name: '测试项目',
        owner_id: req.user.id,
        destroy: destroyStub
      };
      sinon.stub(Project, 'findByPk').resolves(project);
      
      // 调用控制器方法
      await projectController.deleteProject(req, res, next);
      
      // 验证结果
      expect(destroyStub.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('删除成功');
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
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Project.findByPk - 项目存在但用户不是所有者
      const project = { 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        name: '项目名称',
        owner_id: 'different-user-id' // 不同于当前用户的ID
      };
      sinon.stub(Project, 'findByPk').resolves(project);
      
      // 调用控制器方法
      await projectController.deleteProject(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('权限');
    });
  });
  
  describe('getProjects', () => {
    it('应该返回用户参与的所有项目', async () => {
      // 模拟查询结果 - 用户的项目
      const projects = [
        { id: '1', name: '项目1', role: 'owner' },
        { id: '2', name: '项目2', role: 'member' }
      ];
      
      // 模拟Project.findAll
      sinon.stub(Project, 'findAll').resolves(projects);
      
      // 调用控制器方法
      await projectController.getProjects(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('projects');
      expect(res.json.args[0][0].projects).to.deep.equal(projects);
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
  
  describe('addProjectMember', () => {
    it('应该成功添加项目成员', async () => {
      // 设置请求参数和请求体
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      req.body = {
        userId: '223e4567-e89b-12d3-a456-426614174001',
        role: 'member'
      };
      
      // 模拟Project.findByPk
      const project = { 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        name: '测试项目',
        owner_id: req.user.id
      };
      sinon.stub(Project, 'findByPk').resolves(project);
      
      // 模拟User.findByPk - 查找要添加的用户
      sinon.stub(User, 'findByPk').resolves({
        id: '223e4567-e89b-12d3-a456-426614174001',
        username: 'newmember'
      });
      
      // 模拟ProjectMember.findOne - 检查成员是否已存在
      sinon.stub(ProjectMember, 'findOne').resolves(null);
      
      // 模拟ProjectMember.create - 创建项目成员关系
      const newMember = {
        project_id: project.id,
        user_id: req.body.userId,
        role: req.body.role
      };
      sinon.stub(ProjectMember, 'create').resolves(newMember);
      
      // 调用控制器方法
      await projectController.addProjectMember(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('添加成功');
    });
    
    it('项目不存在时应返回404错误', async () => {
      // 设置请求参数和请求体
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      req.body = {
        userId: '223e4567-e89b-12d3-a456-426614174001',
        role: 'member'
      };
      
      // 模拟Project.findByPk返回null（项目不存在）
      sinon.stub(Project, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await projectController.addProjectMember(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('不存在');
    });
    
    it('非项目所有者应返回403错误', async () => {
      // 设置请求参数和请求体
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      req.body = {
        userId: '223e4567-e89b-12d3-a456-426614174001',
        role: 'member'
      };
      
      // 模拟Project.findByPk - 项目存在但用户不是所有者
      const project = { 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        name: '项目名称',
        owner_id: 'different-user-id' // 不同于当前用户的ID
      };
      sinon.stub(Project, 'findByPk').resolves(project);
      
      // 调用控制器方法
      await projectController.addProjectMember(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('权限');
    });
    
    it('要添加的用户不存在时应返回404错误', async () => {
      // 设置请求参数和请求体
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      req.body = {
        userId: '223e4567-e89b-12d3-a456-426614174001',
        role: 'member'
      };
      
      // 模拟Project.findByPk
      const project = { 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        name: '测试项目',
        owner_id: req.user.id
      };
      sinon.stub(Project, 'findByPk').resolves(project);
      
      // 模拟User.findByPk - 用户不存在
      sinon.stub(User, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await projectController.addProjectMember(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('用户不存在');
    });
    
    it('用户已是项目成员时应返回400错误', async () => {
      // 设置请求参数和请求体
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      req.body = {
        userId: '223e4567-e89b-12d3-a456-426614174001',
        role: 'member'
      };
      
      // 模拟Project.findByPk
      const project = { 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        name: '测试项目',
        owner_id: req.user.id
      };
      sinon.stub(Project, 'findByPk').resolves(project);
      
      // 模拟User.findByPk - 查找要添加的用户
      sinon.stub(User, 'findByPk').resolves({
        id: '223e4567-e89b-12d3-a456-426614174001',
        username: 'newmember'
      });
      
      // 模拟ProjectMember.findOne - 用户已是项目成员
      sinon.stub(ProjectMember, 'findOne').resolves({
        project_id: project.id,
        user_id: req.body.userId,
        role: 'member'
      });
      
      // 调用控制器方法
      await projectController.addProjectMember(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('已是成员');
    });
  });
}); 
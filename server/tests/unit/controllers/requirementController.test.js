const { expect } = require('chai');
const sinon = require('sinon');
const requirementController = require('../../../src/controllers/requirementController');
const { Requirement, Project, User } = require('../../../src/models');

describe('Requirement Controller', () => {
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
  
  describe('createRequirement', () => {
    it('应该成功创建需求', async () => {
      // 准备请求数据
      req.body = {
        title: '实现用户认证',
        description: '实现基于JWT的用户认证系统',
        priority: 'high',
        status: 'draft',
        acceptance_criteria: '用户能够注册、登录和退出系统',
        project_id: '123e4567-e89b-12d3-a456-426614174000'
      };
      
      // 模拟Project.findByPk
      const projectFindStub = sinon.stub(Project, 'findByPk').resolves({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '测试项目'
      });
      
      // 模拟Requirement.create
      const requirementCreateStub = sinon.stub(Requirement, 'create').resolves({
        id: '223e4567-e89b-12d3-a456-426614174001',
        ...req.body,
        created_by: req.user.id
      });
      
      // 调用控制器方法
      await requirementController.createRequirement(req, res, next);
      
      // 验证结果
      expect(projectFindStub.calledWith(req.body.project_id)).to.be.true;
      expect(requirementCreateStub.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0]).to.have.property('requirement');
    });
    
    it('项目不存在时应返回404错误', async () => {
      // 准备请求数据
      req.body = {
        title: '实现用户认证',
        project_id: '123e4567-e89b-12d3-a456-426614174000'
      };
      
      // 模拟Project.findByPk返回null（项目不存在）
      sinon.stub(Project, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await requirementController.createRequirement(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('不存在');
    });
    
    it('发生数据库错误时应传递给错误处理中间件', async () => {
      // 准备请求数据
      req.body = {
        title: '实现用户认证',
        project_id: '123e4567-e89b-12d3-a456-426614174000'
      };
      
      // 模拟Project.findByPk抛出错误
      const error = new Error('数据库错误');
      sinon.stub(Project, 'findByPk').rejects(error);
      
      // 调用控制器方法
      await requirementController.createRequirement(req, res, next);
      
      // 验证结果
      expect(next.calledWith(error)).to.be.true;
    });
  });
  
  describe('getRequirementsByProject', () => {
    it('应该返回项目的所有需求', async () => {
      // 设置请求参数
      req.params.projectId = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Project.findByPk
      sinon.stub(Project, 'findByPk').resolves({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '测试项目'
      });
      
      // 模拟Requirement.findAll
      const requirements = [
        { id: '1', title: '需求1', priority: 'high' },
        { id: '2', title: '需求2', priority: 'medium' }
      ];
      sinon.stub(Requirement, 'findAll').resolves(requirements);
      
      // 调用控制器方法
      await requirementController.getRequirementsByProject(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('data');
      expect(res.json.args[0][0].data).to.deep.equal(requirements);
    });
    
    it('项目不存在时应返回404错误', async () => {
      // 设置请求参数
      req.params.projectId = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Project.findByPk返回null（项目不存在）
      sinon.stub(Project, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await requirementController.getRequirementsByProject(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('不存在');
    });
  });
  
  describe('getRequirementById', () => {
    it('应该返回指定ID的需求', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Requirement.findByPk
      const requirement = { 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        title: '测试需求',
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        created_by: '123e4567-e89b-12d3-a456-426614174000'
      };
      sinon.stub(Requirement, 'findByPk').resolves(requirement);
      
      // 调用控制器方法
      await requirementController.getRequirementById(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('data');
      expect(res.json.args[0][0].data).to.deep.equal(requirement);
    });
    
    it('需求不存在时应返回404错误', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Requirement.findByPk返回null（需求不存在）
      sinon.stub(Requirement, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await requirementController.getRequirementById(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('不存在');
    });
  });
  
  describe('updateRequirement', () => {
    it('应该成功更新需求', async () => {
      // 模拟请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      req.body = {
        title: '更新后的需求标题',
        description: '更新后的需求描述',
        priority: 'high',
        status: 'in_progress'
      };
      
      // 模拟查询结果 - 找到需求
      const requirement = {
        id: req.params.id,
        title: '原需求标题',
        description: '原需求描述',
        priority: 'medium',
        status: 'draft',
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        created_by: req.user.id,
        update: sinon.stub().resolves(true)
      };
      
      // 模拟Requirement.findByPk
      const findByPkStub = sinon.stub(Requirement, 'findByPk');
      findByPkStub.resolves(requirement);
      
      // 模拟更新后的需求
      const updatedRequirement = {
        ...requirement,
        ...req.body 
      };
      
      // 调用控制器方法
      await requirementController.updateRequirement(req, res, next);
      
      // 验证结果
      expect(findByPkStub.calledWith(req.params.id)).to.be.true;
      expect(requirement.update.calledWith(req.body)).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('更新成功');
    });
    
    it('需求不存在时应返回404错误', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      req.body = { title: '更新的标题' };
      
      // 模拟Requirement.findByPk返回null（需求不存在）
      sinon.stub(Requirement, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await requirementController.updateRequirement(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('不存在');
    });
  });
  
  describe('deleteRequirement', () => {
    it('应该成功删除需求', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Requirement.findByPk和destroy方法
      const destroyStub = sinon.stub().resolves();
      const requirement = { 
        id: '123e4567-e89b-12d3-a456-426614174000', 
        title: '测试需求',
        destroy: destroyStub
      };
      sinon.stub(Requirement, 'findByPk').resolves(requirement);
      
      // 调用控制器方法
      await requirementController.deleteRequirement(req, res, next);
      
      // 验证结果
      expect(destroyStub.calledOnce).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('删除成功');
    });
    
    it('需求不存在时应返回404错误', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Requirement.findByPk返回null（需求不存在）
      sinon.stub(Requirement, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await requirementController.deleteRequirement(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message');
      expect(res.json.args[0][0].message).to.include('不存在');
    });
  });
}); 
const { expect } = require('chai');
const sinon = require('sinon');
const dashboardController = require('../../../src/controllers/dashboardController');
const { Project, User, Requirement, ProjectMember } = require('../../../src/models');
const { Sequelize } = require('sequelize');

describe('Dashboard Controller', () => {
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
  
  describe('getDashboardStats', () => {
    it('应该返回用户的仪表盘统计数据', async () => {
      // 模拟Project.count - 用户拥有的项目数
      const projectCountStub = sinon.stub(Project, 'count').resolves(5);
      
      // 模拟ProjectMember.count - 用户参与的项目数
      const memberCountStub = sinon.stub(ProjectMember, 'count').resolves(8);
      
      // 模拟Requirement.count - 用户创建的需求数和待处理的需求数
      const requirementCountStub = sinon.stub(Requirement, 'count');
      requirementCountStub.onFirstCall().resolves(15);
      requirementCountStub.onSecondCall().resolves(7);
      
      // 调用控制器方法
      await dashboardController.getDashboardStats(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      
      const stats = res.json.args[0][0].stats;
      expect(stats).to.have.property('ownedProjects', 5);
      expect(stats).to.have.property('memberProjects', 8);
      expect(stats).to.have.property('createdRequirements', 15);
      expect(stats).to.have.property('pendingRequirements', 7);
    });
    
    it('发生错误时应传递给错误处理中间件', async () => {
      // 模拟Project.count抛出错误
      const error = new Error('数据库错误');
      sinon.stub(Project, 'count').rejects(error);
      
      // 调用控制器方法
      await dashboardController.getDashboardStats(req, res, next);
      
      // 验证结果
      expect(next.calledWith(error)).to.be.true;
    });
  });
  
  describe('getRecentProjects', () => {
    it('应该返回用户最近参与的项目', async () => {
      // 模拟查询结果 - 用户最近的项目
      const recentProjects = [
        { id: '1', name: '项目1', status: 'active', updated_at: new Date() },
        { id: '2', name: '项目2', status: 'planning', updated_at: new Date() }
      ];
      
      // 模拟Project.findAll
      sinon.stub(Project, 'findAll').resolves(recentProjects);
      
      // 调用控制器方法
      await dashboardController.getRecentProjects(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('projects');
      expect(res.json.args[0][0].projects).to.deep.equal(recentProjects);
    });
    
    it('发生错误时应传递给错误处理中间件', async () => {
      // 模拟Project.findAll抛出错误
      const error = new Error('数据库错误');
      sinon.stub(Project, 'findAll').rejects(error);
      
      // 调用控制器方法
      await dashboardController.getRecentProjects(req, res, next);
      
      // 验证结果
      expect(next.calledWith(error)).to.be.true;
    });
  });
}); 
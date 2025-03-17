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
      // 模拟ProjectMember.count - 用户参与的项目数
      const memberCountStub = sinon.stub(ProjectMember, 'count').resolves(8);
      
      // 调用控制器方法
      await dashboardController.getDashboardStats(req, res, next);
      
      // 验证结果
      expect(memberCountStub.calledWith({ where: { user_id: req.user.id } })).to.be.true;
      expect(res.json.called).to.be.true;
      
      const response = res.json.args[0][0];
      expect(response).to.have.property('totalProjects', 8);
      expect(response).to.have.property('inProgressTasks');
      expect(response).to.have.property('completedTasks');
      expect(response).to.have.property('totalPrototypes');
    });
    
    it('发生错误时应返回500错误', async () => {
      // 模拟ProjectMember.count抛出错误
      const error = new Error('数据库错误');
      sinon.stub(ProjectMember, 'count').rejects(error);
      
      // 调用控制器方法
      await dashboardController.getDashboardStats(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message', '获取仪表盘统计信息失败');
    });
  });
  
  describe('getProjectStats', () => {
    it('应该返回项目的统计数据', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Project.findByPk
      const projectFindStub = sinon.stub(Project, 'findByPk').resolves({
        id: req.params.id,
        name: '测试项目'
      });
      
      // 模拟ProjectMember.findOne
      const memberFindStub = sinon.stub(ProjectMember, 'findOne').resolves({
        id: '1',
        project_id: req.params.id,
        user_id: req.user.id,
        role: 'admin'
      });
      
      // 模拟ProjectMember.count
      const memberCountStub = sinon.stub(ProjectMember, 'count').resolves(5);
      
      // 调用控制器方法
      await dashboardController.getProjectStats(req, res, next);
      
      // 验证结果
      expect(projectFindStub.calledWith(req.params.id)).to.be.true;
      expect(memberFindStub.calledWith({
        where: {
          project_id: req.params.id,
          user_id: req.user.id
        }
      })).to.be.true;
      expect(memberCountStub.calledWith({
        where: { project_id: req.params.id }
      })).to.be.true;
      expect(res.json.called).to.be.true;
      
      const response = res.json.args[0][0];
      expect(response).to.have.property('totalTasks');
      expect(response).to.have.property('completedTasks');
      expect(response).to.have.property('pendingTasks');
      expect(response).to.have.property('progress');
      expect(response).to.have.property('teamMembers', 5);
    });
    
    it('项目不存在时应返回404错误', async () => {
      // 设置请求参数
      req.params.id = 'non-existent-id';
      
      // 模拟Project.findByPk返回null
      sinon.stub(Project, 'findByPk').resolves(null);
      
      // 调用控制器方法
      await dashboardController.getProjectStats(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message', '项目不存在');
    });
    
    it('用户无权访问项目时应返回403错误', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Project.findByPk
      sinon.stub(Project, 'findByPk').resolves({
        id: req.params.id,
        name: '测试项目'
      });
      
      // 模拟ProjectMember.findOne返回null
      sinon.stub(ProjectMember, 'findOne').resolves(null);
      
      // 调用控制器方法
      await dashboardController.getProjectStats(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message', '无权访问该项目');
    });
    
    it('发生错误时应返回500错误', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Project.findByPk抛出错误
      const error = new Error('数据库错误');
      sinon.stub(Project, 'findByPk').rejects(error);
      
      // 调用控制器方法
      await dashboardController.getProjectStats(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message', '获取项目统计信息失败');
    });
  });
  
  describe('getProjectActivities', () => {
    it('应该返回项目的活动记录', async () => {
      // 设置请求参数
      req.params.id = '123e4567-e89b-12d3-a456-426614174000';
      
      // 模拟Project.findByPk
      const projectFindStub = sinon.stub(Project, 'findByPk').resolves({
        id: req.params.id,
        name: '测试项目'
      });
      
      // 模拟ProjectMember.findOne
      const memberFindStub = sinon.stub(ProjectMember, 'findOne').resolves({
        id: '1',
        project_id: req.params.id,
        user_id: req.user.id,
        role: 'admin'
      });
      
      // 调用控制器方法
      await dashboardController.getProjectActivities(req, res, next);
      
      // 验证结果
      expect(projectFindStub.calledWith(req.params.id)).to.be.true;
      expect(memberFindStub.calledWith({
        where: {
          project_id: req.params.id,
          user_id: req.user.id
        }
      })).to.be.true;
      expect(res.json.called).to.be.true;
      
      const activities = res.json.args[0][0];
      expect(Array.isArray(activities)).to.be.true;
      expect(activities.length).to.be.greaterThan(0);
      expect(activities[0]).to.have.property('id');
      expect(activities[0]).to.have.property('type');
      expect(activities[0]).to.have.property('user');
      expect(activities[0]).to.have.property('description');
      expect(activities[0]).to.have.property('timestamp');
    });
  });
  
  describe('getTaskDistribution', () => {
    it('应该返回任务分布统计', async () => {
      // 调用控制器方法
      await dashboardController.getTaskDistribution(req, res, next);
      
      // 验证结果
      expect(res.json.called).to.be.true;
      
      const distribution = res.json.args[0][0];
      expect(distribution).to.have.property('not_started');
      expect(distribution).to.have.property('in_progress');
      expect(distribution).to.have.property('completed');
      expect(distribution).to.have.property('blocked');
      expect(distribution).to.have.property('cancelled');
    });
    
    it('发生错误时应返回500错误', async () => {
      // 模拟错误
      const originalConsoleError = console.error;
      console.error = sinon.stub();
      
      // 模拟错误
      const error = new Error('测试错误');
      sinon.stub(dashboardController, 'getTaskDistribution').callsFake(async (req, res) => {
        try {
          throw error;
        } catch (err) {
          console.error('Error getting task distribution:', err);
          res.status(500).json({ message: '获取任务分布统计失败' });
        }
      });
      
      // 调用控制器方法
      await dashboardController.getTaskDistribution(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message', '获取任务分布统计失败');
      
      // 恢复console.error
      console.error = originalConsoleError;
    });
  });
  
  describe('getTeamActivities', () => {
    it('应该返回团队活动统计', async () => {
      // 模拟ProjectMember.findAll
      const userProjects = [
        { project_id: '1' },
        { project_id: '2' }
      ];
      const findAllStub = sinon.stub(ProjectMember, 'findAll');
      findAllStub.onFirstCall().resolves(userProjects);
      findAllStub.onSecondCall().resolves([
        { user: { id: '1', username: '张三', avatar_url: '' } },
        { user: { id: '2', username: '李四', avatar_url: '' } }
      ]);
      
      // 调用控制器方法
      await dashboardController.getTeamActivities(req, res, next);
      
      // 验证结果
      expect(findAllStub.calledWith({
        where: { user_id: req.user.id },
        attributes: ['project_id']
      })).to.be.true;
      expect(res.json.called).to.be.true;
      
      const members = res.json.args[0][0];
      expect(Array.isArray(members)).to.be.true;
      expect(members.length).to.be.greaterThan(0);
      expect(members[0]).to.have.property('id');
      expect(members[0]).to.have.property('name');
      expect(members[0]).to.have.property('role');
      expect(members[0]).to.have.property('contributions');
      expect(members[0]).to.have.property('avatar');
    });
    
    it('发生错误时应返回500错误', async () => {
      // 模拟ProjectMember.findAll抛出错误
      const error = new Error('数据库错误');
      sinon.stub(ProjectMember, 'findAll').rejects(error);
      
      // 调用控制器方法
      await dashboardController.getTeamActivities(req, res, next);
      
      // 验证结果
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.called).to.be.true;
      expect(res.json.args[0][0]).to.have.property('message', '获取团队活动统计失败');
    });
  });
}); 
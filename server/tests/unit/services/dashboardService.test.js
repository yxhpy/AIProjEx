const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const dashboardService = require('../../../src/services/dashboardService');
const { Project, Task, User, Requirement, sequelize } = require('../../../src/models');

describe('Dashboard Service', () => {
  let sandbox;
  
  beforeEach(() => {
    // 创建sandbox以管理模拟
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    // 恢复所有模拟
    sandbox.restore();
  });
  
  describe('getDashboardStats', () => {
    it('should get dashboard stats for a user', async () => {
      // 模拟数据
      const userId = 'user1';
      const projectCount = 3;
      const taskCount = 5;
      const pendingTaskCount = 2;
      
      // 模拟Project.count
      sandbox.stub(Project, 'count').resolves(projectCount);
      
      // 模拟Task.count - 需要两次调用，分别返回不同的结果
      const taskCountStub = sandbox.stub(Task, 'count');
      taskCountStub.onFirstCall().resolves(taskCount);
      taskCountStub.onSecondCall().resolves(pendingTaskCount);
      
      // 调用服务方法
      const result = await dashboardService.getDashboardStats(userId);
      
      // 验证结果
      expect(result).to.be.an('object');
      expect(result.projectCount).to.equal(projectCount);
      expect(result.taskCount).to.equal(taskCount);
      expect(result.pendingTaskCount).to.equal(pendingTaskCount);
      
      // 验证调用
      expect(Project.count.calledOnce).to.be.true;
      expect(Task.count.calledTwice).to.be.true;
    });
    
    it('should handle errors when getting dashboard stats', async () => {
      // 模拟数据
      const userId = 'user1';
      
      // 模拟Project.count抛出错误
      const error = new Error('Database error');
      sandbox.stub(Project, 'count').throws(error);
      
      // 调用服务方法并验证错误被抛出
      try {
        await dashboardService.getDashboardStats(userId);
        // 如果没有抛出错误，测试应该失败
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
  
  describe('getProjectStats', () => {
    it('should get project stats', async () => {
      // 模拟数据
      const projectId = 'project1';
      
      // 模拟项目
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        members: [
          { id: 'user1', username: 'User 1', avatar_url: 'avatar1.jpg' },
          { id: 'user2', username: 'User 2', avatar_url: 'avatar2.jpg' }
        ]
      };
      
      // 模拟任务统计
      const mockTaskStats = [
        { status: 'todo', getDataValue: () => '2' },
        { status: 'in_progress', getDataValue: () => '3' },
        { status: 'completed', getDataValue: () => '5' }
      ];
      
      // 模拟需求统计
      const mockRequirementStats = [
        { status: 'draft', getDataValue: () => '1' },
        { status: 'approved', getDataValue: () => '4' }
      ];
      
      // 模拟Project.findByPk
      sandbox.stub(Project, 'findByPk').resolves(mockProject);
      
      // 模拟Task.findAll
      sandbox.stub(Task, 'findAll').resolves(mockTaskStats);
      
      // 模拟Requirement.findAll
      sandbox.stub(Requirement, 'findAll').resolves(mockRequirementStats);
      
      // 调用服务方法
      const result = await dashboardService.getProjectStats(projectId);
      
      // 验证结果
      expect(result).to.be.an('object');
      expect(result.project).to.equal(mockProject);
      expect(result.taskStats).to.be.an('array').with.lengthOf(3);
      expect(result.requirementStats).to.be.an('array').with.lengthOf(2);
      
      // 验证任务统计
      expect(result.taskStats[0].status).to.equal('todo');
      expect(result.taskStats[0].count).to.equal(2);
      
      // 验证需求统计
      expect(result.requirementStats[0].status).to.equal('draft');
      expect(result.requirementStats[0].count).to.equal(1);
    });
    
    it('should throw error if project does not exist', async () => {
      // 模拟数据
      const projectId = 'nonexistent';
      
      // 模拟Project.findByPk - 项目不存在
      sandbox.stub(Project, 'findByPk').resolves(null);
      
      // 调用服务方法并验证错误被抛出
      try {
        await dashboardService.getProjectStats(projectId);
        // 如果没有抛出错误，测试应该失败
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err.message).to.equal('项目不存在');
      }
    });
    
    it('should handle database errors', async () => {
      // 模拟数据
      const projectId = 'project1';
      
      // 模拟Project.findByPk抛出错误
      const error = new Error('Database error');
      sandbox.stub(Project, 'findByPk').throws(error);
      
      // 调用服务方法并验证错误被抛出
      try {
        await dashboardService.getProjectStats(projectId);
        // 如果没有抛出错误，测试应该失败
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
  
  describe('getProjectActivities', () => {
    it('should get project activities', async () => {
      // 模拟数据
      const projectId = 'project1';
      const limit = 5;
      
      // 模拟任务
      const mockTasks = [
        {
          id: 'task1',
          title: 'Task 1',
          status: 'completed',
          updated_at: new Date('2025-03-16T10:00:00Z'),
          assignee: { id: 'user1', username: 'User 1', avatar_url: 'avatar1.jpg' },
          reporter: { id: 'user2', username: 'User 2', avatar_url: 'avatar2.jpg' }
        },
        {
          id: 'task2',
          title: 'Task 2',
          status: 'in_progress',
          updated_at: new Date('2025-03-15T10:00:00Z'),
          assignee: { id: 'user2', username: 'User 2', avatar_url: 'avatar2.jpg' },
          reporter: { id: 'user1', username: 'User 1', avatar_url: 'avatar1.jpg' }
        }
      ];
      
      // 模拟需求
      const mockRequirements = [
        {
          id: 'req1',
          title: 'Requirement 1',
          status: 'approved',
          updated_at: new Date('2025-03-17T10:00:00Z'),
          creator: { id: 'user1', username: 'User 1', avatar_url: 'avatar1.jpg' }
        }
      ];
      
      // 模拟Task.findAll
      sandbox.stub(Task, 'findAll').resolves(mockTasks);
      
      // 模拟Requirement.findAll
      sandbox.stub(Requirement, 'findAll').resolves(mockRequirements);
      
      // 调用服务方法
      const result = await dashboardService.getProjectActivities(projectId, limit);
      
      // 验证结果
      expect(result).to.be.an('array').with.lengthOf(3);
      
      // 验证活动按更新时间排序
      expect(result[0].type).to.equal('requirement');
      expect(result[0].id).to.equal('req1');
      expect(result[1].type).to.equal('task');
      expect(result[1].id).to.equal('task1');
      expect(result[2].type).to.equal('task');
      expect(result[2].id).to.equal('task2');
    });
    
    it('should handle database errors', async () => {
      // 模拟数据
      const projectId = 'project1';
      
      // 模拟Task.findAll抛出错误
      const error = new Error('Database error');
      sandbox.stub(Task, 'findAll').throws(error);
      
      // 调用服务方法并验证错误被抛出
      try {
        await dashboardService.getProjectActivities(projectId);
        // 如果没有抛出错误，测试应该失败
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
  
  describe('getTaskDistribution', () => {
    it('should get task distribution by team members', async () => {
      // 模拟数据
      const projectId = 'project1';
      
      // 模拟项目和成员
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        members: [
          { id: 'user1', username: 'User 1', avatar_url: 'avatar1.jpg' },
          { id: 'user2', username: 'User 2', avatar_url: 'avatar2.jpg' },
          { id: 'user3', username: 'User 3', avatar_url: 'avatar3.jpg' }
        ]
      };
      
      // 模拟任务分布
      const mockTaskDistribution = [
        { 
          assignee_id: 'user1', 
          getDataValue: () => '3' // user1有3个任务
        },
        { 
          assignee_id: 'user2', 
          getDataValue: () => '2' // user2有2个任务
        }
        // user3没有任务
      ];
      
      // 模拟Project.findByPk
      sandbox.stub(Project, 'findByPk').resolves(mockProject);
      
      // 模拟Task.findAll
      sandbox.stub(Task, 'findAll').resolves(mockTaskDistribution);
      
      // 调用服务方法
      const result = await dashboardService.getTaskDistribution(projectId);
      
      // 验证结果
      expect(result).to.be.an('array').with.lengthOf(3);
      
      // 验证每个成员的任务数量
      const user1 = result.find(m => m.id === 'user1');
      expect(user1.taskCount).to.equal(3);
      
      const user2 = result.find(m => m.id === 'user2');
      expect(user2.taskCount).to.equal(2);
      
      const user3 = result.find(m => m.id === 'user3');
      expect(user3.taskCount).to.equal(0); // 没有任务
    });
    
    it('should throw error if project does not exist', async () => {
      // 模拟数据
      const projectId = 'nonexistent';
      
      // 模拟Project.findByPk - 项目不存在
      sandbox.stub(Project, 'findByPk').resolves(null);
      
      // 调用服务方法并验证错误被抛出
      try {
        await dashboardService.getTaskDistribution(projectId);
        // 如果没有抛出错误，测试应该失败
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err.message).to.equal('项目不存在');
      }
    });
    
    it('should handle database errors', async () => {
      // 模拟数据
      const projectId = 'project1';
      
      // 模拟Project.findByPk抛出错误
      const error = new Error('Database error');
      sandbox.stub(Project, 'findByPk').throws(error);
      
      // 调用服务方法并验证错误被抛出
      try {
        await dashboardService.getTaskDistribution(projectId);
        // 如果没有抛出错误，测试应该失败
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
  
  describe('getTeamActivities', () => {
    it('should get team activities', async () => {
      // 模拟数据
      const projectId = 'project1';
      const limit = 5;
      
      // 模拟项目和成员
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        members: [
          { id: 'user1', username: 'User 1', avatar_url: 'avatar1.jpg' },
          { id: 'user2', username: 'User 2', avatar_url: 'avatar2.jpg' }
        ]
      };
      
      // 模拟完成的任务
      const mockCompletedTasks = [
        {
          id: 'task1',
          title: 'Task 1',
          assignee_id: 'user1',
          updated_at: new Date('2025-03-16T10:00:00Z'),
          assignee: { id: 'user1', username: 'User 1', avatar_url: 'avatar1.jpg' }
        },
        {
          id: 'task2',
          title: 'Task 2',
          assignee_id: 'user2',
          updated_at: new Date('2025-03-15T10:00:00Z'),
          assignee: { id: 'user2', username: 'User 2', avatar_url: 'avatar2.jpg' }
        },
        {
          id: 'task3',
          title: 'Task 3',
          assignee_id: 'user1',
          updated_at: new Date('2025-03-14T10:00:00Z'),
          assignee: { id: 'user1', username: 'User 1', avatar_url: 'avatar1.jpg' }
        }
      ];
      
      // 模拟Project.findByPk
      sandbox.stub(Project, 'findByPk').resolves(mockProject);
      
      // 模拟Task.findAll
      sandbox.stub(Task, 'findAll').resolves(mockCompletedTasks);
      
      // 调用服务方法
      const result = await dashboardService.getTeamActivities(projectId, limit);
      
      // 验证结果
      expect(result).to.be.an('array').with.lengthOf(2); // 每个成员最多一个活动
      
      // 验证活动按更新时间排序
      expect(result[0].memberId).to.equal('user1');
      expect(result[0].taskId).to.equal('task1');
      expect(result[1].memberId).to.equal('user2');
      expect(result[1].taskId).to.equal('task2');
    });
    
    it('should throw error if project does not exist', async () => {
      // 模拟数据
      const projectId = 'nonexistent';
      
      // 模拟Project.findByPk - 项目不存在
      sandbox.stub(Project, 'findByPk').resolves(null);
      
      // 调用服务方法并验证错误被抛出
      try {
        await dashboardService.getTeamActivities(projectId);
        // 如果没有抛出错误，测试应该失败
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err.message).to.equal('项目不存在');
      }
    });
    
    it('should handle database errors', async () => {
      // 模拟数据
      const projectId = 'project1';
      
      // 模拟Project.findByPk抛出错误
      const error = new Error('Database error');
      sandbox.stub(Project, 'findByPk').throws(error);
      
      // 调用服务方法并验证错误被抛出
      try {
        await dashboardService.getTeamActivities(projectId);
        // 如果没有抛出错误，测试应该失败
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
}); 
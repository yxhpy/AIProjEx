const sinon = require('sinon');
const { expect } = require('chai');
const projectService = require('../../../src/services/projectService');
const { Project, User, ProjectMember, sequelize } = require('../../../src/models');

describe('Project Service', () => {
  let sandbox;
  
  beforeEach(() => {
    // 创建沙盒用于独立测试
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    // 每次测试后恢复所有模拟
    sandbox.restore();
  });
  
  describe('getProjects', () => {
    it('应该返回用户有权访问的项目列表', async () => {
      // 模拟数据
      const mockProjects = [
        {
          id: '1',
          name: '项目1',
          created_by: 'user1',
          members: [{ id: 'user1', ProjectMember: { role: 'owner' } }],
          creator: { id: 'user1', username: 'user1' }
        },
        {
          id: '2',
          name: '项目2',
          created_by: 'user2',
          members: [{ id: 'user1', ProjectMember: { role: 'member' } }],
          creator: { id: 'user2', username: 'user2' }
        }
      ];
      
      // 模拟Project.findAndCountAll方法
      sandbox.stub(Project, 'findAndCountAll').resolves({
        rows: mockProjects,
        count: 2
      });
      
      // 调用服务
      const result = await projectService.getProjects({
        userId: 'user1',
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'DESC'
      });
      
      // 断言
      expect(result.projects).to.have.length(2);
      expect(result.pagination.total).to.equal(2);
      expect(result.pagination.page).to.equal(1);
    });
  });
  
  describe('getProjectById', () => {
    it('应该返回项目详情如果用户是创建者', async () => {
      // 模拟数据
      const mockProject = {
        id: '1',
        name: '测试项目',
        created_by: 'user1',
        members: [],
        creator: { id: 'user1', username: 'user1' }
      };
      
      // 模拟Project.findByPk方法
      sandbox.stub(Project, 'findByPk').resolves(mockProject);
      
      // 调用服务
      const result = await projectService.getProjectById('1', 'user1');
      
      // 断言
      expect(result).to.deep.equal(mockProject);
    });
    
    it('应该返回项目详情如果用户是成员', async () => {
      // 模拟数据
      const mockProject = {
        id: '1',
        name: '测试项目',
        created_by: 'user2',
        members: [{ id: 'user1', ProjectMember: { role: 'member' } }],
        creator: { id: 'user2', username: 'user2' }
      };
      
      // 模拟Project.findByPk方法
      sandbox.stub(Project, 'findByPk').resolves(mockProject);
      
      // 调用服务
      const result = await projectService.getProjectById('1', 'user1');
      
      // 断言
      expect(result).to.deep.equal(mockProject);
    });
    
    it('应该返回null如果用户无权访问项目', async () => {
      // 模拟数据
      const mockProject = {
        id: '1',
        name: '测试项目',
        created_by: 'user2',
        members: [{ id: 'user3', ProjectMember: { role: 'member' } }],
        creator: { id: 'user2', username: 'user2' }
      };
      
      // 模拟Project.findByPk方法
      sandbox.stub(Project, 'findByPk').resolves(mockProject);
      
      // 调用服务
      const result = await projectService.getProjectById('1', 'user1');
      
      // 断言
      expect(result).to.be.null;
    });
  });
  
  describe('createProject', () => {
    it('应该创建新项目并将创建者添加为项目所有者', async () => {
      // 模拟事务
      const mockTransaction = { commit: sinon.stub(), rollback: sinon.stub() };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      
      // 模拟Project.create方法
      const mockProject = { id: '1', name: '新项目', created_by: 'user1' };
      sandbox.stub(Project, 'create').resolves(mockProject);
      
      // 模拟ProjectMember.create方法
      sandbox.stub(ProjectMember, 'create').resolves({});
      
      // 模拟getProjectById方法
      const mockProjectWithDetails = {
        ...mockProject,
        members: [{ id: 'user1', ProjectMember: { role: 'owner' } }],
        creator: { id: 'user1', username: 'user1' }
      };
      sandbox.stub(projectService, 'getProjectById').resolves(mockProjectWithDetails);
      
      // 调用服务
      const result = await projectService.createProject(
        { name: '新项目', description: '项目描述' },
        'user1'
      );
      
      // 断言
      expect(mockTransaction.commit.calledOnce).to.be.true;
      expect(mockTransaction.rollback.called).to.be.false;
      expect(result).to.deep.equal(mockProjectWithDetails);
    });
  });
  
  describe('updateProject', () => {
    it('应该更新项目如果用户有权限', async () => {
      // 模拟ProjectMember.findOne方法
      sandbox.stub(ProjectMember, 'findOne').resolves({ role: 'owner' });
      
      // 模拟Project.update方法
      sandbox.stub(Project, 'update').resolves([1]);
      
      // 模拟getProjectById方法
      const mockUpdatedProject = {
        id: '1',
        name: '更新的项目',
        description: '更新的描述',
        created_by: 'user1',
        members: [{ id: 'user1', ProjectMember: { role: 'owner' } }],
        creator: { id: 'user1', username: 'user1' }
      };
      sandbox.stub(projectService, 'getProjectById').resolves(mockUpdatedProject);
      
      // 调用服务
      const result = await projectService.updateProject(
        '1',
        { name: '更新的项目', description: '更新的描述' },
        'user1'
      );
      
      // 断言
      expect(result).to.deep.equal(mockUpdatedProject);
    });
    
    it('应该返回null如果用户无权更新项目', async () => {
      // 模拟ProjectMember.findOne方法
      sandbox.stub(ProjectMember, 'findOne').resolves(null);
      
      // 调用服务
      const result = await projectService.updateProject(
        '1',
        { name: '更新的项目' },
        'user2'
      );
      
      // 断言
      expect(result).to.be.null;
    });
  });
  
  describe('deleteProject', () => {
    it('应该删除项目如果用户是所有者', async () => {
      // 模拟ProjectMember.findOne方法
      sandbox.stub(ProjectMember, 'findOne').resolves({ role: 'owner' });
      
      // 模拟Project.destroy方法
      sandbox.stub(Project, 'destroy').resolves(1);
      
      // 调用服务
      const result = await projectService.deleteProject('1', 'user1');
      
      // 断言
      expect(result).to.be.true;
    });
    
    it('应该返回false如果用户不是所有者', async () => {
      // 模拟ProjectMember.findOne方法
      sandbox.stub(ProjectMember, 'findOne').resolves(null);
      
      // 调用服务
      const result = await projectService.deleteProject('1', 'user2');
      
      // 断言
      expect(result).to.be.false;
    });
  });
  
  describe('getProjectMembers', () => {
    it('应该返回项目成员列表如果用户有权限', async () => {
      // 模拟Project.findByPk方法
      sandbox.stub(Project, 'findByPk').resolves({ id: '1' });
      
      // 模拟ProjectMember.findOne方法
      sandbox.stub(ProjectMember, 'findOne').resolves({ role: 'member' });
      
      // 模拟ProjectMember.findAll方法
      const mockMembers = [
        { user_id: 'user1', role: 'owner', User: { id: 'user1', username: 'user1' } },
        { user_id: 'user2', role: 'member', User: { id: 'user2', username: 'user2' } }
      ];
      sandbox.stub(ProjectMember, 'findAll').resolves(mockMembers);
      
      // 调用服务
      const result = await projectService.getProjectMembers('1', 'user1');
      
      // 断言
      expect(result).to.deep.equal(mockMembers);
    });
    
    it('应该返回null如果用户无权查看项目成员', async () => {
      // 模拟Project.findByPk方法
      sandbox.stub(Project, 'findByPk').resolves({ id: '1' });
      
      // 模拟ProjectMember.findOne方法
      sandbox.stub(ProjectMember, 'findOne').resolves(null);
      
      // 调用服务
      const result = await projectService.getProjectMembers('1', 'user2');
      
      // 断言
      expect(result).to.be.null;
    });
  });
}); 
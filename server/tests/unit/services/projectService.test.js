const sinon = require('sinon');
const { expect } = require('chai');
const projectService = require('../../../src/services/projectService');
const { Project, User, ProjectMember, sequelize } = require('../../../src/models');

describe('Project Service', () => {
  let sandbox;
  const testUserId = 'user1'; // 添加测试用户ID
  
  beforeEach(() => {
    // 创建sandbox以管理模拟
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    // 恢复所有模拟
    sandbox.restore();
  });
  
  describe('getProjects', () => {
    it('should get projects with pagination', async () => {
      // 模拟数据
      const mockProjects = [
        { id: '1', name: 'Project 1', status: 'planning' },
        { id: '2', name: 'Project 2', status: 'in_progress' }
      ];
      
      // 模拟Project.findAndCountAll
      const findAndCountAllStub = sandbox.stub(Project, 'findAndCountAll').resolves({
        rows: mockProjects.map(p => ({
          ...p,
          created_by: testUserId,
          members: [],
          toJSON: () => p
        })),
        count: mockProjects.length
      });
      
      // 调用服务方法
      const result = await projectService.getProjects({
        userId: testUserId,
        page: 1,
        limit: 10,
        sort: 'created_at',
        order: 'DESC'
      });
      
      // 验证结果
      expect(result).to.be.an('object');
      expect(result.projects).to.be.an('array').with.lengthOf(2);
      expect(result.totalItems).to.equal(2); // 修改为totalItems而不是totalProjects
      expect(result.currentPage).to.equal(1);
      expect(result.totalPages).to.equal(1);
      
      // 验证调用参数
      expect(findAndCountAllStub.calledOnce).to.be.true;
      const callArgs = findAndCountAllStub.getCall(0).args[0];
      expect(callArgs).to.have.property('limit', 10);
      expect(callArgs).to.have.property('offset', 0);
      expect(callArgs.order[0]).to.deep.equal(['created_at', 'DESC']);
    });
    
    it('should filter projects by status', async () => {
      // 模拟数据
      const mockProjects = [
        { id: '1', name: 'Project 1', status: 'planning' }
      ];
      
      // 模拟Project.findAndCountAll
      const findAndCountAllStub = sandbox.stub(Project, 'findAndCountAll').resolves({
        rows: mockProjects.map(p => ({
          ...p,
          created_by: testUserId,
          members: [],
          toJSON: () => p
        })),
        count: mockProjects.length
      });
      
      // 调用服务方法
      const result = await projectService.getProjects({
        userId: testUserId,
        page: 1,
        limit: 10,
        status: 'planning',
        sort: 'created_at',
        order: 'DESC'
      });
      
      // 验证结果
      expect(result.projects).to.be.an('array').with.lengthOf(1);
      expect(result.projects[0].status).to.equal('planning');
      
      // 验证调用参数
      expect(findAndCountAllStub.calledOnce).to.be.true;
      const callArgs = findAndCountAllStub.getCall(0).args[0];
      expect(callArgs.where).to.have.property('status', 'planning');
    });
  });
  
  describe('getProjectById', () => {
    it('should get project by id', async () => {
      // 模拟数据
      const mockProject = {
        id: '1',
        name: 'Test Project',
        description: 'Test Description',
        status: 'planning',
        created_by: testUserId,
        members: [{ id: testUserId }], // 添加members数组
        toJSON: () => ({
          id: '1',
          name: 'Test Project',
          description: 'Test Description',
          status: 'planning',
          created_by: testUserId
        })
      };
      
      // 模拟Project.findByPk
      const findByPkStub = sandbox.stub(Project, 'findByPk').resolves(mockProject);
      
      // 调用服务方法，添加userId参数
      const result = await projectService.getProjectById('1', testUserId);
      
      // 验证结果
      expect(result).to.be.an('object');
      expect(result.id).to.equal('1');
      expect(result.name).to.equal('Test Project');
      
      // 验证调用参数
      expect(findByPkStub.calledOnce).to.be.true;
      expect(findByPkStub.getCall(0).args[0]).to.equal('1');
    });
    
    it('should return null for non-existent project', async () => {
      // 模拟Project.findByPk
      sandbox.stub(Project, 'findByPk').resolves(null);
      
      // 调用服务方法，添加userId参数
      const result = await projectService.getProjectById('nonexistent', testUserId);
      
      // 验证结果
      expect(result).to.be.null;
    });
  });
  
  describe('createProject', () => {
    it('should create a project', async () => {
      // 模拟数据
      const projectData = {
        name: 'New Project',
        description: 'New Project Description',
        status: 'planning',
        created_by: testUserId
      };
      
      const mockCreatedProject = {
        id: '1',
        ...projectData,
        toJSON: () => ({ id: '1', ...projectData })
      };
      
      // 模拟事务
      const transactionStub = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves()
      };
      const beginTransactionStub = sandbox.stub(sequelize, 'transaction').resolves(transactionStub);
      
      // 模拟Project.create
      const createStub = sandbox.stub(Project, 'create').resolves(mockCreatedProject);
      
      // 模拟ProjectMember.create
      const memberCreateStub = sandbox.stub(ProjectMember, 'create').resolves({});
      
      // 模拟getProjectById
      sandbox.stub(projectService, 'getProjectById').resolves(mockCreatedProject);
      
      // 调用服务方法，添加userId参数
      const result = await projectService.createProject(projectData, testUserId);
      
      // 验证结果
      expect(result).to.be.an('object');
      expect(result.id).to.equal('1');
      expect(result.name).to.equal('New Project');
      
      // 验证调用
      expect(createStub.calledOnce).to.be.true;
      expect(memberCreateStub.calledOnce).to.be.true;
      expect(beginTransactionStub.calledOnce).to.be.true;
    });
  });
  
  describe('updateProject', () => {
    it('should update a project', async () => {
      // 模拟数据
      const projectId = '1';
      const updateData = {
        name: 'Updated Project',
        description: 'Updated Description',
        status: 'in_progress'
      };
      
      const mockProject = {
        id: projectId,
        name: 'Old Project',
        description: 'Old Description',
        status: 'planning',
        update: sandbox.stub().resolves(),
        toJSON: () => ({
          id: projectId,
          ...updateData
        })
      };
      
      // 模拟ProjectMember.findOne
      sandbox.stub(ProjectMember, 'findOne').resolves({
        role: 'owner'
      });
      
      // 模拟Project.findByPk
      const findByPkStub = sandbox.stub(Project, 'findByPk').resolves(mockProject);
      
      // 调用服务方法，添加userId参数
      const result = await projectService.updateProject(projectId, updateData, testUserId);
      
      // 验证结果
      expect(result).to.be.an('object');
      expect(result.name).to.equal('Updated Project');
      expect(result.status).to.equal('in_progress');
      
      // 验证调用
      expect(findByPkStub.calledOnce).to.be.true;
      expect(mockProject.update.calledOnce).to.be.true;
      expect(mockProject.update.getCall(0).args[0]).to.deep.equal(updateData);
    });
    
    it('should return null for non-existent project', async () => {
      // 模拟ProjectMember.findOne
      sandbox.stub(ProjectMember, 'findOne').resolves(null);
      
      // 模拟Project.findByPk
      sandbox.stub(Project, 'findByPk').resolves(null);
      
      // 调用服务方法，添加userId参数
      const result = await projectService.updateProject('nonexistent', { name: 'Updated' }, testUserId);
      
      // 验证结果
      expect(result).to.be.null;
    });
  });
  
  describe('deleteProject', () => {
    it('should delete a project', async () => {
      // 模拟数据
      const projectId = '1';
      const mockProject = {
        id: projectId,
        destroy: sandbox.stub().resolves()
      };
      
      // 模拟ProjectMember.findOne
      sandbox.stub(ProjectMember, 'findOne').resolves({
        role: 'owner'
      });
      
      // 模拟Project.findByPk
      const findByPkStub = sandbox.stub(Project, 'findByPk').resolves(mockProject);
      
      // 调用服务方法，添加userId参数
      const result = await projectService.deleteProject(projectId, testUserId);
      
      // 验证结果
      expect(result).to.be.true;
      
      // 验证调用
      expect(findByPkStub.calledOnce).to.be.true;
      expect(mockProject.destroy.calledOnce).to.be.true;
    });
    
    it('should return false for non-existent project', async () => {
      // 模拟ProjectMember.findOne
      sandbox.stub(ProjectMember, 'findOne').resolves(null);
      
      // 模拟Project.findByPk
      sandbox.stub(Project, 'findByPk').resolves(null);
      
      // 调用服务方法，添加userId参数
      const result = await projectService.deleteProject('nonexistent', testUserId);
      
      // 验证结果
      expect(result).to.be.false;
    });
  });
  
  describe('getProjectMembers', () => {
    it('should get project members', async () => {
      // 模拟数据
      const projectId = '1';
      const mockMembers = [
        { id: testUserId, username: 'User 1', ProjectMember: { role: 'owner' } },
        { id: 'user2', username: 'User 2', ProjectMember: { role: 'member' } }
      ];
      
      const mockProject = {
        id: projectId,
        getMembers: sandbox.stub().resolves(mockMembers)
      };
      
      // 模拟ProjectMember.findOne
      sandbox.stub(ProjectMember, 'findOne').resolves({
        role: 'owner'
      });
      
      // 模拟Project.findByPk
      const findByPkStub = sandbox.stub(Project, 'findByPk').resolves(mockProject);
      
      // 调用服务方法，添加userId参数
      const result = await projectService.getProjectMembers(projectId, testUserId);
      
      // 验证结果
      expect(result).to.be.an('array').with.lengthOf(2);
      expect(result[0]).to.have.property('id', testUserId);
      expect(result[0]).to.have.property('role', 'owner');
      
      // 验证调用
      expect(findByPkStub.calledOnce).to.be.true;
      expect(mockProject.getMembers.calledOnce).to.be.true;
    });
    
    it('should return empty array for non-existent project', async () => {
      // 模拟ProjectMember.findOne
      sandbox.stub(ProjectMember, 'findOne').resolves(null);
      
      // 模拟Project.findByPk
      sandbox.stub(Project, 'findByPk').resolves(null);
      
      // 调用服务方法，添加userId参数
      const result = await projectService.getProjectMembers('nonexistent', testUserId);
      
      // 验证结果
      expect(result).to.be.an('array').that.is.empty;
    });
  });
}); 
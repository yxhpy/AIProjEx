const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
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
      expect(result.pagination.total).to.equal(2);
      expect(result.pagination.page).to.equal(1);
      expect(result.pagination.totalPages).to.equal(1);
      
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
        name: 'Test Project',
        description: 'Test Description',
        status: 'planning'
      };
      const userId = 'user1';
      
      // 模拟创建的项目
      const mockProject = {
        id: '1',
        ...projectData,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // 模拟事务
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves()
      };
      
      // 模拟sequelize.transaction
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      
      // 模拟Project.create
      sandbox.stub(Project, 'create').resolves(mockProject);
      
      // 模拟ProjectMember.create
      sandbox.stub(ProjectMember, 'create').resolves({
        id: 'member1',
        project_id: mockProject.id,
        user_id: userId,
        role: 'owner'
      });
      
      // 模拟projectService.getProjectById方法
      const getProjectByIdStub = sandbox.stub(projectService, 'getProjectById').resolves({
        ...mockProject,
        members: [{ id: userId, role: 'owner' }]
      });
      
      // 调用服务方法
      const result = await projectService.createProject(projectData, userId);
      
      // 验证结果
      expect(result).to.be.an('object');
      expect(result).to.have.property('id', mockProject.id);
      expect(result).to.have.property('name', projectData.name);
      
      // 验证调用
      expect(Project.create.calledOnce).to.be.true;
      expect(ProjectMember.create.calledOnce).to.be.true;
      expect(mockTransaction.commit.calledOnce).to.be.true;
      expect(getProjectByIdStub.calledOnce).to.be.true;
      
      // 恢复getProjectById的原始实现
      getProjectByIdStub.restore();
    });
  });
  
  describe('updateProject', () => {
    it('should update a project', async () => {
      // 模拟数据
      const projectId = '1';
      const userId = 'user1';
      const updateData = {
        name: 'Updated Project',
        description: 'Updated Description',
        status: 'in_progress'
      };
      
      // 模拟项目
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        description: 'Test Description',
        status: 'planning',
        created_by: userId
      };
      
      // 模拟ProjectMember.findOne - 检查权限
      sandbox.stub(ProjectMember, 'findOne').resolves({
        project_id: projectId,
        user_id: userId,
        role: 'owner'
      });
      
      // 模拟Project.update
      sandbox.stub(Project, 'update').resolves([1]);
      
      // 模拟projectService.getProjectById方法
      const getProjectByIdStub = sandbox.stub(projectService, 'getProjectById').resolves({
        ...mockProject,
        ...updateData
      });
      
      // 调用服务方法
      const result = await projectService.updateProject(projectId, updateData, userId);
      
      // 验证结果
      expect(result).to.be.an('object');
      expect(result).to.have.property('id', projectId);
      expect(result).to.have.property('name', updateData.name);
      
      // 验证调用
      expect(ProjectMember.findOne.calledOnce).to.be.true;
      expect(Project.update.calledOnce).to.be.true;
      expect(getProjectByIdStub.calledOnce).to.be.true;
      
      // 恢复getProjectById的原始实现
      getProjectByIdStub.restore();
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
      const userId = 'user1';
      
      // 模拟ProjectMember.findOne - 检查权限
      sandbox.stub(ProjectMember, 'findOne').resolves({
        project_id: projectId,
        user_id: userId,
        role: 'owner'
      });
      
      // 模拟Project.destroy - 返回1表示成功删除了一条记录
      sandbox.stub(Project, 'destroy').resolves(1);
      
      // 调用服务方法
      const result = await projectService.deleteProject(projectId, userId);
      
      // 验证结果
      expect(result).to.be.true;
      
      // 验证调用
      expect(ProjectMember.findOne.calledOnce).to.be.true;
      expect(Project.destroy.calledOnce).to.be.true;
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

    it('should return false if user is not the owner', async () => {
      // 模拟数据
      const projectId = '1';
      const userId = 'user2'; // 不是项目所有者
      
      // 模拟ProjectMember.findOne - 用户是成员但不是所有者
      sandbox.stub(ProjectMember, 'findOne').resolves({
        project_id: projectId,
        user_id: userId,
        role: 'admin' // 不是owner角色
      });
      
      // 调用服务方法
      const result = await projectService.deleteProject(projectId, userId);
      
      // 验证结果
      expect(result).to.be.false;
    });

    it('should handle database errors during deletion', async () => {
      // 模拟数据
      const projectId = '1';
      const userId = 'user1';
      
      // 模拟ProjectMember.findOne - 检查权限
      sandbox.stub(ProjectMember, 'findOne').resolves({
        project_id: projectId,
        user_id: userId,
        role: 'owner'
      });
      
      // 模拟Project.destroy抛出错误
      const error = new Error('Database error during deletion');
      sandbox.stub(Project, 'destroy').throws(error);
      
      // 调用服务方法并验证错误被抛出
      try {
        await projectService.deleteProject(projectId, userId);
        // 如果没有抛出错误，测试应该失败
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
  
  describe('getProjectMembers', () => {
    it('should get project members', async () => {
      // 模拟数据
      const projectId = '1';
      const userId = 'user1';
      
      // 模拟用户
      const mockUsers = [
        {
          id: 'user1',
          username: 'User 1',
          email: 'user1@example.com',
          avatar_url: 'avatar1.jpg'
        },
        {
          id: 'user2',
          username: 'User 2',
          email: 'user2@example.com',
          avatar_url: 'avatar2.jpg'
        }
      ];
      
      // 模拟项目
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        toJSON: () => ({
          id: projectId,
          name: 'Test Project'
        })
      };
      
      // 模拟成员
      const mockMembers = mockUsers.map((user, index) => ({
        id: `member${index}`,
        project_id: projectId,
        user_id: user.id,
        role: index === 0 ? 'owner' : 'member',
        dataValues: {
          User: user
        },
        toJSON: () => ({
          id: `member${index}`,
          project_id: projectId,
          user_id: user.id,
          role: index === 0 ? 'owner' : 'member',
          User: user
        })
      }));
      
      // 修改模拟以避免关联错误
      // 首先模拟Project.findByPk
      sandbox.stub(Project, 'findByPk').resolves(mockProject);
      
      // 模拟ProjectMember.findOne - 检查用户是否是成员
      sandbox.stub(ProjectMember, 'findOne').resolves(mockMembers[0]);
      
      // 模拟ProjectMember.findAll - 不使用include选项，而是直接返回带有User数据的结果
      sandbox.stub(ProjectMember, 'findAll').resolves(mockMembers);
      
      // 调用服务方法
      const result = await projectService.getProjectMembers(projectId, userId);
      
      // 验证结果
      expect(result).to.be.an('array').with.lengthOf(2);
      expect(result[0].role).to.equal('owner');
      expect(result[1].role).to.equal('member');
    });
    
    it('should return null for non-existent project', async () => {
      // 模拟Project.findByPk - 项目不存在
      sandbox.stub(Project, 'findByPk').resolves(null);
      
      // 调用服务方法
      const result = await projectService.getProjectMembers('nonexistent', 'user1');
      
      // 验证结果 - 根据service的实际返回值调整期望
      expect(result).to.be.null;
    });

    it('should return null if user is not a member of the project', async () => {
      // 模拟数据
      const projectId = '1';
      const userId = 'user3'; // 不是项目成员
      
      // 模拟Project.findByPk - 项目存在
      sandbox.stub(Project, 'findByPk').resolves({
        id: projectId,
        name: 'Test Project'
      });
      
      // 模拟ProjectMember.findOne - 用户不是成员
      sandbox.stub(ProjectMember, 'findOne').resolves(null);
      
      // 调用服务方法
      const result = await projectService.getProjectMembers(projectId, userId);
      
      // 验证结果
      expect(result).to.be.null;
    });

    it('should handle database errors when fetching members', async () => {
      // 模拟数据
      const projectId = '1';
      const userId = 'user1';
      
      // 模拟Project.findByPk - 项目存在
      sandbox.stub(Project, 'findByPk').resolves({
        id: projectId,
        name: 'Test Project'
      });
      
      // 模拟ProjectMember.findOne - 用户是成员
      sandbox.stub(ProjectMember, 'findOne').resolves({
        project_id: projectId,
        user_id: userId,
        role: 'member'
      });
      
      // 模拟ProjectMember.findAll抛出错误
      const error = new Error('Database error when fetching members');
      sandbox.stub(ProjectMember, 'findAll').throws(error);
      
      // 调用服务方法并验证错误被抛出
      try {
        await projectService.getProjectMembers(projectId, userId);
        // 如果没有抛出错误，测试应该失败
        expect.fail('Expected an error to be thrown');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
});

describe('addProjectMember', () => {
  let sandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  it('should add a project member', async () => {
    // 模拟数据
    const projectId = '1';
    const newUserId = 'user2';
    const role = 'member';
    const currentUserId = 'user1';
    
    // 模拟用户
    const mockUser = {
      id: newUserId,
      username: 'User 2',
      email: 'user2@example.com',
      avatar_url: 'avatar2.jpg',
      toJSON: () => ({
        id: newUserId,
        username: 'User 2',
        email: 'user2@example.com',
        avatar_url: 'avatar2.jpg'
      })
    };
    
    // 模拟新创建的成员
    const mockNewMember = {
      id: 'member1',
      project_id: projectId,
      user_id: newUserId,
      role: role,
      joined_at: new Date(),
      toJSON: () => ({
        id: 'member1',
        project_id: projectId,
        user_id: newUserId,
        role: role,
        joined_at: new Date()
      })
    };
    
    // 模拟当前用户的成员身份 - 有权限添加成员
    const findOneStub = sandbox.stub(ProjectMember, 'findOne');
    findOneStub.onFirstCall().resolves({
      id: 'member-current',
      project_id: projectId,
      user_id: currentUserId,
      role: 'owner'
    });
    // 第二次调用检查新用户是否已经是成员 - 返回null表示不是
    findOneStub.onSecondCall().resolves(null);
    
    // 模拟User.findByPk - 新用户存在
    sandbox.stub(User, 'findByPk').resolves(mockUser);
    
    // 模拟ProjectMember.create
    sandbox.stub(ProjectMember, 'create').resolves(mockNewMember);
    
    // 调用服务方法
    const result = await projectService.addProjectMember(projectId, newUserId, role, currentUserId);
    
    // 验证结果
    expect(result).to.not.be.null;
    expect(result).to.have.property('user_id', newUserId);
    expect(result).to.have.property('role', role);
    expect(result).to.have.property('user');
    expect(result.user).to.have.property('id', newUserId);
    
    // 验证调用
    expect(findOneStub.calledTwice).to.be.true;
  });
  
  it('should return null if current user has no permission', async () => {
    // 模拟数据
    const projectId = '1';
    const newUserId = 'user2';
    const role = 'member';
    const currentUserId = 'user3';
    
    // 模拟当前用户的成员身份 - 没有权限添加成员
    sandbox.stub(ProjectMember, 'findOne').resolves(null);
    
    // 调用服务方法
    const result = await projectService.addProjectMember(projectId, newUserId, role, currentUserId);
    
    // 验证结果
    expect(result).to.be.null;
  });

  it('should return null if user is already a member', async () => {
    // 模拟数据
    const projectId = '1';
    const newUserId = 'user2';
    const role = 'member';
    const currentUserId = 'user1';
    
    // 模拟当前用户的成员身份 - 有权限添加成员
    const findOneStub = sandbox.stub(ProjectMember, 'findOne');
    findOneStub.onFirstCall().resolves({
      id: 'member-current',
      project_id: projectId,
      user_id: currentUserId,
      role: 'owner'
    });
    // 第二次调用检查新用户是否已经是成员 - 返回结果表示已经是成员
    findOneStub.onSecondCall().resolves({
      id: 'member-existing',
      project_id: projectId,
      user_id: newUserId,
      role: 'member'
    });
    
    // 调用服务方法
    const result = await projectService.addProjectMember(projectId, newUserId, role, currentUserId);
    
    // 验证结果
    expect(result).to.be.null;
  });

  it('should return null if user to add does not exist', async () => {
    // 模拟数据
    const projectId = '1';
    const newUserId = 'nonexistent-user';
    const role = 'member';
    const currentUserId = 'user1';
    
    // 模拟当前用户的成员身份 - 有权限添加成员
    const findOneStub = sandbox.stub(ProjectMember, 'findOne');
    findOneStub.onFirstCall().resolves({
      id: 'member-current',
      project_id: projectId,
      user_id: currentUserId,
      role: 'owner'
    });
    // 第二次调用检查新用户是否已经是成员 - 返回null表示不是
    findOneStub.onSecondCall().resolves(null);
    
    // 模拟User.findByPk - 用户不存在
    sandbox.stub(User, 'findByPk').resolves(null);
    
    // 调用服务方法
    const result = await projectService.addProjectMember(projectId, newUserId, role, currentUserId);
    
    // 验证结果
    expect(result).to.be.null;
  });

  it('should handle database errors when adding member', async () => {
    // 模拟数据
    const projectId = '1';
    const newUserId = 'user2';
    const role = 'member';
    const currentUserId = 'user1';
    
    // 模拟当前用户的成员身份 - 有权限添加成员
    const findOneStub = sandbox.stub(ProjectMember, 'findOne');
    findOneStub.onFirstCall().resolves({
      id: 'member-current',
      project_id: projectId,
      user_id: currentUserId,
      role: 'owner'
    });
    // 第二次调用检查新用户是否已经是成员 - 返回null表示不是
    findOneStub.onSecondCall().resolves(null);
    
    // 模拟User.findByPk - 用户存在
    sandbox.stub(User, 'findByPk').resolves({
      id: newUserId,
      username: 'User 2',
      email: 'user2@example.com',
      avatar_url: 'avatar2.jpg'
    });
    
    // 模拟ProjectMember.create抛出错误
    const error = new Error('Database error when adding member');
    sandbox.stub(ProjectMember, 'create').throws(error);
    
    // 调用服务方法并验证错误被抛出
    try {
      await projectService.addProjectMember(projectId, newUserId, role, currentUserId);
      // 如果没有抛出错误，测试应该失败
      expect.fail('Expected an error to be thrown');
    } catch (err) {
      expect(err).to.equal(error);
    }
  });
});

describe('removeProjectMember', () => {
  let sandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  it('should remove a project member', async () => {
    // 模拟数据
    const projectId = '1';
    const memberUserId = 'user2';
    const currentUserId = 'user1';
    
    // 模拟要移除的成员
    const mockMemberToRemove = {
      id: 'member2',
      project_id: projectId,
      user_id: memberUserId,
      role: 'member'
    };
    
    // 模拟当前用户的成员身份 - 有权限移除成员
    const mockCurrentMember = {
      id: 'member1',
      project_id: projectId,
      user_id: currentUserId,
      role: 'owner'
    };
    
    // 模拟ProjectMember.findOne
    const findOneStub = sandbox.stub(ProjectMember, 'findOne');
    // 第一次调用 - 查找要移除的成员
    findOneStub.onFirstCall().resolves(mockMemberToRemove);
    // 第二次调用 - 查找当前用户的成员身份
    findOneStub.onSecondCall().resolves(mockCurrentMember);
    
    // 模拟ProjectMember.destroy - 成功移除
    sandbox.stub(ProjectMember, 'destroy').resolves(1);
    
    // 调用服务方法
    const result = await projectService.removeProjectMember(projectId, memberUserId, currentUserId);
    
    // 验证结果
    expect(result).to.be.true;
    
    // 验证调用
    expect(findOneStub.calledTwice).to.be.true;
  });
  
  it('should not remove project owner', async () => {
    // 模拟数据
    const projectId = '1';
    const memberUserId = 'user1'; // 项目所有者
    const currentUserId = 'user2';
    
    // 模拟要移除的成员 - 是项目所有者
    const mockMemberToRemove = {
      id: 'member1',
      project_id: projectId,
      user_id: memberUserId,
      role: 'owner'
    };
    
    // 模拟ProjectMember.findOne - 只需要第一次调用的结果
    sandbox.stub(ProjectMember, 'findOne').resolves(mockMemberToRemove);
    
    // 调用服务方法
    const result = await projectService.removeProjectMember(projectId, memberUserId, currentUserId);
    
    // 验证结果
    expect(result).to.be.false;
  });

  it('should fail if member to remove does not exist', async () => {
    // 模拟数据
    const projectId = '1';
    const memberUserId = 'nonexistent-user';
    const currentUserId = 'user1';
    
    // 模拟ProjectMember.findOne - 成员不存在
    sandbox.stub(ProjectMember, 'findOne').resolves(null);
    
    // 调用服务方法
    const result = await projectService.removeProjectMember(projectId, memberUserId, currentUserId);
    
    // 验证结果
    expect(result).to.be.false;
  });

  it('should return false if admin tries to remove another admin', async () => {
    // 模拟数据
    const projectId = '1';
    const memberUserId = 'user2'; // 是admin
    const currentUserId = 'user3'; // 也是admin
    
    // 模拟要移除的成员 - 是admin
    const mockMemberToRemove = {
      id: 'member2',
      project_id: projectId,
      user_id: memberUserId,
      role: 'admin'
    };
    
    // 模拟当前用户 - 也是admin
    const mockCurrentMember = {
      id: 'member3',
      project_id: projectId,
      user_id: currentUserId,
      role: 'admin'
    };
    
    // 模拟ProjectMember.findOne
    const findOneStub = sandbox.stub(ProjectMember, 'findOne');
    // 第一次调用 - 查找要移除的成员
    findOneStub.onFirstCall().resolves(mockMemberToRemove);
    // 第二次调用 - 查找当前用户的成员身份
    findOneStub.onSecondCall().resolves(mockCurrentMember);
    
    // 调用服务方法
    const result = await projectService.removeProjectMember(projectId, memberUserId, currentUserId);
    
    // 验证结果
    expect(result).to.be.false;
  });

  it('should allow member to remove themselves', async () => {
    // 模拟数据
    const projectId = '1';
    const memberUserId = 'user2';
    const currentUserId = 'user2'; // 自己移除自己
    
    // 模拟要移除的成员
    const mockMemberToRemove = {
      id: 'member2',
      project_id: projectId,
      user_id: memberUserId,
      role: 'member'
    };
    
    // 模拟ProjectMember.findOne
    const findOneStub = sandbox.stub(ProjectMember, 'findOne');
    // 第一次调用 - 查找要移除的成员
    findOneStub.onFirstCall().resolves(mockMemberToRemove);
    // 第二次调用 - 查找当前用户的成员身份 (不是admin或owner，但是自己移除自己)
    findOneStub.onSecondCall().resolves(null);
    
    // 模拟ProjectMember.destroy - 成功移除
    sandbox.stub(ProjectMember, 'destroy').resolves(1);
    
    // 调用服务方法
    const result = await projectService.removeProjectMember(projectId, memberUserId, currentUserId);
    
    // 验证结果
    expect(result).to.be.true;
  });

  it('should handle database errors when removing member', async () => {
    // 模拟数据
    const projectId = '1';
    const memberUserId = 'user2';
    const currentUserId = 'user1';
    
    // 模拟要移除的成员
    const mockMemberToRemove = {
      id: 'member2',
      project_id: projectId,
      user_id: memberUserId,
      role: 'member'
    };
    
    // 模拟当前用户
    const mockCurrentMember = {
      id: 'member1',
      project_id: projectId,
      user_id: currentUserId,
      role: 'owner'
    };
    
    // 模拟ProjectMember.findOne
    const findOneStub = sandbox.stub(ProjectMember, 'findOne');
    // 第一次调用 - 查找要移除的成员
    findOneStub.onFirstCall().resolves(mockMemberToRemove);
    // 第二次调用 - 查找当前用户的成员身份
    findOneStub.onSecondCall().resolves(mockCurrentMember);
    
    // 模拟ProjectMember.destroy抛出错误
    const error = new Error('Database error when removing member');
    sandbox.stub(ProjectMember, 'destroy').throws(error);
    
    // 调用服务方法并验证错误被抛出
    try {
      await projectService.removeProjectMember(projectId, memberUserId, currentUserId);
      // 如果没有抛出错误，测试应该失败
      expect.fail('Expected an error to be thrown');
    } catch (err) {
      expect(err).to.equal(error);
    }
  });
});

describe('createProject error handling', () => {
  let sandbox;
  
  beforeEach(() => {
    // 创建sandbox以管理模拟
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    // 恢复所有模拟
    sandbox.restore();
  });

  it('should handle transaction errors', async () => {
    // 模拟数据
    const projectData = {
      name: 'Error Project',
      description: 'Error Project Description'
    };
    
    // 模拟事务
    const transactionStub = {
      commit: sandbox.stub().resolves(),
      rollback: sandbox.stub().resolves()
    };
    
    // 模拟sequelize.transaction
    sandbox.stub(sequelize, 'transaction').resolves(transactionStub);
    
    // 模拟Project.create抛出错误
    const error = new Error('Database error');
    sandbox.stub(Project, 'create').throws(error);
    
    // 调用服务方法并验证错误被抛出
    try {
      await projectService.createProject(projectData, 'user1');
      // 如果没有抛出错误，测试应该失败
      expect.fail('Expected an error to be thrown');
    } catch (err) {
      expect(err).to.equal(error);
      expect(transactionStub.rollback.calledOnce).to.be.true;
      expect(transactionStub.commit.called).to.be.false;
    }
  });
});

describe('updateProject error handling', () => {
  let sandbox;
  
  beforeEach(() => {
    // 创建sandbox以管理模拟
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    // 恢复所有模拟
    sandbox.restore();
  });

  it('should handle database errors', async () => {
    // 模拟数据
    const projectId = '1';
    const updateData = {
      name: 'Updated Project'
    };
    const userId = 'user1';
    
    // 模拟成员权限查询
    sandbox.stub(ProjectMember, 'findOne').resolves({
      role: 'owner'
    });
    
    // 模拟Project.update抛出错误
    const error = new Error('Database error');
    sandbox.stub(Project, 'update').throws(error);
    
    // 调用服务方法并验证错误被抛出
    try {
      await projectService.updateProject(projectId, updateData, userId);
      // 如果没有抛出错误，测试应该失败
      expect.fail('Expected an error to be thrown');
    } catch (err) {
      expect(err).to.equal(error);
    }
  });
});

// 添加updateProjectMember方法的测试
describe('updateProjectMember', () => {
  let sandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  it('should update a project member role', async () => {
    // 模拟数据
    const projectId = '1';
    const memberUserId = 'user2';
    const newRole = 'admin';
    const currentUserId = 'user1';
    
    // 模拟要更新的成员
    const mockMemberToUpdate = {
      id: 'member2',
      project_id: projectId,
      user_id: memberUserId,
      role: 'member',
      update: sandbox.stub().resolves({
        id: 'member2',
        project_id: projectId,
        user_id: memberUserId,
        role: newRole
      })
    };
    
    // 模拟当前用户
    const mockCurrentMember = {
      id: 'member1',
      project_id: projectId,
      user_id: currentUserId,
      role: 'owner'
    };
    
    // 模拟用户对象
    const mockUser = {
      id: memberUserId,
      username: 'User 2',
      email: 'user2@example.com',
      avatar_url: 'avatar2.jpg'
    };
    
    // 模拟ProjectMember.findOne
    const findOneStub = sandbox.stub(ProjectMember, 'findOne');
    // 第一次调用 - 查找当前用户的成员身份
    findOneStub.onFirstCall().resolves(mockCurrentMember);
    // 第二次调用 - 查找要更新的成员
    findOneStub.onSecondCall().resolves(mockMemberToUpdate);
    
    // 模拟User.findByPk
    sandbox.stub(User, 'findByPk').resolves(mockUser);
    
    // 调用服务方法
    const result = await projectService.updateProjectMember(projectId, memberUserId, { role: newRole }, currentUserId);
    
    // 验证结果
    expect(result).to.not.be.null;
    expect(result).to.have.property('role', newRole);
    expect(result).to.have.property('user');
    expect(result.user).to.have.property('id', memberUserId);
    
    // 验证调用
    expect(findOneStub.calledTwice).to.be.true;
    expect(mockMemberToUpdate.update.calledOnce).to.be.true;
  });
  
  it('should not allow updating the owner role', async () => {
    // 模拟数据
    const projectId = '1';
    const memberUserId = 'user1'; // 是owner
    const newRole = 'member';
    const currentUserId = 'user1';
    
    // 模拟要更新的成员 - 是owner
    const mockMemberToUpdate = {
      id: 'member1',
      project_id: projectId,
      user_id: memberUserId,
      role: 'owner'
    };
    
    // 模拟当前用户 - 也是owner
    const mockCurrentMember = {
      id: 'member1',
      project_id: projectId,
      user_id: currentUserId,
      role: 'owner'
    };
    
    // 模拟ProjectMember.findOne
    const findOneStub = sandbox.stub(ProjectMember, 'findOne');
    // 第一次调用 - 查找当前用户的成员身份
    findOneStub.onFirstCall().resolves(mockCurrentMember);
    // 第二次调用 - 查找要更新的成员
    findOneStub.onSecondCall().resolves(mockMemberToUpdate);
    
    // 调用服务方法
    const result = await projectService.updateProjectMember(projectId, memberUserId, { role: newRole }, currentUserId);
    
    // 验证结果 - 不允许更改owner角色
    expect(result).to.be.null;
  });
  
  it('should not allow non-owner to update admin roles', async () => {
    // 模拟数据
    const projectId = '1';
    const memberUserId = 'user2'; // 是admin
    const newRole = 'member';
    const currentUserId = 'user3'; // 也是admin
    
    // 模拟要更新的成员 - 是admin
    const mockMemberToUpdate = {
      id: 'member2',
      project_id: projectId,
      user_id: memberUserId,
      role: 'admin'
    };
    
    // 模拟当前用户 - 也是admin
    const mockCurrentMember = {
      id: 'member3',
      project_id: projectId,
      user_id: currentUserId,
      role: 'admin'
    };
    
    // 模拟ProjectMember.findOne
    const findOneStub = sandbox.stub(ProjectMember, 'findOne');
    // 第一次调用 - 查找当前用户的成员身份
    findOneStub.onFirstCall().resolves(mockCurrentMember);
    // 第二次调用 - 查找要更新的成员
    findOneStub.onSecondCall().resolves(mockMemberToUpdate);
    
    // 调用服务方法
    const result = await projectService.updateProjectMember(projectId, memberUserId, { role: newRole }, currentUserId);
    
    // 验证结果 - 不允许admin更改其他admin角色
    expect(result).to.be.null;
  });
  
  it('should return null if user has no permission', async () => {
    // 模拟数据
    const projectId = '1';
    const memberUserId = 'user2';
    const newRole = 'admin';
    const currentUserId = 'user3'; // 没有权限
    
    // 模拟当前用户 - 没有权限
    sandbox.stub(ProjectMember, 'findOne').resolves(null);
    
    // 调用服务方法
    const result = await projectService.updateProjectMember(projectId, memberUserId, { role: newRole }, currentUserId);
    
    // 验证结果
    expect(result).to.be.null;
  });
  
  it('should handle database errors', async () => {
    // 模拟数据
    const projectId = '1';
    const memberUserId = 'user2';
    const newRole = 'admin';
    const currentUserId = 'user1';
    
    // 模拟当前用户
    const mockCurrentMember = {
      id: 'member1',
      project_id: projectId,
      user_id: currentUserId,
      role: 'owner'
    };
    
    // 模拟ProjectMember.findOne
    const findOneStub = sandbox.stub(ProjectMember, 'findOne');
    // 第一次调用 - 查找当前用户的成员身份
    findOneStub.onFirstCall().resolves(mockCurrentMember);
    // 第二次调用 - 抛出错误
    const error = new Error('Database error');
    findOneStub.onSecondCall().throws(error);
    
    // 调用服务方法并验证错误被抛出
    try {
      await projectService.updateProjectMember(projectId, memberUserId, { role: newRole }, currentUserId);
      // 如果没有抛出错误，测试应该失败
      expect.fail('Expected an error to be thrown');
    } catch (err) {
      expect(err).to.equal(error);
    }
  });
}); 
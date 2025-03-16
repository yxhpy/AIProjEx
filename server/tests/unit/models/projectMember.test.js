const { expect } = require('chai');
const { Sequelize } = require('sequelize');
const ProjectModel = require('../../../src/models/Project');
const UserModel = require('../../../src/models/User');
const ProjectMemberModel = require('../../../src/models/ProjectMember');

describe('ProjectMember Model', () => {
  let sequelize;
  let Project;
  let User;
  let ProjectMember;
  
  beforeAll(async () => {
    // 创建测试数据库连接
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    // 初始化模型
    User = UserModel(sequelize);
    Project = ProjectModel(sequelize);
    ProjectMember = ProjectMemberModel(sequelize);
    
    // 设置关联关系
    Project.associate({ User, ProjectMember });
    User.associate({ Project, ProjectMember });
    ProjectMember.associate && ProjectMember.associate({ User, Project });
    
    // 同步数据库
    await sequelize.sync({ force: true });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('Model definition', () => {
    it('should have correct fields', () => {
      expect(ProjectMember.getAttributes()).to.have.property('id');
      expect(ProjectMember.getAttributes()).to.have.property('project_id');
      expect(ProjectMember.getAttributes()).to.have.property('user_id');
      expect(ProjectMember.getAttributes()).to.have.property('role');
      expect(ProjectMember.getAttributes()).to.have.property('joined_at');
    });
  });
  
  describe('CRUD operations', () => {
    let testUser;
    let testProject;
    
    beforeEach(async () => {
      // 创建测试用户
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      });
      
      // 创建测试项目
      testProject = await Project.create({
        name: 'Test Project',
        description: 'This is a test project',
        status: 'planning',
        created_by: testUser.id
      });
    });
    
    afterEach(async () => {
      // 清理测试数据
      await ProjectMember.destroy({ where: {}, force: true });
      await Project.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    });
    
    it('should create a project member', async () => {
      const projectMember = await ProjectMember.create({
        project_id: testProject.id,
        user_id: testUser.id,
        role: 'admin'
      });
      
      expect(projectMember).to.be.an('object');
      expect(projectMember.id).to.exist;
      expect(projectMember.project_id).to.equal(testProject.id);
      expect(projectMember.user_id).to.equal(testUser.id);
      expect(projectMember.role).to.equal('admin');
      expect(projectMember.joined_at).to.exist;
    });
    
    it('should create a project member with default role', async () => {
      const projectMember = await ProjectMember.create({
        project_id: testProject.id,
        user_id: testUser.id
      });
      
      expect(projectMember.role).to.equal('member');
    });
    
    it('should find a project member', async () => {
      // 创建项目成员
      const createdMember = await ProjectMember.create({
        project_id: testProject.id,
        user_id: testUser.id,
        role: 'owner'
      });
      
      // 查找项目成员
      const foundMember = await ProjectMember.findByPk(createdMember.id);
      
      expect(foundMember).to.be.an('object');
      expect(foundMember.id).to.equal(createdMember.id);
      expect(foundMember.role).to.equal('owner');
    });
    
    it('should update a project member', async () => {
      // 创建项目成员
      const projectMember = await ProjectMember.create({
        project_id: testProject.id,
        user_id: testUser.id,
        role: 'member'
      });
      
      // 更新项目成员
      projectMember.role = 'admin';
      await projectMember.save();
      
      // 重新查找
      const updatedMember = await ProjectMember.findByPk(projectMember.id);
      
      expect(updatedMember.role).to.equal('admin');
    });
    
    it('should delete a project member', async () => {
      // 创建项目成员
      const projectMember = await ProjectMember.create({
        project_id: testProject.id,
        user_id: testUser.id,
        role: 'member'
      });
      
      // 删除项目成员
      await projectMember.destroy();
      
      // 验证删除
      const notFoundMember = await ProjectMember.findByPk(projectMember.id);
      expect(notFoundMember).to.be.null;
    });
  });
  
  describe('Validations', () => {
    let testUser;
    let testProject;
    let secondUser;
    
    beforeAll(async () => {
      // 创建测试数据
      testUser = await User.create({
        username: 'validationuser',
        email: 'validation@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      });
      
      secondUser = await User.create({
        username: 'seconduser',
        email: 'second@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      });
      
      testProject = await Project.create({
        name: 'Validation Project',
        description: 'This is a validation test project',
        status: 'planning',
        created_by: testUser.id
      });
    });
    
    afterAll(async () => {
      await ProjectMember.destroy({ where: {}, force: true });
      await Project.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    });
    
    it('should not create a project member without project_id', async () => {
      try {
        await ProjectMember.create({
          user_id: testUser.id,
          role: 'member'
        });
        
        // 如果创建成功则失败测试
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
    
    it('should not create a project member without user_id', async () => {
      try {
        await ProjectMember.create({
          project_id: testProject.id,
          role: 'member'
        });
        
        // 如果创建成功则失败测试
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
    
    it('should not create a project member with an invalid role', async () => {
      try {
        await ProjectMember.create({
          project_id: testProject.id,
          user_id: testUser.id,
          role: 'invalid_role'
        });
        
        // 如果创建成功则失败测试
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
    
    it('should not create duplicate project member', async () => {
      // 创建项目成员
      await ProjectMember.create({
        project_id: testProject.id,
        user_id: secondUser.id,
        role: 'member'
      });
      
      // 尝试创建重复的项目成员
      try {
        await ProjectMember.create({
          project_id: testProject.id,
          user_id: secondUser.id,
          role: 'viewer'
        });
        
        // 如果创建成功则失败测试
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
  });
}); 
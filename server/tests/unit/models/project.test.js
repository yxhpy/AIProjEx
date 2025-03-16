const { expect } = require('chai');
const { Sequelize } = require('sequelize');
const ProjectModel = require('../../../src/models/Project');
const UserModel = require('../../../src/models/User');
const ProjectMemberModel = require('../../../src/models/ProjectMember');

describe('Project Model', () => {
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
      expect(Project.getAttributes()).to.have.property('id');
      expect(Project.getAttributes()).to.have.property('name');
      expect(Project.getAttributes()).to.have.property('description');
      expect(Project.getAttributes()).to.have.property('status');
      expect(Project.getAttributes()).to.have.property('start_date');
      expect(Project.getAttributes()).to.have.property('end_date');
      expect(Project.getAttributes()).to.have.property('created_by');
      expect(Project.getAttributes()).to.have.property('deleted_at');
    });

    it('should have correct associations', () => {
      expect(Project.associations).to.have.property('creator');
      expect(Project.associations).to.have.property('members');
    });
  });

  describe('CRUD operations', () => {
    let testUser;
    
    beforeEach(async () => {
      // 创建测试用户
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      });
    });

    afterEach(async () => {
      // 清理测试数据
      await Project.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
    });

    it('should create a project', async () => {
      const project = await Project.create({
        name: 'Test Project',
        description: 'This is a test project',
        status: 'planning',
        created_by: testUser.id
      });

      expect(project).to.be.an('object');
      expect(project.id).to.exist;
      expect(project.name).to.equal('Test Project');
      expect(project.description).to.equal('This is a test project');
      expect(project.status).to.equal('planning');
      expect(project.created_by).to.equal(testUser.id);
    });

    it('should find a project', async () => {
      // 创建项目
      const createdProject = await Project.create({
        name: 'Find Test Project',
        description: 'This is a test project to find',
        status: 'planning',
        created_by: testUser.id
      });

      // 查找项目
      const foundProject = await Project.findByPk(createdProject.id);
      
      expect(foundProject).to.be.an('object');
      expect(foundProject.id).to.equal(createdProject.id);
      expect(foundProject.name).to.equal('Find Test Project');
    });

    it('should update a project', async () => {
      // 创建项目
      const project = await Project.create({
        name: 'Update Test Project',
        description: 'This is a test project to update',
        status: 'planning',
        created_by: testUser.id
      });

      // 更新项目
      project.name = 'Updated Project';
      project.status = 'in_progress';
      await project.save();

      // 重新查找
      const updatedProject = await Project.findByPk(project.id);
      
      expect(updatedProject.name).to.equal('Updated Project');
      expect(updatedProject.status).to.equal('in_progress');
    });

    it('should delete a project', async () => {
      // 创建项目
      const project = await Project.create({
        name: 'Delete Test Project',
        description: 'This is a test project to delete',
        status: 'planning',
        created_by: testUser.id
      });

      // 软删除项目
      await project.destroy();

      // 验证软删除
      const deletedProject = await Project.findByPk(project.id, { paranoid: false });
      expect(deletedProject.deleted_at).to.not.be.null;
      
      // 验证常规查询不返回已删除项目
      const notFoundProject = await Project.findByPk(project.id);
      expect(notFoundProject).to.be.null;
    });
  });

  describe('Validations', () => {
    let testUser;
    
    beforeAll(async () => {
      testUser = await User.create({
        username: 'validationuser',
        email: 'validation@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      });
    });

    afterAll(async () => {
      await User.destroy({ where: {}, force: true });
    });

    it('should not create a project without a name', async () => {
      try {
        await Project.create({
          description: 'Project without name',
          status: 'planning',
          created_by: testUser.id
        });
        
        // 如果创建成功则失败测试
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.name).to.equal('SequelizeValidationError');
      }
    });

    it('should not create a project with an invalid status', async () => {
      try {
        await Project.create({
          name: 'Invalid Status Project',
          description: 'Project with invalid status',
          status: 'invalid_status',
          created_by: testUser.id
        });
        
        // 如果创建成功则失败测试
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
  });
}); 
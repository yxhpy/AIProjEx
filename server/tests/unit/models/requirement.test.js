const { expect } = require('chai');
const sinon = require('sinon');
const { Sequelize } = require('sequelize');
const requirementModel = require('../../../src/models/Requirement');
const projectModel = require('../../../src/models/Project');
const userModel = require('../../../src/models/User');
const projectMemberModel = require('../../../src/models/ProjectMember');

describe('Requirement Model', () => {
  let sequelize;
  let Requirement;
  let Project;
  let User;
  let ProjectMember;
  
  beforeAll(() => {
    // 使用SQLite内存数据库进行测试
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false,
    });
    
    // 初始化模型
    Requirement = requirementModel(sequelize);
    Project = projectModel(sequelize);
    User = userModel(sequelize);
    ProjectMember = projectMemberModel(sequelize);
    
    // 设置关联关系
    const models = { Project, User, Requirement, ProjectMember };
    Object.values(models).forEach(model => {
      if (model.associate) {
        model.associate(models);
      }
    });
  });
  
  beforeEach(async () => {
    // 每次测试前同步数据库结构
    await sequelize.sync({ force: true });
  });
  
  afterEach(() => {
    // 清理所有stub/spy等
    sinon.restore();
  });
  
  describe('模型初始化', () => {
    it('应该正确定义数据模型', () => {
      expect(Requirement).to.be.a('function');
      expect(Requirement.tableName).to.equal('requirements');
    });
    
    it('应该有正确的字段定义', () => {
      const attributes = Requirement.getAttributes();
      
      expect(attributes).to.have.property('id');
      expect(attributes).to.have.property('title');
      expect(attributes).to.have.property('description');
      expect(attributes).to.have.property('priority');
      expect(attributes).to.have.property('status');
      expect(attributes).to.have.property('acceptance_criteria');
      expect(attributes).to.have.property('project_id');
      expect(attributes).to.have.property('created_by');
      expect(attributes).to.have.property('createdAt');
      expect(attributes).to.have.property('updatedAt');
      expect(attributes).to.have.property('deletedAt');
    });
    
    it('应该使用软删除', () => {
      expect(Requirement.options.paranoid).to.be.true;
    });
  });
  
  describe('验证', () => {
    it('创建需求时标题不能为空', async () => {
      try {
        await Requirement.create({
          priority: 'medium',
          status: 'draft',
          project_id: '123e4567-e89b-12d3-a456-426614174000',
          created_by: '123e4567-e89b-12d3-a456-426614174000'
        });
        expect.fail('应该因为标题为空而失败');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
      }
    });
    
    it('应该验证优先级枚举值', async () => {
      try {
        await Requirement.create({
          title: '测试需求',
          priority: 'invalid-priority', // 无效的优先级
          status: 'draft',
          project_id: '123e4567-e89b-12d3-a456-426614174000',
          created_by: '123e4567-e89b-12d3-a456-426614174000'
        });
        expect.fail('应该因为无效的优先级而失败');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
    
    it('应该验证状态枚举值', async () => {
      try {
        await Requirement.create({
          title: '测试需求',
          priority: 'medium',
          status: 'invalid-status', // 无效的状态
          project_id: '123e4567-e89b-12d3-a456-426614174000',
          created_by: '123e4567-e89b-12d3-a456-426614174000'
        });
        expect.fail('应该因为无效的状态而失败');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
  });
  
  describe('实例方法和操作', () => {
    let project;
    let user;
    
    beforeEach(async () => {
      user = await User.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'password123',
        role: 'user'
      });
      
      project = await Project.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '测试项目',
        description: '这是一个测试项目',
        status: 'planning',
        created_by: user.id
      });
    });
    
    it('应该能成功创建需求', async () => {
      const requirementData = {
        title: '实现登录功能',
        description: '实现用户登录功能，包括表单验证',
        priority: 'high',
        status: 'draft',
        acceptance_criteria: '用户能够使用正确的凭据登录系统',
        project_id: project.id,
        created_by: user.id
      };
      
      const requirement = await Requirement.create(requirementData);
      expect(requirement.id).to.exist;
      expect(requirement.title).to.equal(requirementData.title);
      expect(requirement.priority).to.equal(requirementData.priority);
      expect(requirement.createdAt).to.exist;
    });
    
    it('应该能更新需求', async () => {
      const requirement = await Requirement.create({
        title: '实现登录功能',
        description: '实现用户登录功能',
        priority: 'medium',
        status: 'draft',
        project_id: project.id,
        created_by: user.id
      });
      
      // 更新需求
      await requirement.update({
        title: '改进登录功能',
        priority: 'high',
        status: 'approved'
      });
      
      // 重新获取需求
      const updatedRequirement = await Requirement.findByPk(requirement.id);
      expect(updatedRequirement.title).to.equal('改进登录功能');
      expect(updatedRequirement.priority).to.equal('high');
      expect(updatedRequirement.status).to.equal('approved');
    });
    
    it('应该能软删除需求', async () => {
      const requirement = await Requirement.create({
        title: '测试需求',
        priority: 'medium',
        status: 'draft',
        project_id: project.id,
        created_by: user.id
      });
      
      // 软删除需求
      await requirement.destroy();
      
      // 尝试找回被删除的需求（不包括软删除的）
      const notFound = await Requirement.findByPk(requirement.id);
      expect(notFound).to.be.null;
      
      // 尝试找回被删除的需求（包括软删除的）
      const found = await Requirement.findByPk(requirement.id, { paranoid: false });
      expect(found).to.exist;
      expect(found.deleted_at).to.exist;
    });
  });
  
  describe('关联关系', () => {
    it('应该关联到Project模型', () => {
      const associations = Requirement.associations;
      expect(associations).to.have.property('project');
      expect(associations.project.target).to.equal(Project);
    });
    
    it('应该关联到User模型', () => {
      const associations = Requirement.associations;
      expect(associations).to.have.property('creator');
      expect(associations.creator.target).to.equal(User);
    });
  });
}); 
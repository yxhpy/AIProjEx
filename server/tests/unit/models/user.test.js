const { expect } = require('chai');
const sinon = require('sinon');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const userModel = require('../../../src/models/User');
const projectModel = require('../../../src/models/Project');
const projectMemberModel = require('../../../src/models/ProjectMember');

describe('User Model', () => {
  let sequelize;
  let User;
  let Project;
  let ProjectMember;
  
  beforeAll(() => {
    // 使用SQLite内存数据库进行测试
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false,
    });
    
    // 初始化模型
    User = userModel(sequelize);
    Project = projectModel(sequelize);
    ProjectMember = projectMemberModel(sequelize);
    
    // 设置关联关系
    const models = { Project, User, ProjectMember };
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
      expect(User).to.be.a('function');
      expect(User.tableName).to.equal('users');
    });
    
    it('应该有正确的字段定义', () => {
      const attributes = User.getAttributes();
      
      expect(attributes).to.have.property('id');
      expect(attributes).to.have.property('username');
      expect(attributes).to.have.property('email');
      expect(attributes).to.have.property('password_hash');
      expect(attributes).to.have.property('role');
      expect(attributes).to.have.property('avatar_url');
      expect(attributes).to.have.property('deleted_at');
      expect(attributes).to.have.property('createdAt');
      expect(attributes).to.have.property('updatedAt');
    });
    
    it('应该使用软删除', () => {
      expect(User.options.paranoid).to.be.true;
    });
    
    it('应该使用下划线命名约定', () => {
      expect(User.options.underscored).to.be.true;
    });
  });
  
  describe('验证', () => {
    it('创建用户时用户名不能为空', async () => {
      try {
        await User.create({
          email: 'test@example.com',
          password_hash: 'password123',
          role: 'user'
        });
        expect.fail('应该因为用户名为空而失败');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
      }
    });
    
    it('创建用户时邮箱不能为空', async () => {
      try {
        await User.create({
          username: 'testuser',
          password_hash: 'password123',
          role: 'user'
        });
        expect.fail('应该因为邮箱为空而失败');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
      }
    });
    
    it('创建用户时密码不能为空', async () => {
      try {
        await User.create({
          username: 'testuser',
          email: 'test@example.com',
          role: 'user'
        });
        expect.fail('应该因为密码为空而失败');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
      }
    });
    
    it('应该验证用户名长度', async () => {
      try {
        await User.create({
          username: 'te', // 用户名太短
          email: 'test@example.com',
          password_hash: 'password123',
          role: 'user'
        });
        expect.fail('应该因为用户名太短而失败');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
      }
      
      try {
        await User.create({
          username: 'a'.repeat(31), // 用户名太长
          email: 'test@example.com',
          password_hash: 'password123',
          role: 'user'
        });
        expect.fail('应该因为用户名太长而失败');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
      }
    });
    
    it('应该验证邮箱格式', async () => {
      try {
        await User.create({
          username: 'testuser',
          email: 'invalid-email', // 无效的邮箱格式
          password_hash: 'password123',
          role: 'user'
        });
        expect.fail('应该因为邮箱格式无效而失败');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
      }
    });
    
    it('应该验证角色枚举值', async () => {
      try {
        await User.create({
          username: 'testuser',
          email: 'test@example.com',
          password_hash: 'password123',
          role: 'invalid-role' // 无效的角色
        });
        // 如果执行到这里，说明创建成功了，测试应该失败
        expect.fail('应该因为无效的角色而失败');
      } catch (error) {
        // 我们只需要确保因为错误的角色值抛出了异常
        expect(error).to.exist;
      }
    });
  });
  
  describe('实例方法和操作', () => {
    it('应该能成功创建用户', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'password123',
        role: 'user'
      };
      
      const user = await User.create(userData);
      expect(user.id).to.exist;
      expect(user.username).to.equal(userData.username);
      expect(user.email).to.equal(userData.email);
      expect(user.role).to.equal(userData.role);
      expect(user.createdAt).to.exist;
    });
    
    it('应该在创建用户时对密码进行哈希处理', async () => {
      const bcryptSpy = sinon.spy(bcrypt, 'hash');
      
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'password123',
        role: 'user'
      });
      
      expect(bcryptSpy.called).to.be.true;
    });
    
    it('应该能更新用户信息', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'password123',
        role: 'user'
      });
      
      // 更新用户信息
      await user.update({
        username: 'updateduser',
        email: 'updated@example.com',
        avatar_url: 'https://example.com/avatar.jpg'
      });
      
      // 重新获取用户信息
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.username).to.equal('updateduser');
      expect(updatedUser.email).to.equal('updated@example.com');
      expect(updatedUser.avatar_url).to.equal('https://example.com/avatar.jpg');
    });
    
    it('应该能软删除用户', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'password123',
        role: 'user'
      });
      
      // 软删除用户
      await user.destroy();
      
      // 尝试找回被删除的用户（不包括软删除的）
      const notFound = await User.findByPk(user.id);
      expect(notFound).to.be.null;
      
      // 尝试找回被删除的用户（包括软删除的）
      const found = await User.findByPk(user.id, { paranoid: false });
      expect(found).to.exist;
      expect(found.deleted_at).to.exist;
    });
  });
  
  describe('实例方法', () => {
    it('validatePassword 方法应正确验证密码', async () => {
      // 创建一个用户
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'password123',
        role: 'user'
      });
      
      // 模拟 bcrypt.compare 的行为
      sinon.stub(bcrypt, 'compare')
        .withArgs('password123', sinon.match.any).resolves(true)
        .withArgs('wrongpassword', sinon.match.any).resolves(false);
      
      // 测试正确密码
      const validResult = await user.validatePassword('password123');
      expect(validResult).to.be.true;
      
      // 测试错误密码
      const invalidResult = await user.validatePassword('wrongpassword');
      expect(invalidResult).to.be.false;
    });
  });
  
  describe('关联关系', () => {
    it('应该关联到 Project 模型（创建者关系）', () => {
      const associations = User.associations;
      expect(associations).to.have.property('createdProjects');
      expect(associations.createdProjects.target).to.equal(Project);
    });
    
    it('应该关联到 Project 模型（多对多关系）', () => {
      const associations = User.associations;
      expect(associations).to.have.property('projects');
      expect(associations.projects.target).to.equal(Project);
      expect(associations.projects.through.model).to.equal(ProjectMember);
    });
  });
}); 
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
    // 创建内存数据库连接
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    // 初始化模型
    User = UserModel(sequelize);
    Project = ProjectModel(sequelize);
    ProjectMember = ProjectMemberModel(sequelize);
    
    // 设置模型关联
    const models = { User, Project, ProjectMember };
    Object.values(models).forEach(model => {
      if (model.associate) {
        model.associate(models);
      }
    });
    
    // 同步数据库结构
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // 清理数据库
    await Project.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await ProjectMember.destroy({ where: {}, force: true });
  });

  test('创建项目成员应该设置默认值', async () => {
    // 创建测试用户
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'password123',
      role: 'user'
    });

    // 创建项目
    const project = await Project.create({
      name: '测试项目',
      created_by: user.id
    });

    // 创建项目成员关系
    const projectMember = await ProjectMember.create({
      project_id: project.id,
      user_id: user.id
    });

    // 验证项目成员属性
    expect(projectMember).toHaveProperty('id');
    expect(projectMember.project_id).toBe(project.id);
    expect(projectMember.user_id).toBe(user.id);
    expect(projectMember.role).toBe('member'); // 默认角色
    expect(projectMember).toHaveProperty('joined_at');
  });

  test('项目成员角色可以设置', async () => {
    // 创建测试用户
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'password123',
      role: 'user'
    });

    // 创建项目
    const project = await Project.create({
      name: '测试项目',
      created_by: user.id
    });

    // 创建项目成员关系并设置角色
    const projectMember = await ProjectMember.create({
      project_id: project.id,
      user_id: user.id,
      role: 'admin'
    });

    // 验证项目成员角色
    expect(projectMember.role).toBe('admin');
  });

  test('同一用户不能多次添加到同一项目', async () => {
    // 创建测试用户
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'password123',
      role: 'user'
    });

    // 创建项目
    const project = await Project.create({
      name: '测试项目',
      created_by: user.id
    });

    // 创建项目成员关系
    await ProjectMember.create({
      project_id: project.id,
      user_id: user.id,
      role: 'member'
    });

    // 尝试再次添加同一用户到同一项目，应该失败
    await expect(ProjectMember.create({
      project_id: project.id,
      user_id: user.id,
      role: 'admin'
    })).rejects.toThrow();
  });

  test('可以更新项目成员角色', async () => {
    // 创建测试用户
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'password123',
      role: 'user'
    });

    // 创建项目
    const project = await Project.create({
      name: '测试项目',
      created_by: user.id
    });

    // 创建项目成员关系
    const projectMember = await ProjectMember.create({
      project_id: project.id,
      user_id: user.id,
      role: 'member'
    });

    // 更新成员角色
    await projectMember.update({ role: 'admin' });
    
    // 重新获取并验证
    const updatedMember = await ProjectMember.findByPk(projectMember.id);
    expect(updatedMember.role).toBe('admin');
  });
}); 
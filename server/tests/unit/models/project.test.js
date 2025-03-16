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

  test('创建项目时应该设置默认值', async () => {
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

    // 验证项目属性
    expect(project).toHaveProperty('id');
    expect(project.name).toBe('测试项目');
    expect(project.status).toBe('planning');
    expect(project.created_by).toBe(user.id);
    expect(project.deleted_at).toBeNull();
  });

  test('项目名称不能为空', async () => {
    // 创建测试用户
    const user = await User.create({
      username: 'testuser2',
      email: 'test2@example.com',
      password_hash: 'password123',
      role: 'user'
    });

    // 验证项目名称不能为空
    await expect(Project.create({
      name: '',
      created_by: user.id
    })).rejects.toThrow();
  });

  test('项目可以关联多个成员', async () => {
    // 创建测试用户
    const owner = await User.create({
      username: 'owner',
      email: 'owner@example.com',
      password_hash: 'password123',
      role: 'user'
    });
    
    const member = await User.create({
      username: 'member',
      email: 'member@example.com',
      password_hash: 'password123',
      role: 'user'
    });

    // 创建项目
    const project = await Project.create({
      name: '测试项目',
      created_by: owner.id
    });

    // 添加项目成员
    await ProjectMember.create({
      project_id: project.id,
      user_id: owner.id,
      role: 'owner'
    });
    
    await ProjectMember.create({
      project_id: project.id,
      user_id: member.id,
      role: 'member'
    });

    // 获取项目包括成员
    const projectWithMembers = await Project.findByPk(project.id, {
      include: ['members']
    });

    // 验证项目成员
    expect(projectWithMembers.members).toHaveLength(2);
    expect(projectWithMembers.members[0].ProjectMember.role).toBe('owner');
    expect(projectWithMembers.members[1].ProjectMember.role).toBe('member');
  });
}); 
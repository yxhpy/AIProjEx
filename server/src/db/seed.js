const bcrypt = require('bcryptjs');
const { User, Project, ProjectMember } = require('../models');
const { sequelize } = require('../models');

async function seed() {
  try {
    // 确保数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功。');

    // 使用事务确保数据一致性
    await sequelize.transaction(async (transaction) => {
      // 创建测试用户
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password_hash: bcrypt.hashSync('password123', 8),
        role: 'admin'
      }, { transaction });

      const user1 = await User.create({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: bcrypt.hashSync('password123', 8),
        role: 'user'
      }, { transaction });

      const user2 = await User.create({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: bcrypt.hashSync('password123', 8),
        role: 'user'
      }, { transaction });

      console.log('测试用户创建成功');

      // 创建测试项目
      const project1 = await Project.create({
        name: '电商平台开发',
        description: '开发一个现代化的电子商务平台，包括前端和后端',
        status: 'in_progress',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-06-30'),
        created_by: adminUser.id
      }, { transaction });

      const project2 = await Project.create({
        name: '移动应用开发',
        description: '为客户开发iOS和Android移动应用',
        status: 'planning',
        start_date: new Date('2025-04-01'),
        created_by: user1.id
      }, { transaction });

      const project3 = await Project.create({
        name: '网站重构项目',
        description: '重构现有网站，提升性能和用户体验',
        status: 'completed',
        start_date: new Date('2024-10-01'),
        end_date: new Date('2025-02-28'),
        created_by: adminUser.id
      }, { transaction });

      console.log('测试项目创建成功');

      // 创建项目成员关系
      await ProjectMember.create({
        project_id: project1.id,
        user_id: adminUser.id,
        role: 'owner',
        joined_at: new Date()
      }, { transaction });

      await ProjectMember.create({
        project_id: project1.id,
        user_id: user1.id,
        role: 'member',
        joined_at: new Date()
      }, { transaction });

      await ProjectMember.create({
        project_id: project1.id,
        user_id: user2.id,
        role: 'viewer',
        joined_at: new Date()
      }, { transaction });

      await ProjectMember.create({
        project_id: project2.id,
        user_id: user1.id,
        role: 'owner',
        joined_at: new Date()
      }, { transaction });

      await ProjectMember.create({
        project_id: project2.id,
        user_id: adminUser.id,
        role: 'admin',
        joined_at: new Date()
      }, { transaction });

      await ProjectMember.create({
        project_id: project3.id,
        user_id: adminUser.id,
        role: 'owner',
        joined_at: new Date()
      }, { transaction });

      await ProjectMember.create({
        project_id: project3.id,
        user_id: user2.id,
        role: 'member',
        joined_at: new Date()
      }, { transaction });

      console.log('项目成员关系创建成功');
    });

    console.log('所有测试数据添加成功！');
    process.exit(0);
  } catch (error) {
    console.error('添加测试数据失败：', error);
    process.exit(1);
  }
}

seed(); 
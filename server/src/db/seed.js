const bcrypt = require('bcryptjs');
const { User, Project, ProjectMember, Requirement } = require('../models');
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
      
      // 创建测试需求
      await Requirement.create({
        title: '用户注册和登录功能',
        description: '实现用户注册、登录和密码重置功能，支持邮箱验证',
        priority: 'high',
        status: 'approved',
        acceptance_criteria: '- 用户可以使用邮箱注册账号\n- 登录支持记住我功能\n- 忘记密码可以通过邮箱重置',
        project_id: project1.id,
        created_by: adminUser.id
      }, { transaction });
      
      await Requirement.create({
        title: '商品展示页面',
        description: '设计并实现商品列表和详情页面，支持分类筛选和搜索',
        priority: 'high',
        status: 'implemented',
        acceptance_criteria: '- 商品列表支持分页\n- 可以按类别筛选商品\n- 商品详情页显示完整信息和相关推荐',
        project_id: project1.id,
        created_by: adminUser.id
      }, { transaction });
      
      await Requirement.create({
        title: '购物车功能',
        description: '实现购物车添加、删除、修改数量等功能',
        priority: 'medium',
        status: 'review',
        acceptance_criteria: '- 用户可以将商品添加到购物车\n- 可以修改购物车中商品数量\n- 可以删除购物车中的商品',
        project_id: project1.id,
        created_by: user1.id
      }, { transaction });
      
      await Requirement.create({
        title: '支付功能集成',
        description: '集成多种支付方式，包括信用卡、PayPal等',
        priority: 'critical',
        status: 'draft',
        acceptance_criteria: '- 支持至少3种支付方式\n- 支付过程安全可靠\n- 提供支付状态实时反馈',
        project_id: project1.id,
        created_by: adminUser.id
      }, { transaction });
      
      await Requirement.create({
        title: '用户界面设计',
        description: '设计移动应用的用户界面，确保良好的用户体验',
        priority: 'high',
        status: 'draft',
        acceptance_criteria: '- 符合现代设计标准\n- 支持深色模式\n- 响应式设计适应不同设备',
        project_id: project2.id,
        created_by: user1.id
      }, { transaction });
      
      await Requirement.create({
        title: '性能优化',
        description: '优化网站加载速度和响应时间',
        priority: 'medium',
        status: 'implemented',
        acceptance_criteria: '- 页面加载时间小于2秒\n- 优化资源加载\n- 实施缓存策略',
        project_id: project3.id,
        created_by: adminUser.id
      }, { transaction });
      
      console.log('测试需求创建成功');
    });

    console.log('所有测试数据添加成功！');
    process.exit(0);
  } catch (error) {
    console.error('添加测试数据失败：', error);
    process.exit(1);
  }
}

seed(); 
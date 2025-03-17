const request = require('supertest');
const { expect } = require('chai');
const app = require('../../testApp');
const { sequelize } = require('../../config/database');
const UserModel = require('../../../src/models/User');
const ProjectModel = require('../../../src/models/Project');
const ProjectMemberModel = require('../../../src/models/ProjectMember');
const authHelper = require('../../helpers/authHelper');
const jwt = require('jsonwebtoken');
const config = require('../../../src/config');

describe('Projects API', () => {
  let testUser, testProject, testMember, token, anotherToken;
  let User, Project, ProjectMember;

  beforeAll(async () => {
    // 初始化模型
    User = UserModel(sequelize);
    Project = ProjectModel(sequelize);
    ProjectMember = ProjectMemberModel(sequelize);

    // 设置关联关系
    const models = { User, Project, ProjectMember };
    Object.values(models).forEach(model => {
      if (model.associate) {
        model.associate(models);
      }
    });
    
    // 清理测试数据库
    await sequelize.sync({ force: true });
    
    // 创建测试用户
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'password123',
      role: 'user'
    });
    
    // 创建另一个测试用户
    const anotherUser = await User.create({
      username: 'anotheruser',
      email: 'another@example.com',
      password_hash: 'password123',
      role: 'user'
    });
    
    // 创建测试项目
    testProject = await Project.create({
      name: '测试项目',
      description: '用于API测试的项目',
      status: 'planning',
      created_by: testUser.id
    });
    
    // 添加项目成员关系
    testMember = await ProjectMember.create({
      project_id: testProject.id,
      user_id: testUser.id,
      role: 'owner'
    });
    
    // 生成测试令牌
    token = jwt.sign(
      { id: testUser.id, role: testUser.role },
      config.jwtSecret || 'testSecret',
      { expiresIn: '1h' }
    );
    
    // 生成另一个测试令牌
    anotherToken = jwt.sign(
      { id: anotherUser.id, role: anotherUser.role },
      config.jwtSecret || 'testSecret',
      { expiresIn: '1h' }
    );
  });
  
  afterAll(async () => {
    // 清理测试数据
    await ProjectMember.destroy({ where: {}, force: true });
    await Project.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  });
  
  describe('GET /api/v1/projects', () => {
    it('未认证用户请求应返回401', async () => {
      const res = await request(app)
        .get('/api/v1/projects');
      
      expect(res.status).to.equal(401);
    });
    
    it('认证用户应能获取项目列表', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('projects');
      expect(res.body.data.projects).to.be.an('array');
      expect(res.body.data.projects).to.have.length.at.least(1);
      
      const project = res.body.data.projects[0];
      expect(project).to.have.property('id');
      expect(project).to.have.property('name');
      expect(project).to.have.property('status');
    });
    
    it('应支持按状态过滤项目', async () => {
      const res = await request(app)
        .get('/api/v1/projects?status=planning')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(200);
      expect(res.body.data.projects).to.be.an('array');
      
      // 确认所有返回的项目状态都是planning
      res.body.data.projects.forEach(project => {
        expect(project.status).to.equal('planning');
      });
    });
  });
  
  describe('GET /api/v1/projects/:id', () => {
    it('应返回项目详情', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('id', testProject.id);
      expect(res.body.data).to.have.property('name', testProject.name);
      expect(res.body.data).to.have.property('description', testProject.description);
      expect(res.body.data).to.have.property('status', testProject.status);
    });
    
    it('请求不存在的项目应返回404', async () => {
      const res = await request(app)
        .get('/api/v1/projects/999999')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(404);
    });
  });
  
  describe('POST /api/v1/projects', () => {
    it('应创建新项目', async () => {
      const projectData = {
        name: '新测试项目',
        description: '通过API创建的测试项目',
        status: 'planning',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send(projectData);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('id');
      expect(res.body.data).to.have.property('name', projectData.name);
      expect(res.body.data).to.have.property('description', projectData.description);
      expect(res.body.data).to.have.property('status', projectData.status);
      expect(res.body.data).to.have.property('created_by', testUser.id);
    });
    
    it('缺少必要字段应返回400', async () => {
      const invalidData = {
        description: '缺少名称的项目'
      };
      
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
  });
  
  describe('PUT /api/v1/projects/:id', () => {
    it('应更新项目信息', async () => {
      const updateData = {
        name: '更新后的项目名称',
        description: '更新后的项目描述',
        status: 'in_progress'
      };
      
      const res = await request(app)
        .put(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('id', testProject.id);
      expect(res.body.data).to.have.property('name', updateData.name);
      expect(res.body.data).to.have.property('description', updateData.description);
      expect(res.body.data).to.have.property('status', updateData.status);
    });
  });
  
  describe('DELETE /api/v1/projects/:id', () => {
    it('非项目所有者不能删除项目', async () => {
      // 尝试删除项目
      const res = await request(app)
        .delete(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${anotherToken}`);
      
      expect(res.status).to.equal(403);
    });
    
    it('项目所有者可以删除项目', async () => {
      // 删除项目
      const res = await request(app)
        .delete(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message');
      
      // 验证项目已被删除
      const deletedProject = await Project.findByPk(testProject.id);
      expect(deletedProject).to.be.null;
    });
  });
}); 
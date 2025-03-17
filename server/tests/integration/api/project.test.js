const request = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const app = require('../../testApp');
const { sequelize } = require('../../config/database');
const { setupTestDatabase } = require('../../setup');
const UserModel = require('../../../src/models/User');
const ProjectModel = require('../../../src/models/Project');
const ProjectMemberModel = require('../../../src/models/ProjectMember');

describe('Project API', () => {
  let testUser;
  let testUser2;
  let testProject;
  let userToken;
  let user2Token;
  let User, Project, ProjectMember;
  
  beforeAll(async () => {
    // 设置测试数据库
    await setupTestDatabase();
    
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
    
    // 同步数据库
    await sequelize.sync({ force: true });
    
    // 创建测试用户
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: '$2a$10$TQE9mLdMPMWEYIsAAAXyg.rk9WD5G0V1WZYMKfEC8P2AJjdwL76u2', // 'password123'
      role: 'user'
    });
    
    testUser2 = await User.create({
      username: 'testuser2',
      email: 'test2@example.com',
      password_hash: '$2a$10$TQE9mLdMPMWEYIsAAAXyg.rk9WD5G0V1WZYMKfEC8P2AJjdwL76u2', // 'password123'
      role: 'user'
    });
    
    // 创建JWT令牌
    userToken = jwt.sign(
      { id: testUser.id, username: testUser.username, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    user2Token = jwt.sign(
      { id: testUser2.id, username: testUser2.username, email: testUser2.email, role: testUser2.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    // 创建测试项目
    testProject = await Project.create({
      name: 'Test Project',
      description: 'This is a test project',
      status: 'planning',
      created_by: testUser.id
    });
    
    // 添加项目成员
    await ProjectMember.create({
      project_id: testProject.id,
      user_id: testUser.id,
      role: 'owner'
    });
  });
  
  afterAll(async () => {
    // 清理测试数据
    await ProjectMember.destroy({ where: {}, force: true });
    await Project.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    
    // 关闭数据库连接
    await sequelize.close();
  });
  
  describe('GET /api/v1/projects', () => {
    it('should get projects for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('projects');
      expect(response.body.projects).to.be.an('array');
      expect(response.body).to.have.property('pagination');
    });
    
    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/v1/projects');
      
      expect(response.status).to.equal(401);
    });
  });
  
  describe('GET /api/v1/projects/:id', () => {
    it('should get project by id for project owner', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('id', testProject.id);
      expect(response.body).to.have.property('name', 'Test Project');
    });
    
    it('should return 403 for non-member user', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      
      expect(response.status).to.equal(403);
    });
    
    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/v1/projects/nonexistent-id')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).to.equal(404);
    });
  });
  
  describe('POST /api/v1/projects', () => {
    it('should create a new project', async () => {
      const newProject = {
        name: 'New Test Project',
        description: 'This is a new test project',
        status: 'planning'
      };
      
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newProject);
      
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('name', 'New Test Project');
      expect(response.body).to.have.property('created_by', testUser.id);
      
      // 清理创建的项目
      await Project.destroy({ where: { id: response.body.id }, force: true });
    });
    
    it('should return 400 for invalid project data', async () => {
      const invalidProject = {
        description: 'Missing name field'
      };
      
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidProject);
      
      expect(response.status).to.equal(400);
    });
  });
  
  describe('PUT /api/v1/projects/:id', () => {
    it('should update project for project owner', async () => {
      const updateData = {
        name: 'Updated Test Project',
        description: 'This is an updated test project',
        status: 'in_progress'
      };
      
      const response = await request(app)
        .put(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('name', 'Updated Test Project');
      expect(response.body).to.have.property('status', 'in_progress');
    });
    
    it('should return 403 for non-owner user', async () => {
      const updateData = {
        name: 'Unauthorized Update'
      };
      
      const response = await request(app)
        .put(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(updateData);
      
      expect(response.status).to.equal(403);
    });
    
    it('should return 404 for non-existent project', async () => {
      const updateData = {
        name: 'Update Nonexistent Project'
      };
      
      const response = await request(app)
        .put('/api/v1/projects/nonexistent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);
      
      expect(response.status).to.equal(404);
    });
  });
  
  describe('DELETE /api/v1/projects/:id', () => {
    let projectToDelete;
    
    beforeEach(async () => {
      // 创建待删除的项目
      projectToDelete = await Project.create({
        name: 'Project To Delete',
        description: 'This project will be deleted',
        status: 'planning',
        created_by: testUser.id
      });
      
      await ProjectMember.create({
        project_id: projectToDelete.id,
        user_id: testUser.id,
        role: 'owner'
      });
    });
    
    it('should delete project for project owner', async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${projectToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message').that.includes('deleted');
      
      // 验证项目已被软删除
      const deletedProject = await Project.findByPk(projectToDelete.id);
      expect(deletedProject).to.be.null;
    });
    
    it('should return 403 for non-owner user', async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${projectToDelete.id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      
      expect(response.status).to.equal(403);
    });
    
    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .delete('/api/v1/projects/nonexistent-id')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).to.equal(404);
    });
  });
  
  describe('GET /api/v1/projects/:id/members', () => {
    it('should get project members for project member', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProject.id}/members`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.lengthOf(1);
      expect(response.body[0]).to.have.property('id', testUser.id);
      expect(response.body[0]).to.have.property('role', 'owner');
    });
    
    it('should return 403 for non-member user', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProject.id}/members`)
        .set('Authorization', `Bearer ${user2Token}`);
      
      expect(response.status).to.equal(403);
    });
  });
  
  describe('POST /api/v1/projects/:id/members', () => {
    it('should add a member to project', async () => {
      const memberData = {
        user_id: testUser2.id,
        role: 'member'
      };
      
      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/members`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(memberData);
      
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('user_id', testUser2.id);
      expect(response.body).to.have.property('role', 'member');
      
      // 清理创建的成员关系
      await ProjectMember.destroy({ 
        where: { 
          project_id: testProject.id, 
          user_id: testUser2.id 
        } 
      });
    });
    
    it('should return 403 for non-owner user', async () => {
      // 先添加用户2为成员
      await ProjectMember.create({
        project_id: testProject.id,
        user_id: testUser2.id,
        role: 'member'
      });
      
      const newMemberData = {
        user_id: 'newuser',
        role: 'member'
      };
      
      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/members`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(newMemberData);
      
      expect(response.status).to.equal(403);
      
      // 清理创建的成员关系
      await ProjectMember.destroy({ 
        where: { 
          project_id: testProject.id, 
          user_id: testUser2.id 
        } 
      });
    });
  });
}); 
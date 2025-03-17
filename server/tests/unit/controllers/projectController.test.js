jest.mock('../../../src/services/projectService', () => ({
  getProjects: jest.fn(),
  getProjectById: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  getProjectMembers: jest.fn(),
  removeProjectMember: jest.fn(),
  addProjectMember: jest.fn(),
  isProjectMember: jest.fn(),
  isProjectOwner: jest.fn()
}));

jest.mock('../../../src/utils/validators', () => ({
  validateProject: jest.fn()
}));

const projectController = require('../../../src/controllers/projectController');
const projectService = require('../../../src/services/projectService');
const { validateProject } = require('../../../src/utils/validators');

describe('Project Controller', () => {
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    // 模拟请求对象
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: '123' }
    };
    
    // 模拟响应对象
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // 模拟next函数
    next = jest.fn();
    
    jest.clearAllMocks();
  });
  
  describe('getProjects', () => {
    it('应该返回所有项目', async () => {
      // 模拟查询参数
      req.query = { page: '1', limit: '10', sort: 'createdAt', order: 'desc' };
      
      // 模拟projectService
      const mockProjects = [
        { id: '1', name: '项目1', status: 'active' },
        { id: '2', name: '项目2', status: 'planning' }
      ];
      
      const result = {
        projects: mockProjects,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      
      projectService.getProjects.mockResolvedValue(result);
      
      // 调用控制器方法
      await projectController.getProjects(req, res, next);
      
      // 验证结果
      expect(projectService.getProjects).toHaveBeenCalledWith({
        userId: '123',
        page: 1,
        limit: 10,
        status: undefined,
        sort: 'createdAt',
        order: 'desc'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });
    
    it('发生错误时应传递给错误处理中间件', async () => {
      // 模拟projectService抛出错误
      const error = new Error('数据库错误');
      projectService.getProjects.mockRejectedValue(error);
      
      // 调用控制器方法
      await projectController.getProjects(req, res, next);
      
      // 验证结果
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('getProjectById', () => {
    it('应该返回指定ID的项目', async () => {
      // 设置项目ID
      req.params.id = '123';
      
      // 模拟projectService
      const mockProject = {
        id: '123',
        name: '测试项目',
        description: '这是一个测试项目'
      };
      
      projectService.getProjectById.mockResolvedValue(mockProject);
      
      // 调用控制器方法
      await projectController.getProjectById(req, res, next);
      
      // 验证结果
      expect(projectService.getProjectById).toHaveBeenCalledWith('123', '123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });
    
    it('项目不存在时应返回404错误', async () => {
      // 设置请求参数
      req.params.id = '999';
      
      // 模拟projectService返回null（项目不存在）
      projectService.getProjectById.mockResolvedValue(null);
      
      // 调用控制器方法
      await projectController.getProjectById(req, res, next);
      
      // 验证结果
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: '项目不存在或您没有权限访问' });
    });
    
    it('发生错误时应传递给错误处理中间件', async () => {
      // 设置请求参数
      req.params.id = '123';
      
      // 模拟projectService抛出错误
      const error = new Error('数据库错误');
      projectService.getProjectById.mockRejectedValue(error);
      
      // 调用控制器方法
      await projectController.getProjectById(req, res, next);
      
      // 验证结果
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('createProject', () => {
    it('应该成功创建项目', async () => {
      // 准备请求数据
      req.body = {
        name: '测试项目',
        description: '这是一个测试项目',
        status: 'planning'
      };
      
      // 模拟验证通过
      validateProject.mockReturnValue({
        error: null,
        value: req.body
      });
      
      // 模拟projectService
      const mockProject = {
        id: '456',
        name: '测试项目',
        description: '这是一个测试项目',
        status: 'planning',
        owner_id: '123'
      };
      
      projectService.createProject.mockResolvedValue(mockProject);
      
      // 调用控制器方法
      await projectController.createProject(req, res, next);
      
      // 验证结果
      expect(validateProject).toHaveBeenCalledWith(req.body);
      expect(projectService.createProject).toHaveBeenCalledWith(req.body, '123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });
    
    it('验证失败时应返回400错误', async () => {
      // 准备请求数据
      req.body = {
        description: '缺少项目名称'
      };
      
      // 模拟验证失败
      validateProject.mockReturnValue({
        error: { details: [{ message: '项目名称不能为空' }] },
        value: req.body
      });
      
      // 调用控制器方法
      await projectController.createProject(req, res, next);
      
      // 验证结果
      expect(validateProject).toHaveBeenCalledWith(req.body);
      expect(projectService.createProject).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '项目名称不能为空' });
    });
    
    it('发生错误时应传递给错误处理中间件', async () => {
      // 准备请求数据
      req.body = {
        name: '测试项目',
        description: '这是一个测试项目'
      };
      
      // 模拟验证通过
      validateProject.mockReturnValue({
        error: null,
        value: req.body
      });
      
      // 模拟projectService抛出错误
      const error = new Error('数据库错误');
      projectService.createProject.mockRejectedValue(error);
      
      // 调用控制器方法
      await projectController.createProject(req, res, next);
      
      // 验证结果
      expect(validateProject).toHaveBeenCalledWith(req.body);
      expect(projectService.createProject).toHaveBeenCalledWith(req.body, '123');
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('updateProject', () => {
    it('应该成功更新项目', async () => {
      // 设置项目ID和请求体
      req.params.id = '123';
      req.body = {
        name: '更新后的项目名称',
        description: '更新后的项目描述'
      };
      
      // 模拟验证通过
      validateProject.mockReturnValue({
        error: null,
        value: req.body
      });
      
      // 模拟projectService
      const mockProject = {
        id: '123',
        name: '更新后的项目名称',
        description: '更新后的项目描述'
      };
      
      projectService.updateProject.mockResolvedValue(mockProject);
      
      // 调用控制器方法
      await projectController.updateProject(req, res, next);
      
      // 验证结果
      expect(validateProject).toHaveBeenCalledWith(req.body, true);
      expect(projectService.updateProject).toHaveBeenCalledWith('123', req.body, '123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });
    
    it('验证失败时应返回400错误', async () => {
      // 设置项目ID和请求体
      req.params.id = '123';
      req.body = {
        status: '无效状态'
      };
      
      // 模拟验证失败
      validateProject.mockReturnValue({
        error: { details: [{ message: '项目状态无效' }] },
        value: req.body
      });
      
      // 调用控制器方法
      await projectController.updateProject(req, res, next);
      
      // 验证结果
      expect(validateProject).toHaveBeenCalledWith(req.body, true);
      expect(projectService.updateProject).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '项目状态无效' });
    });
    
    it('项目不存在时应返回404错误', async () => {
      // 设置项目ID和请求体
      req.params.id = '999';
      req.body = {
        name: '更新后的项目名称'
      };
      
      // 模拟验证通过
      validateProject.mockReturnValue({
        error: null,
        value: req.body
      });
      
      // 模拟projectService返回null（项目不存在）
      projectService.updateProject.mockResolvedValue(null);
      
      // 调用控制器方法
      await projectController.updateProject(req, res, next);
      
      // 验证结果
      expect(validateProject).toHaveBeenCalledWith(req.body, true);
      expect(projectService.updateProject).toHaveBeenCalledWith('999', req.body, '123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: '项目不存在或您没有权限修改' });
    });
    
    it('发生错误时应传递给错误处理中间件', async () => {
      // 设置项目ID和请求体
      req.params.id = '123';
      req.body = {
        name: '更新后的项目名称'
      };
      
      // 模拟验证通过
      validateProject.mockReturnValue({
        error: null,
        value: req.body
      });
      
      // 模拟projectService抛出错误
      const error = new Error('数据库错误');
      projectService.updateProject.mockRejectedValue(error);
      
      // 调用控制器方法
      await projectController.updateProject(req, res, next);
      
      // 验证结果
      expect(validateProject).toHaveBeenCalledWith(req.body, true);
      expect(projectService.updateProject).toHaveBeenCalledWith('123', req.body, '123');
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('deleteProject', () => {
    it('应该成功删除项目', async () => {
      // 设置项目ID
      req.params.id = '123';
      
      // 模拟projectService
      projectService.deleteProject.mockResolvedValue(true);
      
      // 调用控制器方法
      await projectController.deleteProject(req, res, next);
      
      // 验证结果
      expect(projectService.deleteProject).toHaveBeenCalledWith('123', '123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: '项目已成功删除' });
    });
    
    it('项目不存在时应返回404错误', async () => {
      // 设置项目ID
      req.params.id = '999';
      
      // 模拟projectService返回false（项目不存在）
      projectService.deleteProject.mockResolvedValue(false);
      
      // 调用控制器方法
      await projectController.deleteProject(req, res, next);
      
      // 验证结果
      expect(projectService.deleteProject).toHaveBeenCalledWith('999', '123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: '项目不存在或您没有权限删除' });
    });
    
    it('发生错误时应传递给错误处理中间件', async () => {
      // 设置项目ID
      req.params.id = '123';
      
      // 模拟projectService抛出错误
      const error = new Error('数据库错误');
      projectService.deleteProject.mockRejectedValue(error);
      
      // 调用控制器方法
      await projectController.deleteProject(req, res, next);
      
      // 验证结果
      expect(projectService.deleteProject).toHaveBeenCalledWith('123', '123');
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('getProjectMembers', () => {
    it('应该返回项目成员列表', async () => {
      // 设置项目ID
      req.params.id = '123';
      
      // 模拟projectService
      const mockMembers = [
        { id: '1', username: '用户1', role: 'admin' },
        { id: '2', username: '用户2', role: 'member' }
      ];
      
      projectService.isProjectMember.mockResolvedValue(true);
      projectService.getProjectMembers.mockResolvedValue(mockMembers);
      
      // 调用控制器方法
      await projectController.getProjectMembers(req, res, next);
      
      // 验证结果
      expect(projectService.isProjectMember).toHaveBeenCalledWith('123', '123');
      expect(projectService.getProjectMembers).toHaveBeenCalledWith('123', '123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockMembers);
    });
    
    it('项目不存在时应返回404错误', async () => {
      // 设置项目ID
      req.params.id = '999';
      
      // 模拟projectService返回null（项目不存在）
      projectService.isProjectMember.mockResolvedValue(false);
      
      // 调用控制器方法
      await projectController.getProjectMembers(req, res, next);
      
      // 验证结果
      expect(projectService.isProjectMember).toHaveBeenCalledWith('999', '123');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: '您没有权限访问此项目成员列表' });
    });
    
    it('发生错误时应传递给错误处理中间件', async () => {
      // 设置项目ID
      req.params.id = '123';
      
      // 模拟projectService抛出错误
      const error = new Error('数据库错误');
      projectService.isProjectMember.mockRejectedValue(error);
      
      // 调用控制器方法
      await projectController.getProjectMembers(req, res, next);
      
      // 验证结果
      expect(projectService.isProjectMember).toHaveBeenCalledWith('123', '123');
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('removeProjectMember', () => {
    it('应成功移除项目成员并返回200状态', async () => {
      // 准备
      req.params = { id: 'project123', userId: 'user456' };
      req.user = { id: 'admin789' };
      projectService.isProjectOwner.mockResolvedValue(true);
      projectService.removeProjectMember.mockResolvedValue(true);

      // 执行
      await projectController.removeProjectMember(req, res, next);

      // 验证
      expect(projectService.isProjectOwner).toHaveBeenCalledWith('project123', 'admin789');
      expect(projectService.removeProjectMember).toHaveBeenCalledWith('project123', 'user456', 'admin789');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: '成员已成功移除' });
      expect(next).not.toHaveBeenCalled();
    });

    it('当项目不存在、成员不存在或无权限时，应返回404状态', async () => {
      // 准备
      req.params = { id: 'project123', userId: 'user456' };
      req.user = { id: 'member789' };
      projectService.isProjectOwner.mockResolvedValue(true);
      projectService.removeProjectMember.mockResolvedValue(false);

      // 执行
      await projectController.removeProjectMember(req, res, next);

      // 验证
      expect(projectService.isProjectOwner).toHaveBeenCalledWith('project123', 'member789');
      expect(projectService.removeProjectMember).toHaveBeenCalledWith('project123', 'user456', 'member789');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: '项目不存在、成员不存在或您没有权限移除成员' });
      expect(next).not.toHaveBeenCalled();
    });

    it('当发生错误时，应将错误传递给下一个中间件', async () => {
      // 准备
      req.params = { id: 'project123', userId: 'user456' };
      req.user = { id: 'admin789' };
      const error = new Error('数据库错误');
      projectService.isProjectOwner.mockResolvedValue(true);
      projectService.removeProjectMember.mockRejectedValue(error);

      // 执行
      await projectController.removeProjectMember(req, res, next);

      // 验证
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('addProjectMember', () => {
    it('应成功添加项目成员并返回201状态', async () => {
      // 准备
      req.params = { id: 'project123' };
      req.body = { userId: 'user456', role: 'developer' };
      req.user = { id: 'admin789' };
      
      const mockResult = { 
        id: 'member1', 
        projectId: 'project123', 
        userId: 'user456', 
        role: 'developer' 
      };
      projectService.isProjectOwner.mockResolvedValue(true);
      projectService.addProjectMember.mockResolvedValue(mockResult);

      // 执行
      await projectController.addProjectMember(req, res, next);

      // 验证
      expect(projectService.isProjectOwner).toHaveBeenCalledWith('project123', 'admin789');
      expect(projectService.addProjectMember).toHaveBeenCalledWith(
        'project123', 'user456', 'developer', 'admin789'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it('当用户ID或角色为空时，应返回400状态', async () => {
      // 准备 - 缺少角色
      req.params = { id: 'project123' };
      req.body = { userId: 'user456' }; // 没有提供角色
      req.user = { id: 'admin789' };

      // 执行
      await projectController.addProjectMember(req, res, next);

      // 验证
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '用户ID和角色不能为空' });
      expect(projectService.addProjectMember).not.toHaveBeenCalled();
      
      // 准备 - 缺少用户ID
      req.body = { role: 'developer' }; // 没有提供用户ID
      jest.clearAllMocks();

      // 执行
      await projectController.addProjectMember(req, res, next);

      // 验证
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: '用户ID和角色不能为空' });
      expect(projectService.addProjectMember).not.toHaveBeenCalled();
    });

    it('当项目不存在、无权限或用户已存在于项目中时，应返回404状态', async () => {
      // 准备
      req.params = { id: 'project123' };
      req.body = { userId: 'user456', role: 'developer' };
      req.user = { id: 'member789' };
      projectService.isProjectOwner.mockResolvedValue(true);
      projectService.addProjectMember.mockResolvedValue(null);

      // 执行
      await projectController.addProjectMember(req, res, next);

      // 验证
      expect(projectService.isProjectOwner).toHaveBeenCalledWith('project123', 'member789');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: '项目不存在、您没有权限添加成员或用户已存在于项目中' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('当发生错误时，应将错误传递给下一个中间件', async () => {
      // 准备
      req.params = { id: 'project123' };
      req.body = { userId: 'user456', role: 'developer' };
      req.user = { id: 'admin789' };
      const error = new Error('数据库错误');
      projectService.isProjectOwner.mockResolvedValue(true);
      projectService.addProjectMember.mockRejectedValue(error);

      // 执行
      await projectController.addProjectMember(req, res, next);

      // 验证
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
}); 
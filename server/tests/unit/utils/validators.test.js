const { expect } = require('chai');
const { validateEmail, validatePassword, validateProject } = require('../../../src/utils/validators');

describe('验证工具测试', () => {
  describe('validateEmail', () => {
    it('应该验证有效的电子邮件地址', () => {
      // 有效的电子邮件地址
      expect(validateEmail('user@example.com')).to.be.true;
      expect(validateEmail('user.name@example.co.uk')).to.be.true;
      expect(validateEmail('user+tag@example.org')).to.be.true;
      expect(validateEmail('123@example.com')).to.be.true;
    });
    
    it('应该拒绝无效的电子邮件地址', () => {
      // 无效的电子邮件地址
      expect(validateEmail('user@')).to.be.false;
      expect(validateEmail('user@example')).to.be.false;
      expect(validateEmail('@example.com')).to.be.false;
      expect(validateEmail('user@.com')).to.be.false;
      expect(validateEmail('user@example.')).to.be.false;
      expect(validateEmail('user example.com')).to.be.false;
      expect(validateEmail('')).to.be.false;
    });
  });
  
  describe('validatePassword', () => {
    it('应该验证符合要求的密码', () => {
      // 符合要求的密码（至少8个字符，包含数字、小写字母和大写字母）
      expect(validatePassword('Password123')).to.be.true;
      expect(validatePassword('Secure1Password')).to.be.true;
      expect(validatePassword('A1b2C3d4')).to.be.true;
    });
    
    it('应该拒绝不符合长度要求的密码', () => {
      // 不符合长度要求的密码（少于8个字符）
      expect(validatePassword('Pass1')).to.be.false;
      expect(validatePassword('Abc123')).to.be.false;
    });
    
    it('应该拒绝不包含数字的密码', () => {
      // 不包含数字的密码
      expect(validatePassword('PasswordOnly')).to.be.false;
      expect(validatePassword('SecurePassword')).to.be.false;
    });
    
    it('应该拒绝不包含小写字母的密码', () => {
      // 不包含小写字母的密码
      expect(validatePassword('PASSWORD123')).to.be.false;
      expect(validatePassword('SECURE123')).to.be.false;
    });
    
    it('应该拒绝不包含大写字母的密码', () => {
      // 不包含大写字母的密码
      expect(validatePassword('password123')).to.be.false;
      expect(validatePassword('secure123')).to.be.false;
    });
  });
  
  describe('validateProject', () => {
    it('应该验证有效的项目数据', () => {
      // 有效的项目数据
      const validProject = {
        name: '测试项目',
        description: '这是一个测试项目',
        status: 'planning',
        start_date: '2023-01-01',
        end_date: '2023-12-31'
      };
      
      const result = validateProject(validProject);
      expect(result.error).to.be.undefined;
      
      // 验证返回的值（注意日期会被转换为Date对象）
      expect(result.value.name).to.equal(validProject.name);
      expect(result.value.description).to.equal(validProject.description);
      expect(result.value.status).to.equal(validProject.status);
      expect(result.value.start_date).to.be.instanceOf(Date);
      expect(result.value.end_date).to.be.instanceOf(Date);
    });
    
    it('应该拒绝没有名称的项目', () => {
      // 没有名称的项目
      const invalidProject = {
        description: '这是一个测试项目',
        status: 'planning',
        start_date: '2023-01-01',
        end_date: '2023-12-31'
      };
      
      const result = validateProject(invalidProject);
      expect(result.error).to.not.be.undefined;
      expect(result.error.details[0].path[0]).to.equal('name');
    });
    
    it('应该拒绝无效状态的项目', () => {
      // 无效状态的项目
      const invalidProject = {
        name: '测试项目',
        description: '这是一个测试项目',
        status: 'invalid_status',
        start_date: '2023-01-01',
        end_date: '2023-12-31'
      };
      
      const result = validateProject(invalidProject);
      expect(result.error).to.not.be.undefined;
      expect(result.error.details[0].path[0]).to.equal('status');
    });
    
    it('应该拒绝结束日期早于开始日期的项目', () => {
      // 结束日期早于开始日期的项目
      const invalidProject = {
        name: '测试项目',
        description: '这是一个测试项目',
        status: 'planning',
        start_date: '2023-12-31',
        end_date: '2023-01-01'
      };
      
      const result = validateProject(invalidProject);
      expect(result.error).to.not.be.undefined;
      expect(result.error.details[0].path[0]).to.equal('end_date');
    });
    
    it('应该在更新模式下允许部分字段', () => {
      // 更新模式下的部分字段
      const partialProject = {
        name: '更新的项目名称',
        status: 'in_progress'
      };
      
      const result = validateProject(partialProject, true);
      expect(result.error).to.be.undefined;
      expect(result.value.name).to.equal(partialProject.name);
      expect(result.value.status).to.equal(partialProject.status);
    });
  });
}); 
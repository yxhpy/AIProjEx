# 编码指南与常见错误汇总

> 本文档总结了项目开发过程中遇到的常见编码问题和最佳实践，每次使用大模型编码前，请务必加载此文档到上下文中，避免重复出现相同的问题。

## 目录

1. [测试相关问题](#测试相关问题)
2. [依赖管理问题](#依赖管理问题)
3. [模块导入与路径问题](#模块导入与路径问题)
4. [异步编程问题](#异步编程问题)
5. [环境变量与配置问题](#环境变量与配置问题)
6. [数据库操作问题](#数据库操作问题)
7. [版本兼容性问题](#版本兼容性问题)
8. [最佳实践](#最佳实践)

## 测试相关问题

### 1. Jest 与 Sinon 配合使用的问题

- **问题**: 使用 `sinon.stub()` 对同一个方法重复存根会导致 `Attempted to wrap error which is already wrapped` 错误。
- **解决方案**: 在 `beforeEach` 中使用 `sandbox.reset()` 或 `sinon.restore()` 重置所有存根，避免重复存根。

```javascript
const sandbox = sinon.createSandbox();

beforeEach(() => {
  sandbox.reset(); // 或使用 sinon.restore()
});

afterEach(() => {
  sandbox.restore();
});
```

### 2. 使用 afterAll 而非 after

- **问题**: Jest 不支持 Mocha 的 `after` 钩子，使用会导致 `ReferenceError: after is not defined`。
- **解决方案**: 使用 Jest 对应的 `afterAll` 钩子。

```javascript
// 错误
after(() => {
  // 清理操作
});

// 正确
afterAll(() => {
  // 清理操作
});
```

### 3. 模拟依赖注入的正确方法

- **问题**: 对不可配置的属性或方法进行 stub 会失败，如 express-validator 的 validationResult。
- **解决方案**: 使用 mock-require 或 jest.mock 整体模拟模块，而不是尝试替换其中的方法。

```javascript
// 使用 mock-require
const mockRequire = require('mock-require');
mockRequire('express-validator', {
  validationResult: () => ({
    isEmpty: () => true,
    array: () => []
  })
});

// 使用 jest.mock
jest.mock('express-validator', () => ({
  validationResult: jest.fn().mockImplementation(() => ({
    isEmpty: () => true,
    array: () => []
  }))
}));
```

### 4. 断言方法的正确使用

- **问题**: 混用 Chai 和 Sinon 的断言语法。
- **解决方案**: 使用一致的断言样式，推荐 Chai 的 expect 风格结合 Sinon 的断言。

```javascript
// 推荐风格
expect(mockFunction.calledOnce).to.be.true;
expect(mockFunction.calledWith(arg1, arg2)).to.be.true;

// 或使用 Sinon 断言
sinon.assert.calledOnce(mockFunction);
sinon.assert.calledWith(mockFunction, arg1, arg2);
```

### 5. 使用 toHaveBeenCalledWith 与 calledWith 的区别

- **问题**: 混用 Jest 的 `toHaveBeenCalledWith` 和 Sinon 的 `calledWith`。
- **解决方案**: 根据使用的 mock 库，选择正确的断言方法。

```javascript
// 对于 Jest mock
expect(jestMock).toHaveBeenCalledWith(arg);

// 对于 Sinon stub
expect(sinonStub.calledWith(arg)).to.be.true;
```

## 依赖管理问题

### 1. 依赖版本锁定

- **问题**: 未锁定依赖版本可能导致不同环境下的依赖版本不一致。
- **解决方案**: 使用精确版本或范围版本，推荐使用 package-lock.json 或 yarn.lock。

```json
// 推荐 - 精确版本
"dependencies": {
  "express": "4.17.1"
}

// 可接受 - 小版本更新
"dependencies": {
  "express": "~4.17.0"
}

// 不推荐 - 主版本更新
"dependencies": {
  "express": "^4.0.0"
}
```

### 2. 开发依赖与生产依赖混淆

- **问题**: 将仅用于测试或开发的依赖放在 dependencies 而非 devDependencies 中。
- **解决方案**: 明确区分开发依赖和生产依赖。

```bash
# 安装开发依赖
npm install --save-dev jest sinon chai

# 安装生产依赖
npm install --save express mongoose
```

### 3. 使用已废弃的 API

- **问题**: 使用已被标记为 deprecated 的 API。
- **解决方案**: 定期检查依赖更新，使用最新推荐的 API。

```javascript
// 废弃的用法
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// 更新的用法 (Mongoose 6+)
mongoose.connect(uri);
```

## 模块导入与路径问题

### 1. 相对路径导入问题

- **问题**: 在测试中使用相对路径导入模块时，路径计算错误，特别是使用 mock-require 等工具时。
- **解决方案**: 使用绝对路径或基于项目根目录的路径。

```javascript
// 问题路径
const module = require('../../../src/utils/module');

// 更可靠的方式（使用 path.resolve）
const path = require('path');
const module = require(path.resolve(__dirname, '../../../src/utils/module'));
```

### 2. 循环依赖问题

- **问题**: 模块之间相互引用导致循环依赖，可能引起难以调试的问题。
- **解决方案**: 重构代码，避免循环依赖，可以考虑依赖注入或事件驱动。

```javascript
// 避免这样的循环依赖
// fileA.js
const B = require('./fileB');

// fileB.js
const A = require('./fileA');
```

## 异步编程问题

### 1. 未正确处理 Promise

- **问题**: 未使用 await 或 .then()/.catch() 处理 Promise，导致异步错误无法捕获。
- **解决方案**: 总是使用 await 或 .then()/.catch() 处理 Promise，特别是在 async 函数中。

```javascript
// 错误 - 忽略返回的 Promise
async function badExample() {
  someAsyncFunction(); // 错误无法捕获
}

// 正确 - 使用 await
async function goodExample1() {
  try {
    await someAsyncFunction();
  } catch (error) {
    console.error(error);
  }
}

// 正确 - 使用 then/catch
function goodExample2() {
  someAsyncFunction()
    .then(result => {
      // 处理结果
    })
    .catch(error => {
      console.error(error);
    });
}
```

### 2. 在异步测试中不使用 done 或 async/await

- **问题**: 异步测试没有通知测试框架测试何时完成，导致测试提前结束或超时。
- **解决方案**: 对于异步测试，使用 async/await 或回调风格的 done。

```javascript
// 使用 async/await（推荐）
it('异步测试示例', async () => {
  await someAsyncOperation();
  expect(result).toBe(expected);
});

// 使用 done 回调
it('异步测试示例', (done) => {
  someAsyncOperation().then(() => {
    expect(result).toBe(expected);
    done();
  }).catch(done);
});
```

## 环境变量与配置问题

### 1. 硬编码敏感信息

- **问题**: 将敏感信息如数据库连接字符串、API密钥直接硬编码在源码中。
- **解决方案**: 使用环境变量或配置文件管理敏感信息。

```javascript
// 错误 - 硬编码
const dbUri = 'mongodb://user:password@host:port/db';

// 正确 - 使用环境变量
const dbUri = process.env.MONGODB_URI;
```

### 2. 环境变量未在测试中正确模拟

- **问题**: 测试中未正确设置或恢复环境变量，可能影响其他测试。
- **解决方案**: 在测试中保存原始值，测试后恢复。

```javascript
describe('环境变量测试', () => {
  const originalEnv = process.env.NODE_ENV;
  
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });
  
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });
  
  it('应该使用测试环境配置', () => {
    // 测试逻辑
  });
});
```

## 数据库操作问题

### 1. 未关闭数据库连接

- **问题**: 测试或应用程序结束时未关闭数据库连接，导致资源泄漏或测试挂起。
- **解决方案**: 在适当的生命周期钩子中关闭连接。

```javascript
// 在应用程序中
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

// 在测试中
afterAll(async () => {
  await mongoose.connection.close();
});
```

### 2. 使用真实数据库进行测试

- **问题**: 单元测试直接使用真实数据库，导致测试速度慢且不可靠。
- **解决方案**: 使用内存数据库或模拟数据库操作。

```javascript
// 使用 MongoDB 内存服务器
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = new MongoMemoryServer();
  const uri = await mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});
```

## 版本兼容性问题

### 1. Node.js 版本兼容性

- **问题**: 使用较新版本 Node.js 中的特性，但在低版本环境中运行导致错误。
- **解决方案**: 在 package.json 中指定所需的 Node.js 版本，并使用与目标环境兼容的特性。

```json
"engines": {
  "node": ">=14.0.0"
}
```

### 2. 浏览器兼容性问题

- **问题**: 使用现代 JS 特性但未进行转译，在旧浏览器中无法运行。
- **解决方案**: 使用 Babel 等工具进行转译，设置适当的目标浏览器。

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: ['> 1%', 'not dead', 'not ie 11']
      }
    }]
  ]
};
```

## 最佳实践

### 1. 代码风格一致性

- **建议**: 使用 ESLint 和 Prettier 确保代码风格一致。
- **配置**: 在项目中设置 .eslintrc 和 .prettierrc 文件。

```json
// .eslintrc.json
{
  "extends": ["eslint:recommended", "prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}

// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### 2. 编写有意义的测试

- **建议**: 测试应该有意义且全面，覆盖正常、边缘和错误情况。
- **示例**: 按照 AAA (Arrange-Act-Assert) 模式组织测试。

```javascript
it('用户名少于2个字符时应返回验证错误', () => {
  // Arrange
  const user = { username: 'a', email: 'test@example.com' };
  
  // Act
  const errors = validateUser(user);
  
  // Assert
  expect(errors).toContain('用户名长度必须至少为2个字符');
});
```

### 3. 使用语义化版本

- **建议**: 遵循语义化版本规范 (SemVer)，正确管理版本号。
- **规则**:
  - 主版本号 (MAJOR): 不兼容的 API 变更
  - 次版本号 (MINOR): 向后兼容的功能新增
  - 修订号 (PATCH): 向后兼容的问题修正

### 4. 文档和注释

- **建议**: 为公共 API、复杂逻辑和非显而易见的代码添加文档和注释。
- **示例**: 使用 JSDoc 风格注释重要函数。

```javascript
/**
 * 验证用户对象的有效性
 * @param {Object} user - 用户对象
 * @param {string} user.username - 用户名
 * @param {string} user.email - 电子邮件
 * @returns {string[]} 验证错误消息数组，如果没有错误则为空数组
 */
function validateUser(user) {
  const errors = [];
  // 验证逻辑...
  return errors;
}
```

### 5. 错误处理

- **建议**: 明确处理错误，而不是让它们默默失败或导致程序崩溃。
- **示例**: 使用 try/catch 和自定义错误类型。

```javascript
try {
  const result = await riskOperation();
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn('验证错误', { error });
    return { success: false, message: '输入数据无效', details: error.details };
  } else {
    logger.error('未预期的错误', { error });
    throw new ApiError(500, '处理请求时发生意外错误');
  }
}
```

---

本文档将持续更新，添加项目中发现的新问题和解决方案。在开始新的开发任务前，请务必阅读本文档以避免重复出现已知问题。 
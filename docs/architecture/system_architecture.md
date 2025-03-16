# AIProjEx 系统架构设计

## 1. 系统概述

AIProjEx是一个AI驱动的全生命周期项目管理平台，涵盖从项目立项、需求分析、任务拆分、原型设计到版本控制的全流程管理。本平台内置大模型支持，实现自动化和半自动化的项目管理。

## 2. 架构目标

- **可扩展性**：系统架构应允许轻松添加新功能和组件
- **可维护性**：代码组织和文档应清晰明了，便于维护
- **性能**：系统应保持良好的响应时间和用户体验
- **安全性**：保护用户数据和项目信息不被未授权访问
- **AI集成**：无缝集成大模型能力，支持全流程的智能化

## 3. 系统架构图

```
┌────────────────────────────────────────────────┐
│                   用户层                        │
│                                                │
│    Web浏览器  ◄───────────────►  移动设备       │
└─────────────────────┬──────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────┐
│                   前端层                        │
│                                                │
│  ┌─────────────┐    ┌───────────┐              │
│  │ React 组件  │◄───┤ API 客户端 │              │
│  └─────────────┘    └───────────┘              │
│                                                │
│  ┌─────────────┐    ┌───────────┐              │
│  │  状态管理   │◄───┤   路由    │              │
│  └─────────────┘    └───────────┘              │
└─────────────────────┬──────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────┐
│                 API 网关层                     │
│                                                │
│    认证/授权  ◄───────┬───────►  速率限制      │
│                       │                        │
│    请求验证  ◄────────┴───────►  日志/监控     │
└─────────────────────┬──────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────┐
│                  服务层                        │
│                                                │
│  ┌─────────────┐   ┌──────────────┐            │
│  │ 项目服务    │   │ 需求分析服务  │            │
│  └─────────────┘   └──────────────┘            │
│                                                │
│  ┌─────────────┐   ┌──────────────┐            │
│  │ 任务服务    │   │ 原型设计服务  │            │
│  └─────────────┘   └──────────────┘            │
│                                                │
│  ┌─────────────┐   ┌──────────────┐            │
│  │ 用户服务    │   │ 版本控制服务  │            │
│  └─────────────┘   └──────────────┘            │
│                                                │
│  ┌─────────────────────────────────┐           │
│  │         AI 服务                 │           │
│  └─────────────────────────────────┘           │
└─────────────────────┬──────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────┐
│                  数据层                        │
│                                                │
│  ┌─────────────────┐   ┌──────────────────┐    │
│  │ 关系型数据库     │   │ 文件存储         │    │
│  │ (MySQL)         │   │                  │    │
│  └─────────────────┘   └──────────────────┘    │
│                                                │
│  ┌─────────────────┐   ┌──────────────────┐    │
│  │ 缓存            │   │ 搜索引擎         │    │
│  │ (Redis)         │   │ (可选)           │    │
│  └─────────────────┘   └──────────────────┘    │
└────────────────────────────────────────────────┘
```

## 4. 技术栈

### 前端技术栈
- **框架**：React.js
- **构建工具**：Vite
- **状态管理**：Zustand
- **路由**：React Router
- **UI组件**：TailwindCSS + DaisyUI
- **API客户端**：React Query + Axios
- **表单处理**：React Hook Form

### 后端技术栈
- **框架**：Node.js + Express.js
- **数据库**：MySQL
- **ORM**：Sequelize
- **缓存**：Redis (可选)
- **认证**：JWT
- **API文档**：Swagger/OpenAPI
- **日志**：Winston
- **测试**：Jest

### AI技术栈
- **大模型API**：OpenAI API (GPT-4o等)
- **AI框架**：LangChain
- **向量数据库**：待定 (如需知识库)

## 5. 核心模块

### 5.1 用户模块
- 用户注册、登录和身份验证
- 用户角色和权限管理
- 用户设置和偏好

### 5.2 项目管理模块
- 项目创建和配置
- 项目状态跟踪
- 项目成员管理
- 项目进度报告

### 5.3 需求分析模块
- 需求收集与管理
- AI辅助需求分析
- 需求优先级设置
- 需求变更跟踪

### 5.4 任务管理模块
- AI辅助任务分解
- 任务分配与状态跟踪
- 任务依赖关系管理
- 任务时间线与Gantt图

### 5.5 原型设计模块
- AI生成原型建议
- 原型创建与编辑
- 原型版本控制
- 用户界面元素库

### 5.6 原型预览模块
- 交互式原型预览
- 用户反馈收集
- 原型导出与分享

### 5.7 版本控制模块
- 文件版本历史
- 版本比较与回滚
- 版本标签与发布管理

### 5.8 AI服务模块
- 大模型API集成
- 提示工程与优化
- 上下文管理
- AI生成内容的改进与修正

## 6. 数据模型

### 6.1 用户相关

#### 6.1.1 用户表(Users)
```
- id: 唯一标识符
- username: 用户名
- email: 电子邮件
- password_hash: 密码哈希
- role: 角色(admin, manager, member)
- avatar_url: 头像URL
- created_at: 创建时间
- updated_at: 更新时间
- deleted_at: 删除时间(用于软删除)
```

### 6.2 项目相关

#### 6.2.1 项目表(Projects)
```
- id: 唯一标识符
- name: 项目名称
- description: 项目描述
- status: 项目状态(planning, ongoing, completed, archived)
- start_date: 开始日期
- end_date: 结束日期
- created_by: 创建者ID
- created_at: 创建时间
- updated_at: 更新时间
- deleted_at: 删除时间
```

#### 6.2.2 项目成员表(ProjectMembers)
```
- id: 唯一标识符
- project_id: 项目ID
- user_id: 用户ID
- role: 项目中的角色(owner, manager, member)
- joined_at: 加入时间
- created_at: 创建时间
- updated_at: 更新时间
```

### 6.3 需求相关

#### 6.3.1 需求表(Requirements)
```
- id: 唯一标识符
- project_id: 项目ID
- title: 需求标题
- description: 需求描述
- priority: 优先级(high, medium, low)
- status: 状态(draft, approved, implemented, tested)
- created_by: 创建者ID
- assigned_to: 负责人ID
- created_at: 创建时间
- updated_at: 更新时间
```

### 6.4 任务相关

#### 6.4.1 任务表(Tasks)
```
- id: 唯一标识符
- project_id: 项目ID
- requirement_id: 需求ID
- title: 任务标题
- description: 任务描述
- status: 状态(todo, in_progress, review, done)
- priority: 优先级
- estimated_hours: 预估工时
- actual_hours: 实际工时
- assigned_to: 负责人ID
- start_date: 开始日期
- due_date: 截止日期
- created_at: 创建时间
- updated_at: 更新时间
```

#### 6.4.2 任务依赖表(TaskDependencies)
```
- id: 唯一标识符
- predecessor_id: 前置任务ID
- successor_id: 后续任务ID
- dependency_type: 依赖类型(finish_to_start, start_to_start, etc)
- created_at: 创建时间
- updated_at: 更新时间
```

### 6.5 原型相关

#### 6.5.1 原型表(Prototypes)
```
- id: 唯一标识符
- project_id: 项目ID
- name: 原型名称
- description: 原型描述
- version: 版本号
- status: 状态(draft, review, approved)
- created_by: 创建者ID
- created_at: 创建时间
- updated_at: 更新时间
```

#### 6.5.2 原型页面表(PrototypePages)
```
- id: 唯一标识符
- prototype_id: 原型ID
- name: 页面名称
- content: 页面内容(HTML)
- order: 排序顺序
- created_at: 创建时间
- updated_at: 更新时间
```

### 6.6 文件相关

#### 6.6.1 文件表(Files)
```
- id: 唯一标识符
- project_id: 项目ID
- file_name: 文件名
- file_path: 文件路径
- file_type: 文件类型
- file_size: 文件大小
- uploaded_by: 上传者ID
- created_at: 创建时间
- updated_at: 更新时间
```

## 7. API设计

### 7.1 认证API
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `GET /api/v1/auth/me` - 获取当前用户信息
- `PUT /api/v1/auth/me` - 更新当前用户信息

### 7.2 项目API
- `GET /api/v1/projects` - 获取项目列表
- `GET /api/v1/projects/:id` - 获取项目详情
- `POST /api/v1/projects` - 创建新项目
- `PUT /api/v1/projects/:id` - 更新项目
- `DELETE /api/v1/projects/:id` - 删除项目
- `GET /api/v1/projects/:id/members` - 获取项目成员
- `POST /api/v1/projects/:id/members` - 添加项目成员
- `DELETE /api/v1/projects/:id/members/:userId` - 移除项目成员

### 7.3 需求API
- `GET /api/v1/projects/:id/requirements` - 获取项目需求
- `GET /api/v1/requirements/:id` - 获取需求详情
- `POST /api/v1/projects/:id/requirements` - 创建需求
- `PUT /api/v1/requirements/:id` - 更新需求
- `DELETE /api/v1/requirements/:id` - 删除需求
- `POST /api/v1/requirements/generate` - AI生成需求建议

### 7.4 任务API
- `GET /api/v1/projects/:id/tasks` - 获取项目任务
- `GET /api/v1/tasks/:id` - 获取任务详情
- `POST /api/v1/projects/:id/tasks` - 创建任务
- `PUT /api/v1/tasks/:id` - 更新任务
- `DELETE /api/v1/tasks/:id` - 删除任务
- `POST /api/v1/requirements/:id/generate-tasks` - AI从需求生成任务

### 7.5 原型API
- `GET /api/v1/projects/:id/prototypes` - 获取项目原型
- `GET /api/v1/prototypes/:id` - 获取原型详情
- `POST /api/v1/projects/:id/prototypes` - 创建原型
- `PUT /api/v1/prototypes/:id` - 更新原型
- `DELETE /api/v1/prototypes/:id` - 删除原型
- `GET /api/v1/prototypes/:id/pages` - 获取原型页面
- `POST /api/v1/prototypes/:id/pages` - 创建原型页面
- `PUT /api/v1/prototype-pages/:id` - 更新原型页面
- `DELETE /api/v1/prototype-pages/:id` - 删除原型页面
- `POST /api/v1/requirements/:id/generate-prototype` - AI生成原型建议

### 7.6 AI API
- `POST /api/v1/ai/analyze-requirements` - AI分析需求
- `POST /api/v1/ai/generate-tasks` - AI生成任务
- `POST /api/v1/ai/generate-prototype` - AI生成原型
- `POST /api/v1/ai/improve-text` - AI优化文本内容
- `POST /api/v1/ai/get-recommendations` - AI获取项目建议

## 8. 安全设计

### 8.1 认证与授权
- 使用JWT进行身份验证
- 基于角色的访问控制(RBAC)
- API路由权限校验

### 8.2 数据安全
- 密码加盐哈希存储(bcrypt)
- 敏感数据加密
- HTTPS传输加密

### 8.3 API安全
- 请求速率限制
- CSRF保护
- 输入验证与过滤

### 8.4 AI安全
- 用户数据隐私保护
- AI生成内容的审核与过滤
- 提示注入防护

## 9. 部署架构

### 9.1 开发环境
- 本地开发服务器
- 本地MySQL数据库
- 前端开发服务器(Vite)

### 9.2 测试环境
- 容器化部署(Docker)
- CI/CD管道(GitHub Actions)
- 自动化测试

### 9.3 生产环境
- 可伸缩的云服务部署
- 负载均衡
- 数据库备份与恢复策略
- 监控与告警系统

## 10. 性能考虑

### 10.1 数据库优化
- 索引设计
- 查询优化
- 数据分区(可选)

### 10.2 API优化
- 数据分页
- 响应缓存
- API限流

### 10.3 AI性能
- 异步处理耗时的AI请求
- 大模型结果缓存
- 高效提示设计

## 11. 可扩展性设计

### 11.1 服务水平扩展
- 无状态API设计
- 负载均衡
- 微服务拆分(未来)

### 11.2 功能扩展
- 插件系统(未来)
- API版本控制
- 模块化架构

## 12. 监控与运维

### 12.1 日志系统
- 应用日志
- 错误跟踪
- 审计日志

### 12.2 监控
- 性能监控
- 资源利用率监控
- 用户行为分析

### 12.3 备份与恢复
- 数据库定期备份
- 文件系统备份
- 灾难恢复计划

## 13. 未来规划

### 13.1 近期计划
- 完成基础功能开发
- 实现AI辅助的核心功能
- 完善单元测试与集成测试

### 13.2 中期计划
- 增强AI模型能力
- 添加团队协作功能
- 移动端适配

### 13.3 长期愿景
- 构建完整的AI项目管理生态
- 支持多种开发方法论
- 多语言支持

## 14. 参考资料

- OpenAI API文档
- Sequelize文档
- React官方文档
- Express.js文档
- MySQL文档 
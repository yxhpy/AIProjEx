# AIProjEx - AI驱动的项目管理平台

AIProjEx是一个基于大模型的全生命周期项目管理平台，涵盖从项目立项、需求分析、任务拆分、原型设计到版本控制的全流程管理。平台本身由大模型支持，实现自动化和半自动化的项目文档生成、原型展示和开发任务安排。

## 项目架构

```
AIProjEx/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── assets/         # 静态资源
│   │   ├── components/     # 可复用组件
│   │   ├── contexts/       # React上下文
│   │   ├── hooks/          # 自定义钩子
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   └── utils/          # 工具函数
│   ├── package.json        # 前端依赖
│   └── vite.config.js      # Vite配置
├── server/                 # 后端代码
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── db/             # 数据库脚本
│   │   ├── middlewares/    # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── tests/              # 测试
│   └── package.json        # 后端依赖
├── docs/                   # 文档
│   ├── architecture/       # 架构文档
│   ├── api/                # API文档
│   ├── development/        # 开发指南
│   ├── guides/             # 用户指南
│   └── coding-guidelines.md # 编码指南与常见错误汇总
├── scripts/                # 实用脚本
├── .env.example            # 环境变量示例
├── .gitignore              # Git忽略文件
├── package.json            # 项目配置
└── README.md               # 项目说明
```

## 技术栈

### 前端
- HTML, JavaScript, Tailwind CSS
- React.js + Vite
- 状态管理：Zustand
- 数据获取：React Query
- 路由：React Router
- UI组件：DaisyUI

### 后端
- Node.js + Express.js
- 数据库：MySQL
- ORM：Sequelize
- 认证：JWT
- 文档：Swagger/OpenAPI
- 日志：Winston

### 大模型集成
- OpenAI API
- LangChain

## 核心功能

1. **项目立项**：创建项目，设定目标和范围
2. **需求分析**：通过大模型辅助进行需求收集和分析
3. **任务拆分**：将需求分解为可操作的任务
4. **原型设计**：生成和展示项目原型
5. **原型预览**：在线预览和测试原型
6. **版本控制**：项目版本管理和变更追踪
7. **AI辅助**：通过大模型支持全流程的自动化和半自动化

## 开始使用

### 前提条件
- Node.js 18.x 或更高版本
- MySQL 8.x
- npm 或 yarn

### 本地开发

1. 克隆仓库
```bash
git clone https://github.com/yourusername/aiprojex.git
cd aiprojex
```

2. 安装依赖
```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，填入正确的配置
```

4. 设置数据库
```bash
# 确保MySQL已启动
# 创建数据库
mysql -u root -p -e "CREATE DATABASE aiprojex_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

5. 运行迁移和种子
```bash
cd server
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
cd ..
```

6. 启动开发服务器
```bash
npm run dev
```

### 生产环境部署

详细部署指南请参见 `docs/guides/deployment.md`

## 贡献指南

请参阅 `docs/development/contributing.md` 了解如何为AIProjEx做出贡献。

## 项目规范

- 编码规范
- 提交规范
- 文档规范
- 测试规范

详情请查看：
- `docs/development/standards.md`: 项目总体规范
- `docs/coding-guidelines.md`: 编码指南与常见错误汇总（**重要：所有开发者和大模型在编码前必读**）

## 开源许可

本项目基于MIT许可证开源。

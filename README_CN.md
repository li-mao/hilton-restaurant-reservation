# 希尔顿餐厅预订系统

一个功能完善的在线餐桌预订系统，为希尔顿餐厅的客人提供便捷的预订服务，同时帮助餐厅员工高效管理预订。

## 功能特色

### 客人功能
- 在线预订餐桌
- 管理个人预订
- 更新或取消预订
- 实时查看预订状态

### 餐厅员工功能
- 管理所有预订
- 批准、取消或完成预订
- 按日期和状态筛选预订
- 查看客人联系信息
- 员工仪表板概览

## 技术栈

### 后端技术
- **Node.js** + Express.js
- **GraphQL** + Apollo Server
- **Couchbase** 数据持久化
- **JWT** 身份验证
- **Winston** 日志记录
- **Joi** 输入验证

### 前端技术
- **Vue.js 3** + TypeScript
- **Vue Router** 路由管理
- **Pinia** 状态管理
- **Apollo Client** GraphQL客户端
- **Axios** REST API调用

## 项目结构

```
hilton-restaurant-reservation/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── config/            # 数据库配置
│   │   ├── controllers/       # REST API控制器
│   │   ├── graphql/           # GraphQL架构和解析器
│   │   ├── middleware/        # 自定义中间件
│   │   ├── models/            # Couchbase数据模型
│   │   ├── routes/            # REST API路由
│   │   ├── services/          # 业务逻辑
│   │   ├── utils/             # 工具函数
│   │   └── server.js          # 主服务器文件
│   ├── tests/                 # 后端测试
│   └── package.json
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/        # Vue组件
│   │   ├── views/             # 页面组件
│   │   ├── stores/            # Pinia状态管理
│   │   ├── services/          # API服务
│   │   ├── types/             # TypeScript类型定义
│   │   └── utils/             # 工具函数
│   ├── tests/                 # 前端测试
│   └── package.json
└── README.md
```

## 安装指南

### 环境要求
- Node.js (v14 或更高版本)
- Couchbase Server (本地或云服务)
- npm 或 yarn

### 后端设置

1. 进入后端目录：
   ```bash
   cd backend
   ```

2. 安装依赖包：
   ```bash
   npm install
   ```

3. 根据 `.env.example` 创建 `.env` 文件：
   ```bash
   cp .env.example .env
   ```

4. 更新 `.env` 文件配置：
   ```env
   NODE_ENV=development
   PORT=5000
   COUCHBASE_CONNECTION_STRING=couchbase://localhost:8091
   COUCHBASE_USERNAME=Administrator
   COUCHBASE_PASSWORD=password
   COUCHBASE_BUCKET=hilton-reservations
   JWT_SECRET=你的超级密钥
   JWT_EXPIRE=7d
   LOG_LEVEL=info
   ```

5. 启动开发服务器：
   ```bash
   npm run dev
   ```

### 前端设置

1. 进入前端目录：
   ```bash
   cd frontend
   ```

2. 安装依赖包：
   ```bash
   npm install
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

## API文档

### REST端点

#### 身份验证
- `POST /api/auth/register` - 注册用户
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### GraphQL架构

#### 查询
- `me` - 获取当前用户
- `reservations(filter: ReservationFilter)` - 获取所有预订（支持筛选）
- `reservation(id: ID!)` - 获取特定预订
- `myReservations` - 获取当前用户的预订

#### 变更
- `register` - 注册新用户
- `login` - 用户登录
- `createReservation` - 创建新预订
- `updateReservation` - 更新预订
- `cancelReservation` - 取消预订
- `approveReservation` - 批准预订（仅限员工）
- `completeReservation` - 完成预订（仅限员工）

## 测试

### 后端测试
```bash
cd backend
npm test              # 运行所有测试
npm run test:watch    # 监听模式运行测试
npm run test:coverage # 运行测试并生成覆盖率报告
```

### 前端测试
```bash
cd frontend
npm run test:unit     # 运行单元测试
npm run lint          # 运行代码检查
```

## 环境变量

### 后端 (.env)
- `NODE_ENV` - 环境设置 (development/production)
- `PORT` - 服务器端口
- `COUCHBASE_CONNECTION_STRING` - Couchbase连接字符串
- `COUCHBASE_USERNAME` - Couchbase用户名
- `COUCHBASE_PASSWORD` - Couchbase密码
- `COUCHBASE_BUCKET` - Couchbase存储桶名称
- `JWT_SECRET` - JWT密钥
- `JWT_EXPIRE` - JWT过期时间
- `LOG_LEVEL` - 日志级别

## 部署

### Docker部署 (推荐)
1. 确保已安装 Docker 和 Docker Compose
2. 在项目根目录运行：
   ```bash
   docker-compose up -d
   ```
3. 访问应用：
   - 前端：http://localhost:3000
   - 后端API：http://localhost:5000
   - Couchbase管理界面：http://localhost:8091

### 手动部署

#### 后端部署
1. 设置生产环境变量
2. 运行 `npm install --production`
3. 使用 PM2 等进程管理器
4. 设置 Couchbase Server 或生产环境Couchbase

#### 前端部署
1. 构建应用：`npm run build`
2. 将 `dist` 文件夹部署到托管服务
3. 配置生产环境API地址

## 安全特性
- JWT身份验证
- bcrypt密码加密
- Joi输入验证
- CORS保护
- 错误处理中间件
- 请求日志记录

## 数据模型

### 用户模型
- 姓名、邮箱、密码、电话、角色（客人/员工/管理员）
- JWT身份验证
- 密码哈希加密

### 预订模型
- 客人信息（姓名、联系方式）
- 预计到达时间
- 餐桌大小/人数
- 状态（已请求/已批准/已取消/已完成）
- 特殊要求
- 创建和更新时间戳

## 使用说明

### 客人使用
1. 注册账户或登录
2. 点击"预订新餐桌"
3. 填写预订信息（姓名、联系方式、到达时间、人数等）
4. 提交预订申请
5. 在我的预订页面查看和管理预订

### 员工使用
1. 使用员工账户登录
2. 进入员工仪表板
3. 查看所有预订申请
4. 根据需要批准、取消或完成预订
5. 使用筛选功能快速查找特定预订

## 开发团队
- 后端开发：Node.js + Express + GraphQL
- 前端开发：Vue.js 3 + TypeScript
- 数据库：Couchbase
- 架构设计：RESTful + GraphQL混合架构

## 技术支持
如遇到问题，请检查：
1. 数据库连接是否正常
2. 环境变量配置是否正确
3. 端口是否被占用
4. 依赖包是否完整安装

## 更新日志
- v1.0.0 - 初始版本发布
  - 完整的预订系统功能
  - 用户身份验证
  - 员工管理功能
  - 响应式前端界面

## 许可证
ISC 许可证
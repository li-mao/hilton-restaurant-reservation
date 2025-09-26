# 🏗️ 项目结构说明

本文档详细说明希尔顿餐厅预订系统的项目结构及其设计原因。

## 📁 整体项目结构

```
hilton-restaurant-reservation/
├── 📁 backend/                    # 后端服务
│   ├── 📁 src/                    # 源代码
│   ├── 📁 features/               # BDD测试用例
│   ├── 📁 logs/                   # 日志文件
│   ├── 📄 package.json            # 后端依赖配置
│   ├── 📄 jest.config.js          # Jest测试配置
│   └── 📄 cucumber.js             # Cucumber配置
├── 📁 frontend/                   # 前端应用
│   ├── 📁 src/                    # 源代码
│   ├── 📄 package.json            # 前端依赖配置
│   ├── 📄 vite.config.ts          # Vite构建配置
│   └── 📄 tsconfig.json           # TypeScript配置
├── 📁 docs/                       # 项目文档
├── 📁 scripts/                    # 部署脚本
├── 📄 docker-compose.yml          # Docker编排配置
├── 📄 deploy.sh                   # 一键部署脚本
└── 📄 README.md                   # 项目说明
```

## 🔧 后端结构设计

### 目录结构

```
backend/
├── 📁 src/
│   ├── 📁 config/                 # 配置模块
│   │   └── 📄 database.js         # 数据库连接配置
│   ├── 📁 controllers/            # 控制器层
│   │   ├── 📄 adminController.js  # 管理员控制器
│   │   └── 📄 authController.js   # 认证控制器
│   ├── 📁 graphql/                # GraphQL层
│   │   ├── 📄 resolvers.js        # GraphQL解析器
│   │   └── 📄 schema.js           # GraphQL模式定义
│   ├── 📁 middleware/             # 中间件
│   │   └── 📄 errorHandler.js     # 错误处理中间件
│   ├── 📁 models/                 # 数据模型
│   │   ├── 📄 index.js            # 模型导出
│   │   ├── 📄 Reservation.js      # 预订模型
│   │   ├── 📄 ReservationChangeLog.js # 预订变更日志
│   │   └── 📄 User.js             # 用户模型
│   ├── 📁 routes/                 # 路由定义
│   │   ├── 📄 admin.js            # 管理员路由
│   │   ├── 📄 auth.js             # 认证路由
│   │   └── 📄 health.js           # 健康检查路由
│   ├── 📁 utils/                  # 工具函数
│   │   ├── 📄 apolloContext.js    # Apollo上下文
│   │   ├── 📄 auth.js             # 认证工具
│   │   ├── 📄 logger.js           # 日志工具
│   │   └── 📄 seed.js             # 数据种子
│   └── 📄 server.js               # 服务器入口
├── 📁 features/                   # BDD测试
│   ├── 📁 step_definitions/       # 步骤定义
│   ├── 📄 admin-reservation.feature
│   ├── 📄 auth.feature
│   ├── 📄 health.feature
│   └── 📄 reservation.feature
└── 📁 logs/                       # 日志目录
```

### 设计原则

#### 1. 分层架构 (Layered Architecture)
**设计原因:**
- **关注点分离**: 每层负责特定功能，降低耦合度
- **可维护性**: 修改某层不影响其他层
- **可测试性**: 每层可以独立测试
- **可扩展性**: 新功能可以按层添加

```
┌─────────────────┐
│   Controllers   │ ← 处理HTTP请求和响应
├─────────────────┤
│   Services      │ ← 业务逻辑处理
├─────────────────┤
│   Models        │ ← 数据模型和验证
├─────────────────┤
│   Database      │ ← 数据持久化
└─────────────────┘
```

#### 2. 模块化设计
**设计原因:**
- **代码复用**: 模块可以在不同地方复用
- **团队协作**: 不同开发者可以并行开发不同模块
- **维护便利**: 问题定位和修复更容易
- **测试隔离**: 模块可以独立测试

### 核心模块说明

#### 配置模块 (`config/`)
```javascript
// database.js - 数据库配置
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
```

**设计原因:**
- **环境隔离**: 不同环境使用不同配置
- **安全性**: 敏感信息通过环境变量管理
- **灵活性**: 配置可以动态调整

#### 控制器层 (`controllers/`)
```javascript
// authController.js - 认证控制器
const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      // 认证逻辑...
      res.json({ token, user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};
```

**设计原因:**
- **请求处理**: 统一处理HTTP请求
- **响应格式化**: 标准化API响应格式
- **错误处理**: 统一的错误处理机制
- **参数验证**: 输入参数验证和清理

#### 数据模型 (`models/`)
```javascript
// Reservation.js - 预订模型
const reservationSchema = new mongoose.Schema({
  guestName: { type: String, required: true },
  partySize: { type: Number, required: true, min: 1, max: 20 },
  status: { 
    type: String, 
    enum: ['requested', 'approved', 'cancelled', 'completed'],
    default: 'requested'
  },
  createdAt: { type: Date, default: Date.now }
});
```

**设计原因:**
- **数据验证**: 模型级别的数据验证
- **关系定义**: 定义数据之间的关系
- **业务规则**: 在模型中体现业务规则
- **类型安全**: 确保数据类型正确

#### GraphQL层 (`graphql/`)
```javascript
// schema.js - GraphQL模式
const typeDefs = gql`
  type Reservation {
    id: ID!
    guestName: String!
    partySize: Int!
    status: ReservationStatus!
  }
  
  type Query {
    reservations: [Reservation]
    reservation(id: ID!): Reservation
  }
`;
```

**设计原因:**
- **灵活查询**: 客户端可以精确请求需要的数据
- **类型安全**: 强类型系统减少错误
- **自文档化**: 自动生成API文档
- **实时更新**: 支持订阅和实时数据

## 🎨 前端结构设计

### 目录结构

```
frontend/
├── 📁 src/
│   ├── 📁 components/             # 可复用组件
│   │   ├── 📄 NavBar.vue          # 导航栏组件
│   │   ├── 📄 ReservationCard.vue # 预订卡片组件
│   │   ├── 📄 ReservationForm.vue # 预订表单组件
│   │   └── 📄 EmployeeReservationCard.vue # 员工预订卡片
│   ├── 📁 views/                  # 页面组件
│   │   ├── 📄 HomeView.vue        # 首页
│   │   ├── 📄 LoginView.vue       # 登录页
│   │   ├── 📄 RegisterView.vue    # 注册页
│   │   ├── 📄 ReservationsView.vue # 预订列表页
│   │   ├── 📄 AdminDashboard.vue  # 管理员仪表板
│   │   ├── 📄 EmployeeDashboard.vue # 员工仪表板
│   │   └── 📄 GuestManagement.vue # 客户管理
│   ├── 📁 stores/                 # 状态管理
│   │   └── 📄 auth.ts             # 认证状态
│   ├── 📁 services/               # API服务
│   │   ├── 📄 api.ts              # REST API服务
│   │   ├── 📄 apollo.ts           # GraphQL客户端
│   │   ├── 📄 auth.ts             # 认证服务
│   │   ├── 📄 admin.ts            # 管理员服务
│   │   └── 📄 reservation.ts      # 预订服务
│   ├── 📁 types/                  # TypeScript类型
│   │   └── 📄 index.ts            # 类型定义
│   ├── 📁 router/                 # 路由配置
│   │   └── 📄 index.ts            # 路由定义
│   ├── 📄 App.vue                 # 根组件
│   ├── 📄 main.ts                 # 应用入口
│   └── 📄 style.css               # 全局样式
├── 📄 package.json                # 依赖配置
├── 📄 vite.config.ts              # 构建配置
└── 📄 tsconfig.json               # TypeScript配置
```

### 设计原则

#### 1. 组件化架构
**设计原因:**
- **可复用性**: 组件可以在多个页面复用
- **可维护性**: 组件独立开发和维护
- **可测试性**: 组件可以独立测试
- **团队协作**: 不同开发者可以并行开发组件

```
📁 components/
├── 📄 NavBar.vue           # 导航栏 - 全局复用
├── 📄 ReservationCard.vue  # 预订卡片 - 列表页面复用
├── 📄 ReservationForm.vue  # 预订表单 - 创建/编辑复用
└── 📄 EmployeeReservationCard.vue # 员工视图卡片
```

#### 2. 页面组件设计
**设计原因:**
- **路由对应**: 每个页面对应一个组件
- **业务逻辑**: 页面级别的业务逻辑处理
- **用户体验**: 页面级别的用户交互
- **权限控制**: 页面级别的权限验证

```
📁 views/
├── 📄 HomeView.vue         # 首页 - 公开访问
├── 📄 LoginView.vue        # 登录页 - 未认证用户
├── 📄 AdminDashboard.vue   # 管理员仪表板 - 管理员权限
├── 📄 EmployeeDashboard.vue # 员工仪表板 - 员工权限
└── 📄 ReservationsView.vue  # 预订管理 - 认证用户
```

#### 3. 状态管理设计
**设计原因:**
- **全局状态**: 跨组件共享状态
- **数据持久化**: 状态在页面刷新后保持
- **响应式更新**: 状态变化自动更新UI
- **类型安全**: TypeScript提供类型检查

```typescript
// stores/auth.ts - 认证状态管理
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  
  const login = async (credentials: LoginCredentials) => {
    // 登录逻辑
  }
  
  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }
  
  return { user, token, login, logout }
})
```

#### 4. 服务层设计
**设计原因:**
- **API封装**: 统一管理API调用
- **错误处理**: 统一的错误处理机制
- **数据转换**: 请求和响应数据转换
- **缓存管理**: API响应缓存

```typescript
// services/reservation.ts - 预订服务
export class ReservationService {
  static async createReservation(data: CreateReservationData) {
    try {
      const response = await apolloClient.mutate({
        mutation: CREATE_RESERVATION,
        variables: { input: data }
      })
      return response.data.createReservation
    } catch (error) {
      throw new Error('创建预订失败')
    }
  }
}
```

## 🧪 测试结构设计

### BDD测试结构
```
📁 features/
├── 📁 step_definitions/           # 步骤定义
│   ├── 📄 auth.steps.js           # 认证步骤
│   ├── 📄 reservation.steps.js    # 预订步骤
│   ├── 📄 admin-reservation.steps.js # 管理员步骤
│   ├── 📄 common.steps.js         # 通用步骤
│   └── 📄 shared-reservation.steps.js # 共享步骤
├── 📄 auth.feature                # 认证测试场景
├── 📄 reservation.feature         # 预订测试场景
├── 📄 admin-reservation.feature   # 管理员测试场景
└── 📄 health.feature              # 健康检查测试
```

**设计原因:**
- **行为驱动**: 以业务行为为中心的测试
- **可读性**: 自然语言描述测试场景
- **协作**: 业务人员和技术人员协作
- **文档化**: 测试即文档

### 测试场景覆盖
```gherkin
# reservation.feature - 客户预订流程
Feature: 客户预订管理
  Scenario: 创建预订
    Given 用户已登录
    When 用户创建预订
    Then 预订状态为 "requested"
    
  Scenario: 修改预订
    Given 用户有未处理的预订
    When 用户修改预订信息
    Then 预订信息已更新
```

## 🐳 容器化设计

### Docker结构
```yaml
# docker-compose.yml
services:
  mongodb:          # 数据库服务
  backend:          # 后端API服务
  frontend:         # 前端应用服务
```

**设计原因:**
- **服务隔离**: 每个服务独立容器
- **环境一致性**: 开发、测试、生产环境一致
- **扩展性**: 支持水平扩展
- **部署便利**: 一键部署所有服务

## 📊 设计模式应用

### 1. MVC模式 (Model-View-Controller)
```
Model (models/)     ← 数据模型和业务逻辑
View (views/)       ← 用户界面
Controller (controllers/) ← 请求处理和响应
```

### 2. 服务层模式 (Service Layer)
```
Controllers → Services → Models → Database
```

### 3. 仓储模式 (Repository Pattern)
```javascript
// 数据访问层抽象
class ReservationRepository {
  async create(data) { /* 创建逻辑 */ }
  async findById(id) { /* 查询逻辑 */ }
  async update(id, data) { /* 更新逻辑 */ }
}
```

### 4. 中间件模式 (Middleware Pattern)
```javascript
// 请求处理管道
app.use(cors())           // CORS处理
app.use(express.json())  // JSON解析
app.use(authMiddleware)   // 认证中间件
app.use('/api', routes)  // 路由处理
```

## 🔄 数据流设计

### 前端数据流
```
用户操作 → Vue组件 → Pinia Store → API服务 → 后端API
```

### 后端数据流
```
HTTP请求 → 中间件 → 控制器 → 服务层 → 模型层 → 数据库
```

### GraphQL数据流
```
客户端查询 → Apollo Client → GraphQL解析器 → 数据源 → 响应
```

## 📈 扩展性设计

### 水平扩展
- **微服务拆分**: 支持服务独立部署
- **负载均衡**: 支持多实例部署
- **数据库分片**: 支持数据水平分片

### 垂直扩展
- **缓存层**: Redis缓存支持
- **CDN**: 静态资源CDN加速
- **数据库优化**: 索引和查询优化

## 🛡️ 安全性设计

### 认证授权
- **JWT令牌**: 无状态认证
- **角色权限**: 基于角色的访问控制
- **密码加密**: bcrypt密码哈希

### 数据安全
- **输入验证**: Joi数据验证
- **SQL注入防护**: MongoDB参数化查询
- **XSS防护**: 前端输入转义

## 📚 文档结构

### 文档组织
```
📁 docs/
├── 📄 deployment-guide.md    # 部署指南
├── 📄 tech-stack.md          # 技术栈说明
├── 📄 project-structure.md  # 项目结构说明
└── 📄 test-report.md         # 测试报告
```

**设计原因:**
- **分类管理**: 按功能分类文档
- **易于查找**: 清晰的文档结构
- **维护便利**: 文档与代码同步更新
- **团队协作**: 统一的文档标准

---

**总结**: 本项目结构设计遵循现代软件开发最佳实践，采用分层架构、模块化设计、组件化开发等模式，确保代码的可维护性、可扩展性和可测试性。通过合理的目录组织和设计模式应用，为希尔顿餐厅预订系统提供了清晰、高效的代码架构。

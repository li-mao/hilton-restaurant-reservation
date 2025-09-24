# 🏨 希尔顿餐厅预订系统

一个功能完善的在线餐桌预订系统，为希尔顿餐厅的客人提供便捷的预订服务，同时帮助餐厅员工高效管理预订。

[![Docker](https://img.shields.io/badge/Docker-就绪-blue?logo=docker)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Couchbase](https://img.shields.io/badge/Couchbase-数据库-orange?logo=couchbase)](https://www.couchbase.com/)
[![许可证](https://img.shields.io/badge/许可证-ISC-yellow.svg)](LICENSE)

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

## 🚀 快速开始

### 一键部署（推荐）

```bash
# 克隆仓库
git clone <repository-url>
cd hilton-restaurant-reservation

# 一键启动所有服务
./deploy.sh
```

**访问应用：**
- 🌐 前端应用: http://localhost:3000
- 🔧 后端API: http://localhost:5000
- 🗄️ 数据库管理: http://localhost:8091

**默认管理员账户：**
- 邮箱: admin@hilton.com
- 密码: admin123

## 📦 安装指南

### 环境要求
- **Docker** 和 **Docker Compose**（推荐）
- **Node.js** (v20 或更高版本) 用于手动安装
- **npm** 或 **yarn**

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

## 🐳 Docker管理

### 常用Docker命令

```bash
# 启动所有服务
./deploy.sh

# 停止所有服务
docker-compose down

# 重启特定服务
docker-compose restart backend

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend

# 检查服务状态
docker-compose ps

# 进入容器
docker-compose exec backend bash
```

### 数据库管理

```bash
# 重置数据库（⚠️ 这将删除所有数据）
docker-compose exec backend node reset-db.js

# 检查数据库状态
docker-compose exec backend node check-data.js

# 访问数据库管理界面
# 打开 http://localhost:8091
# 用户名: Administrator
# 密码: password
```

## 🚀 部署

### Docker部署（推荐）
1. 确保已安装 Docker 和 Docker Compose
2. 在项目根目录运行：
   ```bash
   ./deploy.sh
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

## 🔧 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 检查端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# 杀死占用进程
sudo kill -9 <PID>
```

#### 2. 数据库连接问题
```bash
# 检查Couchbase状态
docker-compose logs couchbase

# 重启数据库
docker-compose restart couchbase

# 检查数据库连接
curl -s http://localhost:8091/pools/default
```

#### 3. 权限问题
```bash
# 修复文件权限
sudo chown -R $USER:$USER .

# 修复Docker权限
sudo chmod +x deploy.sh
```

#### 4. 内存问题
```bash
# 检查Docker资源使用
docker stats

# 清理Docker资源
docker system prune -a
```

### 健康检查

```bash
# 检查后端健康状态
curl -s http://localhost:5000/api/health

# 检查前端
curl -s http://localhost:3000

# 检查数据库
curl -s http://localhost:8091/pools/default
```

## 📊 监控

### 日志管理
```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f couchbase

# 保存日志到文件
docker-compose logs > logs.txt
```

### 性能监控
```bash
# 监控资源使用
docker stats

# 检查容器健康状态
docker-compose ps

# 监控数据库性能
# 访问Couchbase管理界面 http://localhost:8091
```

## 🧪 开发

### 运行测试
```bash
# 后端测试
cd backend && npm test

# 前端测试
cd frontend && npm run test:unit

# 集成测试
npm run test:integration
```

### 代码质量
```bash
# 后端代码检查
cd backend && npm run lint

# 前端代码检查
cd frontend && npm run lint

# 代码格式化
npm run format
```

## 📚 附加资源

- [Docker重启指南](DOCKER_RESTART_GUIDE.md) - 完整的Docker管理指南
- [API文档](docs/api.md) - 详细的API文档
- [数据库架构](docs/database.md) - 数据库设计和关系
- [部署指南](docs/deployment.md) - 生产环境部署说明

## 🤝 贡献

1. Fork 仓库
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m '添加新功能'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

### 开发指南
- 遵循现有代码风格
- 为新功能编写测试
- 根据需要更新文档
- 确保所有测试通过后再提交

## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 使用现代Web技术构建
- Docker容器化便于部署
- Couchbase提供可扩展的数据存储
- Vue.js 3提供响应式前端
- Node.js提供强大的后端服务

---

## 🔧 高级故障排除

### Couchbase初始化问题

如果遇到认证失败或连接问题：

```bash
# 1. 检查Couchbase服务状态
docker-compose logs couchbase

# 2. 手动初始化集群
docker-compose exec couchbase couchbase-cli cluster-init -c localhost:8091 \
  --cluster-username Administrator --cluster-password password \
  --services data,query,index,fts,eventing,analytics --cluster-ramsize 1024

# 3. 手动创建存储桶
docker-compose exec couchbase couchbase-cli bucket-create -c localhost:8091 \
  -u Administrator -p password --bucket hilton-reservations \
  --bucket-type couchbase --bucket-ramsize 100 --enable-flush 1

# 4. 重新启动初始化
docker-compose up -d couchbase-init

# 5. 等待完成
sleep 60

# 6. 检查日志
docker-compose logs couchbase-init
```

### 完全系统重置

如果需要完全重置系统：

```bash
# 停止所有服务
docker-compose down

# 删除数据卷
docker volume rm hilton-restaurant-reservation_couchbase_data

# 清理Docker资源
docker system prune -f

# 使用部署脚本重启
./deploy.sh
```

**需要帮助？** 查看[故障排除部分](#-故障排除)或在GitHub上提交问题。
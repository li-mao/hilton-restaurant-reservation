# 🚀 部署和运行服务说明

本文档详细说明如何部署和运行希尔顿餐厅预订系统。

## 📋 系统要求

### 最低要求
- **操作系统**: Linux, macOS, Windows
- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **内存**: 4GB RAM
- **存储**: 10GB 可用空间
- **网络**: 端口 3000, 5000, 27017 可用

### 推荐配置
- **内存**: 8GB+ RAM
- **存储**: 20GB+ 可用空间
- **CPU**: 4核心+

## 🐳 Docker 部署（推荐）

### 一键部署

```bash
# 克隆项目
git clone <repository-url>
cd hilton-restaurant-reservation

# 一键启动所有服务
./deploy.sh
```

### 手动 Docker 部署

```bash
# 1. 停止现有服务
docker compose down

# 2. 清理资源
docker system prune -f

# 3. 启动所有服务
docker compose up -d

# 4. 检查服务状态
docker compose ps
```

### 服务访问地址

部署成功后，可通过以下地址访问：

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017
- **GraphQL Playground**: http://localhost:5000/graphql

### 默认管理员账户

- **邮箱**: admin@hilton.com
- **密码**: admin123

## 🔧 手动部署

### 后端部署

#### 1. 环境准备

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 创建环境配置文件
cp .env.example .env
```

#### 2. 环境变量配置

创建 `.env` 文件：

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=hilton-reservations
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
LOG_LEVEL=info
ADMIN_EMAIL=admin@hilton.com
ADMIN_PASSWORD=admin123
```

#### 3. 启动后端服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 前端部署

#### 1. 环境准备

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install
```

#### 2. 启动前端服务

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 数据库部署

#### MongoDB 安装

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y mongodb

# macOS (使用 Homebrew)
brew install mongodb-community

# 启动 MongoDB 服务
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

## 🏥 健康检查

### 自动健康检查

```bash
# 使用内置健康检查脚本
node scripts/health-check.js
```

### 手动健康检查

```bash
# 检查后端服务
curl -s http://localhost:5000/api/health

# 检查前端服务
curl -s http://localhost:3000

# 检查数据库连接
mongosh mongodb://localhost:27017/hilton-reservations
```

### 服务状态检查

```bash
# 查看所有服务状态
docker compose ps

# 查看服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

## 🔄 服务管理

### 启动服务

```bash
# 启动所有服务
docker compose up -d

# 启动特定服务
docker compose up -d backend
docker compose up -d frontend
docker compose up -d mongodb
```

### 停止服务

```bash
# 停止所有服务
docker compose down

# 停止并删除数据卷
docker compose down -v
```

### 重启服务

```bash
# 重启所有服务
docker compose restart

# 重启特定服务
docker compose restart backend
```

### 更新服务

```bash
# 拉取最新镜像
docker compose pull

# 重新构建并启动
docker compose up -d --build
```

## 🐛 故障排除

### 常见问题

#### 1. 端口占用

```bash
# 检查端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000
netstat -tulpn | grep :27017

# 杀死占用进程
sudo kill -9 <PID>
```

#### 2. Docker 权限问题

```bash
# 添加用户到 docker 组
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker
```

#### 3. 内存不足

```bash
# 检查内存使用
docker stats

# 清理 Docker 资源
docker system prune -a
```

#### 4. 数据库连接失败

```bash
# 检查 MongoDB 日志
docker compose logs mongodb

# 重启数据库服务
docker compose restart mongodb

# 检查数据库连接
mongosh mongodb://localhost:27017
```

### 日志分析

```bash
# 查看所有服务日志
docker compose logs -f

# 查看错误日志
docker compose logs --tail=100 | grep ERROR

# 保存日志到文件
docker compose logs > deployment.log
```

## 🔒 生产环境部署

### 环境变量配置

生产环境需要修改以下配置：

```env
NODE_ENV=production
JWT_SECRET=your-production-secret-key
MONGODB_URI=mongodb://your-production-db:27017
LOG_LEVEL=warn
```

### 反向代理配置

使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # 后端 API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # GraphQL
    location /graphql {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL 配置

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # 其他配置...
}
```

## 📊 监控和维护

### 性能监控

```bash
# 监控资源使用
docker stats

# 监控特定容器
docker stats hilton_backend hilton_frontend hilton_mongodb
```

### 数据备份

```bash
# 备份 MongoDB 数据
docker exec hilton_mongodb mongodump --out /backup

# 恢复数据
docker exec hilton_mongodb mongorestore /backup
```

### 日志轮转

```bash
# 配置日志轮转
docker compose logs --tail=1000 > logs/$(date +%Y%m%d).log
```

## 🔧 开发环境

### 热重载开发

```bash
# 后端开发模式
cd backend && npm run dev

# 前端开发模式
cd frontend && npm run dev
```

### 调试模式

```bash
# 启动调试模式
docker compose -f docker-compose.debug.yml up -d

# 进入容器调试
docker compose exec backend bash
docker compose exec frontend bash
```

## 📚 相关文档

- [技术栈说明](tech-stack.md)
- [项目结构说明](project-structure.md)
- [测试报告](test-report.md)
- [API 文档](api-documentation.md)

## 🆘 获取帮助

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查服务日志：`docker compose logs`
3. 运行健康检查：`node scripts/health-check.js`
4. 提交 Issue 到项目仓库

---

**注意**: 生产环境部署前，请确保已正确配置所有安全设置，包括强密码、HTTPS 证书和防火墙规则。

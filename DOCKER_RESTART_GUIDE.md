# Docker 重启和数据库初始化指南

本文档提供了完整的Docker容器重启和Couchbase数据库初始化的步骤说明。

## 概述

当需要清空数据库并重新初始化系统时，请按照以下步骤操作。这将完全重置数据库状态，删除所有现有数据，并重新创建管理员账户。

## 前置条件

- Docker 和 Docker Compose 已安装
- 项目目录：`/home/limao/workspace/Hilton_book/hilton-restaurant-reservation`
- 确保有足够的磁盘空间用于重新创建数据卷

## 完整重启流程

### 步骤 1: 停止所有服务

```bash
cd /home/limao/workspace/Hilton_book/hilton-restaurant-reservation
docker-compose down
```

**预期输出：**
```
Container hilton_frontend  Stopping
Container hilton_frontend  Stopped
Container hilton_frontend  Removing
Container hilton_frontend  Removed
Container hilton_backend  Stopping
Container hilton_backend  Stopped
Container hilton_backend  Removing
Container hilton_backend  Removed
Container hilton_couchbase_init  Stopping
Container hilton_couchbase_init  Stopped
Container hilton_couchbase_init  Removing
Container hilton_couchbase_init  Removed
Container hilton_couchbase  Stopping
Container hilton_couchbase  Stopped
Container hilton_couchbase  Removing
Container hilton_couchbase  Removed
Network hilton-restaurant-reservation_default  Removing
Network hilton-restaurant-reservation_default  Removed
```

### 步骤 2: 删除数据卷（清空数据库）

```bash
docker volume rm hilton-restaurant-reservation_couchbase_data
```

**预期输出：**
```
hilton-restaurant-reservation_couchbase_data
```

### 步骤 3: 重新启动服务

```bash
docker-compose up -d
```

**预期输出：**
```
Network hilton-restaurant-reservation_default  Creating
Network hilton-restaurant-reservation_default  Created
Volume "hilton-restaurant-reservation_couchbase_data"  Creating
Volume "hilton-restaurant-reservation_couchbase_data"  Created
Container hilton_couchbase  Creating
Container hilton_couchbase  Created
Container hilton_couchbase_init  Creating
Container hilton_couchbase_init  Created
Container hilton_backend  Creating
Container hilton_backend  Created
Container hilton_frontend  Creating
Container hilton_frontend  Created
Container hilton_couchbase  Starting
Container hilton_couchbase  Started
Container hilton_couchbase_init  Starting
Container hilton_couchbase_init  Started
Container hilton_backend  Starting
Container hilton_backend  Started
Container hilton_frontend  Starting
Container hilton_frontend  Started
```

### 步骤 4: 等待Couchbase服务启动

Couchbase服务需要时间完全启动，建议等待2-3分钟。

```bash
# 检查Couchbase服务状态
docker exec hilton_couchbase couchbase-cli server-info -c localhost:8091 -u Administrator -p password
```

**预期输出：** 包含服务器信息的JSON响应，状态为 "healthy"

### 步骤 5: 初始化Couchbase集群

如果集群未初始化，执行以下命令：

```bash
docker exec hilton_couchbase couchbase-cli cluster-init -c localhost:8091 \
  --cluster-username Administrator \
  --cluster-password password \
  --services data,query,index,fts,eventing,analytics \
  --cluster-ramsize 1024
```

**预期输出：**
```
SUCCESS: Cluster initialized
```

### 步骤 6: 创建存储桶

```bash
docker exec hilton_couchbase couchbase-cli bucket-create -c localhost:8091 \
  -u Administrator -p password \
  --bucket hilton-reservations \
  --bucket-type couchbase \
  --bucket-ramsize 100 \
  --enable-flush 1
```

**预期输出：**
```
SUCCESS: Bucket created
```

### 步骤 7: 创建数据库索引和管理员用户

```bash
# 重新启动初始化容器
docker-compose up -d couchbase-init

# 等待初始化完成（约1-2分钟）
sleep 60

# 检查初始化日志
docker logs hilton_couchbase_init --tail 30
```

**预期输出：**
```
✅ Couchbase连接成功！
🔍 检查存储桶 hilton-reservations...
✅ 存储桶 hilton-reservations 已存在
📊 创建数据库索引...
✅ 索引 primary 创建成功
✅ 索引 user_email 创建成功
✅ 索引 reservations_status 创建成功
✅ 索引 reservations_date 创建成功
✅ 索引 reservations_created_by 创建成功
✅ 索引 logs_reservation_id 创建成功
✅ 数据库索引处理完成
👤 检查管理员用户...
✅ 管理员用户创建并验证成功
📧 邮箱: admin@hilton.com
🔑 密码: admin123
```

### 步骤 8: 重启后端服务

```bash
docker-compose restart backend
```

### 步骤 9: 验证系统状态

#### 检查容器状态
```bash
docker-compose ps
```

**预期输出：**
```
NAME               IMAGE                                     COMMAND                  SERVICE     CREATED         STATUS         PORTS
hilton_backend     node:20                                   "docker-entrypoint.s…"   backend     X minutes ago   Up X minutes   0.0.0.0:5000->5000/tcp
hilton_couchbase   hilton-restaurant-reservation-couchbase   "/entrypoint.sh couc…"   couchbase   X minutes ago   Up X minutes   0.0.0.0:8091-8096->8091-8096/tcp
hilton_frontend    node:20                                   "docker-entrypoint.s…"   frontend    X minutes ago   Up X minutes   0.0.0.0:3000->3000/tcp
```

#### 检查后端健康状态
```bash
curl -s http://localhost:5000/api/health
```

**预期输出：**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-24T01:28:00.822Z",
  "services": {
    "database": {
      "status": "healthy",
      "message": "Couchbase connection successful"
    },
    "adminUser": {
      "status": "healthy",
      "message": "Admin user exists and is properly configured"
    },
    "memory": {
      "status": "healthy",
      "used": "20 MB",
      "total": "51 MB"
    },
    "uptime": {
      "status": "healthy",
      "uptime": "4 seconds"
    }
  }
}
```

#### 检查前端服务
```bash
curl -s http://localhost:3000 | head -5
```

**预期输出：**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module" src="/@vite/client"></script>
```

## 访问地址

初始化完成后，您可以通过以下地址访问服务：

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:5000
- **Couchbase管理界面**: http://localhost:8091
  - 用户名: Administrator
  - 密码: password

## 默认管理员账户

系统初始化后会创建默认管理员账户：

- **邮箱**: admin@hilton.com
- **密码**: admin123
- **角色**: admin

## 故障排除

### 问题 1: Couchbase连接失败

**症状**: 后端服务显示 "authentication failure"

**解决方案**:
1. 确保Couchbase服务完全启动（等待2-3分钟）
2. 检查集群是否已初始化
3. 重启后端服务: `docker-compose restart backend`

### 问题 2: 初始化容器失败

**症状**: 初始化容器显示连接超时

**解决方案**:
1. 等待Couchbase服务完全启动
2. 手动初始化集群和存储桶
3. 重新启动初始化容器

### 问题 3: 存储桶创建失败

**症状**: 存储桶创建命令失败

**解决方案**:
1. 确保集群已初始化
2. 检查存储桶名称是否已存在
3. 使用不同的存储桶名称

## 一键重启脚本

您也可以创建一个自动化脚本：

```bash
#!/bin/bash
# 保存为 restart_system.sh

echo "🔄 开始重启系统..."

# 停止服务
echo "⏹️  停止所有服务..."
docker-compose down

# 删除数据卷
echo "🗑️  删除数据卷..."
docker volume rm hilton-restaurant-reservation_couchbase_data

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待Couchbase启动
echo "⏳ 等待Couchbase启动..."
sleep 120

# 初始化集群
echo "🔧 初始化集群..."
docker exec hilton_couchbase couchbase-cli cluster-init -c localhost:8091 \
  --cluster-username Administrator --cluster-password password \
  --services data,query,index,fts,eventing,analytics --cluster-ramsize 1024

# 创建存储桶
echo "📦 创建存储桶..."
docker exec hilton_couchbase couchbase-cli bucket-create -c localhost:8091 \
  -u Administrator -p password --bucket hilton-reservations \
  --bucket-type couchbase --bucket-ramsize 100 --enable-flush 1

# 重启初始化容器
echo "🔄 重启初始化容器..."
docker-compose up -d couchbase-init

# 等待初始化完成
echo "⏳ 等待初始化完成..."
sleep 60

# 重启后端
echo "🔄 重启后端服务..."
docker-compose restart backend

echo "✅ 系统重启完成！"
echo "🌐 前端: http://localhost:3000"
echo "🔧 后端: http://localhost:5000"
echo "🗄️  Couchbase: http://localhost:8091"
echo "👤 管理员: admin@hilton.com / admin123"
```

使用方法：
```bash
chmod +x restart_system.sh
./restart_system.sh
```

## 注意事项

1. **数据丢失警告**: 此过程会完全删除所有现有数据
2. **备份重要数据**: 在执行前请备份重要数据
3. **服务依赖**: 确保按顺序执行步骤，等待服务完全启动
4. **端口占用**: 确保端口 3000、5000、8091-8096 未被占用
5. **磁盘空间**: 确保有足够的磁盘空间用于重新创建数据卷

## 联系支持

如果遇到问题，请检查：
1. Docker和Docker Compose版本兼容性
2. 系统资源（内存、磁盘空间）
3. 网络连接状态
4. 端口占用情况

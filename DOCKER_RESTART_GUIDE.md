# Docker 重启和数据库初始化指南

本文档提供了完整的Docker容器重启和Couchbase数据库初始化的步骤说明。

## 概述

当需要清空数据库并重新初始化系统时，请按照以下步骤操作。这将完全重置数据库状态，删除所有现有数据，并重新创建管理员账户。

## 🚀 快速重启（推荐）

如果您只是想重启服务而不清空数据，可以使用一键部署脚本：

```bash
cd /home/limao/workspace/Hilton_book/hilton-restaurant-reservation
./deploy.sh
```

这个脚本会自动处理所有重启和初始化步骤。

## 前置条件

- Docker 和 Docker Compose 已安装
- 项目目录：`/home/limao/workspace/Hilton_book/hilton-restaurant-reservation`
- 确保有足够的磁盘空间用于重新创建数据卷
- 确保端口 3000、5000、8091-8096 未被占用

## 📋 重启类型选择

### 类型 1: 软重启（保留数据）
- 仅重启容器，保留数据库数据
- 适用于服务异常或配置更新
- 使用命令：`./deploy.sh`

### 类型 2: 硬重启（清空数据）
- 完全重置数据库，删除所有数据
- 适用于开发测试或数据重置
- 按照下面的完整流程操作

## 完整重启流程

### 步骤 1: 停止所有服务

```bash
cd /home/limao/workspace/Hilton_book/hilton-restaurant-reservation
docker-compose down --remove-orphans
```

**说明**: `--remove-orphans` 参数会清理孤立的容器，确保完全停止所有相关服务。

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

### 步骤 2: 清理Docker资源（可选）

```bash
# 清理未使用的Docker资源
docker system prune -f

# 查看数据卷
docker volume ls | grep hilton
```

### 步骤 3: 删除数据卷（清空数据库）

```bash
# 删除Couchbase数据卷
docker volume rm hilton-restaurant-reservation_couchbase_data

# 如果数据卷不存在，会显示错误信息，这是正常的
```

**预期输出：**
```
hilton-restaurant-reservation_couchbase_data
```

**注意**: 如果数据卷不存在，会显示 "No such volume" 错误，这是正常的。

### 步骤 4: 重新启动服务

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

### 步骤 5: 等待服务启动

等待所有服务完全启动，建议等待2-3分钟。

```bash
# 检查所有容器状态
docker-compose ps

# 等待Couchbase服务启动
echo "等待Couchbase服务启动..."
sleep 30

# 检查Couchbase服务状态
docker exec hilton_couchbase couchbase-cli server-info -c localhost:8091 -u Administrator -p password
```

**预期输出：** 包含服务器信息的JSON响应，状态为 "healthy"

### 步骤 6: 检查数据库初始化

数据库初始化由 `couchbase-init` 容器自动处理。检查初始化状态：

```bash
# 查看初始化容器日志
docker-compose logs couchbase-init

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
🔑 密码: admin@hilton.com
```

### 步骤 7: 验证系统状态

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
- **密码**: admin@hilton.com
- **角色**: admin

## 🔧 常用管理命令

### 查看服务状态
```bash
# 查看所有容器状态
docker-compose ps

# 查看服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f couchbase
```

### 重启特定服务
```bash
# 重启后端服务
docker-compose restart backend

# 重启前端服务
docker-compose restart frontend

# 重启数据库
docker-compose restart couchbase
```

### 进入容器调试
```bash
# 进入后端容器
docker-compose exec backend bash

# 进入数据库容器
docker-compose exec couchbase bash

# 进入前端容器
docker-compose exec frontend bash
```

### 健康检查
```bash
# 检查后端健康状态
curl -s http://localhost:5000/api/health | jq

# 检查前端服务
curl -s http://localhost:3000 | head -5

# 检查数据库连接
curl -s http://localhost:8091/pools/default | head -5
```

## 🚨 故障排除

### 问题 1: Couchbase连接失败

**症状**: 后端服务显示 "authentication failure" 或连接超时

**解决方案**:
1. 确保Couchbase服务完全启动（等待2-3分钟）
2. 检查集群是否已初始化
3. 重启后端服务: `docker-compose restart backend`
4. 查看Couchbase日志: `docker-compose logs couchbase`

### 问题 2: 初始化容器失败

**症状**: 初始化容器显示连接超时或初始化失败

**解决方案**:
1. 等待Couchbase服务完全启动
2. 手动重启初始化容器: `docker-compose up -d couchbase-init`
3. 查看初始化日志: `docker-compose logs couchbase-init`
4. 如果持续失败，删除数据卷重新开始

### 问题 3: 端口占用

**症状**: 服务启动失败，显示端口已被占用

**解决方案**:
```bash
# 检查端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000
netstat -tulpn | grep :8091

# 杀死占用端口的进程
sudo kill -9 <PID>

# 或者更改端口配置
```

### 问题 4: 内存不足

**症状**: 容器启动失败或运行缓慢

**解决方案**:
1. 检查系统内存: `free -h`
2. 清理Docker资源: `docker system prune -a`
3. 重启Docker服务: `sudo systemctl restart docker`
4. 增加系统内存或调整容器内存限制

### 问题 5: 数据卷问题

**症状**: 数据卷无法删除或创建

**解决方案**:
```bash
# 查看所有数据卷
docker volume ls

# 强制删除数据卷
docker volume rm -f hilton-restaurant-reservation_couchbase_data

# 清理所有未使用的数据卷
docker volume prune
```

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
echo "👤 管理员: admin@hilton.com / admin@hilton.com"
```

使用方法：
```bash
chmod +x restart_system.sh
./restart_system.sh
```

## 📊 性能监控

### 系统资源监控
```bash
# 查看Docker资源使用情况
docker stats

# 查看系统内存使用
free -h

# 查看磁盘使用情况
df -h

# 查看Docker磁盘使用
docker system df
```

### 服务性能监控
```bash
# 监控容器日志
docker-compose logs -f --tail=100

# 查看特定时间段的日志
docker-compose logs --since="2024-01-01T00:00:00" backend

# 实时监控容器资源
docker stats hilton_backend hilton_frontend hilton_couchbase
```

## 🔄 自动化脚本

### 创建快速重启脚本
```bash
# 创建快速重启脚本
cat > quick_restart.sh << 'EOF'
#!/bin/bash
echo "🔄 快速重启服务..."
docker-compose down --remove-orphans
docker-compose up -d
echo "✅ 服务重启完成！"
echo "🌐 前端: http://localhost:3000"
echo "🔧 后端: http://localhost:5000"
EOF

chmod +x quick_restart.sh
```

### 创建完整重置脚本
```bash
# 创建完整重置脚本
cat > full_reset.sh << 'EOF'
#!/bin/bash
echo "⚠️  警告：这将删除所有数据！"
read -p "确认继续？(y/N): " confirm
if [[ $confirm == [yY] ]]; then
    echo "🔄 开始完整重置..."
    docker-compose down --remove-orphans
    docker volume rm hilton-restaurant-reservation_couchbase_data 2>/dev/null || true
    docker system prune -f
    docker-compose up -d
    echo "⏳ 等待服务启动..."
    sleep 60
    echo "✅ 完整重置完成！"
else
    echo "❌ 操作已取消"
fi
EOF

chmod +x full_reset.sh
```

## 📝 日志管理

### 日志轮转配置
```bash
# 创建日志轮转配置
sudo tee /etc/logrotate.d/docker-compose << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF
```

### 日志分析
```bash
# 分析错误日志
docker-compose logs backend | grep -i error

# 分析访问日志
docker-compose logs backend | grep -i "GET\|POST\|PUT\|DELETE"

# 统计日志行数
docker-compose logs backend | wc -l
```

## 🛡️ 安全建议

### 生产环境安全
1. **更改默认密码**: 修改Couchbase管理员密码
2. **网络隔离**: 使用Docker网络隔离服务
3. **SSL/TLS**: 配置HTTPS证书
4. **访问控制**: 限制管理界面访问
5. **定期备份**: 设置自动数据备份

### 开发环境安全
1. **数据隔离**: 使用不同的数据卷
2. **端口限制**: 限制外部访问端口
3. **日志清理**: 定期清理敏感日志
4. **权限控制**: 限制容器权限

## 📋 检查清单

### 重启前检查
- [ ] 确认数据已备份（如需要）
- [ ] 检查端口占用情况
- [ ] 确认有足够的磁盘空间
- [ ] 停止相关应用程序
- [ ] 记录当前配置信息

### 重启后验证
- [ ] 所有容器状态正常
- [ ] 数据库连接成功
- [ ] 后端API响应正常
- [ ] 前端页面加载正常
- [ ] 管理员账户可登录
- [ ] 健康检查通过

## 注意事项

1. **数据丢失警告**: 硬重启过程会完全删除所有现有数据
2. **备份重要数据**: 在执行前请备份重要数据
3. **服务依赖**: 确保按顺序执行步骤，等待服务完全启动
4. **端口占用**: 确保端口 3000、5000、8091-8096 未被占用
5. **磁盘空间**: 确保有足够的磁盘空间用于重新创建数据卷
6. **网络连接**: 确保网络连接稳定，避免下载中断
7. **权限问题**: 确保有足够的Docker权限执行相关命令

## 联系支持

如果遇到问题，请检查：
1. Docker和Docker Compose版本兼容性
2. 系统资源（内存、磁盘空间）
3. 网络连接状态
4. 端口占用情况
5. 查看相关日志文件
6. 检查防火墙设置

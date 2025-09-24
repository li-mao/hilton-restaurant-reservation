# 脚本目录

本目录包含希尔顿餐厅预订系统的各种脚本文件。

## 脚本文件说明

### 🚀 核心脚本

- **`robust-init.js`** - 健壮的Couchbase初始化脚本
  - 包含完整的数据库初始化
  - 数据验证和错误处理
  - 自动重试机制
  - 健康检查

- **`health-check.js`** - 系统健康检查脚本
  - 检查所有服务状态
  - 验证数据库连接
  - 测试管理员用户
  - 监控系统资源

### 📋 使用方法

#### 初始化系统
```bash
# 使用Docker Compose自动初始化
docker-compose up -d

# 或手动运行初始化脚本
node scripts/robust-init.js
```

#### 健康检查
```bash
# 检查系统健康状态
node scripts/health-check.js

# 或使用一键部署脚本
./deploy.sh
```

### 🔧 配置说明

所有脚本都使用环境变量进行配置：

- `COUCHBASE_CONNECTION_STRING` - Couchbase连接字符串
- `COUCHBASE_USERNAME` - Couchbase用户名
- `COUCHBASE_PASSWORD` - Couchbase密码
- `COUCHBASE_BUCKET` - 存储桶名称
- `ADMIN_EMAIL` - 管理员邮箱
- `ADMIN_PASSWORD` - 管理员密码

### 📝 注意事项

- 确保在运行脚本前Docker服务已启动
- 初始化脚本会自动处理数据验证
- 健康检查脚本可以用于监控系统状态
- 所有脚本都包含详细的日志输出

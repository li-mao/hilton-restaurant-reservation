# Cucumber BDD 测试说明

## 新增的测试用例

本项目新增了完整的预订管理流程测试，包括客户和管理员两个角色的操作。

### 测试文件结构

```
features/
├── auth.feature                    # 原有认证测试
├── health.feature                  # 原有健康检查测试
├── reservation.feature             # 新增：客户预订流程测试
├── admin-reservation.feature       # 新增：管理员预订管理测试
└── step_definitions/
    ├── auth.steps.js               # 原有认证步骤定义
    ├── common.steps.js             # 原有通用步骤定义
    ├── reservation.steps.js        # 新增：客户预订步骤定义
    ├── admin-reservation.steps.js  # 新增：管理员预订步骤定义
    └── shared-reservation.steps.js # 新增：共享步骤定义
```

### 测试场景覆盖

#### 1. 客户预订流程 (`reservation.feature`)

**场景1：创建三个预订 (A, B, C)**
- 客户创建预订A：2人桌，窗边座位
- 客户创建预订B：4人桌，安静区域
- 客户创建预订C：6人桌，生日庆祝
- 验证所有预订状态为 "requested"

**场景2：修改预订A的桌数**
- 将预订A的桌数从2人改为4人
- 验证修改成功且状态保持 "requested"

**场景3：取消预订A**
- 客户取消预订A
- 验证取消成功且状态变为 "cancelled"

#### 2. 管理员预订管理 (`admin-reservation.feature`)

**场景1：管理员取消预订B**
- 管理员取消客户创建的预订B
- 验证取消成功且状态变为 "cancelled"

**场景2：管理员批准预订C**
- 管理员批准客户创建的预订C
- 验证批准成功且状态变为 "approved"

**场景3：管理员完成预订C**
- 管理员完成已批准的预订C
- 验证完成成功且状态变为 "completed"

**场景4：完整的管理员工作流程**
- 管理员取消预订B
- 管理员批准预订C
- 管理员完成预订C
- 验证最终状态：B为 "cancelled"，C为 "completed"

### API 端点测试

测试使用 GraphQL API，覆盖以下操作：

#### 客户操作
- `createReservation` - 创建预订
- `updateReservation` - 修改预订
- `cancelReservation` - 取消预订

#### 管理员操作
- `cancelReservation` - 取消预订（管理员权限）
- `approveReservation` - 批准预订
- `completeReservation` - 完成预订

#### 认证
- `register` - 用户注册
- `login` - 用户登录

### 运行测试

#### 1. 启动服务器
```bash
cd backend
npm start
# 或开发模式
npm run dev
```

#### 2. 运行所有测试
```bash
npm run bdd
```

#### 3. 运行特定测试
```bash
# 只运行预订相关测试
npx cucumber-js features/reservation.feature features/admin-reservation.feature

# 运行特定场景
npx cucumber-js features/reservation.feature:9
```

#### 4. 监听模式运行
```bash
npm run bdd:watch
```

#### 5. 干运行（检查步骤定义）
```bash
npm run bdd -- --dry-run
```

### 测试数据

测试使用以下测试数据：

#### 客户用户
- 邮箱：`guest@example.com`
- 密码：`password123`
- 角色：`guest`

#### 管理员用户
- 邮箱：`admin@hilton.com`
- 密码：`admin123`
- 角色：`admin`

#### 预订数据
- **预订A**：John Doe A，2人桌，窗边座位
- **预订B**：John Doe B，4人桌，安静区域
- **预订C**：John Doe C，6人桌，生日庆祝

### 测试验证点

每个测试场景都验证：
1. **API响应成功** - 检查GraphQL响应无错误
2. **状态正确** - 验证预订状态符合预期
3. **数据完整性** - 确保预订数据正确保存
4. **权限控制** - 验证用户角色权限

### 注意事项

1. **服务器依赖**：测试需要后端服务器运行在 `http://localhost:5000`
2. **数据库**：测试会创建真实的用户和预订数据
3. **幂等性**：测试支持重复运行，会处理用户已存在的情况
4. **清理**：测试数据会保留在数据库中，需要手动清理

### 扩展测试

如需添加新的测试场景，可以：

1. 在相应的 `.feature` 文件中添加新的 `Scenario`
2. 在 `step_definitions` 中添加对应的步骤定义
3. 使用共享的验证步骤或创建新的验证逻辑

### 故障排除

#### 常见问题

1. **连接错误**：确保服务器正在运行
2. **认证失败**：检查用户注册/登录逻辑
3. **权限错误**：验证用户角色设置
4. **数据冲突**：清理测试数据库或使用唯一标识符

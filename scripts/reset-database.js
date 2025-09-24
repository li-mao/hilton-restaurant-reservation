#!/usr/bin/env node

/**
 * 完全重置数据库脚本
 * 清空所有数据并重新初始化
 */

const couchbase = require('couchbase');
const bcrypt = require('bcryptjs');

// 配置参数
const config = {
  connectionString: process.env.COUCHBASE_CONNECTION_STRING || 'couchbase://localhost:8091',
  username: process.env.COUCHBASE_USERNAME || 'Administrator',
  password: process.env.COUCHBASE_PASSWORD || 'password',
  bucketName: process.env.COUCHBASE_BUCKET || 'hilton-reservations',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@hilton.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
};

let cluster = null;
let bucket = null;

/**
 * 连接数据库
 */
async function connectToDatabase() {
  console.log('🔌 连接到Couchbase...');
  
  cluster = await couchbase.connect(config.connectionString, {
    username: config.username,
    password: config.password,
    timeout: 10000
  });
  
  bucket = cluster.bucket(config.bucketName);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('✅ 数据库连接成功');
}

/**
 * 清空所有数据
 */
async function clearAllData() {
  console.log('🗑️  开始清空所有数据...');
  
  const defaultCollection = bucket.defaultCollection();
  
  try {
    // 查询所有文档
    const query = `SELECT META().id FROM \`${config.bucketName}\``;
    const result = await cluster.query(query);
    
    console.log(`📊 找到 ${result.rows.length} 个文档需要删除`);
    
    // 删除所有文档
    for (const row of result.rows) {
      try {
        await defaultCollection.remove(row.id);
        console.log(`✅ 已删除: ${row.id}`);
      } catch (error) {
        console.log(`⚠️  删除失败 ${row.id}: ${error.message}`);
      }
    }
    
    console.log('✅ 所有数据已清空');
  } catch (error) {
    console.log(`⚠️  清空数据时出现错误: ${error.message}`);
    // 继续执行，即使清空失败
  }
}

/**
 * 重新创建管理员用户
 */
async function createAdminUser() {
  console.log('👤 创建管理员用户...');
  
  const defaultCollection = bucket.defaultCollection();
  
  // 加密密码
  const hashedPassword = await bcrypt.hash(config.adminPassword, 10);
  
  // 创建管理员用户数据
  const adminId = `user::admin::${Date.now()}`;
  const adminUser = {
    id: adminId,
    type: 'user',
    name: 'admin',
    email: config.adminEmail,
    password: hashedPassword,
    role: 'admin',
    phone: '12300000000',
    passwordChanged: false,
    disabled: false,
    createdAt: new Date()
  };
  
  // 保存用户文档
  await defaultCollection.insert(adminId, adminUser);
  
  // 保存邮箱索引
  await defaultCollection.insert(`email::${config.adminEmail}`, { userId: adminId });
  
  console.log('✅ 管理员用户创建成功');
  console.log(`📧 邮箱: ${config.adminEmail}`);
  console.log(`🔑 密码: ${config.adminPassword}`);
}

/**
 * 创建数据库索引
 */
async function createIndexes() {
  console.log('📊 创建数据库索引...');
  
  const indexes = [
    {
      name: 'primary',
      query: `CREATE PRIMARY INDEX ON \`${config.bucketName}\``,
      ignoreError: 'already exists'
    },
    {
      name: 'user_email',
      query: `CREATE INDEX idx_user_email ON \`${config.bucketName}\`(email) WHERE type = "user"`,
      ignoreError: 'already exists'
    },
    {
      name: 'reservations_status',
      query: `CREATE INDEX idx_reservations_status ON \`${config.bucketName}\`(status) WHERE type = "reservation"`,
      ignoreError: 'already exists'
    },
    {
      name: 'reservations_date',
      query: `CREATE INDEX idx_reservations_date ON \`${config.bucketName}\`(expectedArrivalTime) WHERE type = "reservation"`,
      ignoreError: 'already exists'
    },
    {
      name: 'reservations_created_by',
      query: `CREATE INDEX idx_reservations_created_by ON \`${config.bucketName}\`(createdBy) WHERE type = "reservation"`,
      ignoreError: 'already exists'
    },
    {
      name: 'logs_reservation_id',
      query: `CREATE INDEX idx_logs_reservation_id ON \`${config.bucketName}\`(reservationId) WHERE type = "log"`,
      ignoreError: 'already exists'
    }
  ];
  
  for (const index of indexes) {
    try {
      await cluster.query(index.query);
      console.log(`✅ 索引 ${index.name} 创建成功`);
    } catch (error) {
      if (error.message.includes(index.ignoreError)) {
        console.log(`ℹ️  索引 ${index.name} 已存在`);
      } else {
        console.warn(`⚠️  索引 ${index.name} 创建失败: ${error.message}`);
      }
    }
  }
  
  console.log('✅ 数据库索引处理完成');
}

/**
 * 验证重置结果
 */
async function verifyReset() {
  console.log('🔍 验证重置结果...');
  
  const defaultCollection = bucket.defaultCollection();
  
  // 查询所有用户
  const userQuery = `SELECT * FROM \`${config.bucketName}\` WHERE type = "user"`;
  const userResult = await cluster.query(userQuery);
  
  console.log(`📊 当前用户数量: ${userResult.rows.length}`);
  
  if (userResult.rows.length === 1) {
    const user = userResult.rows[0];
    if (user.email === config.adminEmail && user.role === 'admin') {
      console.log('✅ 重置验证成功：只有管理员用户存在');
      return true;
    }
  }
  
  console.log('⚠️  重置验证失败：存在其他用户或管理员用户不正确');
  return false;
}

/**
 * 主重置函数
 */
async function resetDatabase() {
  try {
    console.log('🚀 开始完全重置数据库...');
    console.log('=====================================');
    
    // 1. 连接数据库
    await connectToDatabase();
    
    // 2. 清空所有数据
    await clearAllData();
    
    // 3. 创建管理员用户
    await createAdminUser();
    
    // 4. 创建索引
    await createIndexes();
    
    // 5. 验证重置结果
    const isSuccess = await verifyReset();
    
    console.log('=====================================');
    if (isSuccess) {
      console.log('🎉 数据库重置完成！');
      console.log('📋 重置摘要:');
      console.log(`   📦 存储桶: ${config.bucketName}`);
      console.log(`   👤 管理员邮箱: ${config.adminEmail}`);
      console.log(`   🔑 管理员密码: ${config.adminPassword}`);
      console.log('   ✅ 所有旧数据已清空');
      console.log('   ✅ 只保留管理员用户');
    } else {
      console.log('⚠️  数据库重置可能未完全成功');
    }
    console.log('=====================================');
    
    process.exit(0);
    
  } catch (error) {
    console.error('=====================================');
    console.error('❌ 数据库重置失败:');
    console.error(`   错误: ${error.message}`);
    console.error('=====================================');
    process.exit(1);
  } finally {
    if (cluster) {
      await cluster.close();
    }
  }
}

// 运行重置
resetDatabase();

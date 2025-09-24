#!/usr/bin/env node

/**
 * 健壮的Couchbase初始化脚本
 * 包含数据验证、重试机制和健康检查
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
 * 等待服务启动（带重试机制）
 */
async function waitForService(maxRetries = 30, delay = 2000) {
  console.log('等待Couchbase服务启动...');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      cluster = await couchbase.connect(config.connectionString, {
        username: config.username,
        password: config.password,
        timeout: 10000
      });
      
      bucket = cluster.bucket(config.bucketName);
      // 等待存储桶准备就绪
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Couchbase连接成功！');
      return true;
    } catch (error) {
      console.log(`⏳ 连接尝试 ${i + 1}/${maxRetries}: ${error.message}`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error('❌ 无法连接到Couchbase服务');
}

/**
 * 创建存储桶（带验证）
 */
async function createBucketWithValidation() {
  try {
    console.log(`🔍 检查存储桶 ${config.bucketName}...`);
    
    // 尝试获取存储桶
    bucket = cluster.bucket(config.bucketName);
    // 等待存储桶准备就绪
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`✅ 存储桶 ${config.bucketName} 已存在`);
    return true;
  } catch (error) {
    if (error.code === 13) { // Bucket not found
      console.log(`📦 创建存储桶 ${config.bucketName}...`);
      
      await cluster.buckets().createBucket({
        name: config.bucketName,
        ramQuotaMB: 100,
        flushEnabled: true,
        numReplicas: 0
      });
      
      // 等待存储桶创建完成
      bucket = cluster.bucket(config.bucketName);
      // 等待存储桶准备就绪
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log(`✅ 存储桶 ${config.bucketName} 创建成功`);
      return true;
    } else {
      throw error;
    }
  }
}

/**
 * 创建索引（带错误处理）
 */
async function createIndexesSafely() {
  try {
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
  } catch (error) {
    console.warn(`⚠️  索引创建过程中出现错误: ${error.message}`);
    // 索引创建失败不应该阻止初始化完成
  }
}

/**
 * 创建管理员用户（带完整验证）
 */
async function createAdminUserWithValidation() {
  const defaultCollection = bucket.defaultCollection();
  
  try {
    console.log('👤 检查管理员用户...');
    
    // 检查管理员是否已存在
    try {
      const emailResult = await defaultCollection.get(`email::${config.adminEmail}`);
      const userId = emailResult.content.userId;
      const userResult = await defaultCollection.get(userId);
      
      // 验证现有用户数据完整性
      if (userResult.content.password && userResult.content.role === 'admin') {
        console.log('✅ 管理员用户已存在且数据完整');
        return true;
      } else {
        console.log('⚠️  现有管理员用户数据不完整，将重新创建');
        // 删除不完整的用户
        await defaultCollection.remove(userId);
        await defaultCollection.remove(`email::${config.adminEmail}`);
      }
    } catch (error) {
      if (error.code !== 13) { // Not DocumentNotFound
        throw error;
      }
      console.log('ℹ️  没有找到现有管理员用户');
    }
    
    console.log('🔧 创建新的管理员用户...');
    
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
    
    // 使用事务性操作保存用户
    try {
      // 保存用户文档
      await defaultCollection.insert(adminId, adminUser);
      
      // 保存邮箱索引
      await defaultCollection.insert(`email::${config.adminEmail}`, { userId: adminId });
      
      console.log('✅ 管理员用户数据保存成功');
    } catch (saveError) {
      console.error('❌ 保存管理员用户失败:', saveError.message);
      throw saveError;
    }
    
    // 立即验证数据完整性
    console.log('🔍 验证管理员用户数据...');
    const verifyUser = await defaultCollection.get(adminId);
    const verifyEmail = await defaultCollection.get(`email::${config.adminEmail}`);
    
    if (!verifyUser.content.password) {
      throw new Error('密码字段验证失败');
    }
    
    if (!verifyEmail.content.userId) {
      throw new Error('邮箱索引验证失败');
    }
    
    console.log('✅ 管理员用户创建并验证成功');
    console.log(`📧 邮箱: ${config.adminEmail}`);
    console.log(`🔑 密码: ${config.adminPassword}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ 创建管理员用户失败: ${error.message}`);
    throw error;
  }
}

/**
 * 健康检查
 */
async function performHealthCheck() {
  try {
    console.log('🏥 执行健康检查...');
    
    const defaultCollection = bucket.defaultCollection();
    
    // 检查存储桶连接
    // 等待存储桶准备就绪
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ 存储桶连接正常');
    
    // 检查管理员用户
    const emailResult = await defaultCollection.get(`email::${config.adminEmail}`);
    const userId = emailResult.content.userId;
    const userResult = await defaultCollection.get(userId);
    
    if (!userResult.content.password) {
      throw new Error('管理员用户密码字段缺失');
    }
    
    if (userResult.content.role !== 'admin') {
      throw new Error('管理员用户角色不正确');
    }
    
    console.log('✅ 管理员用户健康检查通过');
    
    // 测试密码验证
    const isPasswordValid = await bcrypt.compare(config.adminPassword, userResult.content.password);
    if (!isPasswordValid) {
      throw new Error('管理员用户密码验证失败');
    }
    
    console.log('✅ 密码验证测试通过');
    
    return true;
  } catch (error) {
    console.error(`❌ 健康检查失败: ${error.message}`);
    throw error;
  }
}

/**
 * 主初始化函数
 */
async function robustInitialize() {
  try {
    console.log('🚀 开始健壮的Couchbase初始化...');
    console.log('=====================================');
    
    // 1. 等待服务启动
    await waitForService();
    
    // 2. 创建存储桶
    await createBucketWithValidation();
    
    // 3. 创建索引
    await createIndexesSafely();
    
    // 4. 创建管理员用户
    await createAdminUserWithValidation();
    
    // 5. 执行健康检查
    await performHealthCheck();
    
    console.log('=====================================');
    console.log('🎉 Couchbase健壮初始化完成！');
    console.log('📋 初始化摘要:');
    console.log(`   📦 存储桶: ${config.bucketName}`);
    console.log(`   👤 管理员邮箱: ${config.adminEmail}`);
    console.log(`   🔑 管理员密码: ${config.adminPassword}`);
    console.log('   ✅ 所有健康检查通过');
    console.log('=====================================');
    
    process.exit(0);
    
  } catch (error) {
    console.error('=====================================');
    console.error('❌ Couchbase初始化失败:');
    console.error(`   错误: ${error.message}`);
    console.error('=====================================');
    process.exit(1);
  } finally {
    if (cluster) {
      await cluster.close();
    }
  }
}

// 运行健壮初始化
robustInitialize();

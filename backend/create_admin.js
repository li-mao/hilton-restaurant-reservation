#!/usr/bin/env node

const couchbase = require('couchbase');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('🚀 开始创建管理员用户...');
    
    // 连接Couchbase
    const cluster = await couchbase.connect(process.env.COUCHBASE_CONNECTION_STRING || 'couchbase://couchbase', {
      username: process.env.COUCHBASE_USERNAME || 'Administrator',
      password: process.env.COUCHBASE_PASSWORD || 'password'
    });
    
    const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET || 'hilton-reservations');
    const defaultCollection = bucket.defaultCollection();
    
    // 等待存储桶准备就绪
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ 连接成功');
    
    // 加密密码
    const hashedPassword = await bcrypt.hash('admin@hilton.com', 10);
    
    // 创建管理员用户数据
    const adminId = `user::admin::${Date.now()}`;
    const adminUser = {
      id: adminId,
      type: 'user',
      name: 'admin',
      email: 'admin@hilton.com',
      password: hashedPassword,
      role: 'admin',
      phone: '12300000000',
      passwordChanged: false,
      disabled: false,
      createdAt: new Date()
    };
    
    // 保存用户文档
    await defaultCollection.insert(adminId, adminUser);
    console.log('✅ 管理员用户文档保存成功');
    
    // 保存邮箱索引
    await defaultCollection.insert('email::admin@hilton.com', { userId: adminId });
    console.log('✅ 邮箱索引保存成功');
    
    // 验证数据
    const verifyUser = await defaultCollection.get(adminId);
    const verifyEmail = await defaultCollection.get('email::admin@hilton.com');
    
    console.log('✅ 数据验证成功');
    console.log('📧 管理员邮箱: admin@hilton.com');
    console.log('🔑 管理员密码: admin@hilton.com');
    
    await cluster.close();
    console.log('🎉 管理员用户创建完成！');
    
  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error.message);
    process.exit(1);
  }
}

createAdmin();

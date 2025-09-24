#!/usr/bin/env node

/**
 * 系统健康检查脚本
 * 验证所有服务是否正常运行
 */

const couchbase = require('couchbase');
const bcrypt = require('bcryptjs');

const config = {
  connectionString: process.env.COUCHBASE_CONNECTION_STRING || 'couchbase://localhost:8091',
  username: process.env.COUCHBASE_USERNAME || 'Administrator',
  password: process.env.COUCHBASE_PASSWORD || 'password',
  bucketName: process.env.COUCHBASE_BUCKET || 'hilton-reservations',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@hilton.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
};

async function checkCouchbaseConnection() {
  try {
    console.log('🔍 检查Couchbase连接...');
    const cluster = await couchbase.connect(config.connectionString, {
      username: config.username,
      password: config.password,
      timeout: 5000
    });
    
    const bucket = cluster.bucket(config.bucketName);
    await bucket.waitUntilReady();
    
    console.log('✅ Couchbase连接正常');
    await cluster.close();
    return true;
  } catch (error) {
    console.error('❌ Couchbase连接失败:', error.message);
    return false;
  }
}

async function checkAdminUser() {
  try {
    console.log('🔍 检查管理员用户...');
    const cluster = await couchbase.connect(config.connectionString, {
      username: config.username,
      password: config.password,
      timeout: 5000
    });
    
    const bucket = cluster.bucket(config.bucketName);
    const defaultCollection = bucket.defaultCollection();
    
    // 检查邮箱索引
    const emailResult = await defaultCollection.get(`email::${config.adminEmail}`);
    const userId = emailResult.content.userId;
    
    // 检查用户数据
    const userResult = await defaultCollection.get(userId);
    
    if (!userResult.content.password) {
      throw new Error('管理员用户密码字段缺失');
    }
    
    if (userResult.content.role !== 'admin') {
      throw new Error('管理员用户角色不正确');
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(config.adminPassword, userResult.content.password);
    if (!isPasswordValid) {
      throw new Error('管理员用户密码验证失败');
    }
    
    console.log('✅ 管理员用户正常');
    await cluster.close();
    return true;
  } catch (error) {
    console.error('❌ 管理员用户检查失败:', error.message);
    return false;
  }
}

async function checkBackendAPI() {
  try {
    console.log('🔍 检查后端API...');
    const response = await fetch('http://localhost:5000/api/health');
    
    if (response.ok) {
      console.log('✅ 后端API正常');
      return true;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('❌ 后端API检查失败:', error.message);
    return false;
  }
}

async function checkFrontend() {
  try {
    console.log('🔍 检查前端应用...');
    const response = await fetch('http://localhost:3000');
    
    if (response.ok) {
      console.log('✅ 前端应用正常');
      return true;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('❌ 前端应用检查失败:', error.message);
    return false;
  }
}

async function performHealthCheck() {
  console.log('🏥 开始系统健康检查...');
  console.log('=====================================');
  
  const checks = [
    { name: 'Couchbase连接', fn: checkCouchbaseConnection },
    { name: '管理员用户', fn: checkAdminUser },
    { name: '后端API', fn: checkBackendAPI },
    { name: '前端应用', fn: checkFrontend }
  ];
  
  const results = [];
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      results.push({ name: check.name, status: result ? 'PASS' : 'FAIL' });
    } catch (error) {
      results.push({ name: check.name, status: 'FAIL', error: error.message });
    }
  }
  
  console.log('=====================================');
  console.log('📊 健康检查结果:');
  
  let allPassed = true;
  for (const result of results) {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${status} ${result.name}: ${result.status}`);
    if (result.error) {
      console.log(`      错误: ${result.error}`);
    }
    if (result.status !== 'PASS') {
      allPassed = false;
    }
  }
  
  console.log('=====================================');
  
  if (allPassed) {
    console.log('🎉 所有健康检查通过！系统运行正常。');
    process.exit(0);
  } else {
    console.log('⚠️  部分健康检查失败，请检查相关服务。');
    process.exit(1);
  }
}

// 运行健康检查
performHealthCheck();

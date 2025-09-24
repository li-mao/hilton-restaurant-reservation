#!/usr/bin/env node

/**
 * 系统健康检查脚本
 * 验证所有服务是否正常运行
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: process.env.MONGODB_DB || 'hilton-reservations',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@hilton.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
};

async function checkMongoConnection() {
  try {
    console.log('🔍 检查MongoDB连接...');
    const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    await client.db(config.dbName).command({ ping: 1 });
    console.log('✅ MongoDB连接正常');
    await client.close();
    return true;
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message);
    return false;
  }
}

async function checkAdminUser() {
  try {
    console.log('🔍 检查管理员用户...');
    const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db(config.dbName);
    const users = db.collection('users');

    const user = await users.findOne({ email: config.adminEmail.toLowerCase() });
    if (!user) throw new Error('管理员用户不存在');
    if (!user.password) throw new Error('管理员用户密码字段缺失');
    if (user.role !== 'admin') throw new Error('管理员用户角色不正确');

    const isPasswordValid = await bcrypt.compare(config.adminPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('管理员用户密码验证失败');
    }

    console.log('✅ 管理员用户正常');
    await client.close();
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
    { name: 'MongoDB连接', fn: checkMongoConnection },
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

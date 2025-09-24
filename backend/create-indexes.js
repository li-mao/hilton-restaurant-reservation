#!/usr/bin/env node

/**
 * 创建数据库索引脚本
 */

const couchbase = require('couchbase');

// 配置参数
const config = {
  connectionString: process.env.COUCHBASE_CONNECTION_STRING || 'couchbase://localhost:8091',
  username: process.env.COUCHBASE_USERNAME || 'Administrator',
  password: process.env.COUCHBASE_PASSWORD || 'password',
  bucketName: process.env.COUCHBASE_BUCKET || 'hilton-reservations'
};

async function createIndexes() {
  let cluster = null;
  
  try {
    console.log('连接到Couchbase...');
    cluster = await couchbase.connect(config.connectionString, {
      username: config.username,
      password: config.password,
      timeout: 10000
    });
    
    console.log('创建数据库索引...');
    
    // 创建主索引（所有数据都存储在 default collection）
    await cluster.query(`
      CREATE PRIMARY INDEX ON \`${config.bucketName}\`
    `).catch(() => {
      console.log('主索引已存在');
    });
    
    // 创建用户邮箱索引
    await cluster.query(`
      CREATE INDEX idx_user_email ON \`${config.bucketName}\`(email) WHERE type = "user"
    `).catch(() => {
      console.log('用户邮箱索引已存在');
    });
    
    // 创建预订状态索引
    await cluster.query(`
      CREATE INDEX idx_reservations_status ON \`${config.bucketName}\`(status) WHERE type = "reservation"
    `).catch(() => {
      console.log('预订状态索引已存在');
    });
    
    // 创建预订日期索引
    await cluster.query(`
      CREATE INDEX idx_reservations_date ON \`${config.bucketName}\`(expectedArrivalTime) WHERE type = "reservation"
    `).catch(() => {
      console.log('预订日期索引已存在');
    });
    
    // 创建预订创建者索引
    await cluster.query(`
      CREATE INDEX idx_reservations_created_by ON \`${config.bucketName}\`(createdBy) WHERE type = "reservation"
    `).catch(() => {
      console.log('预订创建者索引已存在');
    });
    
    // 创建变更日志索引
    await cluster.query(`
      CREATE INDEX idx_logs_reservation_id ON \`${config.bucketName}\`(reservationId) WHERE type = "log"
    `).catch(() => {
      console.log('变更日志索引已存在');
    });
    
    console.log('数据库索引创建完成！');
    
  } catch (error) {
    console.error(`创建索引失败: ${error.message}`);
    throw error;
  } finally {
    if (cluster) {
      await cluster.close();
    }
  }
}

// 运行索引创建脚本
createIndexes()
  .then(() => {
    console.log('索引创建完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('索引创建失败:', error);
    process.exit(1);
  });

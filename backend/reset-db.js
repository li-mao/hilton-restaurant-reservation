const couchbase = require('couchbase');
const bcrypt = require('bcryptjs');

const config = {
  connectionString: 'couchbase://couchbase',
  username: 'Administrator',
  password: 'password',
  bucketName: 'hilton-reservations',
  adminEmail: 'admin@hilton.com',
  adminPassword: 'admin123'
};

async function resetDatabase() {
  try {
    console.log('🚀 开始完全重置数据库...');
    
    const cluster = await couchbase.connect(config.connectionString, {
      username: config.username,
      password: config.password,
      timeout: 10000
    });
    
    const bucket = cluster.bucket(config.bucketName);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🗑️  清空所有数据...');
    const defaultCollection = bucket.defaultCollection();
    
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
    
    console.log('👤 创建管理员用户...');
    const hashedPassword = await bcrypt.hash(config.adminPassword, 10);
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
    
    await defaultCollection.insert(adminId, adminUser);
    await defaultCollection.insert(`email::${config.adminEmail}`, { userId: adminId });
    
    console.log('✅ 数据库重置完成！');
    console.log(`📧 管理员邮箱: ${config.adminEmail}`);
    console.log(`🔑 管理员密码: ${config.adminPassword}`);
    
    await cluster.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 重置失败:', error.message);
    process.exit(1);
  }
}

resetDatabase();

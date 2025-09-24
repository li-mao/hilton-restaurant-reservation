const couchbase = require('couchbase');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('👤 创建管理员用户...');
    
    const cluster = await couchbase.connect('couchbase://couchbase', {
      username: 'Administrator',
      password: 'password',
      timeout: 10000
    });
    
    const bucket = cluster.bucket('hilton-reservations');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const defaultCollection = bucket.defaultCollection();
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
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
    
    await defaultCollection.insert(adminId, adminUser);
    await defaultCollection.insert('email::admin@hilton.com', { userId: adminId });
    
    console.log('✅ 管理员用户创建成功！');
    console.log('📧 邮箱: admin@hilton.com');
    console.log('🔑 密码: admin123');
    
    await cluster.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    process.exit(1);
  }
}

createAdmin();

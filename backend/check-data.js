const couchbase = require('couchbase');

async function checkData() {
  try {
    console.log('🔍 检查数据库状态...');
    
    const cluster = await couchbase.connect('couchbase://couchbase', {
      username: 'Administrator',
      password: 'password',
      timeout: 10000
    });
    
    const bucket = cluster.bucket('hilton-reservations');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const defaultCollection = bucket.defaultCollection();
    
    // 查询所有用户
    const userQuery = `SELECT * FROM \`hilton-reservations\` WHERE type = \"user\"`;
    const userResult = await cluster.query(userQuery);
    
    console.log(`📊 当前用户数量: ${userResult.rows.length}`);
    
    for (const user of userResult.rows) {
      console.log(`👤 用户: ${user.email} (角色: ${user.role})`);
    }
    
    // 查询所有预订
    const reservationQuery = `SELECT * FROM \`hilton-reservations\` WHERE type = \"reservation\"`;
    const reservationResult = await cluster.query(reservationQuery);
    
    console.log(`📅 当前预订数量: ${reservationResult.rows.length}`);
    
    // 查询所有日志
    const logQuery = `SELECT * FROM \`hilton-reservations\` WHERE type = \"log\"`;
    const logResult = await cluster.query(logQuery);
    
    console.log(`📝 当前日志数量: ${logResult.rows.length}`);
    
    console.log('✅ 数据库检查完成');
    
    await cluster.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  }
}

checkData();

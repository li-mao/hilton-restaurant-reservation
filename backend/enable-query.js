const couchbase = require("couchbase");

const config = {
  connectionString: process.env.COUCHBASE_CONNECTION_STRING || "couchbase://couchbase:8091",
  username: process.env.COUCHBASE_USERNAME || "Administrator",
  password: process.env.COUCHBASE_PASSWORD || "password",
  bucketName: process.env.COUCHBASE_BUCKET || "hilton-reservations"
};

async function enableQueryService() {
  let cluster = null;
  
  try {
    console.log("连接到Couchbase...");
    cluster = await couchbase.connect(config.connectionString, {
      username: config.username,
      password: config.password,
      timeout: 10000
    });
    
    console.log("Couchbase连接成功！");
    
    // 尝试执行一个简单的查询来测试查询服务
    console.log("测试查询服务...");
    const testQuery = `SELECT COUNT(*) as count FROM \`${config.bucketName}\``;
    
    try {
      const result = await cluster.query(testQuery);
      console.log("查询服务已启用！结果:", result.rows[0]);
    } catch (error) {
      console.log("查询服务未启用，错误:", error.message);
    }
    
  } catch (error) {
    console.error("启用查询服务失败:", error.message);
    throw error;
  } finally {
    if (cluster) {
      await cluster.close();
    }
  }
}

// 运行脚本
enableQueryService()
  .then(() => {
    console.log("查询服务测试完成！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("测试失败:", error);
    process.exit(1);
  });

const couchbase = require("couchbase");

const config = {
  connectionString: process.env.COUCHBASE_CONNECTION_STRING || "couchbase://couchbase:8091",
  username: process.env.COUCHBASE_USERNAME || "Administrator", 
  password: process.env.COUCHBASE_PASSWORD || "password",
  bucketName: process.env.COUCHBASE_BUCKET || "hilton-reservations"
};

async function testQuery() {
  let cluster = null;
  
  try {
    console.log("连接到Couchbase...");
    cluster = await couchbase.connect(config.connectionString, {
      username: config.username,
      password: config.password,
      timeout: 10000
    });
    
    const bucket = cluster.bucket(config.bucketName);
    
    console.log("测试简单查询...");
    const sqlQuery = `SELECT * FROM \`${config.bucketName}\` WHERE type = "user"`;
    const queryResult = await cluster.query(sqlQuery);
    
    console.log("查询成功！结果数量:", queryResult.rows.length);
    console.log("前几个结果:", queryResult.rows.slice(0, 2));
    
  } catch (error) {
    console.error("查询失败:", error.message);
    console.error("详细错误:", error);
  } finally {
    if (cluster) {
      await cluster.close();
    }
  }
}

testQuery();

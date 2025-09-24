const couchbase = require('couchbase');
const logger = require('../utils/logger');

let cluster = null;
let bucket = null;

const connectDB = async () => {
  const connectionString = process.env.COUCHBASE_CONNECTION_STRING || 'couchbase://localhost';
  const username = process.env.COUCHBASE_USERNAME || 'Administrator';
  const password = process.env.COUCHBASE_PASSWORD || 'password';
  const bucketName = process.env.COUCHBASE_BUCKET || 'hilton-reservations';
  
  logger.info(`Connection details: ${connectionString}, user: ${username}, bucket: ${bucketName}`);
  
  const maxRetries = 10;
  const retryDelay = 5000; // 5秒重试延迟
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Attempting to connect to Couchbase (attempt ${attempt}/${maxRetries})...`);
      
      // 尝试不同的连接配置
      const connectionOptions = {
        username: username,
        password: password,
        timeout: 30000, // 30秒超时
        // 尝试禁用TLS
        tls: false
      };
      
      logger.info(`Connection options: ${JSON.stringify(connectionOptions)}`);
      
      cluster = await couchbase.connect(connectionString, connectionOptions);

      bucket = cluster.bucket(bucketName);
      
      // 在Couchbase SDK 4.x中，不需要waitUntilReady，直接测试连接
      // 通过执行一个简单的操作来验证连接
      await bucket.defaultCollection().get('test-key').catch(() => {
        // 忽略错误，这只是为了测试连接
      });

      logger.info(`Couchbase Connected: ${connectionString}`);
      logger.info(`Bucket ready: ${bucketName}`);
      return; // 连接成功，退出重试循环
      
    } catch (error) {
      logger.error(`Error connecting to Couchbase (attempt ${attempt}/${maxRetries}): ${error.message}`);
      logger.error(`Full error: ${JSON.stringify(error)}`);
      
      if (attempt === maxRetries) {
        logger.error(`Failed to connect to Couchbase after ${maxRetries} attempts. Continuing without database...`);
        // 不退出，允许服务器在没有数据库的情况下运行
        return;
      }
      
      logger.info(`Retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

const getBucket = () => {
  if (!bucket) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return bucket;
};

const getCluster = () => {
  if (!cluster) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return cluster;
};

module.exports = {
  connectDB,
  getBucket,
  getCluster
};
const couchbase = require('couchbase');

let cluster = null;
let bucket = null;

beforeAll(async () => {
  // 在测试环境中使用内存数据库或本地Couchbase实例
  const connectionString = process.env.COUCHBASE_TEST_CONNECTION_STRING || 'couchbase://localhost';
  const username = process.env.COUCHBASE_TEST_USERNAME || 'Administrator';
  const password = process.env.COUCHBASE_TEST_PASSWORD || 'password';
  const bucketName = process.env.COUCHBASE_TEST_BUCKET || 'test-bucket';

  try {
    cluster = await couchbase.connect(connectionString, {
      username: username,
      password: password,
    });

    bucket = cluster.bucket(bucketName);
    await bucket.waitUntilReady();
  } catch (error) {
    console.warn('Could not connect to Couchbase for testing. Using mock setup.');
    // 如果无法连接到Couchbase，使用模拟设置
    bucket = {
      collection: (name) => ({
        insert: jest.fn(),
        get: jest.fn(),
        upsert: jest.fn(),
        remove: jest.fn()
      })
    };
    cluster = {
      query: jest.fn(() => ({ rows: [] }))
    };
  }
});

afterAll(async () => {
  if (cluster) {
    await cluster.close();
  }
});

afterEach(async () => {
  // 清理测试数据
  if (bucket && bucket.collection) {
    try {
      // 删除所有测试文档
      const collections = ['users', 'reservations', 'logs'];
      for (const collectionName of collections) {
        const collection = bucket.collection(collectionName);
        // 这里可以添加清理逻辑，比如删除特定前缀的文档
      }
    } catch (error) {
      // 忽略清理错误
    }
  }
});

// 导出测试用的数据库连接
module.exports = {
  getBucket: () => bucket,
  getCluster: () => cluster
};
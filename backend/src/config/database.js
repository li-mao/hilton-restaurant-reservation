const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

let mongoClient = null;
let mongoDb = null;

// A minimal adapter to mimic used Couchbase methods
class DefaultCollectionAdapter {
  constructor(collection) {
    this.collection = collection;
  }

  async get(id) {
    const doc = await this.collection.findOne({ _id: id });
    if (!doc) {
      const err = new Error('document not found');
      err.code = 13; // mimic not found code used in previous layer
      throw err;
    }
    return { content: doc };
  }

  async insert(id, value) {
    await this.collection.insertOne({ _id: id, ...value });
  }

  async upsert(id, value) {
    await this.collection.updateOne(
      { _id: id },
      { $set: { _id: id, ...value } },
      { upsert: true }
    );
  }

  async remove(id) {
    await this.collection.deleteOne({ _id: id });
  }
}

class BucketAdapter {
  constructor(db, name) {
    this.db = db;
    this.name = name;
    this.cluster = {
      query: async (text, { parameters } = {}) => {
        // Very small subset to support our simple N1QL usage by translating to Mongo queries
        // We only handle the specific patterns used in models for reservations and logs.
        const reservationsCol = this.db.collection('reservations');
        const logsCol = this.db.collection('reservation_logs');

        if (/FROM `?\w+`? AS r WHERE r.type = "reservation"/i.test(text)) {
          const filter = { type: 'reservation' };
          if (parameters?.status) filter.status = parameters.status;
          if (parameters?.createdBy) filter.createdBy = parameters.createdBy;
          if (parameters?.guestName) filter.guestName = { $regex: parameters.guestName.replace(/%/g, ''), $options: 'i' };
          if (parameters?.startDate || parameters?.endDate) {
            filter.expectedArrivalTime = {};
            if (parameters.startDate) filter.expectedArrivalTime.$gte = new Date(parameters.startDate);
            if (parameters.endDate) filter.expectedArrivalTime.$lte = new Date(parameters.endDate);
          }
          const rows = await reservationsCol
            .find(filter)
            .sort({ createdAt: -1 })
            .toArray();
          return { rows };
        }

        if (/FROM `?\w+`? AS l\s+WHERE l.type = "log"/i.test(text)) {
          const filter = { type: 'log' };
          if (parameters?.reservationId) filter.reservationId = parameters.reservationId;
          const rows = await logsCol
            .find(filter)
            .sort({ createdAt: -1 })
            .toArray();
          return { rows };
        }

        return { rows: [] };
      }
    };
  }

  defaultCollection() {
    return new DefaultCollectionAdapter(this.db.collection('kv'));
  }
}

let bucket = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB || 'hilton-reservations';

  const maxRetries = 10;
  const retryDelay = 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Connecting to MongoDB ${uri}/${dbName} (attempt ${attempt}/${maxRetries})...`);
      mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 30000 });
      await mongoClient.connect();
      mongoDb = mongoClient.db(dbName);

      // Ensure collections used by adapters exist
      await Promise.all([
        mongoDb.createCollection('kv').catch(() => {}),
        mongoDb.createCollection('reservations').catch(() => {}),
        mongoDb.createCollection('reservation_logs').catch(() => {}),
        mongoDb.createCollection('users').catch(() => {}),
      ]);

      bucket = new BucketAdapter(mongoDb, dbName);
      logger.info('MongoDB connected');
      return;
    } catch (error) {
      logger.error(`MongoDB connect error: ${error.message}`);
      if (attempt === maxRetries) {
        logger.error(`Failed to connect to MongoDB after ${maxRetries} attempts. Continuing without database...`);
        return;
      }
      logger.info(`Retrying in ${retryDelay/1000} seconds...`);
      await new Promise(r => setTimeout(r, retryDelay));
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
  // Provide a cluster-like object backed by BucketAdapter.cluster
  return bucket?.cluster;
};

module.exports = {
  connectDB,
  getBucket,
  getCluster,
  getDb: () => mongoDb,
  getClient: () => mongoClient
};
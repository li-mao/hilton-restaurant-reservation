const { getBucket } = require('../config/database');
const logger = require('../utils/logger');

class ReservationChangeLog {
  constructor(data) {
    this.type = data.type || 'log';
    this.id = data.id;
    this.reservationId = data.reservationId;
    this.action = data.action;
    this.changedBy = data.changedBy;
    this.snapshot = data.snapshot;
    this.createdAt = data.createdAt || new Date();
  }

  // 验证变更日志数据
  static validate(data) {
    const errors = [];

    if (!data.reservationId) {
      errors.push('Reservation ID is required');
    }

    if (!data.action) {
      errors.push('Action is required');
    } else if (!['create', 'update', 'cancel', 'approve', 'complete'].includes(data.action)) {
      errors.push('Action must be create, update, cancel, approve, or complete');
    }

    if (!data.changedBy) {
      errors.push('Changed by user ID is required');
    }

    if (!data.snapshot) {
      errors.push('Snapshot is required');
    }

    return errors;
  }

  // 创建变更日志
  static async create(logData) {
    const errors = this.validate(logData);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const bucket = getBucket();
    const logId = `log::${Date.now()}::${Math.random().toString(36).substr(2, 9)}`;
    
    const log = new ReservationChangeLog({
      id: logId,
      type: 'log',
      reservationId: logData.reservationId,
      action: logData.action,
      changedBy: logData.changedBy,
      snapshot: logData.snapshot,
      createdAt: new Date()
    });

    const defaultCollection = bucket.defaultCollection();
    await defaultCollection.insert(logId, log);
    logger.info(`[ChangeLog] created log ${logId} for reservation ${logData.reservationId} with action ${logData.action}`);

    // 维护每个预订的日志索引，便于在查询服务不可用时降级查询
    const indexKey = `reservation_logs::${logData.reservationId}`;
    try {
      const indexResult = await defaultCollection.get(indexKey);
      const existingIndex = indexResult.content;
      existingIndex.logIds = existingIndex.logIds || [];
      existingIndex.logIds.push(logId);
      existingIndex.updatedAt = new Date();
      await defaultCollection.upsert(indexKey, existingIndex);
      logger.info(`[ChangeLog] updated index ${indexKey}, total logs: ${existingIndex.logIds.length}`);
    } catch (indexError) {
      // 索引不存在则创建（兼容不同SDK错误表现）
      if (indexError.code === 13 || /document not found|key not found/i.test(String(indexError.message))) {
        const newIndex = {
          reservationId: logData.reservationId,
          logIds: [logId],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await defaultCollection.insert(indexKey, newIndex);
        logger.info(`[ChangeLog] created index ${indexKey} with first log ${logId}`);
      } else {
        throw indexError;
      }
    }

    return log;
  }

  // 根据ID查找变更日志
  static async findById(id) {
    try {
      const bucket = getBucket();
      const result = await bucket.defaultCollection().get(id);
      return new ReservationChangeLog(result.content);
    } catch (error) {
      if (error.code === 13) { // 文档不存在
        return null;
      }
      throw error;
    }
  }

  // 根据预订ID查找所有变更日志
  static async findByReservationId(reservationId) {
    const bucket = getBucket();
    const cluster = bucket.cluster;
    const bucketName = bucket.name;
    
    const query = `
      SELECT l.* FROM \`${bucketName}\` AS l
      WHERE l.type = "log" AND l.reservationId = $reservationId
      ORDER BY l.createdAt DESC
    `;

    try {
      const result = await cluster.query(query, {
        parameters: { reservationId }
      });
      logger.info(`[ChangeLog] query logs via N1QL for reservation ${reservationId}: ${result.rows.length} rows`);
      const rows = result.rows.map(row => new ReservationChangeLog(row));
      if (rows.length > 0) return rows;
      // N1QL返回0行时，尝试KV索引降级
      logger.info(`[ChangeLog] N1QL returned 0 rows for ${reservationId}, trying KV index fallback`);
    } catch (error) {
      // 查询服务不可用或索引未就绪时，使用键值降级方案
      logger.warn(`[ChangeLog] N1QL failed for reservation ${reservationId}, fallback to KV. Error: ${error.message}`);
    }

    const defaultCollection = bucket.defaultCollection();
    try {
      const indexKey = `reservation_logs::${reservationId}`;
      const indexResult = await defaultCollection.get(indexKey);
      const logIds = indexResult.content.logIds || [];

      const logs = [];
      for (const logId of logIds) {
        try {
          const logDoc = await defaultCollection.get(logId);
          logs.push(new ReservationChangeLog(logDoc.content));
        } catch (e) {
          // 单条缺失则跳过
          logger.warn(`[ChangeLog] missing log document ${logId} referenced by ${indexKey}`);
        }
      }

      // 按创建时间倒序
      logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      logger.info(`[ChangeLog] return ${logs.length} logs via KV for reservation ${reservationId}`);
      return logs;
    } catch (fallbackError) {
      // 两种方式都失败则返回空数组
      logger.warn(`[ChangeLog] KV index fallback failed for ${reservationId}: ${fallbackError.message}`);
      return [];
    }
  }

  // 填充变更者信息
  async populateChangedBy() {
    if (this.changedBy && typeof this.changedBy === 'string') {
      const User = require('./User');
      const user = await User.findById(this.changedBy);
      if (user) {
        this.changedBy = user.toJSON();
      }
    }
    return this;
  }

  // 删除变更日志
  async delete() {
    const bucket = getBucket();
    await bucket.defaultCollection().remove(this.id);
  }
}

module.exports = ReservationChangeLog;
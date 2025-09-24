const { getDb } = require('../config/database');
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

    const db = getDb();
    const logsCol = db.collection('reservation_logs');
    const globals = db.collection('kv');
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

    await logsCol.insertOne({ _id: logId, ...log });
    logger.info(`[ChangeLog] created log ${logId} for reservation ${logData.reservationId} with action ${logData.action}`);

    // 维护每个预订的日志索引，便于在查询服务不可用时降级查询
    const indexKey = `reservation_logs::${logData.reservationId}`;
    const existing = await globals.findOne({ _id: indexKey });
    if (existing) {
      await globals.updateOne(
        { _id: indexKey },
        { $set: { updatedAt: new Date() }, $addToSet: { logIds: logId } }
      );
    } else {
      await globals.insertOne({
        _id: indexKey,
        reservationId: logData.reservationId,
        logIds: [logId],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return log;
  }

  // 根据ID查找变更日志
  static async findById(id) {
    const db = getDb();
    const logsCol = db.collection('reservation_logs');
    const doc = await logsCol.findOne({ _id: id });
    return doc ? new ReservationChangeLog(doc) : null;
  }

  // 根据预订ID查找所有变更日志
  static async findByReservationId(reservationId) {
    const db = getDb();
    const logsCol = db.collection('reservation_logs');
    const docs = await logsCol
      .find({ reservationId })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(d => new ReservationChangeLog(d));
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
    const db = getDb();
    const logsCol = db.collection('reservation_logs');
    await logsCol.deleteOne({ _id: this.id });
  }
}

module.exports = ReservationChangeLog;
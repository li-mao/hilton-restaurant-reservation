const { getDb } = require('../config/database');

class Reservation {
  constructor(data) {
    this.type = data.type || 'reservation';
    this.id = data.id;
    this.guestName = data.guestName;
    this.guestContactInfo = data.guestContactInfo;
    this.expectedArrivalTime = data.expectedArrivalTime;
    this.tableSize = data.tableSize;
    this.status = data.status || 'requested';
    this.specialRequests = data.specialRequests;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // 验证预订数据
  static validate(data) {
    const errors = [];

    if (!data.guestName || data.guestName.trim().length === 0) {
      errors.push('Please provide guest name');
    } else if (data.guestName.length > 50) {
      errors.push('Guest name cannot be more than 50 characters');
    }

    if (!data.guestContactInfo) {
      errors.push('Please provide guest contact info');
    } else {
      if (!data.guestContactInfo.phone) {
        errors.push('Please provide phone number');
      } else if (!/^\+?[\d\s-()]+$/.test(data.guestContactInfo.phone)) {
        errors.push('Please provide a valid phone number');
      }

      if (!data.guestContactInfo.email) {
        errors.push('Please provide email address');
      } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.guestContactInfo.email)) {
        errors.push('Please provide a valid email');
      }
    }

    if (!data.expectedArrivalTime) {
      errors.push('Please provide expected arrival time');
    }

    if (!data.tableSize) {
      errors.push('Please provide table size');
    } else if (data.tableSize < 1 || data.tableSize > 20) {
      errors.push('Table size must be between 1 and 20');
    }

    if (data.specialRequests && data.specialRequests.length > 500) {
      errors.push('Special requests cannot be more than 500 characters');
    }

    if (data.status && !['requested', 'approved', 'cancelled', 'completed'].includes(data.status)) {
      errors.push('Status must be requested, approved, cancelled, or completed');
    }

    return errors;
  }

  // 创建预订
  static async create(reservationData) {
    const errors = this.validate(reservationData);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const db = getDb();
    const reservations = db.collection('reservations');
    const globals = db.collection('kv');
    const reservationId = `reservation::${Date.now()}::${Math.random().toString(36).substr(2, 9)}`;
    
    const reservation = new Reservation({
      id: reservationId,
      type: 'reservation',
      guestName: reservationData.guestName.trim(),
      guestContactInfo: {
        phone: reservationData.guestContactInfo.phone,
        email: reservationData.guestContactInfo.email.toLowerCase()
      },
      expectedArrivalTime: new Date(reservationData.expectedArrivalTime),
      tableSize: reservationData.tableSize,
      status: reservationData.status || 'requested',
      specialRequests: reservationData.specialRequests,
      createdBy: reservationData.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 保存预订文档
    await reservations.insertOne({ _id: reservationId, ...reservation });
    
    // 更新用户预订索引
    if (reservationData.createdBy) {
      const reservationIndexKey = `user_reservations::${reservationData.createdBy}`;
      const existingIndex = await globals.findOne({ _id: reservationIndexKey });
      if (existingIndex) {
        await globals.updateOne(
          { _id: reservationIndexKey },
          { $set: { updatedAt: new Date() }, $addToSet: { reservationIds: reservationId } }
        );
      } else {
        await globals.insertOne({
          _id: reservationIndexKey,
          userId: reservationData.createdBy,
          reservationIds: [reservationId],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    // 更新全局预订索引
    const globalReservationIndexKey = 'global_reservations_index';
    const globalExisting = await globals.findOne({ _id: globalReservationIndexKey });
    if (globalExisting) {
      await globals.updateOne(
        { _id: globalReservationIndexKey },
        { $set: { updatedAt: new Date() }, $addToSet: { reservationIds: reservationId } }
      );
    } else {
      await globals.insertOne({
        _id: globalReservationIndexKey,
        reservationIds: [reservationId],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return reservation;
  }

  // 根据ID查找预订
  static async findById(id) {
    const db = getDb();
    const reservations = db.collection('reservations');
    const doc = await reservations.findOne({ _id: id });
    return doc ? new Reservation(doc) : null;
  }

  // 查找所有预订（支持过滤）
  static async find(filter = {}) {
    const db = getDb();
    const reservationsCol = db.collection('reservations');
    const mongoFilter = {};
    if (filter.status) mongoFilter.status = filter.status;
    if (filter.guestName) mongoFilter.guestName = { $regex: filter.guestName, $options: 'i' };
    if (filter.startDate || filter.endDate) {
      mongoFilter.expectedArrivalTime = {};
      if (filter.startDate) mongoFilter.expectedArrivalTime.$gte = new Date(filter.startDate);
      if (filter.endDate) mongoFilter.expectedArrivalTime.$lte = new Date(filter.endDate);
    }
    const docs = await reservationsCol.find(mongoFilter).sort({ createdAt: -1 }).toArray();
    return docs.map(d => new Reservation(d));
  }

  // 根据创建者查找预订
  static async findByCreatedBy(createdBy) {
    const db = getDb();
    const reservationsCol = db.collection('reservations');
    const docs = await reservationsCol
      .find({ createdBy })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(d => new Reservation(d));
  }

  // 更新预订
  async save() {
    const db = getDb();
    const reservations = db.collection('reservations');
    this.updatedAt = new Date();
    await reservations.updateOne(
      { _id: this.id },
      { $set: { ...this } },
      { upsert: true }
    );
    return this;
  }

  // 删除预订
  async delete() {
    const db = getDb();
    const reservations = db.collection('reservations');
    await reservations.deleteOne({ _id: this.id });
  }

  // 填充创建者信息
  async populateCreatedBy() {
    if (this.createdBy && typeof this.createdBy === 'string') {
      const User = require('./User');
      const user = await User.findById(this.createdBy);
      if (user) {
        this.createdBy = user.toJSON();
      }
    }
    return this;
  }
}

module.exports = Reservation;
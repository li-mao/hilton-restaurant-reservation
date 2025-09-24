const { getBucket } = require('../config/database');

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

    const bucket = getBucket();
    const defaultCollection = bucket.defaultCollection();
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
    await defaultCollection.insert(reservationId, reservation);
    
    // 更新用户预订索引
    if (reservationData.createdBy) {
      const reservationIndexKey = `user_reservations::${reservationData.createdBy}`;
      
      try {
        // 尝试获取现有索引
        const indexResult = await defaultCollection.get(reservationIndexKey);
        const existingIndex = indexResult.content;
        existingIndex.reservationIds = existingIndex.reservationIds || [];
        existingIndex.reservationIds.push(reservationId);
        existingIndex.updatedAt = new Date();
        
        // 更新索引
        await defaultCollection.upsert(reservationIndexKey, existingIndex);
        console.log(`更新用户 ${reservationData.createdBy} 的预订索引，添加预订 ${reservationId}`);
      } catch (indexError) {
        // 索引不存在，创建新索引
        const newIndex = {
          userId: reservationData.createdBy,
          reservationIds: [reservationId],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await defaultCollection.insert(reservationIndexKey, newIndex);
        console.log(`创建用户 ${reservationData.createdBy} 的预订索引，包含预订 ${reservationId}`);
      }
    }
    
    // 更新全局预订索引
    const globalReservationIndexKey = 'global_reservations_index';
    try {
      // 尝试获取现有全局索引
      const globalIndexResult = await defaultCollection.get(globalReservationIndexKey);
      const existingGlobalIndex = globalIndexResult.content;
      existingGlobalIndex.reservationIds = existingGlobalIndex.reservationIds || [];
      existingGlobalIndex.reservationIds.push(reservationId);
      existingGlobalIndex.updatedAt = new Date();
      
      // 更新全局索引
      await defaultCollection.upsert(globalReservationIndexKey, existingGlobalIndex);
      console.log(`更新全局预订索引，添加预订 ${reservationId}`);
    } catch (globalIndexError) {
      // 全局索引不存在，创建新索引
      const newGlobalIndex = {
        reservationIds: [reservationId],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await defaultCollection.insert(globalReservationIndexKey, newGlobalIndex);
      console.log(`创建全局预订索引，包含预订 ${reservationId}`);
    }
    
    return reservation;
  }

  // 根据ID查找预订
  static async findById(id) {
    try {
      const bucket = getBucket();
      const result = await bucket.defaultCollection().get(id);
      return new Reservation(result.content);
    } catch (error) {
      // Couchbase SDK v3: key not found may surface as code 13 or message text
      if (error.code === 13 || /document not found|key not found/i.test(String(error.message))) { // 文档不存在
        return null;
      }
      throw error;
    }
  }

  // 查找所有预订（支持过滤）
  static async find(filter = {}) {
    try {
      const { getCluster } = require('../config/database');
      const bucket = getBucket();
      const cluster = getCluster();
      const bucketName = bucket.name;
      
      let query = `SELECT r.* FROM \`${bucketName}\` AS r WHERE r.type = "reservation"`;
      const parameters = {};

      if (filter.status) {
        query += ' AND r.status = $status';
        parameters.status = filter.status;
      }

      if (filter.guestName) {
        query += ' AND LOWER(r.guestName) LIKE $guestName';
        parameters.guestName = `%${filter.guestName.toLowerCase()}%`;
      }

      if (filter.startDate || filter.endDate) {
        if (filter.startDate) {
          query += ' AND r.expectedArrivalTime >= $startDate';
          parameters.startDate = new Date(filter.startDate);
        }
        if (filter.endDate) {
          query += ' AND r.expectedArrivalTime <= $endDate';
          parameters.endDate = new Date(filter.endDate);
        }
      }

      // 按创建时间倒序排列
      query += ' ORDER BY r.createdAt DESC';

      const result = await cluster.query(query, { parameters });
      return result.rows.map(row => new Reservation(row));
    } catch (error) {
      console.log('N1QL查询失败，使用键值查询替代方案:', error.message);
      
      // 使用键值查询的替代方案
      const bucket = getBucket();
      const defaultCollection = bucket.defaultCollection();
      
      try {
        // 创建一个全局预订索引来跟踪所有预订
        const globalReservationIndexKey = 'global_reservations_index';
        
        try {
          const indexResult = await defaultCollection.get(globalReservationIndexKey);
          const reservationIds = indexResult.content.reservationIds || [];
          
          console.log(`找到全局预订索引，包含 ${reservationIds.length} 个预订`);
          
          const reservations = [];
          for (const reservationId of reservationIds) {
            try {
              const reservationResult = await defaultCollection.get(reservationId);
              const reservation = new Reservation(reservationResult.content);
              
              // 应用过滤器
              let includeReservation = true;
              
              if (filter.status && reservation.status !== filter.status) {
                includeReservation = false;
              }
              
              if (filter.guestName && !reservation.guestName.toLowerCase().includes(filter.guestName.toLowerCase())) {
                includeReservation = false;
              }
              
              if (filter.startDate && new Date(reservation.expectedArrivalTime) < new Date(filter.startDate)) {
                includeReservation = false;
              }
              
              if (filter.endDate && new Date(reservation.expectedArrivalTime) > new Date(filter.endDate)) {
                includeReservation = false;
              }
              
              if (includeReservation) {
                reservations.push(reservation);
              }
            } catch (reservationError) {
              console.log(`预订 ${reservationId} 不存在，跳过`);
            }
          }
          
          // 按创建时间倒序排序（与N1QL路径保持一致）
          reservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          console.log(`返回 ${reservations.length} 个预订`);
          return reservations;
        } catch (indexError) {
          console.log('全局预订索引不存在，返回空列表');
          return [];
        }
      } catch (fallbackError) {
        console.log('键值查询替代方案失败:', fallbackError.message);
        return [];
      }
    }
  }

  // 根据创建者查找预订
  static async findByCreatedBy(createdBy) {
    try {
      const { getCluster } = require('../config/database');
      const bucket = getBucket();
      const cluster = getCluster();
      const bucketName = bucket.name;
      
      const query = `
        SELECT r.* FROM \`${bucketName}\` AS r
        WHERE r.type = "reservation" AND r.createdBy = $createdBy 
        ORDER BY r.createdAt DESC
      `;

      const result = await cluster.query(query, { 
        parameters: { createdBy } 
      });
      const reservations = result.rows.map(row => new Reservation(row));
      // 再次按创建时间倒序确保一致
      reservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return reservations;
    } catch (error) {
      console.log('N1QL查询失败，使用键值查询替代方案:', error.message);
      
      // 使用键值查询的替代方案
      const bucket = getBucket();
      const defaultCollection = bucket.defaultCollection();
      
      try {
        // 创建一个预订索引来跟踪用户的预订
        const reservationIndexKey = `user_reservations::${createdBy}`;
        
        try {
          const indexResult = await defaultCollection.get(reservationIndexKey);
          const reservationIds = indexResult.content.reservationIds || [];
          
          console.log(`找到用户 ${createdBy} 的预订索引，包含 ${reservationIds.length} 个预订`);
          
          const reservations = [];
          for (const reservationId of reservationIds) {
            try {
              const reservationResult = await defaultCollection.get(reservationId);
              const reservation = new Reservation(reservationResult.content);
              reservations.push(reservation);
            } catch (reservationError) {
              console.log(`预订 ${reservationId} 不存在，跳过`);
            }
          }
          
          // 按创建时间排序
          reservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          console.log(`返回 ${reservations.length} 个预订`);
          return reservations;
        } catch (indexError) {
          console.log(`用户 ${createdBy} 的预订索引不存在`);
          return [];
        }
      } catch (fallbackError) {
        console.log('键值查询替代方案失败:', fallbackError.message);
        return [];
      }
    }
  }

  // 更新预订
  async save() {
    const bucket = getBucket();
    this.updatedAt = new Date();
    await bucket.defaultCollection().upsert(this.id, this);
    return this;
  }

  // 删除预订
  async delete() {
    const bucket = getBucket();
    await bucket.defaultCollection().remove(this.id);
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
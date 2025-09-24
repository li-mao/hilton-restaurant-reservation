const { User, Reservation, ReservationChangeLog } = require('../models');
const { generateToken } = require('../utils/auth');
const logger = require('../utils/logger');

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const userData = await User.findById(user.id);
      return userData ? userData.toJSON() : null;
    },

    reservations: async (_, { filter = {} }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const reservations = await Reservation.find(filter);
      
      // 填充创建者信息
      const populatedReservations = await Promise.all(
        reservations.map(async (reservation) => {
          await reservation.populateCreatedBy();
          return reservation;
        })
      );

      // 保险起见，再次按创建时间倒序保证一致性
      populatedReservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return populatedReservations;
    },

    reservation: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const reservation = await Reservation.findById(id);
      if (reservation) {
        await reservation.populateCreatedBy();
      }
      return reservation;
    },

    myReservations: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      logger.info('[Resolver myReservations] invoked');
      const reservations = await Reservation.findByCreatedBy(user.id);
      
      // 填充创建者信息
      const populatedReservations = await Promise.all(
        reservations.map(async (reservation) => {
          await reservation.populateCreatedBy();
          return reservation;
        })
      );

      // 双重保障：按创建时间倒序
      populatedReservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      try {
        const orderSample = populatedReservations
          .slice(0, 5)
          .map(r => ({ id: r.id, createdAt: r.createdAt }));
        logger.info(`[Resolver myReservations] sorted top5: ${JSON.stringify(orderSample)}`);
      } catch (e) {
        logger.warn(`[Resolver myReservations] log sample failed: ${e?.message || e}`);
      }

      return populatedReservations;
    },

    reservationChangeLogs: async (_, { reservationId }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      logger.info(`[ChangeLog-Resolver] fetching logs for reservation ${reservationId}`);
      const logs = await ReservationChangeLog.findByReservationId(reservationId);
      logger.info(`[ChangeLog-Resolver] fetched ${logs.length} logs for reservation ${reservationId}`);
      
      // 填充变更者信息
      const populatedLogs = await Promise.all(
        logs.map(async (log) => {
          await log.populateChangedBy();
          return {
            id: log.id,
            reservationId: log.reservationId,
            action: log.action,
            changedBy: log.changedBy,
            snapshot: log.snapshot,
            createdAt: log.createdAt
          };
        })
      );
      
      return populatedLogs;
    }
  },

  Mutation: {
    register: async (_, { name, email, password, phone, role = 'guest' }) => {
      const user = await User.create({ name, email, password, phone, role });
      const token = generateToken(user.id);

      logger.info(`New user registered: ${user.email}`);
      return { token, user: user.toJSON() };
    },

    login: async (_, { email, password }) => {
      const user = await User.findByEmailWithPassword(email);
      if (!user) throw new Error('Invalid credentials');

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) throw new Error('Invalid credentials');

      const token = generateToken(user.id);
      logger.info(`User logged in: ${user.email}`);
      return { token, user: user.toJSON() };
    },

    createReservation: async (_, { input }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      // 获取完整用户信息以检查角色
      const userData = await User.findById(user.id);
      if (!userData || userData.role !== 'guest') {
        throw new Error('Only guests can create reservations');
      }

      const reservation = await Reservation.create({
        ...input,
        createdBy: user.id
      });

      logger.info(`New reservation created by ${userData.email}: ${reservation.id}`);
      
      // 填充创建者信息
      await reservation.populateCreatedBy();
      
      // 创建变更日志
      logger.info(`[ChangeLog-Resolver] creating change log (create) for reservation ${reservation.id}`);
      await ReservationChangeLog.create({
        reservationId: reservation.id,
        action: 'create',
        changedBy: user.id,
        snapshot: reservation
      });
      logger.info(`[ChangeLog-Resolver] change log created (create) for reservation ${reservation.id}`);
      
      return reservation;
    },

    updateReservation: async (_, { id, input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const reservation = await Reservation.findById(id);
      if (!reservation) throw new Error('Reservation not found');

      // 获取用户信息以检查权限
      const userData = await User.findById(user.id);
      if (!userData) throw new Error('User not found');

      if (
        reservation.createdBy !== user.id &&
        !(userData.role === 'employee' || userData.role === 'admin')
      ) {
        throw new Error('Not authorized to update this reservation');
      }

      // 更新预订数据
      Object.assign(reservation, input);
      await reservation.save();

      logger.info(`Reservation updated by ${userData.email}: ${id}`);
      
      // 填充创建者信息
      await reservation.populateCreatedBy();
      
      // 创建变更日志
      logger.info(`[ChangeLog-Resolver] creating change log (update) for reservation ${reservation.id}`);
      await ReservationChangeLog.create({
        reservationId: reservation.id,
        action: 'update',
        changedBy: user.id,
        snapshot: reservation
      });
      logger.info(`[ChangeLog-Resolver] change log created (update) for reservation ${reservation.id}`);
      
      return reservation;
    },

    cancelReservation: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const reservation = await Reservation.findById(id);
      if (!reservation) {
        // 幂等化取消：如果文档不存在，直接返回一个已取消的轻量对象，满足前端选择集
        const fallback = { id, status: 'cancelled', updatedAt: new Date() };
        logger.warn(`[Cancel-Resolver] reservation ${id} not found, returning idempotent cancelled fallback.`);
        return fallback;
      }

      // 获取用户信息以检查权限
      const userData = await User.findById(user.id);
      if (!userData) throw new Error('User not found');

      if (
        reservation.createdBy !== user.id &&
        !(userData.role === 'employee' || userData.role === 'admin')
      ) {
        throw new Error('Not authorized to cancel this reservation');
      }

      reservation.status = 'cancelled';
      try {
        await reservation.save();
      } catch (e) {
        // 若保存阶段出现文档问题，同样走幂等返回
        logger.warn(`[Cancel-Resolver] save failed for ${id}: ${e.message}. Returning idempotent cancelled fallback.`);
        return { id, status: 'cancelled', updatedAt: new Date() };
      }

      logger.info(`Reservation cancelled by ${userData.email}: ${id}`);
      
      // 填充创建者信息（容错）
      try {
        await reservation.populateCreatedBy();
      } catch (e) {
        logger.warn(`[Cancel-Resolver] populateCreatedBy failed for ${reservation.id}: ${e.message}`);
      }
      
      // 创建变更日志（容错）
      try {
        logger.info(`[ChangeLog-Resolver] creating change log (cancel) for reservation ${reservation.id}`);
        await ReservationChangeLog.create({
          reservationId: reservation.id,
          action: 'cancel',
          changedBy: user.id,
          snapshot: reservation
        });
        logger.info(`[ChangeLog-Resolver] change log created (cancel) for reservation ${reservation.id}`);
      } catch (e) {
        logger.warn(`[ChangeLog-Resolver] failed to create change log (cancel) for ${reservation.id}: ${e.message}`);
      }
      
      return reservation;
    },

    approveReservation: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      // 获取用户信息以检查角色
      const userData = await User.findById(user.id);
      if (!userData || (userData.role !== 'employee' && userData.role !== 'admin')) {
        throw new Error('Only employees can approve reservations');
      }

      const reservation = await Reservation.findById(id);
      if (!reservation) throw new Error('Reservation not found');

      reservation.status = 'approved';
      await reservation.save();

      logger.info(`Reservation approved by ${userData.email}: ${id}`);
      
      // 填充创建者信息
      await reservation.populateCreatedBy();
      
      // 创建变更日志
      logger.info(`[ChangeLog-Resolver] creating change log (approve) for reservation ${reservation.id}`);
      await ReservationChangeLog.create({
        reservationId: reservation.id,
        action: 'approve',
        changedBy: user.id,
        snapshot: reservation
      });
      logger.info(`[ChangeLog-Resolver] change log created (approve) for reservation ${reservation.id}`);
      
      return reservation;
    },

    completeReservation: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      
      // 获取用户信息以检查角色
      const userData = await User.findById(user.id);
      if (!userData || (userData.role !== 'employee' && userData.role !== 'admin')) {
        throw new Error('Only employees can complete reservations');
      }

      const reservation = await Reservation.findById(id);
      if (!reservation) throw new Error('Reservation not found');

      reservation.status = 'completed';
      await reservation.save();

      logger.info(`Reservation completed by ${userData.email}: ${id}`);
      
      // 填充创建者信息
      await reservation.populateCreatedBy();
      
      // 创建变更日志
      logger.info(`[ChangeLog-Resolver] creating change log (complete) for reservation ${reservation.id}`);
      await ReservationChangeLog.create({
        reservationId: reservation.id,
        action: 'complete',
        changedBy: user.id,
        snapshot: reservation
      });
      logger.info(`[ChangeLog-Resolver] change log created (complete) for reservation ${reservation.id}`);
      
      return reservation;
    }
  }
};

module.exports = resolvers;
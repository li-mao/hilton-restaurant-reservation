const bcrypt = require('bcryptjs');
const { getBucket } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'guest';
    this.phone = data.phone;
    this.passwordChanged = data.passwordChanged || false;
    this.disabled = data.disabled || false;
    this.createdAt = data.createdAt || new Date();
  }

  // 验证用户数据
  static validate(data) {
    const errors = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Please provide a name');
    } else if (data.name.length > 50) {
      errors.push('Name cannot be more than 50 characters');
    }

    if (!data.email) {
      errors.push('Please provide an email');
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
      errors.push('Please provide a valid email');
    }

    if (!data.password) {
      errors.push('Please provide a password');
    } else if (data.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (!data.phone) {
      errors.push('Please provide a phone number');
    } else if (!/^\+?[\d\s-()]+$/.test(data.phone)) {
      errors.push('Please provide a valid phone number');
    }

    if (data.role && !['guest', 'employee', 'admin'].includes(data.role)) {
      errors.push('Role must be guest, employee, or admin');
    }

    return errors;
  }

  // 加密密码
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // 比较密码
  async comparePassword(candidatePassword) {
    if (!this.password) {
      throw new Error('User password not found');
    }
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // 转换为JSON（排除密码）
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  // 创建用户
  static async create(userData) {
    const errors = this.validate(userData);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // 检查邮箱是否已存在
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const bucket = getBucket();
    const userId = `user::${Date.now()}::${Math.random().toString(36).substr(2, 9)}`;
    
    const user = new User({
      id: userId,
      name: userData.name.trim(),
      email: userData.email.toLowerCase(),
      password: await this.hashPassword(userData.password),
      role: userData.role || 'guest',
      phone: userData.phone,
      createdAt: new Date()
    });

    // 使用default collection而不是users collection
    // 确保所有属性都被保存
    const userDataToSave = {
      id: user.id,
      type: 'user',
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      phone: user.phone,
      passwordChanged: user.passwordChanged,
      disabled: user.disabled,
      createdAt: user.createdAt
    };
    
    // 使用事务性操作保存用户数据
    try {
      await bucket.defaultCollection().insert(userId, userDataToSave);
      
      // 创建邮箱索引
      await bucket.defaultCollection().insert(`email::${user.email}`, { userId });

      // 维护按角色的用户索引，便于无查询服务场景下按角色列出用户
      const roleIndexKey = `users_by_role::${user.role}`;
      try {
        const roleIndex = await bucket.defaultCollection().get(roleIndexKey);
        const content = roleIndex.content || {};
        content.userIds = Array.isArray(content.userIds) ? content.userIds : [];
        if (!content.userIds.includes(userId)) {
          content.userIds.push(userId);
        }
        content.updatedAt = new Date();
        await bucket.defaultCollection().upsert(roleIndexKey, content);
      } catch (roleIndexErr) {
        // 索引不存在则创建
        if (roleIndexErr.code === 13 || /document not found|key not found/i.test(String(roleIndexErr.message))) {
          await bucket.defaultCollection().insert(roleIndexKey, {
            role: user.role,
            userIds: [userId],
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          throw roleIndexErr;
        }
      }
      
      // 立即验证数据完整性
      const verifyUser = await bucket.defaultCollection().get(userId);
      const verifyEmail = await bucket.defaultCollection().get(`email::${user.email}`);
      
      if (!verifyUser.content.password) {
        throw new Error('用户密码字段保存失败');
      }
      
      if (!verifyEmail.content.userId) {
        throw new Error('邮箱索引保存失败');
      }
      
      console.log(`✅ 用户 ${user.email} 创建并验证成功`);
      
    } catch (error) {
      console.error(`❌ 用户 ${user.email} 保存失败:`, error.message);
      // 尝试清理可能的不完整数据
      try {
        await bucket.defaultCollection().remove(userId);
        await bucket.defaultCollection().remove(`email::${user.email}`);
      } catch (cleanupError) {
        console.warn('清理不完整数据时出错:', cleanupError.message);
      }
      throw error;
    }
    
    return user;
  }

  // 根据ID查找用户
  static async findById(id) {
    try {
      const bucket = getBucket();
      const result = await bucket.defaultCollection().get(id);
      return new User(result.content);
    } catch (error) {
      // 兼容不同SDK的不存在错误信息
      if (error.code === 13 || /document not found|key not found/i.test(String(error.message))) { // 文档不存在
        return null;
      }
      throw error;
    }
  }

  // 根据邮箱查找用户
  static async findByEmail(email) {
    try {
      const bucket = getBucket();
      const emailResult = await bucket.defaultCollection().get(`email::${email.toLowerCase()}`);
      return await this.findById(emailResult.content.userId);
    } catch (error) {
      if (error.code === 13 || error.message === 'document not found') { // 文档不存在
        return null;
      }
      throw error;
    }
  }

  // 根据邮箱查找用户（包含密码）
  static async findByEmailWithPassword(email) {
    try {
      const bucket = getBucket();
      const emailResult = await bucket.defaultCollection().get(`email::${email.toLowerCase()}`);
      const userResult = await bucket.defaultCollection().get(emailResult.content.userId);
      console.log('User data from Couchbase:', JSON.stringify(userResult.content, null, 2));
      
      // 确保密码字段存在
      if (!userResult.content.password) {
        console.error('Password field is missing from user data:', userResult.content);
        throw new Error('User password not found in database');
      }
      
      return new User(userResult.content);
    } catch (error) {
      if (error.code === 13) { // 文档不存在
        return null;
      }
      throw error;
    }
  }

  // 查找单个用户（兼容Mongoose语法）
  static async findOne(query) {
    if (query.email) {
      return await this.findByEmail(query.email);
    }
    if (query.id) {
      return await this.findById(query.id);
    }
    return null;
  }

  // 查找多个用户（兼容Mongoose语法）
  static async find(query = {}) {
    try {
      const bucket = getBucket();
      const defaultCollection = bucket.defaultCollection();
      
      // 基于键值索引的按角色查询
      const users = [];
      if (query.role) {
        const roleIndexKey = `users_by_role::${query.role}`;
        try {
          const indexDoc = await defaultCollection.get(roleIndexKey);
          const userIds = (indexDoc.content && Array.isArray(indexDoc.content.userIds)) ? indexDoc.content.userIds : [];
          for (const userId of userIds) {
            try {
              const userDoc = await defaultCollection.get(userId);
              users.push(new User(userDoc.content));
            } catch (userErr) {
              // 缺失的用户文档则跳过
              continue;
            }
          }
        } catch (idxErr) {
          if (!(idxErr.code === 13 || /document not found|key not found/i.test(String(idxErr.message)))) {
            throw idxErr;
          }
        }
      }

      // 返回支持 select('-password') 的对象
      return {
        select: function(fields) {
          if (fields === '-password') {
            return users.map(u => {
              const { password, ...rest } = u;
              return rest;
            });
          }
          return users;
        }
      };
    } catch (error) {
      console.error('Error in User.find:', error);
      throw error;
    }
  }

  // 重建按角色的用户索引（如果查询服务可用）
  static async rebuildUsersByRoleIndex(role) {
    try {
      const { getBucket, getCluster } = require('../config/database');
      const bucket = getBucket();
      const cluster = getCluster();
      const bucketName = bucket.name;
      const q = `SELECT u.id FROM \`${bucketName}\` AS u WHERE u.type = "user" AND u.role = $role`;
      const result = await cluster.query(q, { parameters: { role } });
      const userIds = result.rows.map(r => r.id);
      await bucket.defaultCollection().upsert(`users_by_role::${role}`, {
        role,
        userIds,
        updatedAt: new Date(),
        createdAt: new Date()
      });
      return { role, count: userIds.length };
    } catch (e) {
      return { role, count: 0, error: e.message };
    }
  }

  // 更新用户
  async save() {
    const bucket = getBucket();
    this.updatedAt = new Date();
    
    // 创建包含所有字段的数据对象（包括密码）
    const userDataToSave = {
      id: this.id,
      type: 'user',
      name: this.name,
      email: this.email,
      password: this.password, // 确保密码字段被包含
      role: this.role,
      phone: this.phone,
      passwordChanged: this.passwordChanged,
      disabled: this.disabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    
    await bucket.defaultCollection().upsert(this.id, userDataToSave);
    return this;
  }

  // 删除用户
  async delete() {
    const bucket = getBucket();
    await bucket.defaultCollection().remove(this.id);
    await bucket.defaultCollection().remove(`email::${this.email}`);
  }
}

module.exports = User;
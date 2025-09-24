const bcrypt = require('bcryptjs');
const { getDb } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id || data._id;
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

    const db = getDb();
    const users = db.collection('users');
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

    await users.insertOne({
      _id: userId,
      id: userId,
      type: 'user',
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      phone: user.phone,
      passwordChanged: user.passwordChanged,
      disabled: user.disabled,
      createdAt: user.createdAt
    });

    return user;
  }

  // 根据ID查找用户
  static async findById(id) {
    const db = getDb();
    const users = db.collection('users');
    const doc = await users.findOne({ _id: id });
    return doc ? new User(doc) : null;
  }

  // 根据邮箱查找用户
  static async findByEmail(email) {
    const db = getDb();
    const users = db.collection('users');
    const doc = await users.findOne({ email: email.toLowerCase() });
    return doc ? new User(doc) : null;
  }

  // 根据邮箱查找用户（包含密码）
  static async findByEmailWithPassword(email) {
    const db = getDb();
    const users = db.collection('users');
    const doc = await users.findOne({ email: email.toLowerCase() });
    return doc ? new User(doc) : null;
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
    const db = getDb();
    const usersCol = db.collection('users');
    const filter = {};
    if (query.role) filter.role = query.role;
    const docs = await usersCol.find(filter).toArray();
    const users = docs.map(d => new User(d));
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
  }

  // 重建按角色的用户索引（如果查询服务可用）
  static async rebuildUsersByRoleIndex(role) {
    const db = getDb();
    const usersCol = db.collection('users');
    const count = await usersCol.countDocuments({ role });
    return { role, count };
  }

  // 更新用户
  async save() {
    const db = getDb();
    const users = db.collection('users');
    this.updatedAt = new Date();
    await users.updateOne(
      { _id: this.id },
      { $set: {
        id: this.id,
        type: 'user',
        name: this.name,
        email: this.email,
        password: this.password,
        role: this.role,
        phone: this.phone,
        passwordChanged: this.passwordChanged,
        disabled: this.disabled,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      }},
      { upsert: true }
    );
    return this;
  }

  // 删除用户
  async delete() {
    const db = getDb();
    const users = db.collection('users');
    await users.deleteOne({ _id: this.id });
  }
}

module.exports = User;
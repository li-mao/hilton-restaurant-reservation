const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { getDb } = require('../config/database');

async function ensureAdminExists() {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@hilton.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const db = getDb();
    if (!db) {
      logger.warn('Database not connected yet; skip seeding admin for now');
      return;
    }

    const users = db.collection('users');
    const existing = await users.findOne({ email: adminEmail });
    if (existing) {
      logger.info('Default admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const id = `admin::${Date.now()}`;
    await users.insertOne({
      _id: id,
      id,
      type: 'user',
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      phone: '+1234567890',
      passwordChanged: true,
      disabled: false,
      createdAt: new Date()
    });

    logger.info(`Seeded default admin user: ${adminEmail}`);
  } catch (error) {
    logger.error(`Failed to seed default admin: ${error.message}`);
  }
}

module.exports = { ensureAdminExists };



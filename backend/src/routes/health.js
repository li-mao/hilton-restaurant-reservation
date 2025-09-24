const express = require('express');
const router = express.Router();
const { getBucket } = require('../config/database');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * 健康检查端点
 */
router.get('/', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {}
    };

    // 检查数据库连接
    try {
      const bucket = getBucket();
      // 测试数据库连接
      await bucket.defaultCollection().get('test-key').catch(() => {
        // 忽略错误，这只是为了测试连接
      });
      healthStatus.services.database = {
        status: 'healthy',
        message: 'Couchbase connection successful'
      };
    } catch (error) {
      healthStatus.services.database = {
        status: 'unhealthy',
        message: `Database connection failed: ${error.message}`
      };
      healthStatus.status = 'unhealthy';
    }

    // 检查管理员用户
    try {
      const adminUser = await User.findByEmail('admin@hilton.com');
      if (adminUser && adminUser.role === 'admin') {
        healthStatus.services.adminUser = {
          status: 'healthy',
          message: 'Admin user exists and is properly configured'
        };
      } else {
        healthStatus.services.adminUser = {
          status: 'unhealthy',
          message: 'Admin user missing or misconfigured'
        };
        healthStatus.status = 'unhealthy';
      }
    } catch (error) {
      healthStatus.services.adminUser = {
        status: 'unhealthy',
        message: `Admin user check failed: ${error.message}`
      };
      healthStatus.status = 'unhealthy';
    }

    // 检查系统内存使用
    const memUsage = process.memoryUsage();
    healthStatus.services.memory = {
      status: 'healthy',
      used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
    };

    // 检查运行时间
    healthStatus.services.uptime = {
      status: 'healthy',
      uptime: Math.round(process.uptime()) + ' seconds'
    };

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    logger.error(`Health check error: ${error.message}`);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * 详细健康检查端点
 */
router.get('/detailed', async (req, res) => {
  try {
    const detailedStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: []
    };

    // 数据库连接检查
    try {
      const bucket = getBucket();
      // 测试数据库连接
      await bucket.defaultCollection().get('test-key').catch(() => {
        // 忽略错误，这只是为了测试连接
      });
      detailedStatus.checks.push({
        name: 'Database Connection',
        status: 'PASS',
        message: 'Couchbase connection successful'
      });
    } catch (error) {
      detailedStatus.checks.push({
        name: 'Database Connection',
        status: 'FAIL',
        message: `Database connection failed: ${error.message}`
      });
      detailedStatus.status = 'unhealthy';
    }

    // 管理员用户检查
    try {
      const adminUser = await User.findByEmail('admin@hilton.com');
      if (adminUser && adminUser.role === 'admin' && adminUser.password) {
        detailedStatus.checks.push({
          name: 'Admin User',
          status: 'PASS',
          message: 'Admin user exists with proper configuration'
        });
      } else {
        detailedStatus.checks.push({
          name: 'Admin User',
          status: 'FAIL',
          message: 'Admin user missing or misconfigured'
        });
        detailedStatus.status = 'unhealthy';
      }
    } catch (error) {
      detailedStatus.checks.push({
        name: 'Admin User',
        status: 'FAIL',
        message: `Admin user check failed: ${error.message}`
      });
      detailedStatus.status = 'unhealthy';
    }

    // 系统资源检查
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    detailedStatus.checks.push({
      name: 'Memory Usage',
      status: memUsagePercent < 90 ? 'PASS' : 'WARN',
      message: `Memory usage: ${Math.round(memUsagePercent)}% (${Math.round(memUsage.heapUsed / 1024 / 1024)} MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB)`
    });

    if (memUsagePercent >= 90) {
      detailedStatus.status = 'unhealthy';
    }

    // 运行时间检查
    const uptime = process.uptime();
    detailedStatus.checks.push({
      name: 'Uptime',
      status: 'PASS',
      message: `Service uptime: ${Math.round(uptime)} seconds`
    });

    const statusCode = detailedStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(detailedStatus);

  } catch (error) {
    logger.error(`Detailed health check error: ${error.message}`);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
      message: error.message
    });
  }
});

module.exports = router;

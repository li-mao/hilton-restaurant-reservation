const Joi = require('joi');
const { User } = require('../models');
const { generateToken } = require('../utils/auth');
const logger = require('../utils/logger');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).required(),
  role: Joi.string().valid('guest', 'employee', 'admin').default('guest')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

const register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { name, email, password, phone, role } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role
    });

    // Guests are not required (and not allowed) to change password; mark as changed
    if (user.role === 'guest' && user.passwordChanged === false) {
      user.passwordChanged = true;
      await user.save();
    }

    const token = generateToken(user.id);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      token,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          passwordChanged: user.passwordChanged
        }
      }
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
};

const login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email, password } = req.body;

    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // If guest and not marked changed, mark it to avoid forcing change-password
    if (user.role === 'guest' && user.passwordChanged === false) {
      user.passwordChanged = true;
      await user.save();
    }

    const token = generateToken(user.id);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      token,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          passwordChanged: user.passwordChanged
        }
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Ensure guests are never forced to change password
    if (user && user.role === 'guest' && user.passwordChanged === false) {
      user.passwordChanged = true;
      await user.save();
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          passwordChanged: user.passwordChanged,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { error } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findByEmailWithPassword((await User.findById(req.user.id)).email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = await User.hashPassword(newPassword);
    user.passwordChanged = true;
    await user.save();

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Password updated successfully',
      token,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          passwordChanged: user.passwordChanged
        }
      }
    });
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error while changing password'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword
};
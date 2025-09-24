const Joi = require('joi');
const { User } = require('../models');
const logger = require('../utils/logger');

const createEmployeeSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).required(),
});

const listEmployees = async (req, res) => {
  try {
    // 使用修复后的User.find方法获取employee用户
    const result = await User.find({ role: 'employee' });
    const employees = result.select('-password');
    
    logger.info(`Retrieved ${employees.length} employees`);
    res.json({ success: true, data: { employees } });
  } catch (error) {
    logger.error(`List employees error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const listGuests = async (req, res) => {
  try {
    // 使用修复后的User.find方法获取guest用户
    const result = await User.find({ role: 'guest' });
    const guests = result.select('-password');
    
    logger.info(`Retrieved ${guests.length} guests`);
    res.json({ success: true, data: { guests } });
  } catch (error) {
    logger.error(`List guests error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { error } = createEmployeeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const { name, email, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, error: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      role: 'employee',
      password: email, // default password is email
      passwordChanged: false,
    });

    logger.info(`Employee created by admin ${req.user.email}: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        employee: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          passwordChanged: user.passwordChanged,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error(`Create employee error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const resetEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findById(id);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    employee.password = employee.email; // reset to email
    employee.passwordChanged = false;
    await employee.save();
    res.json({ success: true, message: 'Password reset to email' });
  } catch (error) {
    logger.error(`Reset employee password error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const setEmployeeDisabled = async (req, res) => {
  try {
    const { id } = req.params;
    const { disabled } = req.body;
    const employee = await User.findById(id);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    employee.disabled = !!disabled;
    await employee.save();
    res.json({ success: true, data: { disabled: employee.disabled } });
  } catch (error) {
    logger.error(`Set employee disabled error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const setGuestDisabled = async (req, res) => {
  try {
    const { id } = req.params;
    const { disabled } = req.body;
    const guest = await User.findById(id);
    if (!guest || guest.role !== 'guest') {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }
    guest.disabled = !!disabled;
    await guest.save();
    logger.info(`Guest ${guest.email} ${disabled ? 'disabled' : 'enabled'} by admin ${req.user.email}`);
    res.json({ success: true, data: { disabled: guest.disabled } });
  } catch (error) {
    logger.error(`Set guest disabled error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = { listEmployees, listGuests, createEmployee, resetEmployeePassword, setEmployeeDisabled, setGuestDisabled };
 



const express = require('express');
const { authenticate, authorize } = require('../utils/auth');
const { listEmployees, listGuests, createEmployee, resetEmployeePassword, setEmployeeDisabled, setGuestDisabled } = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/employees', listEmployees);
router.post('/employees', createEmployee);
router.post('/employees/:id/reset-password', resetEmployeePassword);
router.patch('/employees/:id/disabled', setEmployeeDisabled);

router.get('/guests', listGuests);
router.patch('/guests/:id/disabled', setGuestDisabled);

module.exports = router;



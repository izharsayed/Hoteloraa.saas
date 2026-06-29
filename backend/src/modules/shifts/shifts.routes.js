"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const express = require('express');
const { authenticate, checkPermission } = require('../../middleware/auth.middleware');
const controller = require('./shifts.controller');

const router = express.Router();

router.use(authenticate);

// All staff can view shifts and their own shift
router.get('/', checkPermission('ATTENDANCE', 'READ'), controller.getShifts);
router.get('/my-shift', checkPermission('ATTENDANCE', 'READ'), controller.getMyShift);
router.get('/:id', checkPermission('ATTENDANCE', 'READ'), controller.getShiftById);
router.get('/:id/employees', checkPermission('ATTENDANCE', 'UPDATE'), controller.getShiftEmployees);

// Manager & Admin: full CRUD
router.post('/', checkPermission('ATTENDANCE', 'UPDATE'), controller.createShift);
router.put('/:id', checkPermission('ATTENDANCE', 'UPDATE'), controller.updateShift);
router.delete('/:id', checkPermission('ATTENDANCE', 'DELETE'), controller.deleteShift);

// Assign / Unassign employees
router.post('/:id/assign', checkPermission('ATTENDANCE', 'UPDATE'), controller.assignEmployees);
router.delete('/:id/unassign', checkPermission('ATTENDANCE', 'UPDATE'), controller.unassignEmployee);

module.exports = router;

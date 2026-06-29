"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const express = require('express');
const { authenticate, checkPermission } = require('../../middleware/auth.middleware');
const controller = require('./attendance.controller');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ── Attendance Settings ──────────────────────────────────────
router.get('/settings',
  checkPermission('ATTENDANCE', 'READ'),
  controller.getSettings
);
router.put('/settings',
  checkPermission('ATTENDANCE', 'UPDATE'),
  controller.updateSettings
);

// ── Employee: Personal routes ────────────────────────────────
router.post('/checkin',
  checkPermission('ATTENDANCE', 'CREATE'),
  controller.checkIn
);
router.post('/checkout',
  checkPermission('ATTENDANCE', 'CREATE'),
  controller.checkOut
);
router.get('/today',
  checkPermission('ATTENDANCE', 'READ'),
  controller.getMyToday
);
router.get('/history',
  checkPermission('ATTENDANCE', 'READ'),
  controller.getMyHistory
);
router.get('/monthly-summary',
  checkPermission('ATTENDANCE', 'READ'),
  controller.getMonthlySummary
);

// ── Manager: All records ─────────────────────────────────────
router.get('/dashboard',
  checkPermission('ATTENDANCE', 'UPDATE'),
  controller.getDashboard
);
router.get('/all',
  checkPermission('ATTENDANCE', 'UPDATE'),
  controller.getAllAttendance
);
router.post('/manual',
  checkPermission('ATTENDANCE', 'UPDATE'),
  controller.addManualAttendance
);
router.put('/:id',
  checkPermission('ATTENDANCE', 'UPDATE'),
  controller.editAttendance
);
router.patch('/:id/approve',
  checkPermission('ATTENDANCE', 'UPDATE'),
  controller.approveAttendance
);
router.patch('/:id/checkout',
  checkPermission('ATTENDANCE', 'UPDATE'),
  controller.managerCheckOut
);
router.get('/logs',
  checkPermission('ATTENDANCE', 'UPDATE'),
  controller.getAuditLogs
);
router.get('/report',
  checkPermission('ATTENDANCE', 'UPDATE'),
  controller.getReport
);
router.get('/export',
  checkPermission('ATTENDANCE', 'UPDATE'),
  controller.exportReport
);

module.exports = router;

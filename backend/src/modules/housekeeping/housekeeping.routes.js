"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _authmiddleware = require('../../middleware/auth.middleware');
var _validatemiddleware = require('../../middleware/validate.middleware');
var _housekeepingdto = require('./housekeeping.dto');
var _housekeepingcontroller = require('./housekeeping.controller'); var controller = _interopRequireWildcard(_housekeepingcontroller);

const router = _express.Router.call(void 0, );

// All routes require authentication
router.use(_authmiddleware.authenticate);

// GET /housekeeping?status=PENDING
router.get('/', _authmiddleware.checkPermission.call(void 0, 'HOUSEKEEPING', 'READ'), controller.getTasks);

// GET /housekeeping/my-tasks  — must be before /:id
router.get('/my-tasks', _authmiddleware.checkPermission.call(void 0, 'HOUSEKEEPING', 'READ'), controller.getMyTasks);

// GET /housekeeping/dashboard — must be before /:id
router.get('/dashboard', _authmiddleware.checkPermission.call(void 0, 'HOUSEKEEPING', 'READ'), controller.getDashboard);

// GET /housekeeping/staff — list active housekeeping staff (no USERS perm needed)
router.get('/staff', _authmiddleware.checkPermission.call(void 0, 'HOUSEKEEPING', 'READ'), controller.getHousekeepingStaff);

// GET /housekeeping/:id
router.get('/:id', _authmiddleware.checkPermission.call(void 0, 'HOUSEKEEPING', 'READ'), controller.getTaskById);

// POST /housekeeping
router.post('/', _authmiddleware.checkPermission.call(void 0, 'HOUSEKEEPING', 'CREATE'), _validatemiddleware.validate.call(void 0, _housekeepingdto.createTaskSchema), controller.createTask);

// PUT /housekeeping/:id
router.put('/:id', _authmiddleware.checkPermission.call(void 0, 'HOUSEKEEPING', 'UPDATE'), _validatemiddleware.validate.call(void 0, _housekeepingdto.updateTaskSchema), controller.updateTask);

// PATCH /housekeeping/:id/status
router.patch('/:id/status', _authmiddleware.checkPermission.call(void 0, 'HOUSEKEEPING', 'UPDATE'), _validatemiddleware.validate.call(void 0, _housekeepingdto.updateStatusSchema), controller.updateStatus);

exports. default = router;

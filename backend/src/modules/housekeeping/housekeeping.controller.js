"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _helpers = require('../../shared/helpers');
var _housekeepingservice = require('./housekeeping.service'); var housekeepingService = _interopRequireWildcard(_housekeepingservice);


// ────────────────────────────────────────────────────────────────
// GET /housekeeping?status=PENDING
// ────────────────────────────────────────────────────────────────
 const getTasks = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const status = req.query.status ;
    const tasks = await housekeepingService.getTasks(tenantId, status);
    _helpers.sendSuccess.call(void 0, res, tasks, 'Housekeeping tasks retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getTasks = getTasks;

// ────────────────────────────────────────────────────────────────
// GET /housekeeping/my-tasks
// ────────────────────────────────────────────────────────────────
 const getMyTasks = async (req, res, next) => {
  try {
    const { tenantId, id: userId } = req.user;
    const tasks = await housekeepingService.getMyTasks(tenantId, userId);
    _helpers.sendSuccess.call(void 0, res, tasks, 'My tasks retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getMyTasks = getMyTasks;

// ────────────────────────────────────────────────────────────────
// GET /housekeeping/dashboard
// ────────────────────────────────────────────────────────────────
 const getDashboard = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const dashboard = await housekeepingService.getDashboard(tenantId);
    _helpers.sendSuccess.call(void 0, res, dashboard, 'Housekeeping dashboard retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getDashboard = getDashboard;

// ────────────────────────────────────────────────────────────────
// GET /housekeeping/:id
// ────────────────────────────────────────────────────────────────
 const getTaskById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const task = await housekeepingService.getTaskById(tenantId, req.params.id);
    _helpers.sendSuccess.call(void 0, res, task, 'Housekeeping task retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getTaskById = getTaskById;

// ────────────────────────────────────────────────────────────────
// POST /housekeeping
// ────────────────────────────────────────────────────────────────
 const createTask = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const task = await housekeepingService.createTask(tenantId, req.body);
    _helpers.sendSuccess.call(void 0, res, task, 'Housekeeping task created successfully', 201);
  } catch (err) {
    next(err);
  }
}; exports.createTask = createTask;

// ────────────────────────────────────────────────────────────────
// PUT /housekeeping/:id
// ────────────────────────────────────────────────────────────────
 const updateTask = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const task = await housekeepingService.updateTask(tenantId, req.params.id, req.body);
    _helpers.sendSuccess.call(void 0, res, task, 'Housekeeping task updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updateTask = updateTask;

// ────────────────────────────────────────────────────────────────
// PATCH /housekeeping/:id/status
// ────────────────────────────────────────────────────────────────
 const updateStatus = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const { status } = req.body ;
    const task = await housekeepingService.updateStatus(tenantId, req.params.id, status, userId);
    _helpers.sendSuccess.call(void 0, res, task, `Task status updated to ${status}`);
  } catch (err) {
    next(err);
  }
}; exports.updateStatus = updateStatus;

// ────────────────────────────────────────────────────────────────
// GET /housekeeping/staff — list all active housekeeping users
// ────────────────────────────────────────────────────────────────
const getHousekeepingStaff = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const staff = await housekeepingService.getHousekeepingStaff(tenantId);
    _helpers.sendSuccess.call(void 0, res, staff, 'Housekeeping staff retrieved');
  } catch (err) {
    next(err);
  }
}; exports.getHousekeepingStaff = getHousekeepingStaff;

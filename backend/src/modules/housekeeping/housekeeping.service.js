"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _errormiddleware = require('../../middleware/error.middleware');


const taskInclude = {
  room: {
    select: {
      id: true,
      number: true,
      floor: true,
      status: true,
      roomType: { select: { id: true, name: true } },
    },
  },
  assignedUser: {
    select: { id: true, name: true, email: true, userRole: true },
  },
} ;

// ────────────────────────────────────────────────────────────────
// GET TASKS — list all with optional status filter
// ────────────────────────────────────────────────────────────────
 const getTasks = async (tenantId, status) => {
  const where = { tenantId };
  if (status) {
    const valid = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'INSPECTED'];
    if (!valid.includes(status)) {
      throw _errormiddleware.createError.call(void 0, `Invalid status filter. Must be one of: ${valid.join(', ')}`, 400);
    }
    where.status = status;
  }

  const tasks = await _database2.default.housekeeping.findMany({
    where,
    include: taskInclude,
    orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }, { createdAt: 'desc' }],
  });

  return tasks;
}; exports.getTasks = getTasks;

// ────────────────────────────────────────────────────────────────
// GET TASK BY ID
// ────────────────────────────────────────────────────────────────
 const getTaskById = async (tenantId, id) => {
  const task = await _database2.default.housekeeping.findFirst({
    where: { id, tenantId },
    include: taskInclude,
  });

  if (!task) {
    throw _errormiddleware.createError.call(void 0, 'Housekeeping task not found', 404);
  }

  return task;
}; exports.getTaskById = getTaskById;

const roomLocks = new Map();

// ────────────────────────────────────────────────────────────────
// CREATE TASK
// ────────────────────────────────────────────────────────────────
 const createTask = async (tenantId, dto) => {
  const roomId = dto.roomId;
  const existingPromise = roomLocks.get(roomId) || Promise.resolve();
  let resolveLock;
  const newPromise = new Promise(resolve => {
    resolveLock = resolve;
  });
  roomLocks.set(roomId, newPromise);
  await existingPromise;

  try {
    // Verify room belongs to tenant
    const room = await _database2.default.room.findFirst({ where: { id: dto.roomId, tenantId } });
    if (!room) {
      throw _errormiddleware.createError.call(void 0, 'Room not found', 404);
    }

    // Verify assignee belongs to tenant (if provided)
    if (dto.assignedTo) {
      const user = await _database2.default.user.findFirst({
        where: { id: dto.assignedTo, tenantId, isActive: true },
      });
      if (!user) {
        throw _errormiddleware.createError.call(void 0, 'Assigned user not found or inactive', 404);
      }
    }

    // Check if an active task of this type already exists for this room to prevent duplicates
    const activeTask = await _database2.default.housekeeping.findFirst({
      where: {
        tenantId,
        roomId: dto.roomId,
        taskType: dto.taskType,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: taskInclude,
    });

    if (activeTask) {
      return activeTask;
    }

    const task = await _database2.default.housekeeping.create({
      data: {
        tenantId,
        roomId: dto.roomId,
        assignedTo: _nullishCoalesce(dto.assignedTo, () => ( null)),
        taskType: dto.taskType,
        notes: _nullishCoalesce(dto.notes, () => ( null)),
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status: 'PENDING',
      },
      include: taskInclude,
    });

    return task;
  } finally {
    resolveLock();
    if (roomLocks.get(roomId) === newPromise) {
      roomLocks.delete(roomId);
    }
  }
}; exports.createTask = createTask;

// ────────────────────────────────────────────────────────────────
// UPDATE TASK (fields only, not status)
// ────────────────────────────────────────────────────────────────
 const updateTask = async (tenantId, id, dto) => {
  const existing = await _database2.default.housekeeping.findFirst({ where: { id, tenantId } });
  if (!existing) {
    throw _errormiddleware.createError.call(void 0, 'Housekeeping task not found', 404);
  }

  if (dto.roomId) {
    const room = await _database2.default.room.findFirst({ where: { id: dto.roomId, tenantId } });
    if (!room) throw _errormiddleware.createError.call(void 0, 'Room not found', 404);
  }

  if (dto.assignedTo) {
    const user = await _database2.default.user.findFirst({
      where: { id: dto.assignedTo, tenantId, isActive: true },
    });
    if (!user) throw _errormiddleware.createError.call(void 0, 'Assigned user not found or inactive', 404);
  }

  const task = await _database2.default.housekeeping.update({
    where: { id },
    data: {
      ...(dto.roomId !== undefined && { roomId: dto.roomId }),
      ...(dto.assignedTo !== undefined && { assignedTo: dto.assignedTo }),
      ...(dto.taskType !== undefined && { taskType: dto.taskType }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.scheduledAt !== undefined && {
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      }),
    },
    include: taskInclude,
  });

  return task;
}; exports.updateTask = updateTask;

// ────────────────────────────────────────────────────────────────
// UPDATE STATUS — sets timestamps, updates room if COMPLETED
// ────────────────────────────────────────────────────────────────
 const updateStatus = async (
  tenantId,
  id,
  status,
  userId
) => {
  const existing = await _database2.default.housekeeping.findFirst({ where: { id, tenantId } });
  if (!existing) {
    throw _errormiddleware.createError.call(void 0, 'Housekeeping task not found', 404);
  }

  const now = new Date();
  const statusData = { status };

  if (status === 'IN_PROGRESS') {
    statusData.startedAt = now;
  } else if (status === 'COMPLETED') {
    statusData.completedAt = now;
    if (!existing.startedAt) statusData.startedAt = now;
  } else if (status === 'PENDING') {
    // Allow resetting — clear timestamps
    statusData.startedAt = null;
    statusData.completedAt = null;
  }

  const task = await _database2.default.housekeeping.update({
    where: { id },
    data: statusData,
    include: taskInclude,
  });

  // When a task is COMPLETED, mark room as AVAILABLE
  if (status === 'COMPLETED') {
    await _database2.default.room.update({
      where: { id: existing.roomId },
      data: { status: 'AVAILABLE' },
    });
  }

  void userId; // auditing hook – userId available for future logs

  return task;
}; exports.updateStatus = updateStatus;

// ────────────────────────────────────────────────────────────────
// GET MY TASKS — tasks assigned to a specific user
// ────────────────────────────────────────────────────────────────
 const getMyTasks = async (tenantId, userId) => {
  const tasks = await _database2.default.housekeeping.findMany({
    where: { tenantId, assignedTo: userId },
    include: taskInclude,
    orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }, { createdAt: 'desc' }],
  });

  return tasks;
}; exports.getMyTasks = getMyTasks;

// ────────────────────────────────────────────────────────────────
// GET DASHBOARD — counts by status and by taskType
// ────────────────────────────────────────────────────────────────
 const getDashboard = async (tenantId) => {
  const [byStatus, byTaskType, recentTasks] = await Promise.all([
    // Count by status
    _database2.default.housekeeping.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
    }),
    // Count by task type
    _database2.default.housekeeping.groupBy({
      by: ['taskType'],
      where: { tenantId },
      _count: { _all: true },
    }),
    // Recent pending / in-progress tasks
    _database2.default.housekeeping.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: taskInclude,
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    }),
  ]);

  const statusCounts = {
    PENDING: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    INSPECTED: 0,
  };
  byStatus.forEach((row) => {
    statusCounts[row.status] = row._count._all;
  });

  const taskTypeCounts = {
    CLEANING: 0,
    INSPECTION: 0,
    MAINTENANCE: 0,
    TURNDOWN: 0,
  };
  byTaskType.forEach((row) => {
    taskTypeCounts[row.taskType] = row._count._all;
  });

  return {
    statusCounts,
    taskTypeCounts,
    totalTasks: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    recentActiveTasks: recentTasks,
  };
}; exports.getDashboard = getDashboard;

// ────────────────────────────────────────────────────────────────
// GET HOUSEKEEPING STAFF — active users with housekeeping role
// ────────────────────────────────────────────────────────────────
const getHousekeepingStaff = async (tenantId) => {
  const staff = await _database2.default.user.findMany({
    where: {
      tenantId,
      isActive: true,
      userRole: { in: ['HOUSEKEEPING', 'HOUSEKEEPER'] },
    },
    select: { id: true, name: true, email: true, userRole: true },
    orderBy: { name: 'asc' },
  });
  return staff;
}; exports.getHousekeepingStaff = getHousekeepingStaff;

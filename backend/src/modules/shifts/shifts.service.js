"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const prisma = require('../../config/database').default;
const { createError } = require('../../middleware/error.middleware');
const { createNotification } = require('../notifications/notifications.service');

// ─────────────────────────────────────────────────────────────
// LIST SHIFTS
// ─────────────────────────────────────────────────────────────

const getShifts = async (tenantId, includeInactive = false) => {
  return prisma.shift.findMany({
    where: {
      tenantId,
      ...(includeInactive ? {} : { status: 'ACTIVE' }),
    },
    include: {
      _count: { select: { employeeShifts: true } },
    },
    orderBy: { name: 'asc' },
  });
};
exports.getShifts = getShifts;

// ─────────────────────────────────────────────────────────────
// GET SHIFT BY ID
// ─────────────────────────────────────────────────────────────

const getShiftById = async (tenantId, id) => {
  const shift = await prisma.shift.findFirst({
    where: { id, tenantId },
    include: {
      employeeShifts: {
        where: {
          effectiveTo: null,
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
        },
        include: {
          user: { select: { id: true, name: true, email: true, userRole: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!shift) throw createError('Shift not found', 404);
  return shift;
};
exports.getShiftById = getShiftById;

// ─────────────────────────────────────────────────────────────
// CREATE SHIFT
// ─────────────────────────────────────────────────────────────

const createShift = async (tenantId, userId, dto) => {
  const existing = await prisma.shift.findFirst({
    where: { tenantId, name: dto.name },
  });
  if (existing) throw createError(`Shift "${dto.name}" already exists`, 409);

  // Compute total working hours from start/end times
  const [startH, startM] = dto.startTime.split(':').map(Number);
  const [endH, endM] = dto.endTime.split(':').map(Number);
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  const totalMins = endMins > startMins ? endMins - startMins : (24 * 60) - startMins + endMins;
  const breakMins = dto.breakDurationMinutes || 60;
  const totalWorkingHours = Math.round(((totalMins - breakMins) / 60) * 10) / 10;

  return prisma.shift.create({
    data: {
      tenantId,
      name: dto.name,
      startTime: dto.startTime,
      endTime: dto.endTime,
      gracePeriodMinutes: dto.gracePeriodMinutes ?? 15,
      breakDurationMinutes: breakMins,
      totalWorkingHours,
      autoCheckoutTime: dto.autoCheckoutTime || null,
      weeklyOffDays: dto.weeklyOffDays || [],
      description: dto.description || null,
      status: 'ACTIVE',
      createdById: userId,
    },
  });
};
exports.createShift = createShift;

// ─────────────────────────────────────────────────────────────
// UPDATE SHIFT
// ─────────────────────────────────────────────────────────────

const updateShift = async (tenantId, id, dto) => {
  const shift = await prisma.shift.findFirst({ where: { id, tenantId } });
  if (!shift) throw createError('Shift not found', 404);

  // Recompute working hours if times changed
  let totalWorkingHours = shift.totalWorkingHours;
  const startTime = dto.startTime || shift.startTime;
  const endTime = dto.endTime || shift.endTime;
  const breakMins = dto.breakDurationMinutes ?? shift.breakDurationMinutes;

  if (dto.startTime || dto.endTime || dto.breakDurationMinutes !== undefined) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    const totalMins = endMins > startMins ? endMins - startMins : (24 * 60) - startMins + endMins;
    totalWorkingHours = Math.round(((totalMins - breakMins) / 60) * 10) / 10;
  }

  const updatedShift = await prisma.shift.update({
    where: { id },
    data: {
      name: dto.name || shift.name,
      startTime: dto.startTime || shift.startTime,
      endTime: dto.endTime || shift.endTime,
      gracePeriodMinutes: dto.gracePeriodMinutes ?? shift.gracePeriodMinutes,
      breakDurationMinutes: breakMins,
      totalWorkingHours,
      autoCheckoutTime: dto.autoCheckoutTime !== undefined ? dto.autoCheckoutTime : shift.autoCheckoutTime,
      weeklyOffDays: dto.weeklyOffDays || shift.weeklyOffDays,
      description: dto.description !== undefined ? dto.description : shift.description,
      status: dto.status || shift.status,
    },
  });

  // If weeklyOffDays changed, update today's generated absent/week_off records
  if (dto.weeklyOffDays && JSON.stringify(dto.weeklyOffDays) !== JSON.stringify(shift.weeklyOffDays)) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const todayName = dayNames[now.getDay()];
    const isNowOffDay = dto.weeklyOffDays.includes(todayName);
    const newStatus = isNowOffDay ? 'WEEK_OFF' : 'ABSENT';

    await prisma.attendance.updateMany({
      where: {
        tenantId,
        shiftId: id,
        date: today,
        status: { in: ['ABSENT', 'WEEK_OFF'] },
      },
      data: {
        status: newStatus,
      },
    });
  }

  return updatedShift;
};
exports.updateShift = updateShift;

// ─────────────────────────────────────────────────────────────
// DELETE SHIFT (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────

const deleteShift = async (tenantId, id) => {
  const shift = await prisma.shift.findFirst({ where: { id, tenantId } });
  if (!shift) throw createError('Shift not found', 404);

  const activeAssignments = await prisma.employeeShift.count({
    where: {
      shiftId: id,
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
    },
  });

  if (activeAssignments > 0) {
    throw createError(
      `Cannot delete shift: ${activeAssignments} employee(s) are currently assigned to it. Unassign them first.`,
      400
    );
  }

  await prisma.shift.delete({ where: { id } });
  return { message: 'Shift deleted successfully' };
};
exports.deleteShift = deleteShift;

// ─────────────────────────────────────────────────────────────
// GET EMPLOYEES IN SHIFT
// ─────────────────────────────────────────────────────────────

const getShiftEmployees = async (tenantId, shiftId) => {
  const shift = await prisma.shift.findFirst({ where: { id: shiftId, tenantId } });
  if (!shift) throw createError('Shift not found', 404);

  return prisma.employeeShift.findMany({
    where: {
      shiftId,
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
    },
    include: {
      user: { select: { id: true, name: true, email: true, userRole: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
};
exports.getShiftEmployees = getShiftEmployees;

// ─────────────────────────────────────────────────────────────
// ASSIGN EMPLOYEES TO SHIFT
// ─────────────────────────────────────────────────────────────

const assignEmployeesToShift = async (tenantId, managerId, shiftId, dto) => {
  const shift = await prisma.shift.findFirst({ where: { id: shiftId, tenantId } });
  if (!shift) throw createError('Shift not found', 404);

  const { userIds, effectiveFrom } = dto;
  const effectiveDate = effectiveFrom ? new Date(effectiveFrom) : new Date();

  const results = [];
  for (const userId of userIds) {
    // Verify user belongs to tenant
    const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) continue;

    // Close any existing open assignment for this employee
    await prisma.employeeShift.updateMany({
      where: {
        userId,
        tenantId,
        effectiveTo: null,
      },
      data: { effectiveTo: effectiveDate },
    });

    // Create new assignment
    const assignment = await prisma.employeeShift.create({
      data: {
        tenantId,
        userId,
        shiftId,
        effectiveFrom: effectiveDate,
        assignedById: managerId,
      },
      include: {
        user: { select: { id: true, name: true } },
        shift: { select: { name: true } },
      },
    });

    results.push(assignment);

    // Audit log
    await prisma.attendanceLog.create({
      data: {
        tenantId,
        userId: managerId,
        action: 'SHIFT_ASSIGNED',
        description: `${user.name} assigned to shift "${shift.name}"`,
        newData: { shiftId, userId, effectiveFrom: effectiveDate },
      },
    });

    // Notify employee
    await createNotification(tenantId, {
      userId,
      title: 'Shift Assigned',
      message: `You have been assigned to the "${shift.name}" shift starting ${effectiveDate.toDateString()}.`,
      type: 'INFO',
    }).catch(() => {});
  }

  return results;
};
exports.assignEmployeesToShift = assignEmployeesToShift;

// ─────────────────────────────────────────────────────────────
// UNASSIGN EMPLOYEE FROM SHIFT
// ─────────────────────────────────────────────────────────────

const unassignEmployeeFromShift = async (tenantId, managerId, shiftId, userId) => {
  const shift = await prisma.shift.findFirst({ where: { id: shiftId, tenantId } });
  if (!shift) throw createError('Shift not found', 404);

  const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  if (!user) throw createError('Employee not found', 404);

  const result = await prisma.employeeShift.updateMany({
    where: { shiftId, userId, effectiveTo: null },
    data: { effectiveTo: new Date() },
  });

  if (result.count === 0) {
    throw createError('No active assignment found for this employee in this shift', 404);
  }

  // Audit log
  await prisma.attendanceLog.create({
    data: {
      tenantId,
      userId: managerId,
      action: 'SHIFT_REMOVED',
      description: `${user.name} removed from shift "${shift.name}"`,
    },
  });

  return { message: `${user.name} removed from shift "${shift.name}"` };
};
exports.unassignEmployeeFromShift = unassignEmployeeFromShift;

// ─────────────────────────────────────────────────────────────
// MY CURRENT SHIFT (Employee)
// ─────────────────────────────────────────────────────────────

const getMyShift = async (tenantId, userId) => {
  const now = new Date();
  const assignment = await prisma.employeeShift.findFirst({
    where: {
      tenantId,
      userId,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    orderBy: { effectiveFrom: 'desc' },
    include: { shift: true },
  });
  return assignment?.shift || null;
};
exports.getMyShift = getMyShift;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const prisma = require('../../config/database').default;
const { createError } = require('../../middleware/error.middleware');
const { createNotification } = require('../notifications/notifications.service');
const {
  haversineDistanceMeters,
  computeCheckInStatus,
  computeCheckOutStatus,
  parseDeviceInfo,
  getClientIp,
  getTodayDate,
} = require('../../shared/attendance.utils');

// ─────────────────────────────────────────────────────────────
// ATTENDANCE SETTINGS
// ─────────────────────────────────────────────────────────────

const getAttendanceSettings = async (tenantId) => {
  let settings = await prisma.attendanceSettings.findUnique({
    where: { tenantId },
  });
  if (!settings) {
    settings = await prisma.attendanceSettings.create({
      data: { tenantId },
    });
  }
  return settings;
};
exports.getAttendanceSettings = getAttendanceSettings;

const updateAttendanceSettings = async (tenantId, dto) => {
  return prisma.attendanceSettings.upsert({
    where: { tenantId },
    update: dto,
    create: { tenantId, ...dto },
  });
};
exports.updateAttendanceSettings = updateAttendanceSettings;

// ─────────────────────────────────────────────────────────────
// EMPLOYEE SHIFT LOOKUP
// ─────────────────────────────────────────────────────────────

const getEmployeeActiveShift = async (tenantId, userId) => {
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
exports.getEmployeeActiveShift = getEmployeeActiveShift;

// ─────────────────────────────────────────────────────────────
// CHECK-IN
// ─────────────────────────────────────────────────────────────

const checkIn = async (tenantId, userId, dto, req) => {
  const today = getTodayDate();

  // Prevent duplicate check-in
  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if (existing) {
    if (existing.checkInTime) throw createError('Already checked in today', 400);
  }

  // Fetch attendance settings (geofence)
  const settings = await getAttendanceSettings(tenantId);

  // Geofence validation (server-side)
  if (settings.isGeoFenceEnabled && settings.latitude && settings.longitude) {
    if (!dto.lat || !dto.lng) {
      throw createError('GPS coordinates are required for check-in', 400);
    }

    // Reject impossible coordinates
    if (dto.lat === 0 && dto.lng === 0) {
      throw createError('Invalid GPS coordinates received', 400);
    }

    const distanceMeters = haversineDistanceMeters(
      dto.lat,
      dto.lng,
      settings.latitude,
      settings.longitude
    );

    if (distanceMeters > settings.allowedRadiusMeters) {
      // Log geofence violation
      await prisma.attendanceLog.create({
        data: {
          tenantId,
          userId,
          action: 'GEOFENCE_VIOLATION',
          description: `Check-in attempt ${Math.round(distanceMeters)}m away from allowed zone (${settings.allowedRadiusMeters}m)`,
          lat: dto.lat,
          lng: dto.lng,
          ipAddress: getClientIp(req),
        },
      });

      // Notify manager
      await createNotification(tenantId, {
        role: 'MANAGER',
        title: 'Geofence Violation',
        message: `Employee attempted check-in ${Math.round(distanceMeters)}m outside the allowed zone.`,
        type: 'DANGER',
      }).catch(() => {});

      throw createError(
        `You are ${Math.round(distanceMeters)}m away from the allowed attendance zone (${settings.allowedRadiusMeters}m radius).`,
        403
      );
    }
  }

  // Get employee's active shift
  const shift = await getEmployeeActiveShift(tenantId, userId);

  // Compute status
  const now = new Date();
  const { status, lateMinutes } = computeCheckInStatus(now, shift, today);
  const deviceInfo = parseDeviceInfo(req);
  const ipAddress = getClientIp(req);

  let attendance;
  if (existing) {
    // Update existing record (edge case)
    attendance = await prisma.attendance.update({
      where: { userId_date: { userId, date: today } },
      data: {
        checkInTime: now,
        checkInLat: dto.lat,
        checkInLng: dto.lng,
        checkInAccuracy: dto.accuracy,
        checkInIp: ipAddress,
        checkInDevice: deviceInfo,
        method: dto.isManual ? 'MANUAL' : 'GPS',
        status,
        lateMinutes,
        shiftId: shift?.id || null,
      },
      include: { shift: true, user: { select: { name: true } } },
    });
  } else {
    attendance = await prisma.attendance.create({
      data: {
        tenantId,
        userId,
        date: today,
        checkInTime: now,
        checkInLat: dto.lat,
        checkInLng: dto.lng,
        checkInAccuracy: dto.accuracy,
        checkInIp: ipAddress,
        checkInDevice: deviceInfo,
        method: dto.isManual ? 'MANUAL' : 'GPS',
        status,
        lateMinutes,
        shiftId: shift?.id || null,
      },
      include: { shift: true, user: { select: { name: true } } },
    });
  }

  // Audit log
  await prisma.attendanceLog.create({
    data: {
      tenantId,
      attendanceId: attendance.id,
      userId,
      action: 'CHECKIN',
      description: `Checked in at ${now.toLocaleTimeString()} — Status: ${status}${lateMinutes > 0 ? ` (${lateMinutes} mins late)` : ''}`,
      newData: { checkInTime: now, status, lateMinutes },
      ipAddress,
      deviceInfo,
      lat: dto.lat,
      lng: dto.lng,
    },
  });

  // Notify manager if late
  if (status === 'LATE') {
    await createNotification(tenantId, {
      role: 'MANAGER',
      title: 'Late Check-In',
      message: `${attendance.user.name} checked in ${lateMinutes} minutes late.`,
      type: 'WARNING',
    }).catch(() => {});
  }

  return attendance;
};
exports.checkIn = checkIn;

// ─────────────────────────────────────────────────────────────
// CHECK-OUT
// ─────────────────────────────────────────────────────────────

const checkOut = async (tenantId, userId, dto, req) => {
  const today = getTodayDate();

  const attendance = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
    include: { shift: true },
  });

  if (!attendance) throw createError('No check-in found for today', 400);
  if (attendance.checkOutTime) throw createError('Already checked out today', 400);
  if (!attendance.checkInTime) throw createError('Cannot check out without checking in', 400);

  // Geofence validation for checkout
  const settings = await getAttendanceSettings(tenantId);
  if (settings.isGeoFenceEnabled && settings.latitude && settings.longitude && dto.lat && dto.lng) {
    const distanceMeters = haversineDistanceMeters(
      dto.lat, dto.lng, settings.latitude, settings.longitude
    );
    if (distanceMeters > settings.allowedRadiusMeters) {
      throw createError(
        `You are ${Math.round(distanceMeters)}m away from the allowed check-out zone.`,
        403
      );
    }
  }

  const now = new Date();
  const { status, workingHoursMinutes, overtimeMinutes } = computeCheckOutStatus(
    attendance.checkInTime,
    now,
    attendance.shift,
    attendance.status
  );

  const ipAddress = getClientIp(req);
  const deviceInfo = parseDeviceInfo(req);

  const updated = await prisma.attendance.update({
    where: { userId_date: { userId, date: today } },
    data: {
      checkOutTime: now,
      checkOutLat: dto.lat,
      checkOutLng: dto.lng,
      checkOutAccuracy: dto.accuracy,
      status,
      workingHoursMinutes,
      overtimeMinutes,
    },
    include: { shift: true, user: { select: { name: true } } },
  });

  // Audit log
  await prisma.attendanceLog.create({
    data: {
      tenantId,
      attendanceId: attendance.id,
      userId,
      action: 'CHECKOUT',
      description: `Checked out at ${now.toLocaleTimeString()} — Total: ${Math.round(workingHoursMinutes / 60 * 10) / 10}h, OT: ${overtimeMinutes}m`,
      newData: { checkOutTime: now, workingHoursMinutes, overtimeMinutes, status },
      ipAddress,
      deviceInfo,
      lat: dto.lat,
      lng: dto.lng,
    },
  });

  return updated;
};
exports.checkOut = checkOut;

// ─────────────────────────────────────────────────────────────
// TODAY'S STATUS (Employee)
// ─────────────────────────────────────────────────────────────

const getMyToday = async (tenantId, userId) => {
  const today = getTodayDate();
  const settings = await getAttendanceSettings(tenantId);
  const shift = await getEmployeeActiveShift(tenantId, userId);

  const attendance = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
    include: { shift: true },
  });

  return { attendance, settings, shift };
};
exports.getMyToday = getMyToday;

// ─────────────────────────────────────────────────────────────
// ATTENDANCE HISTORY (Employee — own records)
// ─────────────────────────────────────────────────────────────

const getMyHistory = async (tenantId, userId, query) => {
  const { page = 1, limit = 25, startDate, endDate, status } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { tenantId, userId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (status) where.status = status;

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: { shift: true },
      orderBy: { date: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.attendance.count({ where }),
  ]);

  return { records, total, page: parseInt(page), limit: parseInt(limit) };
};
exports.getMyHistory = getMyHistory;

// ─────────────────────────────────────────────────────────────
// MONTHLY SUMMARY (Employee)
// ─────────────────────────────────────────────────────────────

const getMonthlySummary = async (tenantId, userId, year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const records = await prisma.attendance.findMany({
    where: { tenantId, userId, date: { gte: startDate, lte: endDate } },
  });

  const summary = {
    totalDays: records.length,
    present: records.filter((r) => r.status === 'PRESENT').length,
    late: records.filter((r) => r.status === 'LATE').length,
    absent: records.filter((r) => r.status === 'ABSENT').length,
    halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
    earlyLeave: records.filter((r) => r.status === 'EARLY_LEAVE').length,
    overtime: records.filter((r) => r.status === 'OVERTIME').length,
    onLeave: records.filter((r) => r.status === 'ON_LEAVE').length,
    weekOff: records.filter((r) => r.status === 'WEEK_OFF').length,
    missedCheckout: records.filter((r) => r.status === 'MISSED_CHECKOUT').length,
    totalWorkingMinutes: records.reduce((acc, r) => acc + (r.workingHoursMinutes || 0), 0),
    totalOvertimeMinutes: records.reduce((acc, r) => acc + (r.overtimeMinutes || 0), 0),
    totalLateMinutes: records.reduce((acc, r) => acc + (r.lateMinutes || 0), 0),
    records,
  };

  return summary;
};
exports.getMonthlySummary = getMonthlySummary;

// ─────────────────────────────────────────────────────────────
// MANAGER: ALL ATTENDANCE
// ─────────────────────────────────────────────────────────────

const getAllAttendance = async (tenantId, query) => {
  const { page = 1, limit = 25, startDate, endDate, status, userId, search } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { tenantId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (status) where.status = status;
  if (userId) where.userId = userId;

  if (search) {
    where.user = { name: { contains: search, mode: 'insensitive' } };
  }

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        shift: true,
        user: { select: { id: true, name: true, email: true, userRole: true, avatarUrl: true } },
      },
      orderBy: [{ date: 'desc' }, { checkInTime: 'desc' }],
      skip,
      take: parseInt(limit),
    }),
    prisma.attendance.count({ where }),
  ]);

  return { records, total, page: parseInt(page), limit: parseInt(limit) };
};
exports.getAllAttendance = getAllAttendance;

// ─────────────────────────────────────────────────────────────
// MANAGER: FORCE CHECK-OUT
// ─────────────────────────────────────────────────────────────

const managerCheckOut = async (tenantId, attendanceId, managerId) => {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { shift: true, user: true },
  });

  if (!attendance || attendance.tenantId !== tenantId) throw createError('Record not found', 404);
  if (attendance.checkOutTime) throw createError('Already checked out', 400);
  if (!attendance.checkInTime) throw createError('Cannot check out without check-in', 400);

  const now = new Date();
  const { status, workingHoursMinutes, overtimeMinutes } = computeCheckOutStatus(
    attendance.checkInTime,
    now,
    attendance.shift,
    attendance.status
  );

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      checkOutTime: now,
      status,
      workingHoursMinutes,
      overtimeMinutes,
      method: 'MANUAL',
    },
  });

  await prisma.attendanceLog.create({
    data: {
      tenantId,
      attendanceId,
      userId: attendance.userId,
      action: 'CHECKOUT',
      description: `Manager manually checked out employee at ${now.toLocaleTimeString()}`,
      newData: { checkOutTime: now, status, workingHoursMinutes },
    },
  });

  return updated;
};
exports.managerCheckOut = managerCheckOut;

// ─────────────────────────────────────────────────────────────
// MANAGER: DASHBOARD STATS
// ─────────────────────────────────────────────────────────────

const getAttendanceDashboard = async (tenantId) => {
  const today = getTodayDate();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Total active employees
  const totalEmployees = await prisma.user.count({
    where: { tenantId, isActive: true },
  });

  // Today's attendance stats
  const todayRecords = await prisma.attendance.findMany({
    where: {
      tenantId,
      date: { gte: today, lt: tomorrow },
    },
    include: {
      user: { select: { id: true, name: true, userRole: true, avatarUrl: true } },
      shift: true,
    },
    orderBy: { checkInTime: 'asc' },
  });

  const presentCount = todayRecords.filter((r) =>
    ['PRESENT', 'LATE', 'OVERTIME'].includes(r.status)
  ).length;
  const lateCount = todayRecords.filter((r) => r.status === 'LATE').length;
  const absentCount = totalEmployees - todayRecords.length;
  const onLeaveCount = todayRecords.filter((r) => r.status === 'ON_LEAVE').length;
  const checkedOutCount = todayRecords.filter((r) => r.checkOutTime !== null).length;
  const stillCheckedIn = todayRecords.filter(
    (r) => r.checkInTime && !r.checkOutTime
  ).length;

  const avgWorkingMinutes =
    todayRecords.length > 0
      ? Math.round(
          todayRecords.reduce((acc, r) => acc + (r.workingHoursMinutes || 0), 0) /
            todayRecords.length
        )
      : 0;

  const attendancePercent =
    totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

  return {
    totalEmployees,
    presentCount,
    lateCount,
    absentCount,
    onLeaveCount,
    checkedOutCount,
    stillCheckedIn,
    avgWorkingMinutes,
    attendancePercent,
    todayRecords,
  };
};
exports.getAttendanceDashboard = getAttendanceDashboard;

// ─────────────────────────────────────────────────────────────
// MANUAL ATTENDANCE (Manager)
// ─────────────────────────────────────────────────────────────

const addManualAttendance = async (tenantId, managerId, dto) => {
  const date = new Date(dto.date);
  date.setHours(0, 0, 0, 0);

  // Verify target user belongs to tenant
  const targetUser = await prisma.user.findFirst({
    where: { id: dto.userId, tenantId },
  });
  if (!targetUser) throw createError('Employee not found in this tenant', 404);

  const shift = await getEmployeeActiveShift(tenantId, dto.userId);

  const checkInTime = dto.checkInTime ? new Date(dto.checkInTime) : null;
  const checkOutTime = dto.checkOutTime ? new Date(dto.checkOutTime) : null;

  let workingHoursMinutes = null;
  let overtimeMinutes = null;
  let lateMinutes = 0;
  let status = dto.status || 'PRESENT';

  if (checkInTime && shift) {
    const ci = computeCheckInStatus(checkInTime, shift, date);
    lateMinutes = ci.lateMinutes;
    status = ci.status;
  }

  if (checkInTime && checkOutTime && shift) {
    const co = computeCheckOutStatus(checkInTime, checkOutTime, shift, status);
    status = co.status;
    workingHoursMinutes = co.workingHoursMinutes;
    overtimeMinutes = co.overtimeMinutes;
  } else if (checkInTime && checkOutTime) {
    workingHoursMinutes = Math.round(
      (checkOutTime.getTime() - checkInTime.getTime()) / 60000
    );
  }

  if (dto.status) status = dto.status; // allow manager to override status

  const attendance = await prisma.attendance.upsert({
    where: { userId_date: { userId: dto.userId, date } },
    update: {
      checkInTime,
      checkOutTime,
      status,
      lateMinutes,
      workingHoursMinutes,
      overtimeMinutes,
      isManual: true,
      manualReason: dto.reason,
      manuallyById: managerId,
      shiftId: shift?.id || null,
      notes: dto.notes,
    },
    create: {
      tenantId,
      userId: dto.userId,
      date,
      checkInTime,
      checkOutTime,
      status,
      lateMinutes,
      workingHoursMinutes,
      overtimeMinutes,
      method: 'MANUAL',
      isManual: true,
      manualReason: dto.reason,
      manuallyById: managerId,
      shiftId: shift?.id || null,
      notes: dto.notes,
    },
  });

  // Audit log
  await prisma.attendanceLog.create({
    data: {
      tenantId,
      attendanceId: attendance.id,
      userId: managerId,
      action: 'MANUAL_ADD',
      description: `Manual attendance added for ${targetUser.name} on ${date.toDateString()} — Reason: ${dto.reason}`,
      newData: dto,
    },
  });

  // Notify manager role about manual entry
  await createNotification(tenantId, {
    role: 'MANAGER',
    title: 'Manual Attendance Added',
    message: `Attendance for ${targetUser.name} on ${date.toDateString()} was added manually.`,
    type: 'INFO',
  }).catch(() => {});

  return attendance;
};
exports.addManualAttendance = addManualAttendance;

// ─────────────────────────────────────────────────────────────
// EDIT ATTENDANCE (Manager)
// ─────────────────────────────────────────────────────────────

const editAttendance = async (tenantId, managerId, id, dto) => {
  const record = await prisma.attendance.findFirst({
    where: { id, tenantId },
    include: { user: { select: { name: true } } },
  });
  if (!record) throw createError('Attendance record not found', 404);

  const previous = { ...record };

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : record.checkInTime,
      checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : record.checkOutTime,
      status: dto.status || record.status,
      lateMinutes: dto.lateMinutes !== undefined ? dto.lateMinutes : record.lateMinutes,
      workingHoursMinutes: dto.workingHoursMinutes !== undefined ? dto.workingHoursMinutes : record.workingHoursMinutes,
      overtimeMinutes: dto.overtimeMinutes !== undefined ? dto.overtimeMinutes : record.overtimeMinutes,
      isManual: true,
      manualReason: dto.reason || record.manualReason,
      manuallyById: managerId,
      notes: dto.notes || record.notes,
    },
  });

  // Audit log
  await prisma.attendanceLog.create({
    data: {
      tenantId,
      attendanceId: id,
      userId: managerId,
      action: 'MANUAL_EDIT',
      description: `Attendance record for ${record.user.name} edited by manager`,
      previousData: previous,
      newData: dto,
    },
  });

  return updated;
};
exports.editAttendance = editAttendance;

// ─────────────────────────────────────────────────────────────
// APPROVE / REJECT ATTENDANCE (Manager)
// ─────────────────────────────────────────────────────────────

const approveAttendance = async (tenantId, managerId, id, approve) => {
  const record = await prisma.attendance.findFirst({
    where: { id, tenantId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!record) throw createError('Attendance record not found', 404);

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      isApproved: approve,
      approvedById: managerId,
      approvedAt: new Date(),
    },
  });

  // Audit
  await prisma.attendanceLog.create({
    data: {
      tenantId,
      attendanceId: id,
      userId: managerId,
      action: approve ? 'APPROVED' : 'REJECTED',
      description: `Attendance ${approve ? 'approved' : 'rejected'} for ${record.user.name}`,
    },
  });

  // Notify employee
  await createNotification(tenantId, {
    userId: record.user.id,
    title: approve ? 'Attendance Approved' : 'Attendance Rejected',
    message: `Your attendance for ${record.date.toDateString()} has been ${approve ? 'approved' : 'rejected'}.`,
    type: approve ? 'SUCCESS' : 'DANGER',
  }).catch(() => {});

  return updated;
};
exports.approveAttendance = approveAttendance;

// ─────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────

const getAuditLogs = async (tenantId, query) => {
  const { page = 1, limit = 50, userId, action, attendanceId } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { tenantId };
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (attendanceId) where.attendanceId = attendanceId;

  const [logs, total] = await Promise.all([
    prisma.attendanceLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.attendanceLog.count({ where }),
  ]);

  return { logs, total, page: parseInt(page), limit: parseInt(limit) };
};
exports.getAuditLogs = getAuditLogs;

// ─────────────────────────────────────────────────────────────
// REPORT DATA
// ─────────────────────────────────────────────────────────────

const getReportData = async (tenantId, query) => {
  const { startDate, endDate, userId, groupBy } = query;
  const where = { tenantId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (userId) where.userId = userId;

  const records = await prisma.attendance.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, userRole: true } },
      shift: { select: { id: true, name: true } },
    },
    orderBy: [{ date: 'asc' }, { userId: 'asc' }],
  });

  return records;
};
exports.getReportData = getReportData;

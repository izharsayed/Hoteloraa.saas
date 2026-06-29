"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const attendanceService = require('./attendance.service');
const { sendSuccess } = require('../../shared/helpers');

// ── Settings ────────────────────────────────────────────────

const getSettings = async (req, res, next) => {
  try {
    const result = await attendanceService.getAttendanceSettings(req.user.tenantId);
    sendSuccess(res, result, 'Attendance settings retrieved');
  } catch (err) { next(err); }
};
exports.getSettings = getSettings;

const updateSettings = async (req, res, next) => {
  try {
    const result = await attendanceService.updateAttendanceSettings(req.user.tenantId, req.body);
    sendSuccess(res, result, 'Attendance settings updated');
  } catch (err) { next(err); }
};
exports.updateSettings = updateSettings;

// ── Employee: Check In / Out ─────────────────────────────────

const checkIn = async (req, res, next) => {
  try {
    const result = await attendanceService.checkIn(
      req.user.tenantId,
      req.user.id,
      req.body,
      req
    );
    sendSuccess(res, result, 'Checked in successfully', 201);
  } catch (err) { next(err); }
};
exports.checkIn = checkIn;

const checkOut = async (req, res, next) => {
  try {
    const result = await attendanceService.checkOut(
      req.user.tenantId,
      req.user.id,
      req.body,
      req
    );
    sendSuccess(res, result, 'Checked out successfully');
  } catch (err) { next(err); }
};
exports.checkOut = checkOut;

// ── Employee: Own Records ────────────────────────────────────

const getMyToday = async (req, res, next) => {
  try {
    const result = await attendanceService.getMyToday(req.user.tenantId, req.user.id);
    sendSuccess(res, result, 'Today attendance retrieved');
  } catch (err) { next(err); }
};
exports.getMyToday = getMyToday;

const getMyHistory = async (req, res, next) => {
  try {
    const result = await attendanceService.getMyHistory(
      req.user.tenantId,
      req.user.id,
      req.query
    );
    sendSuccess(res, result, 'Attendance history retrieved');
  } catch (err) { next(err); }
};
exports.getMyHistory = getMyHistory;

const getMonthlySummary = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    let targetUserId = req.user.id;
    if (req.query.userId && ['MANAGER', 'TENANT_ADMIN', 'SUPERADMIN'].includes(req.user.userRole)) {
      targetUserId = req.query.userId;
    }
    const result = await attendanceService.getMonthlySummary(
      req.user.tenantId,
      targetUserId,
      year,
      month
    );
    sendSuccess(res, result, 'Monthly summary retrieved');
  } catch (err) { next(err); }
};
exports.getMonthlySummary = getMonthlySummary;

// ── Manager: All Attendance ──────────────────────────────────

const getAllAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.getAllAttendance(req.user.tenantId, req.query);
    sendSuccess(res, result, 'Attendance records retrieved');
  } catch (err) { next(err); }
};
exports.getAllAttendance = getAllAttendance;

const getDashboard = async (req, res, next) => {
  try {
    const result = await attendanceService.getAttendanceDashboard(req.user.tenantId);
    sendSuccess(res, result, 'Attendance dashboard retrieved');
  } catch (err) { next(err); }
};
exports.getDashboard = getDashboard;

const addManualAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.addManualAttendance(
      req.user.tenantId,
      req.user.id,
      req.body
    );
    sendSuccess(res, result, 'Manual attendance added', 201);
  } catch (err) { next(err); }
};
exports.addManualAttendance = addManualAttendance;

const editAttendance = async (req, res, next) => {
  try {
    const result = await attendanceService.editAttendance(
      req.user.tenantId,
      req.user.id,
      req.params.id,
      req.body
    );
    sendSuccess(res, result, 'Attendance updated');
  } catch (err) { next(err); }
};
exports.editAttendance = editAttendance;

const approveAttendance = async (req, res, next) => {
  try {
    const approve = req.body.approve !== false;
    const result = await attendanceService.approveAttendance(
      req.user.tenantId,
      req.user.id,
      req.params.id,
      approve
    );
    sendSuccess(res, result, approve ? 'Attendance approved' : 'Attendance rejected');
  } catch (err) { next(err); }
};
exports.approveAttendance = approveAttendance;

const managerCheckOut = async (req, res, next) => {
  try {
    const result = await attendanceService.managerCheckOut(req.user.tenantId, req.params.id, req.user.id);
    sendSuccess(res, result, 'Attendance checked out by manager');
  } catch (err) { next(err); }
};
exports.managerCheckOut = managerCheckOut;

const getAuditLogs = async (req, res, next) => {
  try {
    const result = await attendanceService.getAuditLogs(req.user.tenantId, req.query);
    sendSuccess(res, result, 'Audit logs retrieved');
  } catch (err) { next(err); }
};
exports.getAuditLogs = getAuditLogs;

const getReport = async (req, res, next) => {
  try {
    const result = await attendanceService.getReportData(req.user.tenantId, req.query);
    sendSuccess(res, result, 'Report data retrieved');
  } catch (err) { next(err); }
};
exports.getReport = getReport;

const exportReport = async (req, res, next) => {
  try {
    const records = await attendanceService.getReportData(req.user.tenantId, req.query);
    const format = req.query.format || 'csv';

    if (format === 'csv') {
      const headers = ['Date', 'Employee', 'Role', 'Shift', 'Check In', 'Check Out', 'Working Hours', 'Overtime', 'Late Minutes', 'Status', 'Method'];
      const rows = records.map((r) => [
        new Date(r.date).toLocaleDateString(),
        r.user?.name || '',
        r.user?.userRole || '',
        r.shift?.name || 'No Shift',
        r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : '',
        r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : '',
        r.workingHoursMinutes ? `${Math.floor(r.workingHoursMinutes / 60)}h ${r.workingHoursMinutes % 60}m` : '',
        r.overtimeMinutes ? `${r.overtimeMinutes}m` : '0m',
        r.lateMinutes || 0,
        r.status,
        r.method,
      ]);

      const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance_${Date.now()}.csv"`);
      return res.send(csv);
    }

    // JSON fallback
    sendSuccess(res, records, 'Export data retrieved');
  } catch (err) { next(err); }
};
exports.exportReport = exportReport;

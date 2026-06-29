"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

/**
 * Attendance Utilities
 * Haversine distance calculation + attendance status computation
 */

/**
 * Calculate distance between two GPS coordinates using the Haversine formula.
 * @returns {number} Distance in meters
 */
const haversineDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
exports.haversineDistanceMeters = haversineDistanceMeters;

/**
 * Parse "HH:mm" string into { hours, minutes } numbers.
 */
const parseTime = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
};
exports.parseTime = parseTime;

/**
 * Get total minutes since midnight for a given Date object.
 */
const toMinutesSinceMidnight = (date) => {
  return date.getHours() * 60 + date.getMinutes();
};
exports.toMinutesSinceMidnight = toMinutesSinceMidnight;

/**
 * Convert "HH:mm" to minutes since midnight.
 */
const timeStrToMinutes = (timeStr) => {
  const parsed = parseTime(timeStr);
  if (!parsed) return 0;
  return parsed.hours * 60 + parsed.minutes;
};
exports.timeStrToMinutes = timeStrToMinutes;

/**
 * Compute attendance status based on check-in time vs. shift.
 * @param {Date} checkInTime
 * @param {object|null} shift - { startTime, gracePeriodMinutes, weeklyOffDays }
 * @param {Date} date - The attendance date
 * @returns {{ status: string, lateMinutes: number }}
 */
const computeCheckInStatus = (checkInTime, shift, date) => {
  if (!shift) {
    return { status: 'PRESENT', lateMinutes: 0 };
  }

  // Check weekly off
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dayName = dayNames[date.getDay()];
  if (shift.weeklyOffDays && shift.weeklyOffDays.includes(dayName)) {
    return { status: 'WEEK_OFF', lateMinutes: 0 };
  }

  const shiftStartMins = timeStrToMinutes(shift.startTime);
  const graceMins = shift.gracePeriodMinutes || 15;
  const checkInMins = toMinutesSinceMidnight(checkInTime);

  const lateMins = checkInMins - (shiftStartMins + graceMins);

  if (lateMins <= 0) {
    return { status: 'PRESENT', lateMinutes: 0 };
  }

  return { status: 'LATE', lateMinutes: lateMins };
};
exports.computeCheckInStatus = computeCheckInStatus;

/**
 * Compute checkout status, working hours, and overtime.
 * @param {Date} checkInTime
 * @param {Date} checkOutTime
 * @param {object|null} shift
 * @param {string} currentStatus - existing status from check-in
 * @returns {{ status, workingHoursMinutes, overtimeMinutes }}
 */
const computeCheckOutStatus = (checkInTime, checkOutTime, shift, currentStatus) => {
  const workingHoursMinutes = Math.round(
    (checkOutTime.getTime() - checkInTime.getTime()) / 60000
  );

  let overtimeMinutes = 0;
  let status = currentStatus;

  if (!shift) {
    return { status, workingHoursMinutes, overtimeMinutes };
  }

  const shiftEndMins = timeStrToMinutes(shift.endTime);
  const shiftStartMins = timeStrToMinutes(shift.startTime);
  const totalShiftMins = shift.totalWorkingHours * 60;
  const checkOutMins = toMinutesSinceMidnight(checkOutTime);

  // Calculate overtime
  if (checkOutMins > shiftEndMins) {
    overtimeMinutes = checkOutMins - shiftEndMins;
    if (overtimeMinutes > 0 && status === 'PRESENT') {
      status = 'OVERTIME';
    }
  }

  // Half-day check: worked less than half the shift
  if (workingHoursMinutes < totalShiftMins / 2 && status !== 'WEEK_OFF') {
    status = 'HALF_DAY';
  }

  // Early leave check: left more than 1 hour before shift end
  if (checkOutMins < shiftEndMins - 60 && status === 'PRESENT') {
    status = 'EARLY_LEAVE';
  }

  return { status, workingHoursMinutes, overtimeMinutes };
};
exports.computeCheckOutStatus = computeCheckOutStatus;

/**
 * Parse device info from request headers.
 * @param {object} req - Express request object
 * @returns {string} JSON string with browser/OS info
 */
const parseDeviceInfo = (req) => {
  const ua = req.headers['user-agent'] || '';
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'Desktop';

  // Simple UA parsing
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) { os = 'Android'; deviceType = 'Mobile'; }
  else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; deviceType = 'Mobile'; }

  if (ua.includes('Tablet') || ua.includes('iPad')) deviceType = 'Tablet';

  return JSON.stringify({ browser, os, deviceType, ua: ua.slice(0, 100) });
};
exports.parseDeviceInfo = parseDeviceInfo;

/**
 * Get client IP from request.
 */
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};
exports.getClientIp = getClientIp;

/**
 * Get today's date at midnight (local time) as a UTC Date for Prisma.
 */
const getTodayDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};
exports.getTodayDate = getTodayDate;

/**
 * Format minutes as "Xh Ym" string.
 */
const formatMinutes = (mins) => {
  if (!mins) return '0h 0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};
exports.formatMinutes = formatMinutes;

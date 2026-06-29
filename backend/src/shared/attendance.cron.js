"use strict";

/**
 * Attendance Auto-Checkout Cron Job
 * Runs every 5 minutes. Automatically checks out employees whose
 * shift autoCheckoutTime has passed and they haven't checked out yet.
 * Marks records as MISSED_CHECKOUT and notifies the manager.
 */

const prisma = require('../config/database').default;
const { createNotification } = require('../modules/notifications/notifications.service');

let cronInterval = null;

const runAutoCheckout = async () => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // Get today's date at midnight
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find all tenants with auto-checkout enabled
    const tenantsWithSettings = await prisma.attendanceSettings.findMany({
      where: { isAutoCheckoutEnabled: true },
    });

    for (const settings of tenantsWithSettings) {
      // Find all active shifts in this tenant that have autoCheckoutTime configured
      const shifts = await prisma.shift.findMany({
        where: {
          tenantId: settings.tenantId,
          status: 'ACTIVE',
          autoCheckoutTime: { not: null },
        },
      });

      for (const shift of shifts) {
        if (!shift.autoCheckoutTime) continue;

        // Only fire if current time >= autoCheckoutTime
        if (currentTimeStr < shift.autoCheckoutTime) continue;

        // Find employees with this shift who haven't checked out today
        const openAttendances = await prisma.attendance.findMany({
          where: {
            tenantId: settings.tenantId,
            shiftId: shift.id,
            date: today,
            checkInTime: { not: null },
            checkOutTime: null,
            status: { notIn: ['MISSED_CHECKOUT', 'ABSENT', 'WEEK_OFF', 'ON_LEAVE', 'HOLIDAY'] },
          },
          include: {
            user: { select: { id: true, name: true } },
          },
        });

        for (const attendance of openAttendances) {
          // Auto-checkout at the configured time
          const [h, m] = shift.autoCheckoutTime.split(':').map(Number);
          const autoCheckoutDateTime = new Date(today);
          autoCheckoutDateTime.setHours(h, m, 0, 0);

          const workingHoursMinutes = attendance.checkInTime
            ? Math.max(0, Math.round((autoCheckoutDateTime.getTime() - attendance.checkInTime.getTime()) / 60000))
            : 0;

          await prisma.attendance.update({
            where: { id: attendance.id },
            data: {
              checkOutTime: autoCheckoutDateTime,
              status: 'MISSED_CHECKOUT',
              workingHoursMinutes,
              method: 'AUTO_CHECKOUT',
            },
          });

          // Audit log
          await prisma.attendanceLog.create({
            data: {
              tenantId: settings.tenantId,
              attendanceId: attendance.id,
              userId: attendance.userId,
              action: 'AUTO_CHECKOUT',
              description: `Auto-checkout applied at ${shift.autoCheckoutTime} for ${attendance.user.name} (shift: ${shift.name})`,
              newData: {
                checkOutTime: autoCheckoutDateTime,
                status: 'MISSED_CHECKOUT',
                workingHoursMinutes,
              },
            },
          });

          // Notify manager role
          await createNotification(settings.tenantId, {
            role: 'MANAGER',
            title: 'Auto Checkout Applied',
            message: `${attendance.user.name} was auto-checked out at ${shift.autoCheckoutTime} (shift: ${shift.name}). Status: Missed Checkout.`,
            type: 'WARNING',
          }).catch(() => {});
        }
      }

      // Also mark as ABSENT: employees who never checked in and their shift start + 2 hours has passed
      const activeShifts = await prisma.shift.findMany({
        where: { tenantId: settings.tenantId, status: 'ACTIVE' },
      });

      for (const shift of activeShifts) {
        if (!shift.startTime) continue;
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const absentThresholdMins = startH * 60 + startM + 120; // shift start + 2 hours
        const currentMins = currentHour * 60 + currentMinute;

        if (currentMins < absentThresholdMins) continue;

        // Find employees in this shift who have no attendance record today
        const shiftAssignments = await prisma.employeeShift.findMany({
          where: {
            shiftId: shift.id,
            effectiveFrom: { lte: now },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
          },
          select: { userId: true, tenantId: true },
        });

        for (const assignment of shiftAssignments) {
          const existingRecord = await prisma.attendance.findUnique({
            where: {
              userId_date: { userId: assignment.userId, date: today },
            },
          });

          if (!existingRecord) {
            // Check weekly off for this shift
            const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            const dayName = dayNames[now.getDay()];
            if (shift.weeklyOffDays && shift.weeklyOffDays.includes(dayName)) {
              // Create WEEK_OFF record
              await prisma.attendance.create({
                data: {
                  tenantId: assignment.tenantId,
                  userId: assignment.userId,
                  date: today,
                  status: 'WEEK_OFF',
                  shiftId: shift.id,
                  method: 'AUTO_CHECKOUT',
                },
              }).catch(() => {});
              continue;
            }

            // Create ABSENT record
            await prisma.attendance.create({
              data: {
                tenantId: assignment.tenantId,
                userId: assignment.userId,
                date: today,
                status: 'ABSENT',
                shiftId: shift.id,
                method: 'AUTO_CHECKOUT',
              },
            }).catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    console.error('[Attendance Cron] Error during auto-checkout run:', err.message);
  }
};

/**
 * Start the attendance cron job.
 * Runs immediately on startup, then every 5 minutes.
 */
const startAttendanceCron = () => {
  console.log('[Attendance Cron] Started — running every 5 minutes');
  // Run once immediately to catch anything missed at startup
  runAutoCheckout();
  // Then run every 5 minutes
  cronInterval = setInterval(runAutoCheckout, 5 * 60 * 1000);
};
exports.startAttendanceCron = startAttendanceCron;

/**
 * Stop the cron job (used for graceful shutdown).
 */
const stopAttendanceCron = () => {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('[Attendance Cron] Stopped');
  }
};
exports.stopAttendanceCron = stopAttendanceCron;

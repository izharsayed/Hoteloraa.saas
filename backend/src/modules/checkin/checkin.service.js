"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _errormiddleware = require('../../middleware/error.middleware');


// ─── helpers ─────────────────────────────────────────────────────────────────

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ─── service functions ────────────────────────────────────────────────────────

/**
 * Returns all CONFIRMED reservations whose checkInDate is on or before today.
 * Includes the associated guest and room data.
 */
 const getPendingCheckIns = async (tenantId) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return _database2.default.reservation.findMany({
    where: {
      tenantId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      checkInDate: { lte: today },
    },
    include: {
      guest: true,
      room: {
        include: { roomType: true },
      },
    },
    orderBy: { checkInDate: 'asc' },
  });
}; exports.getPendingCheckIns = getPendingCheckIns;

/**
 * Performs the check-in operation for a given reservation:
 *   1. Validates the reservation belongs to the tenant and is CONFIRMED or PENDING.
 *   2. Updates reservation status → CHECKED_IN, sets actualCheckIn and checkedInById.
 *   3. Updates the room status → OCCUPIED.
 * All three writes are executed in a Prisma transaction.
 */
 const checkIn = async (tenantId, userId, dto) => {
  const reservation = await _database2.default.reservation.findFirst({
    where: { id: dto.reservationId, tenantId },
    include: { room: true },
  });

  if (!reservation) {
    throw _errormiddleware.createError.call(void 0, 'Reservation not found', 404);
  }

  if (reservation.status !== 'CONFIRMED' && reservation.status !== 'PENDING') {
    throw _errormiddleware.createError.call(void 0, 
      `Cannot check-in: reservation is currently ${reservation.status}`,
      400,
    );
  }

  if (reservation.room && reservation.room.status === 'CLEANING') {
    throw _errormiddleware.createError.call(void 0,
      'Room is under cleaning. Please select/allocate another room.',
      400
    );
  }

  const now = new Date();

  const [updatedReservation] = await _database2.default.$transaction([
    _database2.default.reservation.update({
      where: { id: reservation.id },
      data: {
        status: 'CHECKED_IN',
        actualCheckIn: now,
        checkedInById: userId,
        ...(dto.notes ? { notes: dto.notes } : {}),
      },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        checkedInBy: { select: { id: true, name: true, email: true } },
      },
    }),
    _database2.default.room.update({
      where: { id: reservation.roomId },
      data: { status: 'OCCUPIED' },
    }),
  ]);

  return updatedReservation;
}; exports.checkIn = checkIn;

/**
 * Returns all reservations that were checked in today (actualCheckIn within today's date range).
 */
 const getTodayCheckIns = async (tenantId) => {
  const { start, end } = todayRange();

  return _database2.default.reservation.findMany({
    where: {
      tenantId,
      status: 'CHECKED_IN',
      actualCheckIn: { gte: start, lte: end },
    },
    include: {
      guest: true,
      room: { include: { roomType: true } },
      checkedInBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { actualCheckIn: 'desc' },
  });
}; exports.getTodayCheckIns = getTodayCheckIns;

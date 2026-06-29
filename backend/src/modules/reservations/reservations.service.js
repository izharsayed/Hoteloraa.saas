"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _errormiddleware = require('../../middleware/error.middleware');
var _helpers = require('../../shared/helpers');


// ─── Helpers ─────────────────────────────────────────────────────────────────

const reservationIncludes = {
  guest: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      nationality: true,
      gender: true,
      idType: true,
      idNumber: true,
      idProofUrl: true,
      totalStays: true,
      totalSpent: true,
    },
  },
  room: {
    include: {
      roomType: { select: { id: true, name: true, basePrice: true, maxOccupancy: true } },
    },
  },
  payment: {
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      paidAt: true,
    },
  },
} ;

// ─── Service Functions ────────────────────────────────────────────────────────

 const getReservations = async (tenantId, status) => {
  const reservations = await _database2.default.reservation.findMany({
    where: {
      tenantId,
      ...(status && { status: status  }),
    },
    include: reservationIncludes,
    orderBy: { createdAt: 'desc' },
  });

  return reservations;
}; exports.getReservations = getReservations;

 const getReservationById = async (tenantId, id) => {
  const reservation = await _database2.default.reservation.findFirst({
    where: { id, tenantId },
    include: {
      guest: true,
      room: {
        include: {
          roomType: true,
        },
      },
      payment: true,
      checkedInBy: { select: { id: true, name: true } },
      checkedOutBy: { select: { id: true, name: true } },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!reservation) throw _errormiddleware.createError.call(void 0, 'Reservation not found', 404);
  return reservation;
}; exports.getReservationById = getReservationById;

 const createReservation = async (tenantId, dto) => {
  // 1. Validate room belongs to tenant
  const room = await _database2.default.room.findFirst({
    where: { id: dto.roomId, tenantId, isActive: true },
  });
  if (!room) throw _errormiddleware.createError.call(void 0, 'Room not found or inactive', 404);

  // 2. Validate guest belongs to tenant
  const guest = await _database2.default.guest.findFirst({
    where: { id: dto.guestId, tenantId },
  });
  if (!guest) throw _errormiddleware.createError.call(void 0, 'Guest not found', 404);

  // 3. Check for overlapping reservations (room must not be booked for the same dates)
  const overlap = await _database2.default.reservation.findFirst({
    where: {
      tenantId,
      roomId: dto.roomId,
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      AND: [
        { checkInDate: { lt: dto.checkOutDate } },
        { checkOutDate: { gt: dto.checkInDate } },
      ],
    },
  });
  if (overlap) {
    throw _errormiddleware.createError.call(void 0, 
      `Room is already booked from ${overlap.checkInDate.toDateString()} to ${overlap.checkOutDate.toDateString()}`,
      409
    );
  }

  // 4. Create the reservation
  const bookingRef = _helpers.generateBookingRef.call(void 0, );

  const reservation = await _database2.default.reservation.create({
    data: {
      tenantId,
      roomId: dto.roomId,
      guestId: dto.guestId,
      bookingRef,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      adults: dto.adults,
      children: dto.children,
      numberOfRooms: _nullishCoalesce(dto.numberOfRooms, () => ( 1)),
      ratePerNight: dto.ratePerNight,
      ratePlan: dto.ratePlan,
      totalNights: dto.totalNights,
      roomCharges: dto.roomCharges,
      extraCharges: _nullishCoalesce(dto.extraCharges, () => ( 0)),
      taxAmount: _nullishCoalesce(dto.taxAmount, () => ( 0)),
      discount: _nullishCoalesce(dto.discount, () => ( 0)),
      totalAmount: dto.totalAmount,
      advancePaid: _nullishCoalesce(dto.advancePaid, () => ( 0)),
      advanceMethod: dto.advanceMethod,
      specialRequest: dto.specialRequest,
      notes: dto.notes,
      source: dto.source,
      expectedArrival: dto.expectedArrival,
      vehicleNumber: dto.vehicleNumber,
      companyName: dto.companyName,
      gstNumber: dto.gstNumber,
      purposeOfVisit: dto.purposeOfVisit,
      status: 'CONFIRMED',
    },
    include: reservationIncludes,
  });

  // 5. Mark room as RESERVED
  await _database2.default.room.update({
    where: { id: dto.roomId },
    data: { status: 'RESERVED' },
  });

  return reservation;
}; exports.createReservation = createReservation;

 const updateReservation = async (
  tenantId,
  id,
  dto
) => {
  const reservation = await _database2.default.reservation.findFirst({ where: { id, tenantId } });
  if (!reservation) throw _errormiddleware.createError.call(void 0, 'Reservation not found', 404);

  if (['CANCELLED', 'CHECKED_OUT'].includes(reservation.status)) {
    throw _errormiddleware.createError.call(void 0, `Cannot update a ${reservation.status.toLowerCase()} reservation`, 400);
  }

  // Recalculate totalAmount if financial fields change
  const extraCharges = _nullishCoalesce(dto.extraCharges, () => ( reservation.extraCharges));
  const taxAmount = _nullishCoalesce(dto.taxAmount, () => ( reservation.taxAmount));
  const discount = _nullishCoalesce(dto.discount, () => ( reservation.discount));
  const totalAmount = Math.max(0, reservation.roomCharges + extraCharges + taxAmount - discount);

  const updated = await _database2.default.reservation.update({
    where: { id },
    data: {
      ...(dto.specialRequest !== undefined && { specialRequest: dto.specialRequest }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.adults !== undefined && { adults: dto.adults }),
      ...(dto.children !== undefined && { children: dto.children }),
      ...(dto.extraCharges !== undefined && { extraCharges: dto.extraCharges }),
      ...(dto.taxAmount !== undefined && { taxAmount: dto.taxAmount }),
      ...(dto.discount !== undefined && { discount: dto.discount }),
      ...(dto.advancePaid !== undefined && { advancePaid: dto.advancePaid }),
      ...(dto.advanceMethod !== undefined && { advanceMethod: dto.advanceMethod }),
      ...(dto.vehicleNumber !== undefined && { vehicleNumber: dto.vehicleNumber }),
      ...(dto.companyName !== undefined && { companyName: dto.companyName }),
      ...(dto.gstNumber !== undefined && { gstNumber: dto.gstNumber }),
      ...(dto.purposeOfVisit !== undefined && { purposeOfVisit: dto.purposeOfVisit }),
      totalAmount,
    },
    include: reservationIncludes,
  });

  return updated;
}; exports.updateReservation = updateReservation;

 const updateStatus = async (tenantId, id, status) => {
  const reservation = await _database2.default.reservation.findFirst({
    where: { id, tenantId },
    include: { room: true },
  });
  if (!reservation) throw _errormiddleware.createError.call(void 0, 'Reservation not found', 404);

  // Determine new room status based on reservation status transition
  const roomStatusMap = {
    PENDING: 'RESERVED',
    CONFIRMED: 'RESERVED',
    CHECKED_IN: 'OCCUPIED',
    CHECKED_OUT: 'CHECKOUT_PENDING',
    CANCELLED: 'AVAILABLE',
    NO_SHOW: 'AVAILABLE',
  };

  const newRoomStatus = roomStatusMap[status];

  // Timestamps for actual check-in / check-out
  const now = new Date();
  const timestamps = {};
  if (status === 'CHECKED_IN' && !reservation.actualCheckIn) {
    timestamps.actualCheckIn = now;
  }
  if (status === 'CHECKED_OUT' && !reservation.actualCheckOut) {
    timestamps.actualCheckOut = now;
  }

  const [updatedReservation] = await _database2.default.$transaction([
    _database2.default.reservation.update({
      where: { id },
      data: { status: status , ...timestamps },
      include: reservationIncludes,
    }),
    _database2.default.room.update({
      where: { id: reservation.roomId },
      data: { status: newRoomStatus  },
    }),
  ]);

  // Update guest totalStays when checked out
  if (status === 'CHECKED_OUT') {
    await _database2.default.guest.update({
      where: { id: reservation.guestId },
      data: {
        totalStays: { increment: 1 },
        totalSpent: { increment: reservation.totalAmount },
      },
    });
  }

  return updatedReservation;
}; exports.updateStatus = updateStatus;

 const cancelReservation = async (tenantId, id) => {
  const reservation = await _database2.default.reservation.findFirst({ where: { id, tenantId } });
  if (!reservation) throw _errormiddleware.createError.call(void 0, 'Reservation not found', 404);

  if (reservation.status === 'CANCELLED') {
    throw _errormiddleware.createError.call(void 0, 'Reservation is already cancelled', 400);
  }
  if (reservation.status === 'CHECKED_IN') {
    throw _errormiddleware.createError.call(void 0, 'Cannot cancel a reservation that is already checked in. Use checkout instead.', 400);
  }
  if (reservation.status === 'CHECKED_OUT') {
    throw _errormiddleware.createError.call(void 0, 'Cannot cancel a completed reservation', 400);
  }

  const [cancelled] = await _database2.default.$transaction([
    _database2.default.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: reservationIncludes,
    }),
    _database2.default.room.update({
      where: { id: reservation.roomId },
      data: { status: 'AVAILABLE' },
    }),
  ]);

  return cancelled;
}; exports.cancelReservation = cancelReservation;

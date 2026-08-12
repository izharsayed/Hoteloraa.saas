"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);

var _errormiddleware = require('../../middleware/error.middleware');

 const getPendingCheckOuts = async (tenantId) => {
  return _database2.default.reservation.findMany({
    where: {
      tenantId,
      status: 'CHECKED_IN',
    },
    include: {
      guest: true,
      room: {
        include: {
          roomType: true,
        },
      },
      orders: {
        where: { status: { not: 'CANCELLED' } },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      checkOutDate: 'asc',
    },
  });
}; exports.getPendingCheckOuts = getPendingCheckOuts;

 const getTodayCheckOuts = async (tenantId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return _database2.default.reservation.findMany({
    where: {
      tenantId,
      status: 'CHECKED_OUT',
      actualCheckOut: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      guest: true,
      room: {
        include: {
          roomType: true,
        },
      },
    },
    orderBy: {
      actualCheckOut: 'desc',
    },
  });
}; exports.getTodayCheckOuts = getTodayCheckOuts;

 const checkOut = async (tenantId, userId, dto) => {
  const { reservationId, extraCharges = 0, taxAmount = 0, discount = 0, paymentMethod, notes } = dto;

  const reservation = await _database2.default.reservation.findFirst({
    where: {
      id: reservationId,
      tenantId,
    },
    include: {
      room: true,
      guest: true,
    },
  });

  if (!reservation) {
    throw _errormiddleware.createError.call(void 0, 'Reservation not found', 404);
  }

  if (reservation.status !== 'CHECKED_IN') {
    throw _errormiddleware.createError.call(void 0, `Reservation status is ${reservation.status}, cannot check out.`, 400);
  }

  const finalRoomCharges = reservation.roomCharges;
  const finalExtraCharges = reservation.extraCharges + extraCharges;
  const finalTaxAmount = reservation.taxAmount + taxAmount;
  const finalDiscount = reservation.discount + discount;
  const finalTotalAmount = finalRoomCharges + finalExtraCharges + finalTaxAmount - finalDiscount;

  // Start Transaction
  return _database2.default.$transaction(async (tx) => {
    // 1. Update reservation
    const updatedReservation = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'CHECKED_OUT',
        actualCheckOut: new Date(),
        checkedOutById: userId,
        extraCharges: finalExtraCharges,
        taxAmount: finalTaxAmount,
        discount: finalDiscount,
        totalAmount: finalTotalAmount,
        notes: notes ? `${reservation.notes || ''}\nCheck-out notes: ${notes}` : reservation.notes,
      },
    });

    // 2. Update room status to CLEANING
    await tx.room.update({
      where: { id: reservation.roomId },
      data: {
        status: 'CLEANING',
      },
    });

    // 2b. Automatically create Housekeeping cleaning task for the room
    await tx.housekeeping.create({
      data: {
        tenantId,
        roomId: reservation.roomId,
        taskType: 'CLEANING',
        status: 'PENDING',
        notes: `Automatic cleaning task after checkout of booking ${reservation.bookingRef}`,
      },
    });

    // 3. Create Payment record (marked as PAID)
    const payment = await tx.payment.create({
      data: {
        tenantId,
        reservationId: reservation.id,
        userId,
        amount: finalTotalAmount,
        method: paymentMethod,
        status: 'PAID',
        paidAt: new Date(),
        notes: `Check-out payment for booking ${reservation.bookingRef}`,
      },
    });

    // 4. Update guest lifetime stays & spent
    await tx.guest.update({
      where: { id: reservation.guestId },
      data: {
        totalStays: {
          increment: 1,
        },
        totalSpent: {
          increment: finalTotalAmount,
        },
      },
    });

    return {
      reservation: updatedReservation,
      payment,
    };
  });
}; exports.checkOut = checkOut;

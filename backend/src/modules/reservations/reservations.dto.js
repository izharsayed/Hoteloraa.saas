"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }var _zod = require('zod');

 const createReservationSchema = _zod.z
  .object({
    roomId: _zod.z.string().uuid('Invalid room ID'),
    guestId: _zod.z.string().uuid('Invalid guest ID'),
    checkInDate: _zod.z.string().min(1, 'Check-in date is required'),
    checkOutDate: _zod.z.string().min(1, 'Check-out date is required'),
    adults: _zod.z.number().int().min(1).default(1),
    children: _zod.z.number().int().min(0).default(0),
    numberOfRooms: _zod.z.number().int().min(1).default(1),
    ratePerNight: _zod.z.number().positive('Rate per night must be positive'),
    ratePlan: _zod.z.string().max(50).optional(),
    extraCharges: _zod.z.number().min(0).default(0),
    taxAmount: _zod.z.number().min(0).default(0),
    discount: _zod.z.number().min(0).default(0),
    advancePaid: _zod.z.number().min(0).default(0),
    advanceMethod: _zod.z.string().max(50).optional(),
    specialRequest: _zod.z.string().max(2000).optional(),
    notes: _zod.z.string().max(2000).optional(),
    source: _zod.z.string().max(100).optional(),
    expectedArrival: _zod.z.string().max(20).optional(),
    vehicleNumber: _zod.z.string().max(50).optional(),
    companyName: _zod.z.string().max(200).optional(),
    gstNumber: _zod.z.string().max(50).optional(),
    purposeOfVisit: _zod.z.string().max(200).optional(),
  })
  .transform((data) => {
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalNights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / msPerDay));
    const roomCharges = totalNights * data.ratePerNight;
    const taxAmount = _nullishCoalesce(data.taxAmount, () => ( 0));
    const totalAmount = roomCharges + (_nullishCoalesce(data.extraCharges, () => ( 0))) + taxAmount - (_nullishCoalesce(data.discount, () => ( 0)));

    return {
      ...data,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalNights,
      roomCharges,
      taxAmount,
      totalAmount: Math.max(0, totalAmount),
    };
  }); exports.createReservationSchema = createReservationSchema;

 const updateReservationSchema = _zod.z.object({
  specialRequest: _zod.z.string().max(2000).optional(),
  notes: _zod.z.string().max(2000).optional(),
  adults: _zod.z.number().int().min(1).optional(),
  children: _zod.z.number().int().min(0).optional(),
  extraCharges: _zod.z.number().min(0).optional(),
  taxAmount: _zod.z.number().min(0).optional(),
  discount: _zod.z.number().min(0).optional(),
  advancePaid: _zod.z.number().min(0).optional(),
  advanceMethod: _zod.z.string().max(50).optional(),
  vehicleNumber: _zod.z.string().max(50).optional(),
  companyName: _zod.z.string().max(200).optional(),
  gstNumber: _zod.z.string().max(50).optional(),
  purposeOfVisit: _zod.z.string().max(200).optional(),
}); exports.updateReservationSchema = updateReservationSchema;

 const updateStatusSchema = _zod.z.object({
  status: _zod.z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW']),
}); exports.updateStatusSchema = updateStatusSchema;

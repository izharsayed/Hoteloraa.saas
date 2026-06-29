"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _errormiddleware = require('../../middleware/error.middleware');


 const getGuests = async (tenantId, search) => {
  const where = {
    tenantId,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive'  } },
        { phone: { contains: search, mode: 'insensitive'  } },
        { email: { contains: search, mode: 'insensitive'  } },
      ],
    }),
  };

  const guests = await _database2.default.guest.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      idType: true,
      idNumber: true,
      idProofUrl: true,
      gender: true,
      city: true,
      state: true,
      country: true,
      postalCode: true,
      nationality: true,
      totalStays: true,
      totalSpent: true,
      createdAt: true,
      _count: {
        select: { reservations: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return guests;
}; exports.getGuests = getGuests;

 const getGuestById = async (tenantId, id) => {
  const guest = await _database2.default.guest.findFirst({
    where: { id, tenantId },
    include: {
      reservations: {
        include: {
          room: { select: { id: true, number: true, floor: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!guest) throw _errormiddleware.createError.call(void 0, 'Guest not found', 404);
  return guest;
}; exports.getGuestById = getGuestById;

 const createGuest = async (tenantId, dto) => {
  // Check for duplicate phone within tenant
  const existing = await _database2.default.guest.findFirst({
    where: { tenantId, phone: dto.phone },
  });
  if (existing) throw _errormiddleware.createError.call(void 0, 'A guest with this phone number already exists', 409);

  const guest = await _database2.default.guest.create({
    data: {
      tenantId,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      idType: dto.idType ,
      idNumber: dto.idNumber,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      postalCode: dto.postalCode,
      nationality: dto.nationality,
      gender: dto.gender,
      dateOfBirth: dto.dateOfBirth,
      notes: dto.notes,
      idProofUrl: dto.idProofUrl,
    },
  });

  return guest;
}; exports.createGuest = createGuest;

 const updateGuest = async (tenantId, id, dto) => {
  const guest = await _database2.default.guest.findFirst({ where: { id, tenantId } });
  if (!guest) throw _errormiddleware.createError.call(void 0, 'Guest not found', 404);

  // If phone is being changed, check uniqueness
  if (dto.phone && dto.phone !== guest.phone) {
    const conflict = await _database2.default.guest.findFirst({
      where: { tenantId, phone: dto.phone, id: { not: id } },
    });
    if (conflict) throw _errormiddleware.createError.call(void 0, 'A guest with this phone number already exists', 409);
  }

  const updated = await _database2.default.guest.update({
    where: { id },
    data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.idType !== undefined && { idType: dto.idType  }),
      ...(dto.idNumber !== undefined && { idNumber: dto.idNumber }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.state !== undefined && { state: dto.state }),
      ...(dto.country !== undefined && { country: dto.country }),
      ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
      ...(dto.nationality !== undefined && { nationality: dto.nationality }),
      ...(dto.gender !== undefined && { gender: dto.gender }),
      ...(dto.dateOfBirth !== undefined && { dateOfBirth: dto.dateOfBirth }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.idProofUrl !== undefined && { idProofUrl: dto.idProofUrl }),
    },
  });

  return updated;
}; exports.updateGuest = updateGuest;

 const getGuestHistory = async (tenantId, id) => {
  const guest = await _database2.default.guest.findFirst({ where: { id, tenantId } });
  if (!guest) throw _errormiddleware.createError.call(void 0, 'Guest not found', 404);

  const reservations = await _database2.default.reservation.findMany({
    where: { guestId: id, tenantId },
    include: {
      room: {
        include: {
          roomType: { select: { id: true, name: true, basePrice: true } },
        },
      },
      payment: {
        select: { id: true, amount: true, method: true, status: true, paidAt: true },
      },
      checkedInBy: { select: { id: true, name: true } },
      checkedOutBy: { select: { id: true, name: true } },
    },
    orderBy: { checkInDate: 'desc' },
  });

  return {
    guest: {
      id: guest.id,
      name: guest.name,
      phone: guest.phone,
      email: guest.email,
      totalStays: guest.totalStays,
      totalSpent: guest.totalSpent,
    },
    reservations,
  };
}; exports.getGuestHistory = getGuestHistory;

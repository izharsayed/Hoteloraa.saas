"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }
var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _errormiddleware = require('../../middleware/error.middleware');


// ─── List Rooms ───────────────────────────────────────────────────────────────

 const getRooms = async (tenantId, status) => {
  const where = { tenantId, isActive: true };

  if (status) {
    const validStatuses = [
      'AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'CHECKOUT_PENDING', 'CLEANING',
    ];
    if (!validStatuses.includes(status.toUpperCase())) {
      throw _errormiddleware.createError.call(void 0, `Invalid status value: ${status}`, 400);
    }
    where.status = status.toUpperCase() ;
  }

  return _database2.default.room.findMany({
    where,
    include: {
      roomType: {
        select: {
          id: true,
          name: true,
          basePrice: true,
          maxOccupancy: true,
          amenities: true,
          imageUrl: true,
        },
      },
    },
    orderBy: [{ floor: 'asc' }, { number: 'asc' }],
  });
}; exports.getRooms = getRooms;

// ─── Get Room By ID ───────────────────────────────────────────────────────────

 const getRoomById = async (tenantId, id) => {
  const room = await _database2.default.room.findFirst({
    where: { id, tenantId, isActive: true },
    include: {
      roomType: true,
      reservations: {
        where: {
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        },
        include: {
          guest: {
            select: { id: true, name: true, phone: true, email: true },
          },
        },
        orderBy: { checkInDate: 'asc' },
        take: 1,
      },
    },
  });

  if (!room) throw _errormiddleware.createError.call(void 0, 'Room not found', 404);

  return {
    ...room,
    currentReservation: _nullishCoalesce(room.reservations[0], () => ( null)),
    reservations: undefined,
  };
}; exports.getRoomById = getRoomById;

// ─── Create Room ──────────────────────────────────────────────────────────────

 const createRoom = async (tenantId, dto) => {
  // Verify the room type belongs to this tenant
  const roomType = await _database2.default.roomType.findFirst({
    where: { id: dto.roomTypeId, tenantId, isActive: true },
  });
  if (!roomType) throw _errormiddleware.createError.call(void 0, 'Room type not found', 404);

  // Enforce unique room number within the tenant
  const duplicate = await _database2.default.room.findUnique({
    where: { tenantId_number: { tenantId, number: dto.number } },
  });
  if (duplicate) throw _errormiddleware.createError.call(void 0, `Room number "${dto.number}" already exists in this property`, 409);

  return _database2.default.room.create({
    data: {
      tenantId,
      roomTypeId: dto.roomTypeId,
      number: dto.number,
      floor: dto.floor,
      description: dto.description,
    },
    include: {
      roomType: {
        select: {
          id: true,
          name: true,
          basePrice: true,
          maxOccupancy: true,
          amenities: true,
        },
      },
    },
  });
}; exports.createRoom = createRoom;

// ─── Update Room ──────────────────────────────────────────────────────────────

 const updateRoom = async (tenantId, id, dto) => {
  const room = await _database2.default.room.findFirst({
    where: { id, tenantId, isActive: true },
  });
  if (!room) throw _errormiddleware.createError.call(void 0, 'Room not found', 404);

  // Check for duplicate number if number is being changed
  if (dto.number && dto.number !== room.number) {
    const duplicate = await _database2.default.room.findUnique({
      where: { tenantId_number: { tenantId, number: dto.number } },
    });
    if (duplicate) throw _errormiddleware.createError.call(void 0, `Room number "${dto.number}" already exists in this property`, 409);
  }

  return _database2.default.room.update({
    where: { id },
    data: {
      ...(dto.number !== undefined && { number: dto.number }),
      ...(dto.floor !== undefined && { floor: dto.floor }),
      ...(dto.description !== undefined && { description: dto.description }),
    },
    include: {
      roomType: {
        select: { id: true, name: true, basePrice: true, maxOccupancy: true },
      },
    },
  });
}; exports.updateRoom = updateRoom;

// ─── Update Room Status ───────────────────────────────────────────────────────

 const updateRoomStatus = async (tenantId, id, status) => {
  const room = await _database2.default.room.findFirst({
    where: { id, tenantId, isActive: true },
  });
  if (!room) throw _errormiddleware.createError.call(void 0, 'Room not found', 404);

  return _database2.default.room.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      number: true,
      floor: true,
      status: true,
      updatedAt: true,
    },
  });
}; exports.updateRoomStatus = updateRoomStatus;

// ─── Soft Delete Room ─────────────────────────────────────────────────────────

 const deleteRoom = async (tenantId, id) => {
  const room = await _database2.default.room.findFirst({
    where: { id, tenantId, isActive: true },
  });
  if (!room) throw _errormiddleware.createError.call(void 0, 'Room not found', 404);

  // Prevent deletion if there is an active reservation
  const activeReservation = await _database2.default.reservation.findFirst({
    where: {
      roomId: id,
      tenantId,
      status: { in: ['CONFIRMED', 'CHECKED_IN'] },
    },
  });

  if (activeReservation) {
    throw _errormiddleware.createError.call(void 0, 
      'Cannot delete room — it has an active or upcoming reservation. Cancel or check-out first.',
      400
    );
  }

  return _database2.default.room.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, number: true, isActive: true },
  });
}; exports.deleteRoom = deleteRoom;

// ─── Get Available Rooms ──────────────────────────────────────────────────────

 const getAvailableRooms = async (
  tenantId,
  checkIn,
  checkOut,
  roomTypeId
) => {
  if (checkOut <= checkIn) {
    throw _errormiddleware.createError.call(void 0, 'Check-out date must be after check-in date', 400);
  }

  // Find rooms that have NO overlapping confirmed/checked_in reservations
  const bookedRoomIds = await _database2.default.reservation.findMany({
    where: {
      tenantId,
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      AND: [
        { checkInDate: { lt: checkOut } },
        { checkOutDate: { gt: checkIn } },
      ],
    },
    select: { roomId: true },
  });

  const bookedIds = bookedRoomIds.map((r) => r.roomId);

  return _database2.default.room.findMany({
    where: {
      tenantId,
      isActive: true,
      status: { not: 'MAINTENANCE' },
      id: { notIn: bookedIds },
      ...(roomTypeId && { roomTypeId }),
    },
    include: {
      roomType: {
        select: {
          id: true,
          name: true,
          basePrice: true,
          maxOccupancy: true,
          amenities: true,
          imageUrl: true,
        },
      },
    },
    orderBy: [{ floor: 'asc' }, { number: 'asc' }],
  });
}; exports.getAvailableRooms = getAvailableRooms;

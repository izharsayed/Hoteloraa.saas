"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }


var _helpers = require('../../shared/helpers');
var _errormiddleware = require('../../middleware/error.middleware');
var _roomsservice = require('./rooms.service'); var roomsService = _interopRequireWildcard(_roomsservice);

 const getRooms = async (req, res, next) => {
  try {
    const status = req.query.status ;
    const data = await roomsService.getRooms(req.user.tenantId, status);
    _helpers.sendSuccess.call(void 0, res, data, 'Rooms retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getRooms = getRooms;

 const getAvailableRooms = async (req, res, next) => {
  try {
    const { checkIn, checkOut, roomTypeId } = req.query ;

    if (!checkIn || !checkOut) {
      throw _errormiddleware.createError.call(void 0, 'Query parameters checkIn and checkOut are required (ISO date strings)', 400);
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      throw _errormiddleware.createError.call(void 0, 'checkIn and checkOut must be valid ISO date strings', 400);
    }

    const data = await roomsService.getAvailableRooms(req.user.tenantId, checkInDate, checkOutDate, roomTypeId);
    _helpers.sendSuccess.call(void 0, res, data, 'Available rooms retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getAvailableRooms = getAvailableRooms;

 const getRoomById = async (req, res, next) => {
  try {
    const data = await roomsService.getRoomById(req.user.tenantId, req.params.id);
    _helpers.sendSuccess.call(void 0, res, data, 'Room retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getRoomById = getRoomById;

 const createRoom = async (req, res, next) => {
  try {
    const data = await roomsService.createRoom(req.user.tenantId, req.body);
    _helpers.sendSuccess.call(void 0, res, data, 'Room created successfully', 201);
  } catch (err) {
    next(err);
  }
}; exports.createRoom = createRoom;

 const updateRoom = async (req, res, next) => {
  try {
    const data = await roomsService.updateRoom(req.user.tenantId, req.params.id, req.body);
    _helpers.sendSuccess.call(void 0, res, data, 'Room updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updateRoom = updateRoom;

 const updateRoomStatus = async (req, res, next) => {
  try {
    const data = await roomsService.updateRoomStatus(
      req.user.tenantId,
      req.params.id,
      req.body.status 
    );
    _helpers.sendSuccess.call(void 0, res, data, 'Room status updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updateRoomStatus = updateRoomStatus;

 const deleteRoom = async (req, res, next) => {
  try {
    await roomsService.deleteRoom(req.user.tenantId, req.params.id);
    _helpers.sendSuccess.call(void 0, res, null, 'Room deactivated successfully');
  } catch (err) {
    next(err);
  }
}; exports.deleteRoom = deleteRoom;

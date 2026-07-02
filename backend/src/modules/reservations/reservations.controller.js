"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _helpers = require('../../shared/helpers');
var _reservationsservice = require('./reservations.service'); var reservationsService = _interopRequireWildcard(_reservationsservice);

 const getReservations = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const reservations = await reservationsService.getReservations(tenantId, req.query);
    _helpers.sendSuccess.call(void 0, res, reservations, 'Reservations retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getReservations = getReservations;

 const getReservationById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const reservation = await reservationsService.getReservationById(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, reservation, 'Reservation retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getReservationById = getReservationById;

 const createReservation = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const reservation = await reservationsService.createReservation(tenantId, req.body);
    _helpers.sendSuccess.call(void 0, res, reservation, 'Reservation created successfully', 201);
  } catch (err) {
    next(err);
  }
}; exports.createReservation = createReservation;

 const updateReservation = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const reservation = await reservationsService.updateReservation(tenantId, id, req.body);
    _helpers.sendSuccess.call(void 0, res, reservation, 'Reservation updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updateReservation = updateReservation;

 const updateStatus = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { status } = req.body;
    const reservation = await reservationsService.updateStatus(tenantId, id, status);
    _helpers.sendSuccess.call(void 0, res, reservation, `Reservation status updated to ${status}`);
  } catch (err) {
    next(err);
  }
}; exports.updateStatus = updateStatus;

 const cancelReservation = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const reservation = await reservationsService.cancelReservation(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, reservation, 'Reservation cancelled successfully');
  } catch (err) {
    next(err);
  }
}; exports.cancelReservation = cancelReservation;

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _helpers = require('../../shared/helpers');
var _guestsservice = require('./guests.service'); var guestsService = _interopRequireWildcard(_guestsservice);

 const getGuests = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const search = req.query.search ;
    const guests = await guestsService.getGuests(tenantId, search);
    _helpers.sendSuccess.call(void 0, res, guests, 'Guests retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getGuests = getGuests;

 const getGuestById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const guest = await guestsService.getGuestById(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, guest, 'Guest retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getGuestById = getGuestById;

 const createGuest = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const guest = await guestsService.createGuest(tenantId, req.body);
    _helpers.sendSuccess.call(void 0, res, guest, 'Guest created successfully', 201);
  } catch (err) {
    next(err);
  }
}; exports.createGuest = createGuest;

 const updateGuest = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const guest = await guestsService.updateGuest(tenantId, id, req.body);
    _helpers.sendSuccess.call(void 0, res, guest, 'Guest updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updateGuest = updateGuest;

 const getGuestHistory = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const history = await guestsService.getGuestHistory(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, history, 'Guest history retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getGuestHistory = getGuestHistory;

 const uploadGuestIdProof = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No file uploaded');
      err.statusCode = 400;
      throw err;
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    _helpers.sendSuccess.call(void 0, res, { url: fileUrl }, 'ID Proof uploaded successfully');
  } catch (err) {
    next(err);
  }
}; exports.uploadGuestIdProof = uploadGuestIdProof;

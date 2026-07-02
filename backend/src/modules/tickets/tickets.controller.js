"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }
var _ticketsservice = require('./tickets.service'); var ticketsService = _interopRequireWildcard(_ticketsservice);
var _helpers = require('../../shared/helpers');

 const createTicket = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const result = await ticketsService.createTicket(tenantId, userId, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'Ticket created successfully', 201);
  } catch (err) {
    next(err);
  }
}; exports.createTicket = createTicket;

 const getTenantTickets = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await ticketsService.getTenantTickets(tenantId);
    _helpers.sendSuccess.call(void 0, res, result, 'Tickets retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getTenantTickets = getTenantTickets;

 const getAllTickets = async (req, res, next) => {
  try {
    const result = await ticketsService.getAllTickets();
    _helpers.sendSuccess.call(void 0, res, result, 'All tickets retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getAllTickets = getAllTickets;

 const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await ticketsService.updateTicket(id, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'Ticket updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updateTicket = updateTicket;

const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new Error('No file uploaded or file type not allowed'));
    }
    const relativeUrl = `/uploads/${req.file.filename}`;
    _helpers.sendSuccess.call(void 0, res, { attachmentUrl: relativeUrl }, 'File uploaded successfully');
  } catch (err) {
    next(err);
  }
}; exports.uploadAttachment = uploadAttachment;

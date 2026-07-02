"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _paymentsservice = require('./payments.service'); var paymentsService = _interopRequireWildcard(_paymentsservice);
var _helpers = require('../../shared/helpers');

 const getPayments = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await paymentsService.getPayments(tenantId, req.query);
    _helpers.sendSuccess.call(void 0, res, result, 'Payments retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getPayments = getPayments;

 const getPaymentById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const result = await paymentsService.getPaymentById(tenantId, id);
    _helpers.sendSuccess.call(void 0, res, result, 'Payment retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getPaymentById = getPaymentById;

 const createPayment = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.id;
    const result = await paymentsService.createPayment(tenantId, userId, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'Payment registered successfully', 201);
  } catch (err) {
    next(err);
  }
}; exports.createPayment = createPayment;

 const getPaymentSummary = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { date } = req.query;
    const result = await paymentsService.getPaymentSummary(tenantId, date );
    _helpers.sendSuccess.call(void 0, res, result, 'Payment summary retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getPaymentSummary = getPaymentSummary;

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _paymentscontroller = require('./payments.controller'); var paymentsController = _interopRequireWildcard(_paymentscontroller);
var _authmiddleware = require('../../middleware/auth.middleware');
var _validatemiddleware = require('../../middleware/validate.middleware');
var _paymentsdto = require('./payments.dto');

const router = _express.Router.call(void 0, );

router.use(_authmiddleware.authenticate);

router.get('/', _authmiddleware.checkPermission.call(void 0, 'PAYMENTS', 'READ'), paymentsController.getPayments);
router.get('/summary', _authmiddleware.checkPermission.call(void 0, 'PAYMENTS', 'READ'), paymentsController.getPaymentSummary);
router.get('/:id', _authmiddleware.checkPermission.call(void 0, 'PAYMENTS', 'READ'), paymentsController.getPaymentById);
router.post('/', _authmiddleware.checkPermission.call(void 0, 'PAYMENTS', 'CREATE'), _validatemiddleware.validate.call(void 0, _paymentsdto.createPaymentSchema), paymentsController.createPayment);

exports. default = router;

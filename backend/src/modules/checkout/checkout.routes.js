"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _checkoutcontroller = require('./checkout.controller'); var checkOutController = _interopRequireWildcard(_checkoutcontroller);
var _authmiddleware = require('../../middleware/auth.middleware');
var _validatemiddleware = require('../../middleware/validate.middleware');
var _checkoutdto = require('./checkout.dto');

const router = _express.Router.call(void 0, );

router.use(_authmiddleware.authenticate);

router.get('/pending', _authmiddleware.checkPermission.call(void 0, 'CHECKOUT', 'READ'), checkOutController.getPendingCheckOuts);
router.get('/today', _authmiddleware.checkPermission.call(void 0, 'CHECKOUT', 'READ'), checkOutController.getTodayCheckOuts);
router.post('/', _authmiddleware.checkPermission.call(void 0, 'CHECKOUT', 'CREATE'), _validatemiddleware.validate.call(void 0, _checkoutdto.checkOutSchema), checkOutController.checkOut);

exports. default = router;

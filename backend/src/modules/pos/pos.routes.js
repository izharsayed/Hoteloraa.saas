"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _poscontroller = require('./pos.controller'); var posController = _interopRequireWildcard(_poscontroller);
var _authmiddleware = require('../../middleware/auth.middleware');
var _validatemiddleware = require('../../middleware/validate.middleware');
var _posdto = require('./pos.dto');

const router = _express.Router.call(void 0, );

router.use(_authmiddleware.authenticate);

router.get('/data', _authmiddleware.checkPermission.call(void 0, 'POS', 'READ'), posController.getPOSData);
router.post('/quick-order', _authmiddleware.checkPermission.call(void 0, 'POS', 'CREATE'), _validatemiddleware.validate.call(void 0, _posdto.quickOrderSchema), posController.quickOrder);

exports. default = router;

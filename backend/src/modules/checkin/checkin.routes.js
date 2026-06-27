"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _authmiddleware = require('../../middleware/auth.middleware');
var _validatemiddleware = require('../../middleware/validate.middleware');
var _checkindto = require('./checkin.dto');
var _checkincontroller = require('./checkin.controller'); var checkInController = _interopRequireWildcard(_checkincontroller);

const router = _express.Router.call(void 0, );

// All routes require a valid JWT
router.use(_authmiddleware.authenticate);

// GET /checkin/pending  — CONFIRMED reservations due for check-in
router.get('/pending', _authmiddleware.checkPermission.call(void 0, 'CHECKIN', 'READ'), checkInController.getPendingCheckIns);

// GET /checkin/today   — reservations checked in today
router.get('/today', _authmiddleware.checkPermission.call(void 0, 'CHECKIN', 'READ'), checkInController.getTodayCheckIns);

// POST /checkin        — perform check-in (body validated against checkInSchema)
router.post('/', _authmiddleware.checkPermission.call(void 0, 'CHECKIN', 'CREATE'), _validatemiddleware.validate.call(void 0, _checkindto.checkInSchema), checkInController.checkIn);

exports. default = router;

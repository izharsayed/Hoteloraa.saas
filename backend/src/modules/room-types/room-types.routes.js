"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _authmiddleware = require('../../middleware/auth.middleware');
var _validatemiddleware = require('../../middleware/validate.middleware');
var _roomtypesdto = require('./room-types.dto');
var _roomtypescontroller = require('./room-types.controller'); var roomTypesController = _interopRequireWildcard(_roomtypescontroller);

const router = _express.Router.call(void 0, );

// All room-type routes require authentication
router.use(_authmiddleware.authenticate);

router.get('/', _authmiddleware.checkPermission.call(void 0, 'ROOM_TYPES', 'READ'), roomTypesController.getRoomTypes);
router.get('/:id', _authmiddleware.checkPermission.call(void 0, 'ROOM_TYPES', 'READ'), roomTypesController.getRoomTypeById);
router.post('/', _authmiddleware.checkPermission.call(void 0, 'ROOM_TYPES', 'CREATE'), _validatemiddleware.validate.call(void 0, _roomtypesdto.createRoomTypeSchema), roomTypesController.createRoomType);
router.put('/:id', _authmiddleware.checkPermission.call(void 0, 'ROOM_TYPES', 'UPDATE'), _validatemiddleware.validate.call(void 0, _roomtypesdto.updateRoomTypeSchema), roomTypesController.updateRoomType);
router.delete('/:id', _authmiddleware.checkPermission.call(void 0, 'ROOM_TYPES', 'DELETE'), roomTypesController.deleteRoomType);

exports. default = router;

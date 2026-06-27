"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _foliocontroller = require('./folio.controller'); var folioController = _interopRequireWildcard(_foliocontroller);
var _authmiddleware = require('../../middleware/auth.middleware');
var _validatemiddleware = require('../../middleware/validate.middleware');
var _foliodto = require('./folio.dto');

const router = _express.Router.call(void 0, );

router.use(_authmiddleware.authenticate);

router.get('/payment/:paymentId', _authmiddleware.checkPermission.call(void 0, 'FOLIO', 'READ'), folioController.getFolioByPaymentId);
router.get('/reservation/:reservationId', _authmiddleware.checkPermission.call(void 0, 'FOLIO', 'READ'), folioController.getGuestFolio); // Detailed folio statement
router.get('/reservation/:reservationId/raw', _authmiddleware.checkPermission.call(void 0, 'FOLIO', 'READ'), folioController.getFolioByReservationId); // Raw folio items list
router.post('/item', _authmiddleware.checkPermission.call(void 0, 'FOLIO', 'CREATE'), _validatemiddleware.validate.call(void 0, _foliodto.addFolioItemSchema), folioController.addFolioItem);

exports. default = router;

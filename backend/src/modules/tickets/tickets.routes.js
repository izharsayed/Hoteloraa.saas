"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _ticketscontroller = require('./tickets.controller'); var ticketsController = _interopRequireWildcard(_ticketscontroller);
var _authmiddleware = require('../../middleware/auth.middleware');
var _validatemiddleware = require('../../middleware/validate.middleware');
var _ticketsdto = require('./tickets.dto');
var _uploadmiddleware = require('../../middleware/upload.middleware');

const router = _express.Router.call(void 0, );

router.use(_authmiddleware.authenticate);

router.post('/upload', _uploadmiddleware.uploadImage.single('file'), ticketsController.uploadAttachment);
router.post('/', _validatemiddleware.validate.call(void 0, _ticketsdto.createTicketSchema), ticketsController.createTicket);
router.get('/', ticketsController.getTenantTickets);

exports. default = router;

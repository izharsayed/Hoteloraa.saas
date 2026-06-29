"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _authmiddleware = require('../../middleware/auth.middleware');
var _validatemiddleware = require('../../middleware/validate.middleware');
var _uploadmiddleware = require('../../middleware/upload.middleware');
var _guestsdto = require('./guests.dto');
var _guestscontroller = require('./guests.controller'); var guestsController = _interopRequireWildcard(_guestscontroller);

const router = _express.Router.call(void 0, );

// All routes require authentication
router.use(_authmiddleware.authenticate);

router.get('/',            _authmiddleware.checkPermission.call(void 0, 'GUESTS', 'READ'),   guestsController.getGuests);
router.get('/:id',         _authmiddleware.checkPermission.call(void 0, 'GUESTS', 'READ'),   guestsController.getGuestById);
router.get('/:id/history', _authmiddleware.checkPermission.call(void 0, 'GUESTS', 'READ'),   guestsController.getGuestHistory);
router.post('/',           _authmiddleware.checkPermission.call(void 0, 'GUESTS', 'CREATE'), _validatemiddleware.validate.call(void 0, _guestsdto.createGuestSchema), guestsController.createGuest);
router.put('/:id',         _authmiddleware.checkPermission.call(void 0, 'GUESTS', 'UPDATE'), _validatemiddleware.validate.call(void 0, _guestsdto.updateGuestSchema), guestsController.updateGuest);
router.post('/upload-id',  _authmiddleware.checkPermission.call(void 0, 'GUESTS', 'CREATE'), _uploadmiddleware.uploadImage.single('file'), guestsController.uploadGuestIdProof);

exports. default = router;

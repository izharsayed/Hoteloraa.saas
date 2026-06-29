"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _authcontroller = require('./auth.controller'); var authController = _interopRequireWildcard(_authcontroller);
var _authmiddleware = require('../../middleware/auth.middleware');
var _validatemiddleware = require('../../middleware/validate.middleware');
var _authdto = require('./auth.dto');

const router = _express.Router.call(void 0, );

router.post('/register', _validatemiddleware.validate.call(void 0, _authdto.registerTenantSchema), authController.register);
router.post('/login', _validatemiddleware.validate.call(void 0, _authdto.loginSchema), authController.login);
router.post('/logout', _authmiddleware.authenticate, authController.logout);
router.get('/profile', _authmiddleware.authenticate, authController.getProfile);
router.put('/change-password', _authmiddleware.authenticate, _validatemiddleware.validate.call(void 0, _authdto.changePasswordSchema), authController.changePassword);

// Password reset (public — no auth required)
router.get('/verify-email', authController.verifyEmail);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', _validatemiddleware.validate.call(void 0, _authdto.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', _validatemiddleware.validate.call(void 0, _authdto.resetPasswordSchema), authController.resetPassword);


exports. default = router;


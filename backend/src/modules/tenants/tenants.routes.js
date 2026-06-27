"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _tenantscontroller = require('./tenants.controller'); var tenantsController = _interopRequireWildcard(_tenantscontroller);
var _authmiddleware = require('../../middleware/auth.middleware');
var _validatemiddleware = require('../../middleware/validate.middleware');
var _tenantsdto = require('./tenants.dto');

const router = _express.Router.call(void 0, );

router.use(_authmiddleware.authenticate);

router.get('/profile', _authmiddleware.checkPermission.call(void 0, 'SETTINGS', 'READ'), tenantsController.getTenantProfile);
router.put('/profile', _authmiddleware.checkPermission.call(void 0, 'SETTINGS', 'UPDATE'), _validatemiddleware.validate.call(void 0, _tenantsdto.updateTenantSchema), tenantsController.updateTenant);
router.get('/features', _authmiddleware.checkPermission.call(void 0, 'SETTINGS', 'READ'), tenantsController.getTenantFeatures);
router.patch('/features/:feature/toggle', _authmiddleware.authorize.call(void 0, 'SUPER_ADMIN', 'TENANT_ADMIN'), _authmiddleware.checkPermission.call(void 0, 'SETTINGS', 'UPDATE'), tenantsController.toggleFeature);

exports. default = router;

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _express = require('express');
var _authmiddleware = require('../../middleware/auth.middleware');
var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _helpers = require('../../shared/helpers');



const router = _express.Router.call(void 0, );

router.use(_authmiddleware.authenticate);

// GET /features - list tenant features
router.get('/', _authmiddleware.checkPermission.call(void 0, 'SETTINGS', 'READ'), async (req, res, next) => {
  try {
    const features = await _database2.default.tenantFeature.findMany({ where: { tenantId: req.user.tenantId } });
    _helpers.sendSuccess.call(void 0, res, features);
  } catch (err) { next(err); }
});

// PATCH /features/:feature/toggle
router.patch('/:feature/toggle', _authmiddleware.checkPermission.call(void 0, 'SETTINGS', 'UPDATE'), async (req, res, next) => {
  try {
    const { feature } = req.params;
    const existing = await _database2.default.tenantFeature.findUnique({ where: { tenantId_feature: { tenantId: req.user.tenantId, feature } } });
    
    if (!existing) {
      const created = await _database2.default.tenantFeature.create({ data: { tenantId: req.user.tenantId, feature, isEnabled: true } });
      return _helpers.sendSuccess.call(void 0, res, created, 'Feature enabled');
    }
    
    const updated = await _database2.default.tenantFeature.update({ where: { tenantId_feature: { tenantId: req.user.tenantId, feature } }, data: { isEnabled: !existing.isEnabled } });
    _helpers.sendSuccess.call(void 0, res, updated, `Feature ${updated.isEnabled ? 'enabled' : 'disabled'}`);
  } catch (err) { next(err); }
});

exports. default = router;

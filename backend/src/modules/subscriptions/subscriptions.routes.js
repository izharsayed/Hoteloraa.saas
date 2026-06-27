"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _express = require('express');
var _authmiddleware = require('../../middleware/auth.middleware');
var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _helpers = require('../../shared/helpers');



const router = _express.Router.call(void 0, );

router.use(_authmiddleware.authenticate);

// GET current subscription
router.get('/', _authmiddleware.checkPermission.call(void 0, 'SETTINGS', 'READ'), async (req, res, next) => {
  try {
    const subscription = await _database2.default.subscription.findUnique({ where: { tenantId: req.user.tenantId } });
    _helpers.sendSuccess.call(void 0, res, subscription);
  } catch (err) { next(err); }
});

// PUT upgrade plan (SUPER_ADMIN only in full impl)
router.put('/upgrade', _authmiddleware.authorize.call(void 0, 'SUPER_ADMIN', 'TENANT_ADMIN'), _authmiddleware.checkPermission.call(void 0, 'SETTINGS', 'UPDATE'), async (req, res, next) => {
  try {
    const { plan, endDate } = req.body;
    const subscription = await _database2.default.subscription.update({
      where: { tenantId: req.user.tenantId },
      data: { plan, status: 'ACTIVE', endDate: endDate ? new Date(endDate) : undefined },
    });
    _helpers.sendSuccess.call(void 0, res, subscription, 'Subscription updated');
  } catch (err) { next(err); }
});

exports. default = router;

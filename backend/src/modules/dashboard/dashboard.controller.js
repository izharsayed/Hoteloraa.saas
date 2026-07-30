"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _dashboardservice = require('./dashboard.service'); var dashboardService = _interopRequireWildcard(_dashboardservice);
var _database = require('../../config/database'); var _database2 = _interopRequireDefault(_database);
var _helpers = require('../../shared/helpers');
var _errormiddleware = require('../../middleware/error.middleware');

 const getDashboard = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const tenant = await _database2.default.tenant.findUnique({
      where: { id: tenantId },
      select: { businessType: true },
    });

    if (!tenant) {
      throw _errormiddleware.createError.call(void 0, 'Tenant not found', 404);
    }

    const result = await dashboardService.getDashboard(tenantId, tenant.businessType);
    _helpers.sendSuccess.call(void 0, res, { ...result, businessType: tenant.businessType }, 'Dashboard metrics retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getDashboard = getDashboard;

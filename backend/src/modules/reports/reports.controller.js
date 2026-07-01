"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _reportsservice = require('./reports.service'); var reportsService = _interopRequireWildcard(_reportsservice);
var _helpers = require('../../shared/helpers');

 const generateReport = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await reportsService.generateReport(tenantId, req.query);
    _helpers.sendSuccess.call(void 0, res, result, 'Report generated and saved successfully');
  } catch (err) {
    next(err);
  }
}; exports.generateReport = generateReport;

 const getSavedReports = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await reportsService.getSavedReports(tenantId);
    _helpers.sendSuccess.call(void 0, res, result, 'Saved reports retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getSavedReports = getSavedReports;

// GET /reports/dashboard — read-only, no DB write, returns all KPIs in one shot
 const getDashboard = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const today = new Date();
    const endDateStr = today.toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(today.getDate() - 6);
    const startDateStr = startDate.toISOString().split('T')[0];

    const [occupancy, revenue, sales] = await Promise.all([
      reportsService.getOccupancyReport(tenantId, startDateStr, endDateStr),
      reportsService.getRevenueReport(tenantId, startDateStr, endDateStr),
      reportsService.getDailySalesReport(tenantId, startDateStr, endDateStr),
    ]);

    _helpers.sendSuccess.call(void 0, res, { occupancy, revenue, sales }, 'Dashboard data loaded');
  } catch (err) {
    next(err);
  }
}; exports.getDashboard = getDashboard;

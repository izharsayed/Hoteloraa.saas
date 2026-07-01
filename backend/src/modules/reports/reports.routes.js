"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _reportscontroller = require('./reports.controller'); var reportsController = _interopRequireWildcard(_reportscontroller);
var _authmiddleware = require('../../middleware/auth.middleware');
var _reportsdto = require('./reports.dto');

const router = _express.Router.call(void 0, );

router.use(_authmiddleware.authenticate);

// Inline query validator (req.query not body)
const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: result.error.flatten().fieldErrors,
    });
  }
  req.query = result.data;
  next();
};

router.get('/',          _authmiddleware.checkPermission.call(void 0, 'REPORTS', 'READ'), validateQuery(_reportsdto.reportQuerySchema), reportsController.generateReport);
router.get('/saved',     _authmiddleware.checkPermission.call(void 0, 'REPORTS', 'READ'), reportsController.getSavedReports);
router.get('/dashboard', _authmiddleware.checkPermission.call(void 0, 'REPORTS', 'READ'), reportsController.getDashboard);

exports. default = router;

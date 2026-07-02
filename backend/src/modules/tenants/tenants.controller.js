"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _tenantsservice = require('./tenants.service'); var tenantsService = _interopRequireWildcard(_tenantsservice);
var _helpers = require('../../shared/helpers');

 const getTenantProfile = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await tenantsService.getTenantProfile(tenantId);
    _helpers.sendSuccess.call(void 0, res, result, 'Tenant profile retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getTenantProfile = getTenantProfile;

 const updateTenant = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await tenantsService.updateTenant(tenantId, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'Tenant profile updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updateTenant = updateTenant;

 const getTenantFeatures = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await tenantsService.getTenantFeatures(tenantId);
    _helpers.sendSuccess.call(void 0, res, result, 'Tenant features retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getTenantFeatures = getTenantFeatures;

 const toggleFeature = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { feature } = req.params;
    const result = await tenantsService.toggleFeature(tenantId, feature);
    _helpers.sendSuccess.call(void 0, res, result, `Feature ${feature} toggled successfully`);
  } catch (err) {
    next(err);
  }
}; exports.toggleFeature = toggleFeature;

 const exportTenant = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const data = await tenantsService.exportTenantData(tenantId);

    const filename = `${(data.tenant.name || 'hotel').replace(/[^a-z0-9]/gi, '-').toLowerCase()}-export-${new Date().toISOString().slice(0, 10)}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(JSON.stringify(data, null, 2));
  } catch (err) {
    next(err);
  }
}; exports.exportTenant = exportTenant;

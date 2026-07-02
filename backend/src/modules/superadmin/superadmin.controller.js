"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _superadminservice = require('./superadmin.service'); var superadminService = _interopRequireWildcard(_superadminservice);
var _helpers = require('../../shared/helpers');

// Overview Metrics
 const getOverviewMetrics = async (req, res, next) => {
  try {
    const result = await superadminService.getOverviewMetrics();
    _helpers.sendSuccess.call(void 0, res, result, 'System overview statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getOverviewMetrics = getOverviewMetrics;

// Tenants
 const getAllTenants = async (req, res, next) => {
  try {
    const result = await superadminService.getAllTenants(req.query);
    _helpers.sendSuccess.call(void 0, res, result, 'All cluster tenants retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getAllTenants = getAllTenants;

 const createTenant = async (req, res, next) => {
  try {
    const result = await superadminService.createTenant(req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'New SaaS tenant created and provisioned successfully');
  } catch (err) {
    next(err);
  }
}; exports.createTenant = createTenant;

 const toggleTenantStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await superadminService.toggleTenantStatus(id);
    _helpers.sendSuccess.call(void 0, res, result, 'Tenant status toggled successfully');
  } catch (err) {
    next(err);
  }
}; exports.toggleTenantStatus = toggleTenantStatus;

 const configureTenantFeatures = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await superadminService.configureTenantFeatures(id, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'Tenant operational features configured successfully');
  } catch (err) {
    next(err);
  }
}; exports.configureTenantFeatures = configureTenantFeatures;

 const configureTenantPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await superadminService.configureTenantPlan(id, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'Tenant subscription plan changed successfully');
  } catch (err) {
    next(err);
  }
}; exports.configureTenantPlan = configureTenantPlan;

 const deleteTenant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await superadminService.deleteTenant(id);
    _helpers.sendSuccess.call(void 0, res, result, 'Tenant deleted successfully from cluster database');
  } catch (err) {
    next(err);
  }
}; exports.deleteTenant = deleteTenant;

// Subscriptions
 const getSubscriptionPlans = async (req, res, next) => {
  try {
    const result = await superadminService.getSubscriptionPlans();
    _helpers.sendSuccess.call(void 0, res, result, 'Subscription pricing tiers retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getSubscriptionPlans = getSubscriptionPlans;

// Users
 const getAllUsers = async (req, res, next) => {
  try {
    const result = await superadminService.getAllUsers(req.query);
    _helpers.sendSuccess.call(void 0, res, result, 'All system staff users retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getAllUsers = getAllUsers;

 const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await superadminService.toggleUserStatus(id);
    _helpers.sendSuccess.call(void 0, res, result, 'User status toggled successfully');
  } catch (err) {
    next(err);
  }
}; exports.toggleUserStatus = toggleUserStatus;

 const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await superadminService.resetUserPassword(id, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'User password reset successfully');
  } catch (err) {
    next(err);
  }
}; exports.resetUserPassword = resetUserPassword;

// Audit Logs
 const getAuditLogs = async (req, res, next) => {
  try {
    const result = await superadminService.getAuditLogs(req.query);
    _helpers.sendSuccess.call(void 0, res, result, 'Audit logs retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getAuditLogs = getAuditLogs;

 const createSimulatedLog = async (req, res, next) => {
  try {
    const result = await superadminService.createSimulatedLog(req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'Simulated log registered successfully');
  } catch (err) {
    next(err);
  }
}; exports.createSimulatedLog = createSimulatedLog;

// Global RBAC
 const getGlobalRoles = async (req, res, next) => {
  try {
    const result = await superadminService.getGlobalRoles();
    _helpers.sendSuccess.call(void 0, res, result, 'Global roles and permissions retrieved successfully');
  } catch (err) {
    next(err);
  }
}; exports.getGlobalRoles = getGlobalRoles;

 const updateRolePermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await superadminService.updateRolePermissions(id, req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'Role permissions mapping updated successfully');
  } catch (err) {
    next(err);
  }
}; exports.updateRolePermissions = updateRolePermissions;

 const createRole = async (req, res, next) => {
  try {
    const result = await superadminService.createRole(req.body);
    _helpers.sendSuccess.call(void 0, res, result, 'New global template role created successfully');
  } catch (err) {
    next(err);
  }
}; exports.createRole = createRole;

 const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await superadminService.deleteRole(id);
    _helpers.sendSuccess.call(void 0, res, result, 'Global role deleted successfully');
  } catch (err) {
    next(err);
  }
}; exports.deleteRole = deleteRole;

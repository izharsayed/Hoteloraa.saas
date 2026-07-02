"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }var _express = require('express');
var _authmiddleware = require('../../middleware/auth.middleware');
var _superadmincontroller = require('./superadmin.controller'); var superadminController = _interopRequireWildcard(_superadmincontroller);

const router = _express.Router.call(void 0, );

// Apply auth checks globally to all Super Admin endpoints
router.use(_authmiddleware.authenticate);
router.use(_authmiddleware.authorize.call(void 0, 'SUPER_ADMIN'));

// System Metrics
router.get('/overview', superadminController.getOverviewMetrics);

// Tenants Registry
router.get('/tenants', superadminController.getAllTenants);
router.post('/tenants', superadminController.createTenant);
router.patch('/tenants/:id/status', superadminController.toggleTenantStatus);
router.patch('/tenants/:id/config', superadminController.configureTenantFeatures);
router.patch('/tenants/:id/plan', superadminController.configureTenantPlan);
router.delete('/tenants/:id', superadminController.deleteTenant);

// Subscription Plans
router.get('/subscriptions', superadminController.getSubscriptionPlans);

// Cross-tenant Users
router.get('/users', superadminController.getAllUsers);
router.patch('/users/:id/status', superadminController.toggleUserStatus);
router.put('/users/:id/reset-password', superadminController.resetUserPassword);

// System Audit Logs
router.get('/audit-logs', superadminController.getAuditLogs);
router.post('/audit-logs/simulate', superadminController.createSimulatedLog);

// Support Tickets Management
router.get('/tickets', superadminController.getAllTickets);
router.patch('/tickets/:id', superadminController.updateTicket);

// Global Roles & Matrix (RBAC)
router.get('/roles', superadminController.getGlobalRoles);
router.patch('/roles/:id/permissions', superadminController.updateRolePermissions);
router.post('/roles', superadminController.createRole);
router.delete('/roles/:id', superadminController.deleteRole);

exports. default = router;

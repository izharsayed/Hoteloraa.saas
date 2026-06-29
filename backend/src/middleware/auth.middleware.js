"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
var _jsonwebtoken = require('jsonwebtoken'); var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);
var _env = require('../config/env'); var _env2 = _interopRequireDefault(_env);
var _database = require('../config/database'); var _database2 = _interopRequireDefault(_database);

const AUTH_COOKIE_NAME = 'hoteloraa_token';

const readCookie = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split('=');
    if (rawKey === name) return decodeURIComponent(rawValue.join('='));
  }
  return null;
};










 const authenticate = async (
  req,
  res,
  next
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : readCookie(req.headers.cookie, AUTH_COOKIE_NAME);

    if (!token) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const decoded = _jsonwebtoken2.default.verify(token, _env2.default.jwt.secret) 





;

    const user = await _database2.default.user.findFirst({
      where: { id: decoded.id, tenantId: decoded.tenantId, isActive: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found or inactive' });
      return;
    }

    req.user = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      email: decoded.email,
      userRole: decoded.userRole,
      roleId: decoded.roleId,
    };

    next();
  } catch (e) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}; exports.authenticate = authenticate;

 const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.userRole)) {
      res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
      return;
    }
    next();
  };
}; exports.authorize = authorize;

 const requireTenant = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const headerTenantId = req.headers['x-tenant-id'];
  const tenantId = req.user.userRole === 'SUPER_ADMIN' && headerTenantId
    ? headerTenantId
    : req.user.tenantId;

  if (!tenantId) {
    res.status(400).json({ success: false, message: 'Tenant ID required' });
    return;
  }

  req.user.tenantId = tenantId;
  next();
}; exports.requireTenant = requireTenant;

// Simple helper to assign default behavior to standard system roles
const checkStaticRoleFallback = (role, module, action) => {
  const captainPerms = {
    MENU: ['READ'],
    ORDERS: ['CREATE', 'READ', 'UPDATE'],
    KOT: ['CREATE', 'READ', 'UPDATE'],
    TABLES: ['READ', 'UPDATE'],
    POS: ['CREATE', 'READ'],
    ATTENDANCE: ['CREATE', 'READ'],
    SHIFTS: ['READ'],
  };

  const chefPerms = {
    MENU: ['READ'],
    KOT: ['READ', 'UPDATE'],
    ORDERS: ['READ'],
    ATTENDANCE: ['CREATE', 'READ'],
    SHIFTS: ['READ'],
  };

  const housekeeperPerms = {
    ROOMS: ['READ'],
    HOUSEKEEPING: ['CREATE', 'READ', 'UPDATE'],
    ATTENDANCE: ['CREATE', 'READ'],
    SHIFTS: ['READ'],
  };

  const receptionistPerms = {
    DASHBOARD: ['READ'],
    ROOMS: ['READ', 'UPDATE'],
    ROOM_TYPES: ['READ'],
    GUESTS: ['CREATE', 'READ', 'UPDATE'],
    RESERVATIONS: ['CREATE', 'READ', 'UPDATE'],
    CHECKIN: ['CREATE', 'READ', 'UPDATE'],
    CHECKOUT: ['CREATE', 'READ', 'UPDATE'],
    PAYMENTS: ['CREATE', 'READ'],
    FOLIO: ['CREATE', 'READ', 'UPDATE'],
    ATTENDANCE: ['CREATE', 'READ'],
    SHIFTS: ['READ'],
  };

  const cashierPerms = {
    DASHBOARD: ['READ'],
    MENU: ['READ'],
    ORDERS: ['CREATE', 'READ', 'UPDATE'],
    BILLING: ['CREATE', 'READ', 'UPDATE'],
    PAYMENTS: ['CREATE', 'READ'],
    POS: ['CREATE', 'READ', 'UPDATE'],
    ATTENDANCE: ['CREATE', 'READ'],
    SHIFTS: ['READ'],
  };

  const accountantPerms = {
    DASHBOARD: ['READ'],
    REPORTS: ['READ'],
    INVENTORY: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    VENDORS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    PURCHASES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    BILLING: ['READ'],
    PAYMENTS: ['READ'],
    FOLIO: ['READ'],
    ATTENDANCE: ['CREATE', 'READ'],
    SHIFTS: ['READ'],
  };

  const managerPerms = {
    DASHBOARD: ['READ'],
    SETTINGS: ['READ', 'UPDATE'],
    REPORTS: ['READ'],
    ROOMS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    ROOM_TYPES: ['CREATE', 'READ', 'UPDATE'],
    GUESTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    RESERVATIONS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    CHECKIN: ['CREATE', 'READ', 'UPDATE'],
    CHECKOUT: ['CREATE', 'READ', 'UPDATE'],
    HOUSEKEEPING: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    TABLES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    MENU: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    ORDERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    KOT: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    BILLING: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    PAYMENTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    FOLIO: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    INVENTORY: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    VENDORS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    PURCHASES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    POS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    USERS: ['READ'],
    ATTENDANCE: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    SHIFTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
  };

  let allowedActions = [];

  if (role === 'CAPTAIN') allowedActions = captainPerms[module] || [];
  else if (role === 'CHEF') allowedActions = chefPerms[module] || [];
  else if (role === 'HOUSEKEEPING') allowedActions = housekeeperPerms[module] || [];
  else if (role === 'RECEPTIONIST') allowedActions = receptionistPerms[module] || [];
  else if (role === 'CASHIER') allowedActions = cashierPerms[module] || [];
  else if (role === 'ACCOUNTANT') allowedActions = accountantPerms[module] || [];
  else if (role === 'MANAGER') allowedActions = managerPerms[module] || [];

  return allowedActions.includes(action);
};

 const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { userRole, roleId } = req.user;

      // 1. Super Admin and Tenant Admin have absolute override access
      if (userRole === 'SUPER_ADMIN' || userRole === 'TENANT_ADMIN') {
        return next();
      }

      // 2. If the user has a custom role mapped, check permissions table
      if (roleId) {
        const rolePermission = await _database2.default.rolePermission.findFirst({
          where: {
            roleId,
            permission: {
              module,
              action,
            },
          },
        });

        if (rolePermission) {
          return next();
        }
      }

      // 3. Fallback to static rules for pre-defined system roles (e.g. CAPTAIN can READ MENU, CHEF can UPDATE KOT)
      const hasStaticAccess = checkStaticRoleFallback(userRole, module, action);
      if (hasStaticAccess) {
        return next();
      }

      res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Internal server error during permission check' });
    }
  };
}; exports.checkPermission = checkPermission;

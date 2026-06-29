/**
 * RBAC Permissions Utility
 * Centralized role-access matrix for all modules.
 * This is the single source of truth for frontend access control.
 */

// Role constants
export const ROLES = {
  TENANT_ADMIN: 'TENANT_ADMIN',
  MANAGER: 'MANAGER',
  RECEPTIONIST: 'RECEPTIONIST',
  CASHIER: 'CASHIER',
  CAPTAIN: 'CAPTAIN',
  CHEF: 'CHEF',
  HOUSEKEEPING: 'HOUSEKEEPING',
  ACCOUNTANT: 'ACCOUNTANT',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

// Module → allowed roles matrix
export const MODULE_ACCESS = {
  dashboard:    [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.CASHIER, ROLES.ACCOUNTANT],
  users:        [ROLES.TENANT_ADMIN],
  roles:        [ROLES.TENANT_ADMIN],
  settings:     [ROLES.TENANT_ADMIN, ROLES.MANAGER],
  reports:      [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],
  rooms:        [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  reservations: [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  guests:       [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  housekeeping: [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.HOUSEKEEPING],
  pos:          [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.CASHIER],
  tables:       [ROLES.TENANT_ADMIN, ROLES.MANAGER],
  orders:       [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.CASHIER],
  kot:          [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.CHEF],
  inventory:    [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],
  vendors:      [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],
  purchases:    [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT],
  attendance:   [ROLES.TENANT_ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.CASHIER, ROLES.CAPTAIN, ROLES.CHEF, ROLES.HOUSEKEEPING, ROLES.ACCOUNTANT],
  attendance_manager: [ROLES.TENANT_ADMIN, ROLES.MANAGER],
  shifts:       [ROLES.TENANT_ADMIN, ROLES.MANAGER],
};

/**
 * Get the current user from localStorage.
 * @returns {object|null} user object or null
 */
export function getCurrentUser() {
  try {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}

/**
 * Check if the current user has one of the allowed roles.
 * @param {string[]} allowedRoles
 * @returns {boolean}
 */
export function hasRole(allowedRoles) {
  const user = getCurrentUser();
  if (!user) return false;
  return allowedRoles.includes(user.userRole);
}

/**
 * Check if the current user can access a specific module.
 * SUPER_ADMIN and TENANT_ADMIN always have access.
 * @param {string} module — key from MODULE_ACCESS
 * @returns {boolean}
 */
export function canAccess(module) {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.userRole === ROLES.SUPER_ADMIN || user.userRole === ROLES.TENANT_ADMIN) return true;
  const allowed = MODULE_ACCESS[module] || [];
  return allowed.includes(user.userRole);
}

/**
 * Get the default redirect path for a user role after login.
 * @param {string} userRole
 * @returns {string} path
 */
export function getDefaultRedirect(userRole) {
  switch (userRole) {
    case ROLES.SUPER_ADMIN:   return '/superadmin';
    case ROLES.TENANT_ADMIN:  return '/';
    case ROLES.CAPTAIN:        return '/captain';
    case ROLES.CHEF:          return '/kitchen';
    case ROLES.HOUSEKEEPING:  return '/housekeeping';
    case ROLES.RECEPTIONIST:  return '/rooms';
    case ROLES.CASHIER:       return '/pos';
    case ROLES.ACCOUNTANT:    return '/reports';
    case ROLES.MANAGER:       return '/';
    default:                  return '/';
  }
}

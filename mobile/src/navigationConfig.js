import { canAccess, ROLES } from './permissions';

export const getNavigationGroups = (user) => {
  if (!user) return [];

  const role = user.userRole;
  const businessType = user.businessType || 'HOTEL_RESTAURANT';

  const can = (moduleKey) => {
    return canAccess(user, moduleKey);
  };

  const rawNavigation = [
    {
      category: 'General',
      items: [
        { name: 'Dashboard', view: 'dashboard', icon: 'bar-chart', module: 'dashboard' },
        { name: 'Operations Hub', view: 'manager_hub', icon: 'settings', roles: ['MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
        { name: 'My Attendance', view: 'attendance', icon: 'time', module: 'attendance' },
        { name: 'Reports & Analytics', view: 'reports', icon: 'trending-up', module: 'reports' },
      ]
    },
    {
      category: 'Lodging Operations',
      businessTypes: ['LODGING', 'HOTEL_RESTAURANT'],
      items: [
        { name: 'Rooms Directory', view: 'rooms', icon: 'bed', module: 'rooms' },
        { name: 'Reservations', view: 'reservations', icon: 'calendar', module: 'reservations' },
        { name: 'Front Desk Check-In', view: 'checkin', icon: 'log-in', module: 'rooms' },
        { name: 'Folios & Check-Out', view: 'checkout', icon: 'document-text', module: 'rooms' },
        { name: 'Housekeeping', view: 'housekeeping', icon: 'sparkles', module: 'housekeeping' },
        { name: 'Guests & CRM', view: 'crm', icon: 'people', module: 'guests' },
      ]
    },
    {
      category: 'Restaurant & POS',
      businessTypes: ['RESTAURANT', 'HOTEL_RESTAURANT'],
      items: [
        { name: 'Table Seating', view: 'tables', icon: 'restaurant', module: 'tables' },
        { name: 'Kitchen KOT', view: 'kitchen', icon: 'restaurant', module: 'kot' },
        { name: 'POS Terminal', view: 'orders', icon: 'receipt', module: 'orders', roles: ['MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
        { name: 'POS Menu Manager', view: 'menu', icon: 'book', module: 'pos', roles: ['MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
        { name: 'POS Billing', view: 'pos', icon: 'storefront', module: 'pos' },
      ]
    },
    {
      category: 'Captain Dashboard',
      businessTypes: ['RESTAURANT', 'HOTEL_RESTAURANT'],
      items: [
        { name: 'New Order (POS)', view: 'captain', icon: 'restaurant', roles: ['CAPTAIN', 'MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
        { name: 'Active Orders & History', view: 'captain_history', icon: 'receipt', roles: ['CAPTAIN', 'MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
      ]
    },
    {
      category: 'Procurement',
      businessTypes: ['RESTAURANT', 'HOTEL_RESTAURANT'],
      items: [
        { name: 'Inventory & Stock', view: 'inventory', icon: 'cube', module: 'inventory' },
        { name: 'Vendors', view: 'vendors', icon: 'car', module: 'vendors' },
        { name: 'Purchase Orders', view: 'purchases', icon: 'cart', module: 'purchases' },
      ]
    },
    {
      category: 'Administration',
      items: [
        { name: 'Staff Attendance', view: 'attendance_manager', icon: 'people', module: 'attendance_manager' },
        { name: 'Shift Management', view: 'shifts', icon: 'calendar', module: 'shifts' },
        { name: 'Platform Settings', view: 'settings', icon: 'settings', module: 'settings' },
        { name: 'User Management', view: 'users', icon: 'person', module: 'users' },
        { name: 'Roles & Permissions', view: 'rbac', icon: 'shield-checkmark', module: 'roles' },
      ]
    },
    {
      category: 'Super Admin Portal',
      items: [
        { name: 'Cluster Overview', view: 'super_cluster', icon: 'globe', roles: ['SUPER_ADMIN'] },
        { name: 'Tenants Registry', view: 'super_tenants', icon: 'business', roles: ['SUPER_ADMIN'] },
        { name: 'Subscription Plans', view: 'super_plans', icon: 'card', roles: ['SUPER_ADMIN'] },
        { name: 'Support Tickets', view: 'super_tickets', icon: 'ticket', roles: ['SUPER_ADMIN'] },
        { name: 'Platform Users', view: 'super_users', icon: 'people', roles: ['SUPER_ADMIN'] },
        { name: 'Global RBAC Panel', view: 'super_rbac', icon: 'shield', roles: ['SUPER_ADMIN'] },
        { name: 'System Audit Logs', view: 'super_audit', icon: 'list', roles: ['SUPER_ADMIN'] },
      ]
    },
    {
      category: 'Tenant Administration',
      items: [
        { name: 'Admin Overview', view: 'tenant_overview', icon: 'bar-chart', roles: ['TENANT_ADMIN'] },
        { name: 'Staff Registry', view: 'tenant_staff', icon: 'people', roles: ['TENANT_ADMIN'] },
        { name: 'Roles & Permissions', view: 'tenant_rbac', icon: 'shield-checkmark', roles: ['TENANT_ADMIN'] },
        { name: 'Feature Toggles', view: 'tenant_features', icon: 'options', roles: ['TENANT_ADMIN'] },
        { name: 'Tenant Settings', view: 'tenant_settings', icon: 'construct', roles: ['TENANT_ADMIN'] },
      ]
    }
  ];

  return rawNavigation
    .filter((group) => {
      if (role === 'SUPER_ADMIN') {
        return group.category === 'Super Admin Portal';
      }
      if (role === 'TENANT_ADMIN') {
        return group.category === 'Tenant Administration';
      }
      if (group.category === 'Super Admin Portal' || group.category === 'Tenant Administration') {
        return false;
      }
      if (group.businessTypes) {
        if (!group.businessTypes.includes(businessType)) return false;
      }
      return true;
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.roles) return item.roles.includes(role);
        if (item.module) return can(item.module);
        return true;
      })
    }))
    .filter((group) => group.items.length > 0);
};

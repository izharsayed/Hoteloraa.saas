import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bed,
  CalendarRange,
  UserCheck,
  FileSpreadsheet,
  Sparkles,
  UtensilsCrossed, 
  ChefHat, 
  BookOpen,
  Receipt, 
  PackageSearch, 
  Users, 
  TrendingUp,
  Settings,
  LogOut,
  ShieldAlert,
  ClipboardList,
  ShoppingCart,
  Truck,
  Store,
  UserCog,
  Shield,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MODULE_ACCESS } from '../utils/permissions';

function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  let user = { name: 'Staff', userRole: 'CAPTAIN', businessType: 'HOTEL_RESTAURANT' };
  try {
    if (userJson) user = JSON.parse(userJson);
  } catch (e) {}

  const businessType = user.businessType || 'HOTEL_RESTAURANT';
  const role = user.userRole;

  // Check if role is allowed for a given module key
  const can = (moduleKey) => {
    if (role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') return true;
    const allowed = MODULE_ACCESS[moduleKey] || [];
    return allowed.includes(role);
  };

  const rawNavigation = [
    {
      category: 'General',
      items: [
        { name: 'Dashboard',          path: '/',        icon: LayoutDashboard, module: 'dashboard' },
        { name: 'Reports & Analytics', path: '/reports', icon: TrendingUp,      module: 'reports' },
      ]
    },
    {
      category: 'Lodging Operations',
      businessTypes: ['HOTEL', 'HOTEL_RESTAURANT'],
      items: [
        { name: 'Rooms Directory',      path: '/rooms',        icon: Bed,            module: 'rooms' },
        { name: 'Reservations',         path: '/reservations', icon: CalendarRange,  module: 'reservations' },
        { name: 'Front Desk Check-In',  path: '/checkin',      icon: UserCheck,      module: 'rooms' },
        { name: 'Folios & Check-Out',   path: '/checkout',     icon: FileSpreadsheet,module: 'rooms' },
        { name: 'Housekeeping',         path: '/housekeeping', icon: Sparkles,       module: 'housekeeping' },
        { name: 'Guests & CRM',         path: '/crm',          icon: Users,          module: 'guests' },
      ]
    },
    {
      category: 'Restaurant & POS',
      businessTypes: ['RESTAURANT', 'HOTEL_RESTAURANT'],
      items: [
        { name: 'Table Seating',    path: '/tables',   icon: UtensilsCrossed, module: 'tables' },
        { name: 'Kitchen KOT',      path: '/kitchen',  icon: ChefHat,         module: 'kot' },
        { name: 'POS Terminal',     path: '/orders',   icon: ClipboardList,   module: 'orders', roles: ['WAITER', 'MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
        { name: 'POS Menu Manager', path: '/menu',     icon: BookOpen,        module: 'pos', roles: ['MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
        { name: 'POS Billing',      path: '/pos',      icon: Store,           module: 'pos' },
      ]
    },
    {
      category: 'Procurement',
      items: [
        { name: 'Inventory & Stock', path: '/inventory', icon: PackageSearch, module: 'inventory' },
        { name: 'Vendors',           path: '/vendors',   icon: Truck,         module: 'vendors' },
        { name: 'Purchase Orders',   path: '/purchases', icon: ShoppingCart,  module: 'purchases' },
      ]
    },
    {
      category: 'Administration',
      items: [
        { name: 'Platform Settings',   path: '/settings',    icon: Settings,    module: 'settings' },
        { name: 'User Management',     path: '/admin/users', icon: UserCog,     module: 'users' },
        { name: 'Roles & Permissions', path: '/admin/rbac',  icon: Shield,      module: 'roles' },
        { name: 'Super Admin Control', path: '/superadmin',  icon: ShieldAlert, roles: ['SUPER_ADMIN'] },
      ]
    }
  ];

  const navigation = rawNavigation
    .filter((group) => {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login?loggedOut=1');
  };

  return (
    <aside
      className={`
        ${collapsed ? 'w-0 md:w-16 -translate-x-full md:translate-x-0' : 'w-64 translate-x-0'}
        bg-white border-r border-border-cream flex flex-col h-full select-none shrink-0
        transition-all duration-300 ease-in-out overflow-hidden
        absolute md:relative z-50 shadow-2xl md:shadow-none
      `}
    >
      {/* Brand Header */}
      {collapsed ? (
        <div className="hidden md:flex flex-col items-center py-4 border-b border-border-cream bg-white shrink-0 animate-fadeIn">
          <img 
            src="/logo-icon.png" 
            alt="Hoteloraa Logo Icon" 
            className="h-8 w-auto object-contain cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            onClick={onToggle}
            title="Expand sidebar"
          />
        </div>
      ) : (
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-cream bg-white shrink-0">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img src="/logo.png" alt="Hoteloraa Logo" className="h-9 w-auto object-contain" />
          </div>
          <button
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate hover:text-navy hover:bg-white/70 active:scale-95 border border-transparent hover:border-border-cream transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-2 py-4 space-y-4 overflow-y-auto overflow-x-hidden">
        {navigation.map((group) => (
          <div key={group.category} className="space-y-0.5">
            {/* Category label — only when expanded */}
            {!collapsed && (
              <h4 className="text-[10px] font-bold text-slate uppercase tracking-wider px-3 mb-1">
                {group.category}
              </h4>
            )}
            {/* Divider when collapsed */}
            {collapsed && (
              <div className="border-t border-border-cream/60 mx-1 mb-1" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 768 && !collapsed) {
                        onToggle();
                      }
                    }}
                    title={collapsed ? item.name : undefined}
                    className={({ isActive }) => `
                      flex items-center gap-3 font-medium text-xs transition-all duration-200 group
                      ${collapsed 
                        ? 'w-10 h-10 justify-center rounded-xl mx-auto' 
                        : 'px-3 py-2 rounded-xl hover:translate-x-1'
                      }
                      ${isActive
                        ? collapsed
                          ? 'bg-gold-pale text-navy shadow-sm'
                          : 'bg-gold-pale text-navy border-l-4 border-gold shadow-sm font-semibold'
                        : 'text-slate hover:bg-gold-pale/50 hover:text-navy'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isActive ? 'text-gold' : 'text-slate group-hover:text-navy'}`}
                        />
                        {/* Label — only when expanded */}
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-border-cream bg-white shrink-0">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Exit Platform' : undefined}
          className={`
            flex items-center gap-3 text-danger font-medium text-xs
            hover:bg-danger-pale hover:text-danger active:scale-98 transition-all
            ${collapsed 
              ? 'w-10 h-10 justify-center rounded-xl mx-auto' 
              : 'w-full px-3 py-2.5 rounded-xl'
            }
          `}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Exit Platform</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

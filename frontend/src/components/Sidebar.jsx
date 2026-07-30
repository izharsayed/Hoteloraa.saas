import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import logoIcon from '../assets/logo-icon.png';
import logo from '../assets/logo.png';
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
  ChevronDown,
  Clock,
  MapPin,
} from 'lucide-react';
import { MODULE_ACCESS } from '../utils/permissions';
import api from '../utils/api.js';

function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  let user = { name: 'Staff', userRole: 'CAPTAIN', businessType: 'HOTEL_RESTAURANT' };
  try {
    if (userJson) user = JSON.parse(userJson);
  } catch (e) { }

  const businessType = user.businessType || 'HOTEL_RESTAURANT';
  const role = user.userRole;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US';

  const roleLabel = user.userRole
    ? user.userRole.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    : '';

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, module: 'dashboard' },
        { name: 'My Attendance', path: '/attendance', icon: Clock, module: 'attendance' },
        { name: 'Reports & Analytics', path: '/reports', icon: TrendingUp, module: 'reports' },
      ]
    },
    {
      category: 'Lodging Operations',
      businessTypes: ['LODGING', 'HOTEL_RESTAURANT'],
      items: [
        { name: 'Rooms Directory', path: '/rooms', icon: Bed, module: 'rooms' },
        { name: 'Reservations', path: '/reservations', icon: CalendarRange, module: 'reservations' },
        { name: 'Front Desk Check-In', path: '/checkin', icon: UserCheck, module: 'rooms' },
        { name: 'Folios & Check-Out', path: '/checkout', icon: FileSpreadsheet, module: 'rooms' },
        { name: 'Housekeeping', path: '/housekeeping', icon: Sparkles, module: 'housekeeping' },
        // { name: 'Guests & CRM', path: '/crm', icon: Users, module: 'guests' },
      ]
    },
    {
      category: 'Restaurant & POS',
      businessTypes: ['RESTAURANT', 'HOTEL_RESTAURANT'],
      items: [
        { name: 'Table Seating', path: '/tables', icon: UtensilsCrossed, module: 'tables' },
        { name: 'Kitchen KOT', path: '/kitchen', icon: ChefHat, module: 'kot' },
        { name: 'POS Terminal', path: '/orders', icon: ClipboardList, module: 'orders', roles: ['MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
        { name: 'POS Menu Manager', path: '/menu', icon: BookOpen, module: 'pos', roles: ['MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
        { name: 'POS Billing', path: '/pos', icon: Store, module: 'pos' },
      ]
    },
    {
      category: 'Captain Dashboard',
      businessTypes: ['RESTAURANT', 'HOTEL_RESTAURANT'],
      items: [
        { name: 'New Order (POS)', path: '/captain', icon: UtensilsCrossed, roles: ['CAPTAIN', 'MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
        { name: 'Active Orders & History', path: '/captain/history', icon: ClipboardList, roles: ['CAPTAIN', 'MANAGER', 'TENANT_ADMIN', 'SUPER_ADMIN'] },
      ]
    },
    {
      category: 'Procurement',
      businessTypes: ['RESTAURANT', 'HOTEL_RESTAURANT'],
      items: [
        { name: 'Inventory & Stock', path: '/inventory', icon: PackageSearch, module: 'inventory' },
        { name: 'Vendors', path: '/vendors', icon: Truck, module: 'vendors' },
        { name: 'Purchase Orders', path: '/purchases', icon: ShoppingCart, module: 'purchases' },
      ]
    },
    {
      category: 'Administration',
      items: [
        { name: 'Staff Attendance', path: '/attendance/manager', icon: UserCheck, module: 'attendance_manager' },
        { name: 'Shift Management', path: '/shifts', icon: CalendarRange, module: 'shifts' },
        { name: 'Attendance Settings', path: '/attendance/settings', icon: MapPin, module: 'attendance_manager' },
        { name: 'Platform Settings', path: '/settings', icon: Settings, module: 'settings' },
        { name: 'User Management', path: '/admin/users', icon: UserCog, module: 'users' },
        { name: 'Roles & Permissions', path: '/admin/rbac', icon: Shield, module: 'roles' },
        { name: 'Super Admin Control', path: '/superadmin', icon: ShieldAlert, roles: ['SUPER_ADMIN'] },
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

  const location = useLocation();

  // State for category dropdown accordion collapse/expand
  const [openCategories, setOpenCategories] = useState(() => {
    const initial = {};
    rawNavigation.forEach(g => {
      initial[g.category] = true;
    });
    return initial;
  });

  // Auto-expand category matching current active route
  useEffect(() => {
    navigation.forEach(group => {
      const hasActive = group.items.some(item => {
        if (item.path === '/') return location.pathname === '/';
        return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
      });
      if (hasActive) {
        setOpenCategories(prev => ({ ...prev, [group.category]: true }));
      }
    });
  }, [location.pathname]);

  const toggleCategory = (categoryName) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const handleLogout = async () => {
    await api.logout();
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
            src={logoIcon}
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
            <img src={logo} alt="Hoteloraa Logo" className="h-9 w-auto object-contain" />
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

      {/* Navigation List with Category Dropdowns */}
      <nav className="flex-1 px-2 py-4 space-y-3 overflow-y-auto overflow-x-hidden">
        {navigation.map((group) => {
          const isOpen = openCategories[group.category] !== false;
          return (
            <div key={group.category} className="space-y-1">
              {/* Category Header — clean static label when expanded */}
              {!collapsed ? (
                <div className="px-3 py-1.5 text-xs font-bold text-slate uppercase tracking-wider">
                  <span className="truncate">{group.category}</span>
                </div>
              ) : (
                <div className="border-t border-border-cream/60 mx-1 mb-1" />
              )}

              {/* Nav Items */}
              <div className="space-y-0.5 animate-fadeIn">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      end={item.path === '/captain' || item.path === '/'}
                      onClick={() => {
                        if (window.innerWidth < 768 && !collapsed) {
                          onToggle();
                        }
                      }}
                      title={collapsed ? item.name : undefined}
                      className={({ isActive }) => `
                        flex items-center gap-3 font-semibold text-[0.9rem] transition-all duration-200 group
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
          );
        })}
      </nav>

      {/* Bottom User Profile Dropdown */}
      <div ref={profileMenuRef} className="p-3 border-t border-border-cream bg-white shrink-0 relative">
        {/* Dropdown panel — pops upward */}
        {profileMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-border-cream rounded-2xl shadow-xl overflow-hidden animate-scaleUp z-50 p-2 space-y-1">
            <div className="p-3 bg-cream/20 rounded-xl border border-border-cream/50">
              <p className="text-xs font-bold text-navy truncate">{user.name || 'Staff'}</p>
              <p className="text-[10px] text-slate font-medium truncate">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 text-danger font-bold text-xs hover:bg-danger-pale p-2.5 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Exit Platform</span>
            </button>
          </div>
        )}

        {/* Profile Trigger Button */}
        <button
          onClick={() => setProfileMenuOpen(o => !o)}
          title={collapsed ? `${user.name || 'User'} — Click for options` : undefined}
          className={`
            flex items-center gap-3 p-2 bg-cream/30 border border-border-cream/80 rounded-2xl
            hover:bg-cream/60 hover:border-border-cream transition-all cursor-pointer w-full
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-navy text-gold font-display font-bold flex items-center justify-center border border-gold/20 shrink-0 text-xs shadow-sm">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-charcoal truncate">{user.name || 'Staff'}</p>
                <p className="text-[10px] text-slate font-medium truncate">{roleLabel}</p>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-slate shrink-0 transition-transform duration-200 ${profileMenuOpen ? '-rotate-90' : 'rotate-90'}`} />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

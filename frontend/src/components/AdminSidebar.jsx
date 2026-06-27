import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logoIcon from '../assets/logo-icon.png';
import logo from '../assets/logo.png';
import { 
  Shield, 
  Users, 
  Settings, 
  Sliders, 
  Building2, 
  LogOut,
  LayoutDashboard,
  ChevronLeft
} from 'lucide-react';
import api from '../utils/api.js';

function AdminSidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();

  const navigation = [
    { name: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Staff Registry', path: '/admin/users', icon: Users },
    { name: 'Roles & Permissions', path: '/admin/rbac', icon: Shield },
    { name: 'Feature Toggles', path: '/admin/features', icon: Sliders },
    { name: 'Tenant Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await api.logout();
    navigate('/login?loggedOut=1');
  };

  return (
    <aside 
      className={`
        ${collapsed ? 'w-16' : 'w-64'} 
        bg-white border-r border-border-cream flex flex-col h-full select-none shrink-0 text-charcoal
        transition-all duration-300 ease-in-out overflow-hidden
      `}
    >
      {/* Brand Header */}
      {collapsed ? (
        <div className="flex flex-col items-center py-4 border-b border-border-cream bg-white shrink-0 animate-fadeIn">
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
            onClick={() => navigate('/admin')}
          >
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center font-display font-bold text-navy shrink-0">
              A
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="font-display font-bold text-sm tracking-tight text-navy leading-none">Hoteloraa</h1>
              <span className="text-[9px] font-bold text-gold tracking-widest uppercase mt-1 block text-ellipsis overflow-hidden whitespace-nowrap">Tenant Admin</span>
            </div>
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
      <nav className="flex-1 px-2 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/admin'}
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
                  <Icon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isActive ? 'text-gold' : 'text-slate group-hover:text-navy'}`} />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-border-cream bg-white shrink-0">
        <button
          onClick={handleLogout}
          title={collapsed ? 'Exit Panel' : undefined}
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
          {!collapsed && <span>Exit Panel</span>}
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;

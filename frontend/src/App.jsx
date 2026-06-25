import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import AccessDenied from './components/AccessDenied.jsx';
import { Bell, Info, CheckCircle, AlertTriangle, X, Menu as MenuIcon } from 'lucide-react';
import api from './utils/api.js';

// Core Pages
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

// Lodging Pages
import Rooms from './pages/Rooms.jsx';
import Reservations from './pages/Reservations.jsx';
import CheckIn from './pages/CheckIn.jsx';
import CheckOut from './pages/CheckOut.jsx';
import Housekeeping from './pages/Housekeeping.jsx';
import CRM from './pages/CRM.jsx';

// Restaurant & POS Pages
import Tables from './pages/Tables.jsx';
import Kitchen from './pages/Kitchen.jsx';
import Menu from './pages/Menu.jsx';
import Billing from './pages/Billing.jsx';
import Orders from './pages/Orders.jsx';

// Procurement Pages
import Inventory from './pages/Inventory.jsx';
import Vendors from './pages/Vendors.jsx';
import Purchases from './pages/Purchases.jsx';

// Admin Panel Pages
import AdminLayout from './components/AdminLayout.jsx';
import AdminOverview from './pages/AdminOverview.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminRBAC from './pages/AdminRBAC.jsx';
import AdminFeatures from './pages/AdminFeatures.jsx';
import AdminSettings from './pages/AdminSettings.jsx';

// Captain Panel
import CaptainLayout from './components/CaptainLayout.jsx';
import Captain from './pages/Captain.jsx';

// Super Admin Panel
import SuperAdminLayout from './components/SuperAdminLayout.jsx';
import SuperAdminOverview from './pages/SuperAdminOverview.jsx';
import SuperAdminTenants from './pages/SuperAdminTenants.jsx';
import SuperAdminSubscriptions from './pages/SuperAdminSubscriptions.jsx';
import SuperAdminUsers from './pages/SuperAdminUsers.jsx';
import SuperAdminRBAC from './pages/SuperAdminRBAC.jsx';
import SuperAdminLogs from './pages/SuperAdminLogs.jsx';

// Manager Panel
import Manager from './pages/Manager.jsx';

// Permissions utility
import { MODULE_ACCESS } from './utils/permissions.js';

// --------------------------------------------------------------------------
// DashboardLayout — shared shell for all operational staff routes
// --------------------------------------------------------------------------
function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed_manager') === 'true');
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const userJson = localStorage.getItem('user');
  let user = { name: 'Staff Member', userRole: 'Staff' };
  try {
    if (userJson) user = JSON.parse(userJson);
  } catch (e) {}

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US';

  const roleLabel = user.userRole
    ? user.userRole.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    : '';

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data || []);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(() => {
      fetchNotifications();
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex h-screen overflow-hidden bg-cream relative">
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div 
          className="md:hidden fixed inset-0 bg-navy/20 backdrop-blur-sm z-40" 
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => {
          setSidebarCollapsed(p => {
            const next = !p;
            localStorage.setItem('sidebar_collapsed_manager', next);
            return next;
          });
        }} 
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border-cream bg-white/70 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 text-slate hover:text-navy rounded-xl hover:bg-cream/50 transition-colors"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <span className="hidden md:inline-flex font-mono text-xs px-2 py-1 bg-gold-pale border border-gold/30 rounded text-gold font-semibold uppercase tracking-wider">
              {user.tenantName || 'Live Environment'}
            </span>
            {/* Online indicator */}
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] inline-block" />
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate hover:text-navy hover:bg-cream/40 rounded-xl transition-all relative flex items-center justify-center"
              >
                <Bell className="w-5 h-5 text-slate-600 hover:text-navy" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-border-cream rounded-2xl shadow-xl z-50 overflow-hidden animate-scaleUp">
                  <div className="p-4 border-b border-border-cream flex justify-between items-center bg-cream/10">
                    <span className="font-display font-bold text-navy text-xs uppercase tracking-wider">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-amber-600 hover:text-navy font-bold transition-all uppercase"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-border-cream/40">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate text-xs font-semibold">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => handleMarkRead(notif.id)}
                          className={`p-4 hover:bg-amber-50/20 cursor-pointer flex gap-3 items-start transition-all ${!notif.isRead ? 'bg-amber-50/10' : ''}`}
                        >
                          {notif.type === 'SUCCESS' && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                          {notif.type === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                          {notif.type === 'DANGER' && <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                          {notif.type === 'INFO' && <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                          
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs text-charcoal font-semibold ${!notif.isRead ? 'font-extrabold text-navy' : ''}`}>
                              {notif.title}
                            </p>
                            <p className="text-[10px] text-slate mt-0.5 leading-normal">{notif.message}</p>
                            <span className="text-[8px] text-slate/50 block mt-1 font-medium">
                              {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-charcoal">{user.name}</p>
              <p className="text-[10px] text-slate font-medium">{roleLabel}</p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-navy text-gold font-display font-bold flex items-center justify-center border border-gold/20 shadow-inner text-xs md:text-sm">
              {initials}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// ProtectedRoute — enforces authentication and optionally role-based access
// --------------------------------------------------------------------------
function ProtectedRoute({ allowedRoles, module: moduleKey }) {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userJson);

    // Role whitelist check (used for panel-level guards)
    if (allowedRoles && !allowedRoles.includes(user.userRole)) {
      // Smart redirect based on role
      if (user.userRole === 'SUPER_ADMIN') return <Navigate to="/superadmin" replace />;
      if (user.userRole === 'CAPTAIN') return <Navigate to="/captain" replace />;
      if (user.userRole === 'CHEF') return <Navigate to="/kitchen" replace />;
      return <AccessDenied />;
    }

    // Module-based access check (used for individual route guards)
    if (moduleKey && user.userRole !== 'SUPER_ADMIN' && user.userRole !== 'TENANT_ADMIN') {
      const allowed = MODULE_ACCESS[moduleKey] || [];
      if (!allowed.includes(user.userRole)) {
        return <AccessDenied />;
      }
    }

    return <Outlet />;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
}

// --------------------------------------------------------------------------
// App
// --------------------------------------------------------------------------
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---- Auth ---- */}
        <Route path="/login" element={<Login />} />

        {/* ========================================================
            OPERATIONAL STAFF SHELL — all tenant users except SUPER_ADMIN
        ======================================================== */}
        <Route element={
          <ProtectedRoute allowedRoles={[
            'TENANT_ADMIN', 'MANAGER', 'RECEPTIONIST', 'CAPTAIN', 'CHEF',
            'HOUSEKEEPING', 'ACCOUNTANT', 'CASHIER'
          ]} />
        }>
          <Route element={<DashboardLayout />}>

            {/* --- General --- */}
            <Route element={<ProtectedRoute module="dashboard" />}>
              <Route path="/" element={<Dashboard />} />
            </Route>

            <Route element={<ProtectedRoute module="reports" />}>
              <Route path="/reports" element={<Reports />} />
            </Route>

            <Route element={<ProtectedRoute module="settings" />}>
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* --- Lodging --- */}
            <Route element={<ProtectedRoute module="rooms" />}>
              <Route path="/rooms"    element={<Rooms />} />
              <Route path="/checkin"  element={<CheckIn />} />
              <Route path="/checkout" element={<CheckOut />} />
            </Route>

            <Route element={<ProtectedRoute module="reservations" />}>
              <Route path="/reservations" element={<Reservations />} />
            </Route>

            <Route element={<ProtectedRoute module="housekeeping" />}>
              <Route path="/housekeeping" element={<Housekeeping />} />
            </Route>

            <Route element={<ProtectedRoute module="guests" />}>
              <Route path="/crm" element={<CRM />} />
            </Route>

            {/* --- Restaurant & POS --- */}
            <Route element={<ProtectedRoute module="tables" />}>
              <Route path="/tables" element={<Tables />} />
            </Route>

            <Route element={<ProtectedRoute module="kot" />}>
              <Route path="/kitchen" element={<Kitchen />} />
            </Route>

            <Route element={<ProtectedRoute module="pos" />}>
              <Route path="/menu" element={<Menu />} />
              <Route path="/pos"  element={<Billing />} />
              <Route path="/billing" element={<Billing />} />
            </Route>

            <Route element={<ProtectedRoute module="orders" />}>
              <Route path="/orders" element={<Orders />} />
            </Route>

            {/* --- Procurement --- */}
            <Route element={<ProtectedRoute module="inventory" />}>
              <Route path="/inventory" element={<Inventory />} />
            </Route>

            <Route element={<ProtectedRoute module="vendors" />}>
              <Route path="/vendors" element={<Vendors />} />
            </Route>

            <Route element={<ProtectedRoute module="purchases" />}>
              <Route path="/purchases" element={<Purchases />} />
            </Route>

            {/* Manager panel (accessible to admin + manager) */}
            <Route element={<ProtectedRoute allowedRoles={['TENANT_ADMIN', 'MANAGER']} />}>
              <Route path="/manager" element={<Manager />} />
            </Route>

          </Route>
        </Route>

        {/* ========================================================
            CAPTAIN PANEL — dedicated POS interface for captains
          */}
        <Route element={<ProtectedRoute allowedRoles={['CAPTAIN', 'TENANT_ADMIN', 'MANAGER']} />}>
          <Route element={<CaptainLayout />}>
            <Route path="/captain" element={<Captain />} />
          </Route>
        </Route>

        {/* ========================================================
            TENANT ADMIN PANEL — property management
        ======================================================== */}
        <Route element={<ProtectedRoute allowedRoles={['TENANT_ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin"          element={<AdminOverview />} />
            <Route path="/admin/users"    element={<AdminUsers />} />
            <Route path="/admin/rbac"     element={<AdminRBAC />} />
            <Route path="/admin/features" element={<AdminFeatures />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* ========================================================
            SUPER ADMIN PANEL — global SaaS management
        ======================================================== */}
        <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/superadmin"               element={<SuperAdminOverview />} />
            <Route path="/superadmin/tenants"        element={<SuperAdminTenants />} />
            <Route path="/superadmin/subscriptions"  element={<SuperAdminSubscriptions />} />
            <Route path="/superadmin/users"          element={<SuperAdminUsers />} />
            <Route path="/superadmin/rbac"           element={<SuperAdminRBAC />} />
            <Route path="/superadmin/logs"           element={<SuperAdminLogs />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

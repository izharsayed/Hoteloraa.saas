import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import AccessDenied from './components/AccessDenied.jsx';
import { Bell, Info, CheckCircle, AlertTriangle, X, Menu as MenuIcon, ChevronDown, LogOut } from 'lucide-react';
import api from './utils/api.js';

// Core Pages
import Login from './pages/Login.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import AttendanceEmployee from './pages/AttendanceEmployee.jsx';

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
import AttendanceSettings from './pages/AttendanceSettings.jsx';

// Captain Panel
import Captain from './pages/Captain.jsx';

// Super Admin Panel
import SuperAdminLayout from './components/SuperAdminLayout.jsx';
import SuperAdminOverview from './pages/SuperAdminOverview.jsx';
import SuperAdminTenants from './pages/SuperAdminTenants.jsx';
import SuperAdminSubscriptions from './pages/SuperAdminSubscriptions.jsx';
import SuperAdminUsers from './pages/SuperAdminUsers.jsx';
import SuperAdminRBAC from './pages/SuperAdminRBAC.jsx';
import SuperAdminLogs from './pages/SuperAdminLogs.jsx';
import SuperAdminTickets from './pages/SuperAdminTickets.jsx';

// Manager Panel
import Manager from './pages/Manager.jsx';
import AttendanceManager from './pages/AttendanceManager.jsx';
import ShiftManagement from './pages/ShiftManagement.jsx';

// Permissions utility
import { MODULE_ACCESS } from './utils/permissions.js';

// --------------------------------------------------------------------------
// DashboardLayout — shared shell for all operational staff routes
// --------------------------------------------------------------------------
function DashboardLayout() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed_manager') === 'true');
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

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

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error('Logout failed:', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login?loggedOut=1');
  };

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

  // Handle click outside to close notifications & user menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 relative">
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
  const userJson = localStorage.getItem('user');

  if (!userJson) {
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
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* ---- Auth ---- */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

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

            <Route element={<ProtectedRoute module="attendance" />}>
              <Route path="/attendance" element={<AttendanceEmployee />} />
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

            {/* <Route element={<ProtectedRoute module="guests" />}>
              <Route path="/crm" element={<CRM />} />
            </Route> */}

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

            <Route element={<ProtectedRoute module="attendance_manager" />}>
              <Route path="/attendance/manager" element={<AttendanceManager />} />
              <Route path="/attendance/settings" element={<AttendanceSettings />} />
            </Route>

            <Route element={<ProtectedRoute module="shifts" />}>
              <Route path="/shifts" element={<ShiftManagement />} />
            </Route>

          </Route>
        </Route>

        {/* ========================================================
            CAPTAIN PANEL — dedicated POS interface for captains
          */}
        <Route element={<ProtectedRoute allowedRoles={['CAPTAIN', 'TENANT_ADMIN', 'MANAGER']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/captain" element={<Captain />} />
            <Route path="/captain/history" element={<Captain />} />
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
            <Route path="/superadmin/tickets"        element={<SuperAdminTickets />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

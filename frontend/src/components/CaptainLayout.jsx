import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Coffee, Bell, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';
import api from '../utils/api.js';

function CaptainLayout() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const userJson = localStorage.getItem('user');
  let user = { name: 'Captain Staff', userRole: 'CAPTAIN', tenantName: 'Hoteloraa Property Node' };
  try {
    if (userJson) user = JSON.parse(userJson);
  } catch (e) {}

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'WT';

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login?loggedOut=1');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen flex flex-col bg-cream font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-border-cream bg-navy flex items-center justify-between px-6 z-10 shrink-0 text-white shadow-md">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/captain')}>
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center font-display font-bold text-navy">
            W
          </div>
          <div>
            <h1 className="font-display font-bold text-sm tracking-tight text-white leading-none">Hoteloraa</h1>
            <span className="text-[9px] font-bold text-gold/80 tracking-widest uppercase mt-1 block">Captain POS Ordering</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/5 rounded-xl transition-all relative flex items-center justify-center"
            >
              <Bell className="w-5 h-5 text-gold" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-navy shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-border-cream rounded-2xl shadow-xl z-50 overflow-hidden text-navy animate-scaleUp">
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

          <div className="text-right">
            <p className="text-xs font-semibold text-white/90">{user.name}</p>
            <p className="text-[9px] text-gold/80 font-bold uppercase tracking-wider">{user.tenantName || 'Live Property'}</p>
          </div>
          
          <div className="w-9 h-9 rounded-full bg-gold text-navy font-display font-bold flex items-center justify-center border border-white/20 shadow-inner">
            {initials}
          </div>

          <button 
            onClick={handleLogout}
            className="p-2 text-red-400 hover:bg-white/5 rounded-xl transition-all"
            title="Exit Platform"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 relative min-h-0">
        <Outlet />
      </main>
    </div>
  );
}

export default CaptainLayout;

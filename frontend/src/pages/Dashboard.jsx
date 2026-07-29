import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  IndianRupee, 
  Bed, 
  Utensils, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  ChevronRight,
  LifeBuoy,
  X,
  Loader2,
  CheckCircle,
  Trash2,
  UploadCloud,
  Bell,
  UserCheck,
  AlertTriangle,
  Info
} from 'lucide-react';
import api, { assetUrl } from '../utils/api';

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userJson = localStorage.getItem('user');
  let user = { businessType: 'HOTEL_RESTAURANT' };
  try {
    if (userJson) user = JSON.parse(userJson);
  } catch (e) {}

  const businessType = user.businessType || 'HOTEL_RESTAURANT';

  // Support Ticket Modal States
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ title: '', category: 'BUG', priority: 'MEDIUM', module: 'OTHER', description: '', attachmentUrl: '' });
  const [ticketSaving, setTicketSaving] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [attachmentUploading, setAttachmentUploading] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res || []);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

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

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setAttachmentUploading(true);
      setTicketError('');
      const result = await api.upload('/tickets/upload', formData);
      setTicketForm(p => ({ ...p, attachmentUrl: result.attachmentUrl }));
    } catch (err) {
      console.error(err);
      setTicketError(err.message || 'Failed to upload screenshot');
    } finally {
      setAttachmentUploading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.title || !ticketForm.description) return;
    try {
      setTicketSaving(true);
      setTicketError('');
      await api.post('/tickets', ticketForm);
      setTicketSuccess(true);
      setTicketForm({ title: '', category: 'BUG', priority: 'MEDIUM', module: 'OTHER', description: '', attachmentUrl: '' });
      setTimeout(() => {
        setTicketSuccess(false);
        setShowTicketModal(false);
      }, 2000);
    } catch (err) {
      setTicketError(err.message || 'Failed to submit ticket');
    } finally {
      setTicketSaving(false);
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard');
        setData(res);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-slate font-semibold text-xs animate-pulse">
        Loading operations dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500 font-semibold text-xs">
        {error}
      </div>
    );
  }

  // Dynamic calculations based on business type and loaded API data
  let metrics = [];
  let recentActivity = [];
  let revenueHighlights = {
    netSales: 0,
    title: 'Room & Table Sales',
    items: []
  };

  if (businessType === 'RESTAURANT') {
    const totalOrders = data?.totalOrders || 0;
    const todayRevenue = data?.todayRevenue || 0;
    const pendingKOTs = data?.pendingKOTs || 0;
    const occupiedTables = data?.occupiedTables || 0;
    const totalTables = data?.totalTables || 0;

    metrics = [
      {
        title: "Today's Orders",
        value: String(totalOrders),
        subtitle: 'Total POS & Takeaway orders',
        icon: Utensils,
        color: 'text-gold',
        bgColor: 'bg-gold-pale/30',
      },
      {
        title: 'Active Tables',
        value: `${occupiedTables} / ${totalTables}`,
        subtitle: 'Tables currently occupied',
        icon: Building,
        color: 'text-navy',
        bgColor: 'bg-gold-pale/50',
      },
      {
        title: 'Pending KOTs',
        value: String(pendingKOTs),
        subtitle: 'Kitchen tickets in queue',
        icon: Clock,
        color: 'text-success',
        bgColor: 'bg-success-pale',
      },
      {
        title: 'Gross Revenue (Today)',
        value: `₹${todayRevenue.toLocaleString()}`,
        subtitle: 'POS + Takeaways',
        icon: IndianRupee,
        color: 'text-navy',
        bgColor: 'bg-gold-pale/80',
      }
    ];

    recentActivity = (data?.recentOrders || []).map(order => {
      const orderTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        id: `order-${order.id}`,
        text: `Order #${order.orderNumber} placed for Table ${order.table?.name || 'Takeaway'}`,
        time: orderTime,
        status: order.status.toLowerCase() === 'completed' ? 'completed' : order.status.toLowerCase() === 'cancelled' ? 'alert' : 'preparing'
      };
    });

    revenueHighlights = {
      netSales: todayRevenue,
      title: 'Restaurant Sales',
      items: [
        { label: 'Dine-In Sales', value: data?.dineInSales || 0 },
        { label: 'Takeaways & Delivery', value: data?.takeawaySales || 0 }
      ]
    };

  } else if (businessType === 'LODGING') {
    const totalRooms = data?.totalRooms || 0;
    const occupiedRooms = data?.occupiedRooms || 0;
    const availableRooms = data?.availableRooms || 0;
    const todayCheckIns = data?.todayCheckIns || 0;
    const todayRevenue = data?.todayRevenue || 0;

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    metrics = [
      {
        title: 'Total Lodging Occupancy',
        value: `${occupancyRate}%`,
        subtitle: `${occupiedRooms} of ${totalRooms} Rooms Booked`,
        icon: Bed,
        color: 'text-navy',
        bgColor: 'bg-gold-pale/50',
      },
      {
        title: "Today's Arrivals",
        value: String(todayCheckIns),
        subtitle: 'Expected check-ins',
        icon: Clock,
        color: 'text-gold',
        bgColor: 'bg-gold-pale/30',
      },
      {
        title: 'Available Rooms',
        value: String(availableRooms),
        subtitle: 'Ready for check-in',
        icon: Building,
        color: 'text-success',
        bgColor: 'bg-success-pale',
      },
      {
        title: 'Gross Revenue (Today)',
        value: `₹${todayRevenue.toLocaleString()}`,
        subtitle: 'Lodging + Service',
        icon: IndianRupee,
        color: 'text-navy',
        bgColor: 'bg-gold-pale/80',
      }
    ];

    recentActivity = (data?.recentReservations || []).map(res => {
      const timeStr = new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        id: `res-${res.id}`,
        text: `Booking ${res.bookingRef} created for Guest ${res.guest?.name || 'Walk-In'} (Room ${res.room?.number || 'TBD'})`,
        time: timeStr,
        status: res.status === 'CHECKED_OUT' ? 'completed' : res.status === 'CHECKED_IN' ? 'completed' : res.status === 'CANCELLED' ? 'alert' : 'preparing'
      };
    });

    revenueHighlights = {
      netSales: todayRevenue,
      title: 'Lodging Sales',
      items: [
        { label: 'Room Bookings', value: data?.roomBookings || 0 },
        { label: 'Room Service & Laundry', value: data?.roomService || 0 }
      ]
    };

  } else { // HOTEL_RESTAURANT
    const restaurant = data?.restaurant || {};
    const lodging = data?.lodging || {};
    const combinedTodayRevenue = data?.combinedTodayRevenue || 0;

    const occupancyRate = lodging.totalRooms > 0 ? Math.round((lodging.occupiedRooms / lodging.totalRooms) * 100) : 0;

    metrics = [
      {
        title: 'Total Lodging Occupancy',
        value: `${occupancyRate}%`,
        subtitle: `${lodging.occupiedRooms || 0} of ${lodging.totalRooms || 0} Rooms Booked`,
        icon: Bed,
        color: 'text-navy',
        bgColor: 'bg-gold-pale/50',
      },
      {
        title: "Today's POS Sales",
        value: `₹${(restaurant.todayRevenue || 0).toLocaleString()}`,
        subtitle: `${restaurant.totalOrders || 0} orders completed`,
        icon: Utensils,
        color: 'text-gold',
        bgColor: 'bg-gold-pale/30',
      },
      {
        title: 'Available Rooms',
        value: String(lodging.availableRooms || 0),
        subtitle: 'Ready for check-in',
        icon: Building,
        color: 'text-success',
        bgColor: 'bg-success-pale',
      },
      {
        title: 'Gross Revenue (Today)',
        value: `₹${combinedTodayRevenue.toLocaleString()}`,
        subtitle: 'Lodging + POS + Service',
        icon: IndianRupee,
        color: 'text-navy',
        bgColor: 'bg-gold-pale/80',
      }
    ];

    const orderActivities = (restaurant.recentOrders || []).map(order => ({
      id: `order-${order.id}`,
      text: `Order #${order.orderNumber} placed for Table ${order.table?.name || 'Takeaway'}`,
      createdAt: new Date(order.createdAt),
      time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: order.status.toLowerCase() === 'completed' ? 'completed' : order.status.toLowerCase() === 'cancelled' ? 'alert' : 'preparing'
    }));

    const resActivities = (lodging.recentReservations || []).map(res => ({
      id: `res-${res.id}`,
      text: `Booking ${res.bookingRef} created for Guest ${res.guest?.name || 'Walk-In'} (Room ${res.room?.number || 'TBD'})`,
      createdAt: new Date(res.createdAt),
      time: new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: res.status === 'CHECKED_OUT' ? 'completed' : res.status === 'CHECKED_IN' ? 'completed' : res.status === 'CANCELLED' ? 'alert' : 'preparing'
    }));

    recentActivity = [...orderActivities, ...resActivities]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8);

    revenueHighlights = {
      netSales: combinedTodayRevenue,
      title: 'Room & Table Sales',
      items: [
        { label: 'Room Bookings', value: lodging.roomBookings || 0 },
        { label: 'Restaurant Dining', value: restaurant.dineInSales || 0 },
        { label: 'Takeaways & Delivery', value: restaurant.takeawaySales || 0 },
        { label: 'Room Service & Laundry', value: lodging.roomService || 0 }
      ]
    };
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">
            Operations Dashboard
          </h1>
          <p className="text-slate text-sm font-medium mt-1">
            Real-time status overview of Hotel & Restaurant modules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm px-3 py-1.5 bg-white border border-border-cream rounded-xl text-slate shadow-sm">
            Fiscal: {new Date().toISOString().split('T')[0]}
          </span>

          {businessType !== 'RESTAURANT' && (
            <button 
              onClick={() => navigate('/checkin')} 
              title="Quick Check-In"
              className="p-3 bg-white border border-border-cream rounded-2xl text-charcoal hover:bg-cream/40 transition-all relative flex items-center justify-center shadow-sm cursor-pointer"
            >
              <UserCheck className="w-6 h-6 text-black" />
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="Notifications"
              className="p-3 bg-white border border-border-cream rounded-2xl text-charcoal hover:bg-cream/40 transition-all relative flex items-center justify-center shadow-sm cursor-pointer"
            >
              <Bell className="w-6 h-6 text-black" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-border-cream rounded-2xl shadow-xl z-50 overflow-hidden animate-scaleUp p-1">
                <div className="p-3 border-b border-border-cream flex justify-between items-center bg-cream/20 rounded-t-xl">
                  <span className="font-display font-bold text-navy text-xs uppercase tracking-wider">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-amber-600 hover:text-navy font-bold transition-all uppercase cursor-pointer"
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
                        className={`p-3 hover:bg-cream/30 cursor-pointer flex gap-3 items-start transition-all rounded-lg ${!notif.isRead ? 'bg-amber-50/20' : ''}`}
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
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="soft-card p-5 flex flex-col justify-between h-36 hover:shadow-md transition-all">
              {/* Top Row: Label + Icon */}
              <div className="flex justify-between items-start">
                <span className="text-slate text-xs font-semibold uppercase tracking-wider leading-tight">{metric.title}</span>
                <div className={`p-2 rounded-xl ${metric.bgColor} ${metric.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Bottom Row: Value + Subtitle */}
              <div className="flex items-end justify-between gap-2">
                <h3 className="font-mono font-bold text-3xl text-navy tracking-tight leading-none">{metric.value}</h3>
                <span className="text-[11px] font-semibold text-charcoal leading-tight text-right max-w-[90px]">{metric.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Operational Activity Log */}
        <div className="soft-card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-2xl text-navy">Live Operations Feed</h2>
              <span onClick={() => navigate('/reports')} className="text-xs text-gold font-semibold flex items-center cursor-pointer hover:underline">
                View All Audit Logs <ChevronRight className="w-4 h-4" />
              </span>
            </div>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-10 text-slate text-xs font-semibold">
                  No recent activities recorded today
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-cream/40 rounded-xl transition-colors">
                    <div className="p-2 rounded-lg bg-cream/70 text-slate mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-charcoal truncate">{activity.text}</p>
                      <p className="text-xs text-slate font-medium mt-0.5">{activity.time}</p>
                    </div>
                    <div>
                      <span className={`
                        text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg
                        ${activity.status === 'completed' && 'bg-success-pale text-success border border-success/20'}
                        ${activity.status === 'preparing' && 'bg-warning-pale text-warning border border-warning/20'}
                        ${activity.status === 'paid' && 'bg-success-pale text-success border border-success/20'}
                        ${activity.status === 'alert' && 'bg-danger-pale text-danger border border-danger/20'}
                      `}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Brand/Revenue Split Card */}
        <div className="soft-card p-6 flex flex-col justify-between bg-white text-navy hover:border-gold">
          <div>
            <h3 className="font-display font-bold text-2xl text-navy">{revenueHighlights.title}</h3>

            <div className="mt-8 space-y-4">
              {revenueHighlights.items.map((item, idx) => (
                <div key={idx} className={`flex justify-between items-center ${idx < revenueHighlights.items.length - 1 ? 'border-b border-border-cream/60 pb-2.5' : ''}`}>
                  <span className="text-sm text-slate font-medium">{item.label}</span>
                  <span className="font-mono text-base text-navy font-bold">₹{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border-cream pt-4 mt-6 flex justify-between items-center">
            <span className="text-sm text-navy font-bold uppercase tracking-wider">Net Sales</span>
            <span className="font-mono text-2xl text-navy font-extrabold">
              ₹{revenueHighlights.netSales.toLocaleString()}
            </span>
          </div>
        </div>
    </div>

      {/* Support Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-navy/10 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] border border-border-cream p-8 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowTicketModal(false)} disabled={ticketSaving}
              className="absolute top-6 right-6 text-slate hover:text-navy transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-semibold text-lg text-navy mb-1 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-gold animate-spin-slow" /> Report System Issue
            </h3>
            <p className="text-slate text-xs mb-6">Create a support ticket to platform administrators about any system error or problem.</p>

            {ticketSuccess ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-success animate-bounce" />
                <h4 className="font-display font-bold text-navy text-base">Ticket Submitted!</h4>
                <p className="text-slate text-xs font-semibold">Our platform administrators have been notified.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateTicket} className="space-y-4">
                {ticketError && (
                  <div className="p-3 bg-danger-pale border border-danger/10 rounded-xl text-danger text-xs font-semibold">
                    {ticketError}
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Ticket Title *</label>
                  <input type="text" required placeholder="e.g. POS printer not printing invoice"
                    value={ticketForm.title} onChange={e => setTicketForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold" disabled={ticketSaving} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Affected Module</label>
                  <select value={ticketForm.module} onChange={e => setTicketForm(p => ({ ...p, module: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold" disabled={ticketSaving}>
                    <option value="DASHBOARD">Dashboard & Overview</option>
                    <option value="TABLES">Dining Tables / Seating</option>
                    <option value="MENU">Menu Management</option>
                    <option value="ORDERS">POS Orders</option>
                    <option value="KOT">Kitchen (KOT)</option>
                    <option value="POS">POS Billing Checkout</option>
                    <option value="ROOMS">Rooms Directory</option>
                    <option value="RESERVATIONS">Room Reservations</option>
                    <option value="CHECKIN_CHECKOUT">Check-In / Check-Out</option>
                    <option value="HOUSEKEEPING">Housekeeping</option>
                    <option value="INVENTORY">Inventory & Stock</option>
                    <option value="VENDORS_PURCHASES">Vendors & Procurement</option>
                    <option value="ATTENDANCE_SHIFTS">Attendance & Shifts</option>
                    <option value="REPORTS">Reports & Analytics</option>
                    <option value="SETTINGS_USERS">System Settings & Users</option>
                    <option value="OTHER">Other / General</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Category</label>
                    <select value={ticketForm.category} onChange={e => setTicketForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold" disabled={ticketSaving}>
                      <option value="BUG">Bug / Error</option>
                      <option value="QUESTION">Question</option>
                      <option value="FEATURE_REQUEST">Feature Request</option>
                      <option value="BILLING">Billing / Subscription</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Priority</label>
                    <select value={ticketForm.priority} onChange={e => setTicketForm(p => ({ ...p, priority: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold" disabled={ticketSaving}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Detailed Description *</label>
                  <textarea required rows={4} placeholder="Describe the error, what triggers it, and any details to help us troubleshoot..."
                    value={ticketForm.description} onChange={e => setTicketForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold" disabled={ticketSaving} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Screenshot / Photos</label>
                  {ticketForm.attachmentUrl ? (
                    <div className="relative border border-border-cream rounded-xl p-2 bg-cream/5 flex items-center justify-between group">
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={assetUrl(ticketForm.attachmentUrl)} 
                          alt="Screenshot preview" 
                          className="w-12 h-12 object-cover rounded-lg border border-border-cream"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-navy truncate">
                            {ticketForm.attachmentUrl.split('/').pop()}
                          </p>
                          <p className="text-[9px] text-slate font-medium">Uploaded successfully</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setTicketForm(p => ({ ...p, attachmentUrl: '' }))}
                        className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={attachmentUploading || ticketSaving}
                        className="hidden" 
                        id="ticket-screenshot"
                      />
                      <label 
                        htmlFor="ticket-screenshot"
                        className={`w-full flex flex-col items-center justify-center py-4 border border-dashed border-border-cream rounded-xl hover:border-gold cursor-pointer transition-all ${
                          attachmentUploading ? 'opacity-70 pointer-events-none' : ''
                        }`}
                      >
                        {attachmentUploading ? (
                          <>
                            <Loader2 className="w-6 h-6 text-gold animate-spin mb-1.5" />
                            <span className="text-[11px] font-bold text-navy">Uploading screenshot...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-6 h-6 text-gold mb-1.5" />
                            <span className="text-[11px] font-bold text-navy">Upload screenshot or photo</span>
                            <span className="text-[9px] text-slate mt-0.5">JPEG, PNG, WEBP up to 5MB</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowTicketModal(false)} disabled={ticketSaving}
                    className="w-1/2 px-4 py-2.5 border border-border-cream text-charcoal hover:bg-stone-50 rounded-xl text-xs font-bold">
                    Cancel
                  </button>
                  <button type="submit" disabled={ticketSaving}
                    className="w-1/2 px-4 py-2.5 bg-navy text-white hover:bg-navy/90 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                    {ticketSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LifeBuoy className="w-4 h-4" />}
                    {ticketSaving ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  DollarSign, 
  Bed, 
  Utensils, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import api from '../utils/api';

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
        icon: DollarSign,
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
        icon: DollarSign,
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
        icon: DollarSign,
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
            Hoteloraa Operations Dashboard
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
            <button onClick={() => navigate('/checkin')} className="btn-primary">
              Quick Check-In <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="soft-card p-6 flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate text-xs font-semibold uppercase tracking-wider">{metric.title}</span>
                  <h3 className="font-mono font-bold text-2xl text-navy mt-2 tracking-tight">{metric.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${metric.bgColor} ${metric.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-xs text-slate border-t border-border-cream/50 pt-3 mt-3 font-medium flex items-center justify-between">
                <span>{metric.subtitle}</span>
                <TrendingUp className="w-3.5 h-3.5 text-success" />
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
              <h2 className="font-display font-semibold text-lg text-navy">Live Operations Feed</h2>
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
                      <p className="text-xs font-semibold text-charcoal truncate">{activity.text}</p>
                      <p className="text-[10px] text-slate font-medium mt-0.5">{activity.time}</p>
                    </div>
                    <div>
                      <span className={`
                        text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded
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
        <div className="soft-card p-6 flex flex-col justify-between bg-navy text-white hover:border-gold">
          <div>
            <div className="mb-4">
              <span className="text-[10px] bg-gold/20 text-gold font-mono font-bold uppercase tracking-wider px-2.5 py-1 border border-gold/30 rounded-lg">
                Revenue Highlights
              </span>
            </div>
            <h3 className="font-display font-bold text-2xl text-gold-pale mt-4">{revenueHighlights.title}</h3>
            <p className="text-slate text-xs mt-1">Daily consolidated segment audit</p>

            <div className="mt-8 space-y-4">
              {revenueHighlights.items.map((item, idx) => (
                <div key={idx} className={`flex justify-between items-center ${idx < revenueHighlights.items.length - 1 ? 'border-b border-white/10 pb-2' : ''}`}>
                  <span className="text-xs text-slate font-medium">{item.label}</span>
                  <span className="font-mono text-sm text-white">₹{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-6 flex justify-between items-center">
            <span className="text-xs text-gold font-semibold uppercase tracking-wider">Net Sales</span>
            <span className="font-mono text-xl text-gold font-bold">
              ₹{revenueHighlights.netSales.toLocaleString()}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;

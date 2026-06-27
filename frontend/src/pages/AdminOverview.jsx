import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  ShieldCheck, 
  Sliders, 
  CreditCard, 
  CheckCircle,
  Building,
  Activity,
  UserPlus,
  BedDouble,
  Utensils,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import api from '../utils/api.js';

function AdminOverview() {
  const navigate = useNavigate();
  const [tenantProfile, setTenantProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userJson = localStorage.getItem('user');
  let user = { tenantName: 'Property Node', businessType: 'HOTEL_RESTAURANT' };
  try {
    if (userJson) user = JSON.parse(userJson);
  } catch (e) {}

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [profile, dashMetrics, userList] = await Promise.all([
        api.get('/tenant/profile'),
        api.get('/dashboard'),
        api.get('/users')
      ]);
      
      setTenantProfile(profile);
      setDashboard(dashMetrics);
      setStaff(userList || []);
    } catch (err) {
      console.error('Error fetching admin overview metrics:', err);
      setError(err.message || 'Failed to connect to backend service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-navy font-bold text-xs uppercase tracking-wider animate-pulse flex items-center gap-3">
          <Activity className="w-5 h-5 animate-spin text-gold" /> Loading property command panel...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 soft-card bg-danger-pale border border-danger/10 text-danger rounded-2xl flex flex-col items-center gap-4 max-w-md mx-auto mt-[10vh]">
        <div className="w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center text-danger">
          <Activity className="w-6 h-6" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wider">Service Unavailable</p>
          <p className="text-xs text-slate mt-1 font-medium">{error}</p>
        </div>
        <button 
          onClick={fetchData}
          className="btn-primary text-xs w-full py-2.5 rounded-xl mt-2 transition-all active:scale-95"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const businessType = tenantProfile?.businessType || user.businessType || 'HOTEL_RESTAURANT';
  const subscriptionPlan = tenantProfile?.subscription?.plan || 'ENTERPRISE';
  const subscriptionStatus = tenantProfile?.subscription?.status || 'ACTIVE';
  
  const totalStaff = staff.length;
  const activeStaff = staff.filter(u => u.isActive).length;

  const showLodging = businessType === 'LODGING' || businessType === 'HOTEL_RESTAURANT';
  const showRestaurant = businessType === 'RESTAURANT' || businessType === 'HOTEL_RESTAURANT';

  // Metrics for lodging
  const occupiedRooms = dashboard?.lodging?.occupiedRooms ?? dashboard?.occupiedRooms ?? 0;
  const totalRooms = dashboard?.lodging?.totalRooms ?? dashboard?.totalRooms ?? 0;
  const todayCheckIns = dashboard?.lodging?.todayCheckIns ?? dashboard?.todayCheckIns ?? 0;
  const todayCheckOuts = dashboard?.lodging?.todayCheckOuts ?? dashboard?.todayCheckOuts ?? 0;
  const pendingHousekeeping = dashboard?.lodging?.pendingHousekeeping ?? dashboard?.pendingHousekeeping ?? 0;

  // Metrics for restaurant
  const occupiedTables = dashboard?.restaurant?.occupiedTables ?? dashboard?.occupiedTables ?? 0;
  const totalTables = dashboard?.restaurant?.totalTables ?? dashboard?.totalTables ?? 0;
  const totalOrders = dashboard?.restaurant?.totalOrders ?? dashboard?.totalOrders ?? 0;
  const pendingKOTs = dashboard?.restaurant?.pendingKOTs ?? dashboard?.pendingKOTs ?? 0;
  
  const todayRevenue = dashboard?.combinedTodayRevenue ?? dashboard?.todayRevenue ?? 0;

  const cards = [
    {
      title: 'Staff Personnel',
      value: `${activeStaff} / ${totalStaff} Active`,
      subtitle: `${totalStaff - activeStaff} Suspended Accounts`,
      icon: Users,
      color: 'text-navy',
      bgColor: 'bg-gold-pale/50',
      actionText: 'Manage Staff Registry',
      action: () => navigate('/admin/users')
    },
    {
      title: 'Business Category',
      value: businessType.replace('_', ' '),
      subtitle: 'SaaS isolated operations mode',
      icon: Building,
      color: 'text-gold',
      bgColor: 'bg-gold-pale/30',
      actionText: 'Configure Modules',
      action: () => navigate('/admin/features')
    },
    {
      title: 'Tenant Subscription',
      value: subscriptionPlan,
      subtitle: `Status: ${subscriptionStatus}`,
      icon: CreditCard,
      color: subscriptionStatus === 'ACTIVE' ? 'text-success' : 'text-danger',
      bgColor: subscriptionStatus === 'ACTIVE' ? 'bg-success-pale' : 'bg-danger-pale',
      actionText: 'Billing Settings & Plans',
      action: () => navigate('/admin/settings')
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome Title */}
      <div>
        <h1 className="font-display font-bold text-3xl text-navy">
          Property Control Command
        </h1>
        <p className="text-slate text-sm font-medium mt-1">
          SaaS administrative dashboard for <span className="font-bold text-navy">{tenantProfile?.name || user.tenantName || 'your property node'}</span>.
        </p>
      </div>

      {/* Main Admin Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="soft-card p-6 bg-white flex flex-col justify-between h-48 group hover:border-gold/50 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate text-xs font-semibold uppercase tracking-wider">{card.title}</span>
                  <h3 className="font-sans font-bold text-2xl text-navy mt-2.5 tracking-tight">{card.value}</h3>
                  <p className="text-[10px] text-slate font-medium mt-1">{card.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bgColor} ${card.color} transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <button 
                onClick={card.action}
                className="text-xs text-gold font-bold flex items-center gap-1.5 hover:text-gold-light border-t border-border-cream/50 pt-3 mt-3 w-full text-left transition-colors"
              >
                {card.actionText} →
              </button>
            </div>
          );
        })}
      </div>

      {/* Real-time Property Operations */}
      {(showLodging || showRestaurant) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-gold" />
            <h2 className="font-display font-semibold text-lg text-navy">Live Operations Dashboard</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lodging Command */}
            {showLodging && (
              <div className="soft-card p-6 bg-white flex flex-col justify-between space-y-6">
                <div className="flex justify-between items-start border-b border-border-cream/50 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-gold" /> Lodging Command
                    </h3>
                    <p className="text-[10px] text-slate font-medium mt-0.5">Rooms allocation & front desk heartbeat</p>
                  </div>
                  <span className="text-[9px] font-bold text-success bg-success-pale border border-success/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Live Sync
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Occupancy bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-charcoal">
                      <span>Room Occupancy</span>
                      <span className="font-mono">{occupiedRooms} / {totalRooms} Rooms ({totalRooms > 0 ? Math.round((occupiedRooms/totalRooms)*100) : 0}%)</span>
                    </div>
                    <div className="w-full h-2 bg-cream rounded-full overflow-hidden border border-border-cream/40">
                      <div 
                        className="h-full bg-gold rounded-full transition-all duration-500" 
                        style={{ width: `${totalRooms > 0 ? (occupiedRooms/totalRooms)*100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Grid check-ins check-outs */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-cream/40 border border-border-cream/50 p-3 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-bold text-slate uppercase tracking-wider block">Check-ins</span>
                      <span className="font-sans font-bold text-lg text-navy block">{todayCheckIns}</span>
                    </div>
                    <div className="bg-cream/40 border border-border-cream/50 p-3 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-bold text-slate uppercase tracking-wider block">Check-outs</span>
                      <span className="font-sans font-bold text-lg text-navy block">{todayCheckOuts}</span>
                    </div>
                    <div className="bg-danger-pale border border-danger/10 p-3 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-bold text-danger uppercase tracking-wider block">Housekeeping</span>
                      <span className="font-sans font-bold text-lg text-danger block">{pendingHousekeeping}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Restaurant & Kitchen Command */}
            {showRestaurant && (
              <div className="soft-card p-6 bg-white flex flex-col justify-between space-y-6">
                <div className="flex justify-between items-start border-b border-border-cream/50 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-gold" /> Kitchen & POS Command
                    </h3>
                    <p className="text-[10px] text-slate font-medium mt-0.5">Dining tables status & kitchen ticket stream</p>
                  </div>
                  <span className="text-[9px] font-bold text-success bg-success-pale border border-success/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Live Sync
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Table Occupancy bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-charcoal">
                      <span>Table Occupancy</span>
                      <span className="font-mono">{occupiedTables} / {totalTables} Tables ({totalTables > 0 ? Math.round((occupiedTables/totalTables)*100) : 0}%)</span>
                    </div>
                    <div className="w-full h-2 bg-cream rounded-full overflow-hidden border border-border-cream/40">
                      <div 
                        className="h-full bg-gold rounded-full transition-all duration-500" 
                        style={{ width: `${totalTables > 0 ? (occupiedTables/totalTables)*100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Grid tables, tickets, revenue */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-cream/40 border border-border-cream/50 p-3 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-bold text-slate uppercase tracking-wider block">Today Orders</span>
                      <span className="font-sans font-bold text-lg text-navy block">{totalOrders}</span>
                    </div>
                    <div className="bg-warning-pale border border-warning/10 p-3 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-bold text-warning uppercase tracking-wider block">Pending KOTs</span>
                      <span className="font-sans font-bold text-lg text-warning block">{pendingKOTs}</span>
                    </div>
                    <div className="bg-success-pale border border-success/10 p-3 rounded-xl text-center space-y-1">
                      <span className="text-[9px] font-bold text-success uppercase tracking-wider block">Today Sales</span>
                      <span className="font-sans font-bold text-base text-success block truncate">₹{todayRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Setup Check & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="soft-card p-6 lg:col-span-2 space-y-5">
          <h2 className="font-display font-semibold text-lg text-navy border-b border-border-cream pb-3">Administrative Checklist</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3.5 bg-cream/10 border border-border-cream/30 hover:border-gold/25 hover:bg-cream/40 rounded-xl transition-all duration-300">
              <div className="p-2 rounded-xl bg-success-pale text-success border border-success/10 shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">Tenant Database Seeded</p>
                <p className="text-xs text-charcoal/80 font-medium mt-0.5">All default roles, modules and permission records exist.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3.5 bg-cream/10 border border-border-cream/30 hover:border-gold/25 hover:bg-cream/40 rounded-xl transition-all duration-300">
              <div className="p-2 rounded-xl bg-success-pale text-success border border-success/10 shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">Operational Staff Configured</p>
                <p className="text-xs text-charcoal/80 font-medium mt-0.5">Manager, Cashier, Chef, and Captain accounts initialized.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3.5 bg-cream/10 border border-border-cream/30 hover:border-gold/25 hover:bg-cream/40 rounded-xl transition-all duration-300">
              <div className="p-2 rounded-xl bg-success-pale text-success border border-success/10 shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">Granular Access Control Policies (RBAC)</p>
                <p className="text-xs text-charcoal/80 font-medium mt-0.5">Static role overrides and permissions matrices are enabled.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Administrator Actions */}
        <div className="soft-card p-6 bg-gradient-to-br from-navy via-navy/95 to-[#06101E] text-white flex flex-col justify-between border border-gold/15 shadow-2xl shadow-navy/20">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[9px] bg-gold/20 text-gold font-mono font-bold uppercase tracking-wider px-2.5 py-1 border border-gold/30 rounded-lg">
                Quick Actions
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-ping" />
            </div>
            <h3 className="font-display font-bold text-xl text-gold-pale mt-3">System Utilities</h3>
            <p className="text-stone-300 text-xs mt-1 font-medium">Direct shortcuts to admin operations.</p>

            <div className="space-y-2.5 pt-4">
              <button 
                onClick={() => navigate('/admin/users')}
                className="w-full flex items-center justify-between text-xs p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold/35 text-white font-semibold transition-all duration-200 group active:scale-[0.98]"
              >
                <span className="flex items-center gap-2.5"><UserPlus className="w-4.5 h-4.5 text-gold" /> Onboard Staff</span>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
              </button>

              <button 
                onClick={() => navigate('/admin/rbac')}
                className="w-full flex items-center justify-between text-xs p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold/35 text-white font-semibold transition-all duration-200 group active:scale-[0.98]"
              >
                <span className="flex items-center gap-2.5"><ShieldCheck className="w-4.5 h-4.5 text-gold" /> Edit Permissions</span>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
              </button>

              <button 
                onClick={() => navigate('/admin/features')}
                className="w-full flex items-center justify-between text-xs p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold/35 text-white font-semibold transition-all duration-200 group active:scale-[0.98]"
              >
                <span className="flex items-center gap-2.5"><Sliders className="w-4.5 h-4.5 text-gold" /> Toggle Modules</span>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-6 text-[10px] text-stone-400 font-medium text-center">
            System Node: <span className="text-gold font-semibold uppercase tracking-wider">{businessType.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOverview;

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
  TrendingUp,
  UserPlus
} from 'lucide-react';

function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    staffCount: 4,
    activeStaff: 3,
    businessType: 'HOTEL_RESTAURANT',
    subscriptionPlan: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    roomsCount: 24,
    tablesCount: 15
  });

  const userJson = localStorage.getItem('user');
  let user = { tenantName: 'Property Node' };
  try {
    if (userJson) user = JSON.parse(userJson);
  } catch (e) {}

  useEffect(() => {
    // Populate stats based on logged-in tenant business type
    if (user.businessType) {
      setStats(prev => ({
        ...prev,
        businessType: user.businessType,
        subscriptionPlan: user.tenantName === 'Cafe Aroma' ? 'STARTER' : 'ENTERPRISE'
      }));
    }
  }, [user.businessType, user.tenantName]);

  const cards = [
    {
      title: 'Staff Personnel',
      value: `${stats.activeStaff} / ${stats.staffCount} Online`,
      subtitle: 'Managers, Captains, Chefs',
      icon: Users,
      color: 'text-navy',
      bgColor: 'bg-gold-pale/50',
      actionText: 'Manage Staff',
      action: () => navigate('/admin/users')
    },
    {
      title: 'Business Category',
      value: stats.businessType.replace('_', ' '),
      subtitle: 'SaaS isolated operations mode',
      icon: Building,
      color: 'text-gold',
      bgColor: 'bg-gold-pale/30',
      actionText: 'Toggle Modules',
      action: () => navigate('/admin/features')
    },
    {
      title: 'Tenant Subscription',
      value: stats.subscriptionPlan,
      subtitle: `Status: ${stats.subscriptionStatus}`,
      icon: CreditCard,
      color: 'text-success',
      bgColor: 'bg-success-pale',
      actionText: 'Billing Settings',
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
          SaaS administrative dashboard for {user.tenantName || 'your property node'}.
        </p>
      </div>

      {/* Main Admin Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="soft-card p-6 flex flex-col justify-between h-48">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate text-xs font-semibold uppercase tracking-wider">{card.title}</span>
                  <h3 className="font-display font-bold text-xl text-navy mt-2 tracking-tight">{card.value}</h3>
                  <p className="text-[10px] text-slate font-medium mt-1">{card.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bgColor} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <button 
                onClick={card.action}
                className="text-xs text-gold font-bold flex items-center gap-1.5 hover:underline border-t border-border-cream/50 pt-3 mt-3 w-full text-left"
              >
                {card.actionText} →
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick Setup Check & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="soft-card p-6 lg:col-span-2 space-y-4">
          <h2 className="font-display font-semibold text-lg text-navy border-b border-border-cream pb-3">Administrative Checklist</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-2 hover:bg-cream/40 rounded-xl">
              <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-charcoal">Tenant Database Seeded</p>
                <p className="text-[10px] text-slate">All default roles, modules and permission records exist.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 hover:bg-cream/40 rounded-xl">
              <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-charcoal">Operational Staff Configured</p>
                <p className="text-[10px] text-slate">Manager, Cashier, Chef, and Captain accounts initialized.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2 hover:bg-cream/40 rounded-xl">
              <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-charcoal">Granular Access Control Policies (RBAC)</p>
                <p className="text-[10px] text-slate">Static role overrides and permissions matrices are enabled.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Administrator Actions */}
        <div className="soft-card p-6 bg-navy text-white flex flex-col justify-between border border-gold/10">
          <div className="space-y-4">
            <span className="text-[9px] bg-gold/20 text-gold font-mono font-bold uppercase tracking-wider px-2.5 py-1 border border-gold/30 rounded-lg">
              Quick Actions
            </span>
            <h3 className="font-display font-bold text-xl text-gold-pale mt-4">System Utilities</h3>
            <p className="text-slate text-xs mt-1">Direct shortcuts to admin operations.</p>

            <div className="space-y-2 pt-4">
              <button 
                onClick={() => navigate('/admin/users')}
                className="w-full flex items-center justify-between text-xs p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-all"
              >
                <span className="flex items-center gap-2"><UserPlus className="w-4 h-4 text-gold" /> Onboard Staff</span>
                <span>→</span>
              </button>

              <button 
                onClick={() => navigate('/admin/rbac')}
                className="w-full flex items-center justify-between text-xs p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-all"
              >
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-gold" /> Edit Permissions</span>
                <span>→</span>
              </button>

              <button 
                onClick={() => navigate('/admin/features')}
                className="w-full flex items-center justify-between text-xs p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-all"
              >
                <span className="flex items-center gap-2"><Sliders className="w-4 h-4 text-gold" /> Toggle Modules</span>
                <span>→</span>
              </button>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-6 text-[10px] text-slate font-medium text-center">
            System Node: {stats.businessType === 'HOTEL_RESTAURANT' ? 'Hybrid Hotel/POS' : stats.businessType}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOverview;

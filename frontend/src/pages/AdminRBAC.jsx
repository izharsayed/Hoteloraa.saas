import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, LayoutGrid, CheckSquare, Layers } from 'lucide-react';
import api from '../utils/api.js';

function AdminRBAC() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  const systemRoles = [
    { id: 'sys-manager', name: 'Manager', description: 'Full operational authority over lodging, POS, staff, and financial reporting.', isSystem: true },
    { id: 'sys-receptionist', name: 'Receptionist', description: 'Front desk operations, guest check-ins, reservations, and checkout folios.', isSystem: true },
    { id: 'sys-captain', name: 'Captain', description: 'Restaurant dining table seating, live POS order entry, and customer billing.', isSystem: true },
    { id: 'sys-chef', name: 'Chef', description: 'Kitchen Order Ticket (KOT) preparation, status timers, and order routing.', isSystem: true },
    { id: 'sys-housekeeping', name: 'Housekeeping', description: 'Room status management, cleaning task rosters, and inspection logs.', isSystem: true },
    { id: 'sys-accountant', name: 'Accountant', description: 'Financial auditing, revenue reports, tax summaries, and expense tracking.', isSystem: true },
    { id: 'sys-cashier', name: 'Cashier', description: 'POS billing checkout, payment collection, and daily register settlement.', isSystem: true },
  ];

  const roleCapabilitiesMap = {
    'Manager': {
      modules: ['Dashboard', 'Rooms Directory', 'Reservations', 'Check-In & Check-Out', 'Housekeeping Board', 'Table Seating Map', 'POS Terminal & Menu', 'Kitchen KOT', 'Inventory & Stock', 'Vendors & Purchases', 'Reports & Analytics', 'Attendance & Shifts'],
      rights: [
        'Full administrative access across lodging & restaurant modules',
        'Manage staff employee rosters, attendance records, and shift schedules',
        'Override room rates, apply custom discounts, and process refunds',
        'Inspect comprehensive financial reports and system audit logs'
      ]
    },
    'Receptionist': {
      modules: ['Dashboard', 'Rooms Directory', 'Reservations', 'Front Desk Check-In', 'Folios & Check-Out', 'Housekeeping Board'],
      rights: [
        'Create and modify room bookings and guest reservations',
        'Process guest check-ins, key card allocations, and checkout folios',
        'View real-time room status grid (Available, Occupied, Dirty, Maintenance)',
        'Collect booking advance payments and print guest checkout invoices'
      ]
    },
    'Captain': {
      modules: ['Dashboard', 'Table Seating Map', 'Captain POS Terminal', 'Active Orders & History', 'POS Billing'],
      rights: [
        'Punch dining orders directly at guest tables via tablet / POS',
        'Send Kitchen Order Tickets (KOT) directly to kitchen displays',
        'Manage dining table seating maps, covers, and order transfers',
        'Initiate customer billing checkout and table clearance requests'
      ]
    },
    'Chef': {
      modules: ['Kitchen (KOT) Board'],
      rights: [
        'View incoming Kitchen Order Tickets (KOT) in real time',
        'Update dish preparation statuses (Pending -> Preparing -> Ready)',
        'Track preparation timers and ticket dispatch queues',
        'Alert restaurant captains when orders are ready for serving'
      ]
    },
    'Housekeeping': {
      modules: ['Housekeeping Board', 'Rooms Directory (Read)'],
      rights: [
        'View assigned room cleaning tasks and checkout cleanup alerts',
        'Update room cleaning status (Dirty -> Cleaning -> Available)',
        'Report maintenance issues, damaged amenities, or extra guest requests',
        'Inspect cleaned rooms and mark housekeeping tasks completed'
      ]
    },
    'Accountant': {
      modules: ['Dashboard', 'Reports & Analytics', 'Folios & Billing History', 'Purchases & Expenses'],
      rights: [
        'Access revenue analytics, sales trends, and tax summaries (CGST/SGST)',
        'Audit daily sales statements for lodging and restaurant transactions',
        'Review purchase orders, vendor invoices, and inventory valuation',
        'Export financial statements in Excel / JSON formats for accounting'
      ]
    },
    'Cashier': {
      modules: ['POS Terminal', 'POS Billing Checkout', 'Active Orders'],
      rights: [
        'Process dining and takeaway bill payments (Cash, Card, UPI)',
        'Apply authorized billing discounts and split bill covers',
        'Print official tax invoices and customer payment receipts',
        'Perform end-of-day register closure and cash drawer audits'
      ]
    }
  };

  const fetchRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/roles');
      const allRoles = [...systemRoles, ...(data || [])];
      setRoles(allRoles);
      if (allRoles.length > 0) {
        setSelectedRole(allRoles[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load property roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const currentCapabilities = selectedRole
    ? (roleCapabilitiesMap[selectedRole.name] || {
        modules: ['Dashboard', 'General Operations'],
        rights: ['Standard module access based on assigned permission matrix.']
      })
    : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="font-display font-bold text-3xl text-navy">Roles & Permissions</h1>
        <p className="text-slate text-sm font-medium mt-1">Review access control roles and operational permission details.</p>
      </div>

      {error && <div className="p-3 bg-danger-pale border border-danger/10 text-danger rounded-xl text-xs font-bold">{error}</div>}

      {loading ? (
        <div className="text-center py-10 text-slate font-semibold text-xs animate-pulse">Loading roles...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Role list */}
          <div className="soft-card p-6 space-y-4 lg:col-span-1 bg-white">
            <h3 className="font-display font-semibold text-sm text-navy border-b border-border-cream pb-3">Available Roles</h3>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    selectedRole?.id === role.id
                      ? 'border-gold bg-gold-pale/60 text-navy shadow-sm'
                      : 'border-border-cream hover:bg-cream/40 text-charcoal'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Shield className={`w-4 h-4 ${selectedRole?.id === role.id ? 'text-gold' : 'text-slate'}`} />
                    {role.name}
                  </span>
                  {role.isSystem && (
                    <span className="text-[9px] bg-navy/10 text-navy font-bold uppercase px-2 py-0.5 rounded-full border border-navy/10">System</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Permissions details */}
          <div className="soft-card p-6 lg:col-span-2 space-y-6 bg-white border border-border-cream/80">
            {selectedRole ? (
              <div className="space-y-6">
                {/* Role Header */}
                <div className="border-b border-border-cream pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-display font-bold text-xl text-navy">{selectedRole.name}</h3>
                    {selectedRole.isSystem && (
                      <span className="text-xs bg-gold-pale text-navy font-bold px-3 py-1 rounded-full border border-gold/30">
                        System Defined Role
                      </span>
                    )}
                  </div>
                  <p className="text-slate text-xs mt-1.5 font-medium leading-relaxed">
                    {selectedRole.description || 'No description provided.'}
                  </p>
                </div>

                {/* Allocated Modules */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-gold" /> Accessible Navigation Modules
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentCapabilities.modules.map((modName, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1.5 rounded-xl bg-gold-pale/40 text-navy text-xs font-bold border border-gold/20 flex items-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5 text-gold" />
                        {modName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Core Operational Capabilities Checklist */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-gold" /> Core System Authorization Rights
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {currentCapabilities.rights.map((rightText, idx) => (
                      <div key={idx} className="p-3.5 bg-cream/20 border border-border-cream/60 rounded-xl flex items-start gap-3 text-xs text-charcoal font-medium">
                        <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>{rightText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate text-xs font-semibold">Select a role on the left to inspect its permissions.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRBAC;

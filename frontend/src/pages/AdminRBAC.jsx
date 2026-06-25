import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';
import api from '../utils/api.js';

function AdminRBAC() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

const systemRoles = [
  { id: 'sys-manager', name: 'Manager', description: 'Full access to property operations and reporting.', isSystem: true },
  { id: 'sys-receptionist', name: 'Receptionist', description: 'Front desk operations and guest management.', isSystem: true },
  { id: 'sys-captain', name: 'Captain', description: 'Restaurant order management and POS.', isSystem: true },
  { id: 'sys-chef', name: 'Chef', description: 'Kitchen Order Ticket (KOT) management.', isSystem: true },
  { id: 'sys-housekeeping', name: 'Housekeeping', description: 'Room status and cleaning management.', isSystem: true },
  { id: 'sys-accountant', name: 'Accountant', description: 'Financial reporting and accounting.', isSystem: true },
  { id: 'sys-cashier', name: 'Cashier', description: 'Billing and payments.', isSystem: true },
];

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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="font-display font-bold text-3xl text-navy">Roles & Permissions</h1>
        <p className="text-slate text-sm font-medium mt-1">Review access control roles and static permission overrides.</p>
      </div>

      {error && <div className="p-3 bg-danger-pale border border-danger/10 text-danger rounded-xl text-xs font-bold">{error}</div>}

      {loading ? (
        <div className="text-center py-10 text-slate font-semibold text-xs animate-pulse">Loading roles...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Role list */}
          <div className="soft-card p-6 space-y-4 lg:col-span-1">
            <h3 className="font-display font-semibold text-sm text-navy border-b border-border-cream pb-3">Available Roles</h3>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    selectedRole?.id === role.id
                      ? 'border-gold bg-gold-pale text-navy'
                      : 'border-border-cream hover:bg-cream/40 text-charcoal'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${selectedRole?.id === role.id ? 'text-navy' : 'text-slate'}`} />
                    {role.name}
                  </span>
                  {role.isSystem && (
                    <span className="text-[9px] bg-navy/10 text-navy px-1.5 py-0.5 rounded">System</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Permissions display */}
          <div className="soft-card p-6 lg:col-span-2 space-y-4 bg-white">
            {selectedRole ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-border-cream pb-4">
                  <div>
                    <h3 className="font-display font-semibold text-base text-navy">{selectedRole.name}</h3>
                    <p className="text-slate text-xs mt-1">{selectedRole.description || 'No description provided.'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] text-slate font-bold uppercase tracking-wider">Access Rights Checklist</h4>
                  
                  {/* System Overrides Alert */}
                  <div className="p-4 bg-gold-pale/50 border border-gold/20 rounded-2xl flex gap-3 text-xs text-charcoal">
                    <ShieldAlert className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">System Defined Role</span>
                      <p className="text-slate text-[11px] mt-0.5">
                        This role uses system-defined static permission overrides. Tenant administrators cannot revoke core operational rights to maintain application functionality.
                      </p>
                    </div>
                  </div>

                  {/* List active capabilities */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-cream/40 border border-border-cream/50 rounded-xl flex items-center gap-2.5 text-xs text-charcoal">
                      <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      <span>View Operations Dashboard</span>
                    </div>
                    <div className="p-3 bg-cream/40 border border-border-cream/50 rounded-xl flex items-center gap-2.5 text-xs text-charcoal">
                      <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      <span>Manage Module Settings</span>
                    </div>
                    <div className="p-3 bg-cream/40 border border-border-cream/50 rounded-xl flex items-center gap-2.5 text-xs text-charcoal">
                      <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      <span>Execute Daily Staff Transactions</span>
                    </div>
                    <div className="p-3 bg-cream/40 border border-border-cream/50 rounded-xl flex items-center gap-2.5 text-xs text-charcoal">
                      <CheckCircle className="w-4 h-4 text-success shrink-0" />
                      <span>Generate Analytics Reports</span>
                    </div>
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

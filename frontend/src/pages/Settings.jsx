import React, { useState } from 'react';
import { 
  Settings, 
  CreditCard, 
  ToggleLeft, 
  ToggleRight, 
  ShieldAlert, 
  Sparkles, 
  Building,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  UserPlus
} from 'lucide-react';

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'staff' | 'roles'
  
  // General State
  const [restaurantModule, setRestaurantModule] = useState(true);
  const [lodgingModule, setLodgingModule] = useState(true);
  const [propertyName, setPropertyName] = useState('Royal Palace Hotel');
  const [taxRate, setTaxRate] = useState(18);

  const [subscription] = useState({
    tier: 'Enterprise Suite',
    status: 'Active',
    price: '₹14,999 / month',
    renewalDate: '2026-07-15'
  });

  // Staff State
  const [staffList, setStaffList] = useState([
    { id: 1, name: 'Ananya Sharma', email: 'ananya@hoteloraa.saas', role: 'MANAGER', status: 'Active' },
    { id: 2, name: 'Aarav Patel', email: 'aarav@hoteloraa.saas', role: 'CAPTAIN', status: 'Active' },
    { id: 3, name: 'Siddharth Roy', email: 'siddharth@hoteloraa.saas', role: 'CHEF', status: 'Active' },
    { id: 4, name: 'Priya Iyer', email: 'priya@hoteloraa.saas', role: 'RECEPTIONIST', status: 'Active' },
    { id: 5, name: 'Rohan Verma', email: 'rohan@hoteloraa.saas', role: 'HOUSEKEEPING', status: 'Active' },
  ]);

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('CAPTAIN');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // Role Permissions State
  const [selectedRole, setSelectedRole] = useState('CAPTAIN');
  
  const [rolePermissions, setRolePermissions] = useState({
    CAPTAIN: {
      ROOMS: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      RESERVATIONS: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      TABLES: { CREATE: false, READ: true, UPDATE: true, DELETE: false },
      MENU: { CREATE: false, READ: true, UPDATE: false, DELETE: false },
      ORDERS: { CREATE: true, READ: true, UPDATE: true, DELETE: false },
      KOT: { CREATE: false, READ: true, UPDATE: false, DELETE: false },
      BILLING: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      INVENTORY: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
    },
    CHEF: {
      ROOMS: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      RESERVATIONS: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      TABLES: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      MENU: { CREATE: false, READ: true, UPDATE: false, DELETE: false },
      ORDERS: { CREATE: false, READ: true, UPDATE: false, DELETE: false },
      KOT: { CREATE: false, READ: true, UPDATE: true, DELETE: false },
      BILLING: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      INVENTORY: { CREATE: false, READ: true, UPDATE: false, DELETE: false },
    },
    RECEPTIONIST: {
      ROOMS: { CREATE: false, READ: true, UPDATE: true, DELETE: false },
      RESERVATIONS: { CREATE: true, READ: true, UPDATE: true, DELETE: false },
      TABLES: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      MENU: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      ORDERS: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      KOT: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      BILLING: { CREATE: true, READ: true, UPDATE: true, DELETE: false },
      INVENTORY: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
    },
    HOUSEKEEPING: {
      ROOMS: { CREATE: false, READ: true, UPDATE: false, DELETE: false },
      RESERVATIONS: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      TABLES: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      MENU: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      ORDERS: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      KOT: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      BILLING: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
      INVENTORY: { CREATE: false, READ: false, UPDATE: false, DELETE: false },
    },
    MANAGER: {
      ROOMS: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
      RESERVATIONS: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
      TABLES: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
      MENU: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
      ORDERS: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
      KOT: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
      BILLING: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
      INVENTORY: { CREATE: true, READ: true, UPDATE: true, DELETE: true },
    }
  });

  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;
    
    const newStaff = {
      id: Date.now(),
      name: newStaffName,
      email: newStaffEmail,
      role: newStaffRole,
      status: 'Active'
    };

    setStaffList([...staffList, newStaff]);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffRole('CAPTAIN');
    setShowAddStaffModal(false);
    showNotification('Staff member added successfully!');
  };

  const handleDeleteStaff = (id) => {
    setStaffList(staffList.filter(staff => staff.id !== id));
    showNotification('Staff member removed.');
  };

  const togglePermission = (role, module, action) => {
    const updated = { ...rolePermissions };
    updated[role][module][action] = !updated[role][module][action];
    setRolePermissions(updated);
  };

  const savePermissions = () => {
    showNotification(`Role permissions for ${selectedRole} saved and synced to database!`);
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-navy border border-gold text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl shadow-stone-900/10 animate-slideIn">
          <div className="w-5 h-5 bg-gold/10 rounded-full flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-gold" />
          </div>
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">PMS settings & Control Panel</h1>
          <p className="text-slate text-sm font-medium mt-1">Configure property settings, manage employee accounts, and adjust RBAC configurations</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-border-cream gap-2">
        <button 
          onClick={() => setActiveTab('general')}
          className={`px-5 py-3 font-display font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'general' 
              ? 'border-gold text-navy font-semibold' 
              : 'border-transparent text-slate hover:text-navy'
          }`}
        >
          <Building className="w-4 h-4" /> Property & Features
        </button>
        <button 
          onClick={() => setActiveTab('staff')}
          className={`px-5 py-3 font-display font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'staff' 
              ? 'border-gold text-navy font-semibold' 
              : 'border-transparent text-slate hover:text-navy'
          }`}
        >
          <Users className="w-4 h-4" /> Staff Members
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`px-5 py-3 font-display font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'roles' 
              ? 'border-gold text-navy font-semibold' 
              : 'border-transparent text-slate hover:text-navy'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> Role Permissions (RBAC)
        </button>
      </div>

      {/* ─── TAB: PROPERTY & FEATURES ──────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="soft-card p-6 bg-white space-y-4">
              <h3 className="font-display font-semibold text-lg text-navy border-b border-border-cream pb-3 flex items-center gap-2">
                <Building className="w-5 h-5 text-gold" /> Property Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider block">Property Name</label>
                  <input 
                    type="text"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider block">Tax Slab (CGST + SGST %)</label>
                  <input 
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="soft-card p-6 bg-white space-y-6">
              <h3 className="font-display font-semibold text-lg text-navy border-b border-border-cream pb-3 flex items-center gap-2">
                <ToggleRight className="w-5 h-5 text-gold" /> Module Feature Flags
              </h3>
              <p className="text-xs text-slate">Toggle modules on/off dynamically to match your operational requirements. Enabling modules allocates corresponding menus in the navigation.</p>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center p-4 bg-cream/20 border border-border-cream/50 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-charcoal">Restaurant Management & POS</h4>
                    <p className="text-[10px] text-slate mt-0.5">Enables KOTs, table floor maps, category menus, and billing covers</p>
                  </div>
                  <button 
                    onClick={() => setRestaurantModule(!restaurantModule)}
                    className="text-navy focus:outline-none"
                  >
                    {restaurantModule ? (
                      <ToggleRight className="w-12 h-12 text-gold fill-gold-pale transition-all" />
                    ) : (
                      <ToggleLeft className="w-12 h-12 text-slate transition-all" />
                    )}
                  </button>
                </div>

                <div className="flex justify-between items-center p-4 bg-cream/20 border border-border-cream/50 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-charcoal">Hotel & Lodging Operations</h4>
                    <p className="text-[10px] text-slate mt-0.5">Enables reservations, check-ins, check-outs, housekeeping and room directory</p>
                  </div>
                  <button 
                    onClick={() => setLodgingModule(!lodgingModule)}
                    className="text-navy focus:outline-none"
                  >
                    {lodgingModule ? (
                      <ToggleRight className="w-12 h-12 text-gold fill-gold-pale transition-all" />
                    ) : (
                      <ToggleLeft className="w-12 h-12 text-slate transition-all" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="soft-card p-6 bg-white h-fit space-y-6">
            <h3 className="font-display font-semibold text-navy text-sm border-b border-border-cream pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gold" /> Subscription Details
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-navy text-white rounded-2xl border border-gold/30 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono font-bold text-gold uppercase tracking-wider">Plan Tier</span>
                  <h4 className="font-display font-bold text-base text-white mt-1">{subscription.tier}</h4>
                </div>
                <Sparkles className="w-5 h-5 text-gold" />
              </div>

              <div className="space-y-2 text-xs font-medium">
                <div className="flex justify-between text-slate pb-2 border-b border-border-cream/30">
                  <span>Account Status:</span>
                  <span className="text-success font-bold uppercase tracking-wider">{subscription.status}</span>
                </div>
                <div className="flex justify-between text-slate pb-2 border-b border-border-cream/30">
                  <span>Rate:</span>
                  <span className="font-mono text-charcoal">{subscription.price}</span>
                </div>
                <div className="flex justify-between text-slate">
                  <span>Next Invoice Renewal:</span>
                  <span className="font-mono text-charcoal">{subscription.renewalDate}</span>
                </div>
              </div>

              <button className="w-full btn-secondary text-xs flex justify-center items-center gap-2 mt-4">
                <ShieldAlert className="w-4 h-4 text-gold" /> Manage Subscriptions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: STAFF MEMBERS ────────────────────────────────────────── */}
      {activeTab === 'staff' && (
        <div className="soft-card bg-white p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-border-cream pb-4">
            <div>
              <h3 className="font-display font-semibold text-lg text-navy flex items-center gap-2">
                <Users className="w-5 h-5 text-gold" /> Employee Accounts Registry
              </h3>
              <p className="text-[11px] text-slate mt-0.5">Manage active hotel staff members and assign their system RBAC authorization roles</p>
            </div>
            <button 
              onClick={() => setShowAddStaffModal(true)}
              className="btn-primary text-xs flex items-center gap-2 px-4 py-2"
            >
              <UserPlus className="w-4 h-4" /> Add Staff Member
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-cream/70 text-[10px] font-bold text-navy uppercase tracking-wider bg-cream/10">
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-cream/40 text-xs font-semibold">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-cream/5 transition-colors">
                    <td className="py-3.5 px-4 text-navy font-bold">{staff.name}</td>
                    <td className="py-3.5 px-4 text-slate">{staff.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-gold-pale/40 text-navy rounded-full text-[9px] font-bold tracking-wide uppercase border border-gold/10">
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-success font-bold text-[10px] uppercase tracking-wider">
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => handleDeleteStaff(staff.id)}
                        className="text-danger hover:text-red-700 p-1.5 rounded-lg hover:bg-danger-pale transition-all"
                        title="Delete staff member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Staff Modal */}
          {showAddStaffModal && (
            <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] border border-border-cream p-8 w-full max-w-md shadow-2xl space-y-6">
                <div>
                  <h4 className="font-display font-bold text-navy text-lg">Add New Employee</h4>
                  <p className="text-xs text-slate mt-0.5">Register a new profile and configure initial role authorization</p>
                </div>
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Aniket Kulkarni"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="aniket@hoteloraa.saas"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">System Role</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                    >
                      <option value="MANAGER">Manager</option>
                      <option value="CAPTAIN">Captain</option>
                      <option value="CHEF">Chef</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                      <option value="HOUSEKEEPING">Housekeeper</option>
                      <option value="CASHIER">Cashier</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-3">
                    <button 
                      type="button" 
                      onClick={() => setShowAddStaffModal(false)}
                      className="w-1/2 px-4 py-2.5 border border-border-cream text-charcoal hover:bg-stone-50 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="w-1/2 px-4 py-2.5 bg-navy text-white hover:bg-navy/90 rounded-xl text-xs font-bold"
                    >
                      Register Staff
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: ROLE PERMISSIONS (RBAC) ────────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="soft-card bg-white p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-cream pb-4 gap-4">
            <div>
              <h3 className="font-display font-semibold text-lg text-navy flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold" /> Custom Role-Based Access Control
              </h3>
              <p className="text-[11px] text-slate mt-0.5">Toggle fine-grained system authorizations for custom and pre-defined property roles</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">Configure Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-bold text-navy"
              >
                <option value="CAPTAIN">Captain</option>
                <option value="CHEF">Chef</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="HOUSEKEEPING">Housekeeping</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
          </div>

          <div className="bg-cream/10 border border-border-cream/50 rounded-2xl p-4 text-xs text-slate mb-4">
            <span className="font-bold text-navy uppercase tracking-wider block mb-1">💡 Super & Tenant Admin Bypass</span>
            By default, members assigned to **SUPER_ADMIN** and **TENANT_ADMIN** roles bypass all checks and possess full write/read access to all modules.
          </div>

          {/* Module Permission Matrix Grid */}
          <div className="space-y-4">
            <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-2 border-b border-border-cream text-[10px] font-bold text-navy uppercase tracking-wider">
              <div>Module System</div>
              <div className="text-center">Create (Write)</div>
              <div className="text-center">Read</div>
              <div className="text-center">Update</div>
              <div className="text-center">Delete</div>
            </div>

            {Object.keys(rolePermissions[selectedRole]).map((moduleKey) => (
              <div key={moduleKey} className="grid grid-cols-1 md:grid-cols-5 gap-4 px-4 py-3 bg-cream/5 border border-border-cream/40 rounded-xl items-center hover:bg-cream/10 transition-all">
                <div className="text-xs font-bold text-navy uppercase tracking-wide">{moduleKey}</div>
                {['CREATE', 'READ', 'UPDATE', 'DELETE'].map((action) => {
                  const isChecked = rolePermissions[selectedRole][moduleKey][action];
                  return (
                    <div key={action} className="flex justify-between md:justify-center items-center">
                      <span className="md:hidden text-[10px] font-bold text-slate uppercase mr-2">{action}:</span>
                      <button
                        onClick={() => togglePermission(selectedRole, moduleKey, action)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isChecked 
                            ? 'bg-gold border-gold text-white shadow-sm' 
                            : 'border-border-cream bg-white hover:border-gold'
                        }`}
                      >
                        {isChecked && <Check className="w-4 h-4 stroke-[3px]" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-border-cream">
            <button 
              onClick={savePermissions}
              className="btn-primary text-xs px-6 py-2.5 font-bold flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> Save Access Rules
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;

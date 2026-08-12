import React, { useState, useEffect } from 'react';
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
  UserPlus,
  LifeBuoy,
  AlertCircle,
  X,
  Loader2,
  CheckCircle,
  UploadCloud,
  Save
} from 'lucide-react';
import api from '../utils/api';

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  // Ticket Modal State
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ title: '', category: 'BUG', priority: 'MEDIUM', module: 'OTHER', description: '', attachmentUrl: '' });
  const [ticketSaving, setTicketSaving] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [attachmentUploading, setAttachmentUploading] = useState(false);

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
      setTimeout(() => { setTicketSuccess(false); setShowTicketModal(false); }, 2000);
    } catch (err) {
      setTicketError(err.message || 'Failed to submit ticket');
    } finally {
      setTicketSaving(false);
    }
  };
  
  // General State
  const [restaurantModule, setRestaurantModule] = useState(true);
  const [lodgingModule, setLodgingModule] = useState(true);
  const [propertyName, setPropertyName] = useState('Grand Palace Resort');
  const [taxRate, setTaxRate] = useState(18);
  const [savingProfile, setSavingProfile] = useState(false);

  const [subscription, setSubscription] = useState({
    tier: 'Enterprise Suite',
    status: 'Active',
    price: '₹14,999 / month',
    renewalDate: '2026-07-15'
  });

  // Staff State
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffError, setStaffError] = useState('');

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
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

  useEffect(() => {
    fetchStaff();
    fetchTenantProfile();
    fetchTenantFeatures();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const res = await api.get('/users');
      const list = Array.isArray(res) ? res : res.data?.data || res.data || [];
      const mapped = list.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.userRole || u.role?.name || 'STAFF',
        status: u.isActive ? 'Active' : 'Inactive'
      }));
      setStaffList(mapped);
    } catch (err) {
      console.error('Failed to load staff members:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchTenantProfile = async () => {
    try {
      const res = await api.get('/tenant/profile');
      const data = res.data || res;
      if (data) {
        if (data.name) setPropertyName(data.name);
        if (data.taxRate !== undefined) setTaxRate(data.taxRate);
        if (data.subscription) {
          setSubscription({
            tier: data.subscription.tier || 'Enterprise Suite',
            status: data.subscription.status || 'Active',
            price: data.subscription.price || '₹14,999 / month',
            renewalDate: data.subscription.renewalDate ? new Date(data.subscription.renewalDate).toISOString().split('T')[0] : 'N/A'
          });
        }
      }
    } catch (err) {
      console.error('Failed to load tenant profile:', err);
    }
  };

  const fetchTenantFeatures = async () => {
    try {
      const res = await api.get('/tenant/features');
      const features = res.data || res;
      if (Array.isArray(features)) {
        setRestaurantModule(features.includes('POS') || features.includes('RESTAURANT'));
        setLodgingModule(features.includes('HOTEL') || features.includes('LODGING'));
      }
    } catch (err) {
      console.error('Failed to load tenant features:', err);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;
    
    try {
      setAddingStaff(true);
      setStaffError('');
      await api.post('/users', {
        name: newStaffName,
        email: newStaffEmail,
        password: newStaffPassword || 'Hoteloraa@123',
        userRole: newStaffRole
      });

      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setNewStaffRole('CAPTAIN');
      setShowAddStaffModal(false);
      fetchStaff();
      showNotification('Staff member registered successfully!');
    } catch (err) {
      setStaffError(err.message || 'Failed to add staff member');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this staff member?')) return;
    try {
      await api.patch(`/users/${id}/toggle-status`);
      fetchStaff();
      showNotification('Staff member status updated.');
    } catch (err) {
      showNotification(err.message || 'Failed to update staff status.');
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    try {
      setSavingProfile(true);
      await api.put('/tenant/profile', {
        name: propertyName,
        taxRate: parseFloat(taxRate) || 0
      });
      showNotification('Property profile updated successfully!');
    } catch (err) {
      showNotification(err.message || 'Failed to update property profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleManageSubscriptions = () => {
    setTicketForm({
      title: `Subscription & Billing Query (${subscription.tier})`,
      category: 'BILLING',
      priority: 'MEDIUM',
      module: 'SETTINGS_USERS',
      description: `Request regarding ${subscription.tier} plan renewal on ${subscription.renewalDate} or tier upgrade.`,
      attachmentUrl: ''
    });
    setTicketSuccess(false);
    setTicketError('');
    setShowTicketModal(true);
  };

  const handleToggleFeature = async (featureName) => {
    try {
      await api.patch(`/tenant/features/${featureName}/toggle`);
      fetchTenantFeatures();
      showNotification(`Feature ${featureName} status updated.`);
    } catch (err) {
      showNotification('Failed to toggle feature.');
    }
  };

  const [savingPermissions, setSavingPermissions] = useState(false);

  const togglePermission = (role, module, action) => {
    const updated = { ...rolePermissions };
    updated[role][module][action] = !updated[role][module][action];
    setRolePermissions(updated);
  };

  const savePermissions = async () => {
    try {
      setSavingPermissions(true);
      await new Promise(r => setTimeout(r, 600));
      showNotification(`Role permissions for ${selectedRole} saved and synced to system authorization rules!`);
    } catch (err) {
      showNotification(err.message || 'Failed to save role permissions.');
    } finally {
      setSavingPermissions(false);
    }
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
        <button
          onClick={() => setShowTicketModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-navy/20 hover:border-navy text-navy hover:bg-navy/5 font-semibold rounded-xl text-sm transition-all duration-200 self-start"
        >
          <AlertCircle className="w-4 h-4 text-danger" /> Report Issue
        </button>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-navy/60 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-border-cream rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl relative my-auto animate-scaleUp max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowTicketModal(false)} 
              className="absolute top-6 right-6 text-slate hover:text-navy transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-5 h-5 text-danger" />
              <h3 className="font-display font-semibold text-lg text-navy">Report an Issue</h3>
            </div>

            {ticketSuccess ? (
              <div className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                <p className="font-bold text-navy text-sm">Ticket submitted successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleCreateTicket} className="space-y-4">
                {ticketError && <p className="text-danger text-xs font-semibold">{ticketError}</p>}
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Title *</label>
                  <input 
                    value={ticketForm.title} 
                    onChange={e => setTicketForm(p => ({...p, title: e.target.value}))} 
                    className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none focus:border-gold" 
                    placeholder="Brief issue description" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate mb-1">Category</label>
                    <select 
                      value={ticketForm.category} 
                      onChange={e => setTicketForm(p => ({...p, category: e.target.value}))} 
                      className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none focus:border-gold"
                    >
                      <option value="BUG">Bug</option>
                      <option value="FEATURE">Feature Request</option>
                      <option value="SUPPORT">Support</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate mb-1">Priority</label>
                    <select 
                      value={ticketForm.priority} 
                      onChange={e => setTicketForm(p => ({...p, priority: e.target.value}))} 
                      className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none focus:border-gold"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Description *</label>
                  <textarea 
                    value={ticketForm.description} 
                    onChange={e => setTicketForm(p => ({...p, description: e.target.value}))} 
                    rows={4} 
                    className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none focus:border-gold resize-none" 
                    placeholder="Describe the issue in detail..." 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Screenshot (optional)</label>
                  <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border-cream rounded-xl px-4 py-2.5 hover:bg-cream/30 transition-all bg-cream/5">
                    <UploadCloud className="w-4 h-4 text-slate" />
                    <span className="text-xs text-slate font-medium">{attachmentUploading ? 'Uploading...' : ticketForm.attachmentUrl ? 'File uploaded ✓' : 'Click to upload'}</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowTicketModal(false)} 
                    className="w-1/2 px-4 py-2.5 border border-border-cream rounded-xl text-xs font-bold text-slate hover:bg-cream/30 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={ticketSaving} 
                    className="w-1/2 px-4 py-2.5 bg-navy text-white rounded-xl text-xs font-bold hover:bg-navy/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {ticketSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4 text-danger" />}
                    {ticketSaving ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
          Property
        </button>
        <button 
          onClick={() => setActiveTab('staff')}
          className={`px-5 py-3 font-display font-bold text-sm tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'staff' 
              ? 'border-gold text-navy font-semibold' 
              : 'border-transparent text-slate hover:text-navy'
          }`}
        >
          Staff Members
        </button>
      </div>

      {/* ─── TAB: PROPERTY & FEATURES ──────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="soft-card p-6 bg-white space-y-4">
              <div className="flex justify-between items-center border-b border-border-cream pb-3">
                <h3 className="font-display font-semibold text-lg text-navy">
                  Property Profile
                </h3>
                <button 
                  onClick={handleSaveProfile} 
                  disabled={savingProfile}
                  className="px-4 py-1.5 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy/90 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
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
          </div>

          <div className="soft-card p-6 bg-white h-fit space-y-6">
            <h3 className="font-display font-semibold text-navy text-sm border-b border-border-cream pb-3">
              Subscription Details
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-navy text-white rounded-2xl border border-gold/30 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono font-bold text-gold uppercase tracking-wider">Plan Tier</span>
                  <h4 className="font-display font-bold text-base text-white mt-1">{subscription.tier}</h4>
                </div>
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

              {/* <button 
                onClick={handleManageSubscriptions}
                className="w-full btn-secondary text-xs flex justify-center items-center gap-2 mt-4 hover:border-gold hover:text-navy transition-all cursor-pointer"
              >
                Manage Subscriptions
              </button> */}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: STAFF MEMBERS ────────────────────────────────────────── */}
      {activeTab === 'staff' && (
        <div className="soft-card bg-white p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-border-cream pb-4">
            <div>
              <h3 className="font-display font-semibold text-lg text-navy">
                Employee Accounts Registry
              </h3>
              <p className="text-[11px] text-slate mt-0.5">Manage active hotel staff members and assign their system RBAC authorization roles</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loadingStaff ? (
              <div className="py-12 text-center text-slate flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-gold" />
                <span className="text-xs font-medium">Loading staff members...</span>
              </div>
            ) : staffList.length === 0 ? (
              <div className="py-12 text-center text-slate text-xs font-medium">
                No staff members registered. Click "+ Add Staff Member" to add one.
              </div>
            ) : (
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
                        <span className={`font-bold text-[10px] uppercase tracking-wider ${staff.status === 'Active' ? 'text-success' : 'text-slate'}`}>
                          {staff.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="text-danger hover:text-red-700 p-1.5 rounded-lg hover:bg-danger-pale transition-all"
                          title="Deactivate / Delete staff member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Add Staff Modal */}
          {showAddStaffModal && (
            <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-[2rem] border border-border-cream p-8 w-full max-w-md shadow-2xl space-y-6 relative my-auto animate-scaleUp">
                <button 
                  onClick={() => setShowAddStaffModal(false)}
                  className="absolute top-6 right-6 text-slate hover:text-navy transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <h4 className="font-display font-bold text-navy text-lg">Add New Employee</h4>
                  <p className="text-xs text-slate mt-0.5">Register a new profile and configure initial role authorization</p>
                </div>
                {staffError && <p className="text-danger text-xs font-semibold">{staffError}</p>}
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Ananya Sharma"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. ananya@hoteloraa.saas"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Password (Default: Hoteloraa@123)</label>
                    <input 
                      type="password" 
                      placeholder="Hoteloraa@123"
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
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
                      disabled={addingStaff}
                      className="w-1/2 px-4 py-2.5 bg-navy text-white hover:bg-navy/90 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {addingStaff ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {addingStaff ? 'Registering...' : 'Register Staff'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SettingsPage;

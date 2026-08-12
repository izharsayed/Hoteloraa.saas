import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, 
  Plus, 
  Check, 
  Settings, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Eye, 
  EyeOff,
  X,
  User,
  Activity,
  Mail,
  Globe,
  Copy,
  Key,
  Bed, 
  Utensils, 
  CopyCheck, 
  Info,
  Users,
  Shield
} from 'lucide-react';
import api from '../utils/api.js';

function SuperAdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Manage Tenant Users Modal States
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedTenantForUsers, setSelectedTenantForUsers] = useState(null);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [usersSuccess, setUsersSuccess] = useState('');
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // New Tenant Form States
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newType, setNewType] = useState('HOTEL_RESTAURANT');
  const [newPlan, setNewPlan] = useState('STARTER');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createdTenantCredentials, setCreatedTenantCredentials] = useState(null);

  // Live Validation & UI States
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await api.get('/superadmin/tenants');
      setTenants(data);
    } catch (err) {
      setError(err.message || 'Failed to load tenants list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const openUsersModal = async (tenant) => {
    setSelectedTenantForUsers(tenant);
    setShowUsersModal(true);
    setUsersError('');
    setUsersSuccess('');
    setResetPasswordUser(null);
    setNewPasswordInput('');
    await fetchTenantUsers(tenant.id);
  };

  const fetchTenantUsers = async (tenantId) => {
    try {
      setUsersLoading(true);
      const res = await api.get(`/superadmin/users?tenantId=${tenantId}`);
      setTenantUsers(res || []);
    } catch (err) {
      setUsersError(err.message || 'Failed to load tenant users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggleTenantUserStatus = async (user) => {
    setUsersError('');
    setUsersSuccess('');
    try {
      await api.patch(`/superadmin/users/${user.id}/status`, {});
      setUsersSuccess(`Status updated for ${user.name}`);
      await fetchTenantUsers(selectedTenantForUsers.id);
    } catch (err) {
      setUsersError(err.message || 'Failed to toggle user status');
    }
  };

  const handleResetTenantUserPassword = async (e) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPasswordInput) return;
    setUsersError('');
    setUsersSuccess('');
    try {
      await api.put(`/superadmin/users/${resetPasswordUser.id}/reset-password`, { password: newPasswordInput });
      setUsersSuccess(`Password updated for ${resetPasswordUser.name}`);
      setResetPasswordUser(null);
      setNewPasswordInput('');
    } catch (err) {
      setUsersError(err.message || 'Failed to reset password');
    }
  };

  const handleSlugChange = (val) => {
    // Keep URL safe characters only
    const formatted = val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setNewSlug(formatted);
    
    if (formatted.length < 3) {
      setSlugError('Slug must be at least 3 characters');
    } else if (tenants.some(t => t.slug === formatted)) {
      setSlugError('⚠️ This portal slug is already taken');
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formatted)) {
      setSlugError('Slug must contain only lowercase letters, numbers, and single hyphens');
    } else {
      setSlugError('');
    }
  };

  const handleNameChange = (val) => {
    setNewName(val);
    const slug = val.toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    setNewSlug(slug);
    
    if (slug.length < 3) {
      setSlugError('Slug must be at least 3 characters');
    } else if (tenants.some(t => t.slug === slug)) {
      setSlugError('⚠️ This portal slug is already taken');
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setSlugError('Slug must contain only lowercase letters, numbers, and single hyphens');
    } else {
      setSlugError('');
    }
  };

  const handleEmailChange = (val) => {
    setNewAdminEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) {
      setEmailError('Email is required');
    } else if (!emailRegex.test(val)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleCopyPassword = () => {
    const pwd = generatedPassword || (createdTenantCredentials && createdTenantCredentials.password);
    if (pwd) {
      navigator.clipboard.writeText(pwd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleStatus = async (id, name) => {
    try {
      const updated = await api.patch(`/superadmin/tenants/${id}/status`, {});
      const newStatus = updated.isActive ? 'ACTIVE' : 'SUSPENDED';
      showToast(`Tenant "${name}" status set to ${newStatus}`);
      
      setTenants(tenants.map(t => {
        if (t.id === id) {
          return { 
            ...t, 
            status: updated.isActive ? (t.plan === 'FREE' ? 'TRIAL' : 'ACTIVE') : 'SUSPENDED' 
          };
        }
        return t;
      }));
    } catch (err) {
      showToast(`Error changing status: ${err.message}`);
    }
  };

  const handleDeleteTenant = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete tenant: ${name}? This will delete all its rooms, bookings, and users.`)) {
      try {
        await api.delete(`/superadmin/tenants/${id}`);
        setTenants(tenants.filter(t => t.id !== id));
        showToast(`Tenant "${name}" deleted.`);
      } catch (err) {
        showToast(`Error deleting tenant: ${err.message}`);
      }
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    if (!newName || !newSlug || !newAdminEmail || slugError || emailError) return;

    setCreateLoading(true);
    try {
      const res = await api.post('/superadmin/tenants', {
        name: newName,
        slug: newSlug.toLowerCase().replace(/\s+/g, '-'),
        adminEmail: newAdminEmail,
        businessType: newType,
        plan: newPlan
      });

      setCreatedTenantCredentials({
        name: newName,
        email: newAdminEmail,
        password: res.generatedPassword
      });
      setGeneratedPassword(res.generatedPassword);
      showToast(`Tenant "${newName}" created successfully!`);
      
      // Refresh list
      fetchTenants();
      
      // Clear input fields immediately
      setNewName('');
      setNewSlug('');
      setNewAdminEmail('');
      setSlugError('');
      setEmailError('');
    } catch (err) {
      showToast(`Error creating tenant: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSaveFeatures = async () => {
    if (!selectedTenant) return;
    try {
      await api.patch(`/superadmin/tenants/${selectedTenant.id}/config`, {
        businessType: selectedTenant.type || selectedTenant.businessType,
        features: selectedTenant.features
      });

      showToast(`Features updated for ${selectedTenant.name}`);
      
      // Sync list
      setTenants(tenants.map(t => t.id === selectedTenant.id ? { 
        ...t, 
        businessType: selectedTenant.type || selectedTenant.businessType,
        features: selectedTenant.features 
      } : t));
      
      setShowConfigModal(false);
    } catch (err) {
      showToast(`Error updating configuration: ${err.message}`);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.slug.includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-navy font-bold text-xs uppercase tracking-wider animate-pulse flex items-center gap-3">
          <Activity className="w-5 h-5 animate-spin text-gold" /> Loading property nodes registry...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-danger-pale border border-danger/10 text-danger rounded-2xl text-xs font-bold">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-navy border border-gold text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl shadow-stone-900/10 animate-slideIn">
          <div className="w-5 h-5 bg-gold/10 rounded-full flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-gold" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Tenants Registry</h1>
          <p className="text-slate text-sm font-medium mt-1">Onboard and manage platform isolated business tenants and their structural module parameters</p>
        </div>
        <button 
          onClick={() => {
            setGeneratedPassword('');
            setCreatedTenantCredentials(null);
            setShowPassword(false);
            setShowCreateModal(true);
          }}
          className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Business
        </button>
      </div>

      {/* Tenants Table */}
      <div className="soft-card bg-white p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-border-cream pb-4">
          <h3 className="font-display font-semibold text-lg text-navy">Isolated Properties</h3>
          <input 
            type="text" 
            placeholder="Search tenant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold w-64 font-semibold shadow-inner bg-cream/5"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-cream/70 text-[10px] font-bold text-navy uppercase tracking-wider bg-cream/10">
                <th className="py-3 px-4">Business Name</th>
                <th className="py-3 px-4">Operational Type</th>
                <th className="py-3 px-4">Database Slug</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-cream/40 text-xs font-semibold">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-cream/5 transition-colors">
                  <td className="py-3.5 px-4 text-navy font-bold">{t.name}</td>
                  <td className="py-3.5 px-4 text-slate">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-cream border border-border-cream/50 px-2 py-0.5 rounded">
                      {t.businessType.replace('_', ' + ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate">{t.slug}</td>
                  <td className="py-3.5 px-4 text-navy font-bold">{t.plan}</td>
                  <td className="py-3.5 px-4 text-slate font-mono font-medium">{t.adminEmail}</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${
                      t.status === 'ACTIVE' || t.status === 'TRIAL' ? 'text-success animate-pulse' : 'text-danger'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    <button 
                      onClick={() => openUsersModal(t)}
                      className="text-navy hover:text-navy/80 p-1.5 border border-border-cream hover:border-gold rounded-lg hover:bg-cream/10 transition-all inline-flex items-center gap-1 text-[10px] font-bold"
                      title="Manage Property Users & Staff"
                    >
                      <Users className="w-3.5 h-3.5 text-gold" /> Users
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedTenant(JSON.parse(JSON.stringify(t))); // deep copy
                        setShowConfigModal(true);
                      }}
                      className="text-navy hover:text-navy/80 p-1.5 border border-border-cream hover:border-gold rounded-lg hover:bg-cream/10 transition-all inline-flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Settings className="w-3.5 h-3.5 text-gold" /> Config
                    </button>
                    <button
                      onClick={() => handleToggleStatus(t.id, t.name)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        t.status === 'ACTIVE' || t.status === 'TRIAL'
                          ? 'border-red-100 text-red-500 hover:bg-red-50'
                          : 'border-green-100 text-green-500 hover:bg-green-50'
                      }`}
                      title={t.status === 'ACTIVE' || t.status === 'TRIAL' ? 'Suspend Tenant' : 'Activate Tenant'}
                    >
                      {t.status === 'ACTIVE' || t.status === 'TRIAL' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleDeleteTenant(t.id, t.name)}
                      className="text-danger hover:text-red-700 p-1.5 border border-red-50 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate font-medium">
                    No property nodes found matching search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: CONFIGURE FEATURES & BUSINESS TYPE ────────────────── */}
      {showConfigModal && selectedTenant && createPortal(
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] border border-border-cream p-8 w-full max-w-lg shadow-2xl space-y-6 animate-fadeInScale max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-border-cream pb-3">
              <div>
                <h4 className="font-display font-bold text-navy text-lg">{selectedTenant.name} Configuration</h4>
                <p className="text-xs text-slate mt-0.5 font-mono">Tenant Slug: {selectedTenant.slug}</p>
              </div>
              <button onClick={() => setShowConfigModal(false)}>
                <X className="w-5 h-5 text-slate hover:text-navy" />
              </button>
            </div>

            {/* Business Type Selector (Interactive Cards) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Business Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'HOTEL_RESTAURANT', label: 'Hotel + Rest', desc: 'PMS & POS combined', icon: Building2 },
                  { value: 'RESTAURANT', label: 'Rest Only', desc: 'POS, KOT, Tables', icon: Utensils },
                  { value: 'LODGING', label: 'Lodging Only', desc: 'PMS & Rooms only', icon: Bed }
                ].map((opt) => {
                  const OptIcon = opt.icon;
                  const currentVal = selectedTenant.type || selectedTenant.businessType;
                  const isSelected = currentVal === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const type = opt.value;
                        setSelectedTenant({
                          ...selectedTenant,
                          type,
                          businessType: type,
                          features: {
                            POS: type === 'RESTAURANT' || type === 'HOTEL_RESTAURANT',
                            ROOMS: type === 'LODGING' || type === 'HOTEL_RESTAURANT',
                            HOUSEKEEPING: type === 'LODGING' || type === 'HOTEL_RESTAURANT'
                          }
                        });
                      }}
                      className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all duration-200 ${
                        isSelected 
                          ? 'border-gold bg-gold-pale/30 shadow-sm scale-102 ring-1 ring-gold' 
                          : 'border-border-cream bg-white hover:bg-cream/10'
                      }`}
                    >
                      <OptIcon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-gold' : 'text-slate'}`} />
                      <span className="text-[10px] font-bold text-navy block">{opt.label}</span>
                      <span className="text-[8px] text-slate/80 leading-none mt-0.5">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feature Allocations */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-navy uppercase tracking-wider block border-b border-border-cream/40 pb-1">Enabled Feature Flags</label>
              
              <div className="space-y-2">
                {Object.keys(selectedTenant.features).map((featureName) => (
                  <div key={featureName} className="flex justify-between items-center p-3 bg-cream/10 border border-border-cream/30 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-charcoal uppercase tracking-wider">{featureName}</span>
                      <p className="text-[9px] text-slate mt-0.5">Toggle runtime availability of this operational module</p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedTenant({
                          ...selectedTenant,
                          features: {
                            ...selectedTenant.features,
                            [featureName]: !selectedTenant.features[featureName]
                          }
                        });
                      }}
                    >
                      {selectedTenant.features[featureName] ? (
                        <ToggleRight className="w-10 h-10 text-gold fill-gold-pale" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-slate" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-border-cream">
              <button 
                type="button" 
                onClick={() => setShowConfigModal(false)}
                className="w-1/2 btn-secondary py-2.5 text-xs font-bold"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveFeatures}
                className="w-1/2 btn-primary py-2.5 text-xs font-bold"
              >
                Save Configurations
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL: CREATE TENANT ────────────────────────────────────── */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          {createdTenantCredentials ? (
            /* Success Screen State */
            <div className="bg-white rounded-[2.5rem] border border-border-cream p-8 w-full max-w-md shadow-2xl space-y-6 text-center animate-fadeInScale max-h-[90vh] overflow-y-auto">
              <div className="mx-auto w-16 h-16 bg-success-pale text-success rounded-full flex items-center justify-center mb-2 shadow-inner">
                <Check className="w-8 h-8" />
              </div>
              
              <div>
                <h4 className="font-display font-bold text-navy text-xl">Tenant Registered Successfully</h4>
                <p className="text-xs text-slate mt-1">Property database has been created and administrative login is ready.</p>
              </div>

              {/* Credentials Card */}
              <div className="p-5 bg-gold-pale border border-gold/40 rounded-2xl text-xs space-y-4 text-left relative overflow-hidden shadow-sm">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-gold" />
                  <span className="font-bold text-navy">Credentials Profile</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate font-bold uppercase tracking-wider block">Admin User Role</span>
                    <span className="font-semibold text-navy">Tenant Administrator</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate font-bold uppercase tracking-wider block">Login Email</span>
                    <span className="font-mono text-navy font-semibold select-all">{createdTenantCredentials.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate font-bold uppercase tracking-wider block">Temporary Password</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-white border border-border-cream/80 rounded-xl px-3 py-2 font-mono text-navy font-bold flex items-center justify-between text-xs shadow-inner">
                        <span>{showPassword ? createdTenantCredentials.password : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate hover:text-navy focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className={`p-2 h-10 w-10 rounded-xl border transition-all flex items-center justify-center ${
                          copied 
                            ? 'bg-success/15 border-success text-success shadow-inner' 
                            : 'bg-white border-border-cream text-slate hover:text-navy hover:border-gold hover:shadow-sm'
                        }`}
                        title="Copy Password"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                {copied && (
                  <p className="text-[10px] text-success font-bold flex items-center gap-1 animate-pulse">
                    <Check className="w-3.5 h-3.5" /> Password copied to clipboard!
                  </p>
                )}
                <p className="text-[9px] text-danger/80 font-bold block bg-danger-pale border border-danger/10 p-2.5 rounded-xl">
                  ⚠️ Make sure to copy this password now. It will not be shown again.
                </p>
              </div>

              <button 
                type="button" 
                onClick={() => {
                  setShowCreateModal(false);
                  setGeneratedPassword('');
                  setCreatedTenantCredentials(null);
                  setShowPassword(false);
                }}
                className="w-full btn-primary py-3 rounded-2xl text-xs font-bold font-display"
              >
                Done & Return to Registry
              </button>
            </div>
          ) : (
            /* Creation Form State */
            <div className="bg-white rounded-[2rem] border border-border-cream p-8 w-full max-w-md shadow-2xl space-y-6 animate-fadeInScale max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-display font-bold text-navy text-lg">Create SaaS Tenant</h4>
                  <p className="text-xs text-slate mt-0.5">Register a new property and auto-provision the Tenant Admin account</p>
                </div>
                <button onClick={() => setShowCreateModal(false)}>
                  <X className="w-5 h-5 text-slate hover:text-navy" />
                </button>
              </div>

              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Property / Hotel Name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Grand Oberoi Inn"
                      value={newName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Tenant Portal Slug</label>
                    {newSlug && !slugError && (
                      <span className="text-[9px] text-success font-bold font-mono">
                        localhost:5173/t/{newSlug}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. grand-oberoi"
                      value={newSlug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 bg-cream/10 border rounded-xl focus:outline-none text-xs font-semibold font-mono ${
                        slugError ? 'border-danger focus:border-danger' : 'border-border-cream focus:border-gold'
                      }`}
                    />
                  </div>
                  {slugError && <p className="text-[10px] text-danger font-bold mt-1">{slugError}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Tenant Admin Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. admin@oberoi.com"
                      value={newAdminEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 bg-cream/10 border rounded-xl focus:outline-none text-xs font-semibold ${
                        emailError ? 'border-danger focus:border-danger' : 'border-border-cream focus:border-gold'
                      }`}
                    />
                  </div>
                  {emailError && <p className="text-[10px] text-danger font-bold mt-1">{emailError}</p>}
                </div>

                {/* Business Type (Option Cards) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Business Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'HOTEL_RESTAURANT', label: 'Hotel + Rest', desc: 'All features', icon: Building2 },
                      { value: 'RESTAURANT', label: 'Rest Only', desc: 'POS + KOT', icon: Utensils },
                      { value: 'LODGING', label: 'Lodging Only', desc: 'Rooms + PMS', icon: Bed }
                    ].map((opt) => {
                      const OptIcon = opt.icon;
                      const isSelected = newType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNewType(opt.value)}
                          className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all duration-200 ${
                            isSelected 
                              ? 'border-gold bg-gold-pale/30 shadow-sm scale-102 ring-1 ring-gold' 
                              : 'border-border-cream bg-white hover:bg-cream/10'
                          }`}
                        >
                          <OptIcon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-gold' : 'text-slate'}`} />
                          <span className="text-[10px] font-bold text-navy block leading-none">{opt.label}</span>
                          <span className="text-[7px] text-slate/80 leading-none mt-1">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Plan Tier (Option Pills) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Plan Tier</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: 'FREE', label: 'Free', price: '0 INR' },
                      { value: 'STARTER', label: 'Starter', price: '4.9k' },
                      { value: 'PROFESSIONAL', label: 'Pro', price: '9.9k' },
                      { value: 'ENTERPRISE', label: 'Ent', price: '14.9k' }
                    ].map((opt) => {
                      const isSelected = newPlan === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNewPlan(opt.value)}
                          className={`flex flex-col items-center py-2 px-1 rounded-xl border text-center transition-all duration-200 ${
                            isSelected 
                              ? 'border-gold bg-gold-pale/30 shadow-sm scale-102 ring-1 ring-gold' 
                              : 'border-border-cream bg-white hover:bg-cream/10'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-navy block leading-none">{opt.label}</span>
                          <span className="text-[8px] text-gold font-bold leading-none mt-1">{opt.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-3 border-t border-border-cream/50">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="w-1/2 px-4 py-2.5 border border-border-cream text-charcoal hover:bg-stone-50 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={createLoading || !!slugError || !!emailError || !newName || !newSlug || !newAdminEmail}
                    className="w-1/2 px-4 py-2.5 bg-navy text-white hover:bg-navy/95 disabled:bg-navy/40 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all shadow-md shadow-navy/10 flex items-center justify-center gap-1.5"
                  >
                    {createLoading ? (
                      <>
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Provisioning...
                      </>
                    ) : (
                      'Create Tenant'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* ─── MODAL: MANAGE TENANT USERS / STAFF ────────────────── */}
      {showUsersModal && selectedTenantForUsers && createPortal(
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] border border-border-cream p-6 sm:p-8 w-full max-w-3xl shadow-2xl space-y-6 animate-fadeInScale max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-border-cream pb-3">
              <div>
                <h3 className="font-display font-bold text-xl text-navy flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold" /> Manage Property Users & Staff
                </h3>
                <p className="text-slate text-xs font-semibold mt-0.5">
                  Property Node: <span className="text-navy font-bold">{selectedTenantForUsers.name}</span> ({selectedTenantForUsers.slug})
                </p>
              </div>
              <button onClick={() => setShowUsersModal(false)} className="text-slate hover:text-navy p-1 rounded-lg hover:bg-cream/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            {usersError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl">{usersError}</div>}
            {usersSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-xl">{usersSuccess}</div>}

            {usersLoading ? (
              <div className="text-center py-12 text-slate font-semibold text-xs animate-pulse">Loading property staff records...</div>
            ) : tenantUsers.length === 0 ? (
              <div className="text-center py-12 text-slate font-medium text-xs">No user accounts found for this property node.</div>
            ) : (
              <div className="space-y-3">
                {tenantUsers.map((u) => (
                  <div key={u.id} className="p-4 border border-border-cream/80 rounded-2xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gold/50 transition-all shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                        u.isActive ? 'bg-gold-pale/50 text-navy border-gold/30' : 'bg-slate/10 text-slate border-slate/20'
                      }`}>
                        {u.initials || 'U'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-sm text-navy truncate">{u.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-navy/5 text-navy border border-navy/10 rounded-full flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5 text-gold" /> {u.userRole || u.role}
                          </span>
                          <span className="text-[10px] text-slate font-mono truncate">{u.email}</span>
                          {u.phone && <span className="text-[10px] text-slate/80">{u.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => {
                          setResetPasswordUser(u);
                          setNewPasswordInput('');
                          setUsersError('');
                          setUsersSuccess('');
                        }}
                        className="px-3 py-1.5 border border-border-cream hover:border-gold rounded-xl text-[10px] font-bold text-navy hover:bg-cream/20 transition-all flex items-center gap-1"
                      >
                        <Key className="w-3.5 h-3.5 text-gold" /> Reset Password
                      </button>
                      <button
                        onClick={() => handleToggleTenantUserStatus(u)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-all ${
                          u.isActive
                            ? 'bg-success-pale text-success border-success/20 hover:bg-danger-pale hover:text-danger hover:border-danger/20'
                            : 'bg-slate/10 text-slate border-slate/20 hover:bg-success-pale hover:text-success hover:border-success/20'
                        }`}
                      >
                        {u.isActive ? <><ToggleRight className="w-4 h-4" /> Active</> : <><ToggleLeft className="w-4 h-4" /> Suspended</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-modal inline form: Reset Password */}
            {resetPasswordUser && (
              <div className="p-4 border border-gold/30 bg-gold-pale/10 rounded-2xl space-y-3 animate-fadeIn">
                <h4 className="font-display font-bold text-xs text-navy flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-gold" /> Reset Password for <span className="underline">{resetPasswordUser.name}</span> ({resetPasswordUser.email})
                </h4>
                <form onSubmit={handleResetTenantUserPassword} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="flex-1 px-3 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold bg-white"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-xs whitespace-nowrap">Save Password</button>
                    <button type="button" onClick={() => { setResetPasswordUser(null); setNewPasswordInput(''); }} className="btn-secondary text-xs">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border-cream">
              <button onClick={() => setShowUsersModal(false)} className="btn-secondary text-xs">Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default SuperAdminTenants;

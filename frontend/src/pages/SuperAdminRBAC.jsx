import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Check, 
  Trash2, 
  Settings2, 
  Key, 
  Users, 
  Lock, 
  FileLock2,
  X,
  Activity,
  Copy,
  Search,
  Filter,
  Shield,
  Sparkles,
  Coffee,
  Receipt
} from 'lucide-react';
import api from '../utils/api.js';

// Mapping functions between frontend UI keys and backend/database keys
const mapToDbPermission = (key) => {
  const [mod, act] = key.split('.');
  const actionMap = {
    view: 'read',
    create: 'create',
    update: 'update',
    delete: 'delete'
  };
  const moduleMap = {
    room: 'rooms',
    reservation: 'reservations',
    guest: 'guests',
    housekeeping: 'housekeeping',
    table: 'tables',
    menu: 'menu',
    order: 'orders',
    kot: 'kot',
    billing: 'billing',
    inventory: 'inventory'
  };
  const dbMod = moduleMap[mod] || mod;
  const dbAct = actionMap[act] || act;
  return `${dbMod}.${dbAct}`;
};

const mapToUiPermission = (key) => {
  const [mod, act] = key.split('.');
  const actionMap = {
    read: 'view',
    create: 'create',
    update: 'update',
    delete: 'delete'
  };
  const moduleMap = {
    rooms: 'room',
    reservations: 'reservation',
    guests: 'guest',
    housekeeping: 'housekeeping',
    tables: 'table',
    menu: 'menu',
    orders: 'order',
    kot: 'kot',
    billing: 'billing',
    inventory: 'inventory'
  };
  const uiMod = moduleMap[mod] || mod;
  const uiAct = actionMap[act] || act;
  return `${uiMod}.${uiAct}`;
};

// Helper function to dynamically map role names to Lucide icons
const getRoleIcon = (roleName) => {
  const name = roleName.toLowerCase();
  if (name.includes('super admin') || name.includes('superadmin')) return ShieldCheck;
  if (name.includes('tenant admin') || name.includes('admin')) return Users;
  if (name.includes('manager')) return Settings2;
  if (name.includes('receptionist')) return Key;
  if (name.includes('captain')) return Coffee;
  if (name.includes('chef') || name.includes('kitchen') || name.includes('cook')) return Shield;
  if (name.includes('cashier') || name.includes('accountant') || name.includes('billing')) return Receipt;
  return Shield;
};

function SuperAdminRBAC() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Active Role for Permissions Matrix
  const [selectedRoleId, setSelectedRoleId] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');

  // Modals state
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloningRoleId, setCloningRoleId] = useState('');
  const [cloneRoleName, setCloneRoleName] = useState('');
  const [cloneRoleDesc, setCloneRoleDesc] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Predefined System Modules & Actions
  const modules = [
    { key: 'room', name: 'Room Directory' },
    { key: 'reservation', name: 'Reservations Calendar' },
    { key: 'guest', name: 'Guest Profiles' },
    { key: 'housekeeping', name: 'Housekeeping Tasks' },
    { key: 'table', name: 'Dining Table Map' },
    { key: 'menu', name: 'Menu Editor' },
    { key: 'order', name: 'Order Processing' },
    { key: 'kot', name: 'Kitchen Order Tickets' },
    { key: 'billing', name: 'POS Billing' },
    { key: 'inventory', name: 'Inventory & Stock' },
  ];

  const actions = ['view', 'create', 'update', 'delete'];

  const fetchRoles = async (selectFirst = false) => {
    try {
      if (selectFirst) setLoading(true);
      const data = await api.get('/superadmin/roles');
      
      // Translate permissions to UI formats
      const formatted = data.map(r => ({
        ...r,
        permissions: r.permissions.map(mapToUiPermission)
      }));

      setRoles(formatted);
      
      if (selectFirst && formatted.length > 0) {
        setSelectedRoleId(formatted[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles(true);
  }, []);

  const activeRole = roles.find(r => r.id === selectedRoleId) || roles[0];

  // Filtering roles based on search and category filters
  const filteredRoles = roles.filter(role => {
    const matchesSearch = 
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (!matchesSearch) return false;
    
    if (roleFilter === 'system') return role.isSystem;
    if (roleFilter === 'custom') return !role.isSystem;
    return true; // 'all'
  });

  // Filtering modules in permissions table
  const filteredModules = modules.filter(mod => 
    mod.name.toLowerCase().includes(matrixSearchQuery.toLowerCase()) ||
    mod.key.toLowerCase().includes(matrixSearchQuery.toLowerCase())
  );

  const handleTogglePermission = async (permKey) => {
    // Prevent modification of Tenant Admin
    if (activeRole.name === 'Tenant Admin') {
      showToast('Tenant Admin role must retain all system permissions.');
      return;
    }

    const hasPermission = activeRole.permissions.includes(permKey);
    const updatedUiPermissions = hasPermission
      ? activeRole.permissions.filter(p => p !== permKey)
      : [...activeRole.permissions, permKey];

    // Optimistically update state
    setRoles(roles.map(r => r.id === selectedRoleId ? { ...r, permissions: updatedUiPermissions } : r));

    try {
      // Translate back to db formats for the payload
      const dbPermissions = updatedUiPermissions.map(mapToDbPermission);
      await api.patch(`/superadmin/roles/${selectedRoleId}/permissions`, {
        permissions: dbPermissions
      });
      showToast(`Permission "${permKey}" updated for ${activeRole.name}`);
    } catch (err) {
      showToast(`Error updating permission: ${err.message}`);
      // Revert on error
      fetchRoles();
    }
  };

  const handleToggleAllModulePermissions = async (moduleKey, checkAll) => {
    if (activeRole.name === 'Tenant Admin') {
      showToast('Tenant Admin role must retain all system permissions.');
      return;
    }

    const modulePermKeys = actions.map(act => `${moduleKey}.${act}`);
    let updatedUiPermissions = [...activeRole.permissions];

    if (checkAll) {
      modulePermKeys.forEach(pk => {
        if (!updatedUiPermissions.includes(pk)) {
          updatedUiPermissions.push(pk);
        }
      });
    } else {
      updatedUiPermissions = updatedUiPermissions.filter(pk => !modulePermKeys.includes(pk));
    }

    // Optimistically update
    setRoles(roles.map(r => r.id === selectedRoleId ? { ...r, permissions: updatedUiPermissions } : r));

    try {
      const dbPermissions = updatedUiPermissions.map(mapToDbPermission);
      await api.patch(`/superadmin/roles/${selectedRoleId}/permissions`, {
        permissions: dbPermissions
      });
      showToast(`${checkAll ? 'Granted' : 'Revoked'} all "${moduleKey}" permissions for ${activeRole.name}`);
    } catch (err) {
      showToast(`Error updating permissions: ${err.message}`);
      fetchRoles();
    }
  };

  // Bulk grant all privileges to selected role
  const handleGrantAllPermissions = async () => {
    if (activeRole.name === 'Tenant Admin') {
      showToast('Tenant Admin role must retain all system permissions.');
      return;
    }

    const allUiPermissions = [];
    modules.forEach(mod => {
      actions.forEach(act => {
        allUiPermissions.push(`${mod.key}.${act}`);
      });
    });

    setRoles(roles.map(r => r.id === selectedRoleId ? { ...r, permissions: allUiPermissions } : r));

    try {
      const dbPermissions = allUiPermissions.map(mapToDbPermission);
      await api.patch(`/superadmin/roles/${selectedRoleId}/permissions`, {
        permissions: dbPermissions
      });
      showToast(`Granted all privileges to ${activeRole.name}`);
    } catch (err) {
      showToast(`Error granting permissions: ${err.message}`);
      fetchRoles();
    }
  };

  // Bulk revoke all privileges from selected role
  const handleRevokeAllPermissions = async () => {
    if (activeRole.name === 'Tenant Admin') {
      showToast('Tenant Admin role must retain all system permissions.');
      return;
    }

    setRoles(roles.map(r => r.id === selectedRoleId ? { ...r, permissions: [] } : r));

    try {
      await api.patch(`/superadmin/roles/${selectedRoleId}/permissions`, {
        permissions: []
      });
      showToast(`Revoked all privileges from ${activeRole.name}`);
    } catch (err) {
      showToast(`Error revoking permissions: ${err.message}`);
      fetchRoles();
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName) return;

    setActionLoading(true);
    try {
      const res = await api.post('/superadmin/roles', {
        name: newRoleName,
        description: newRoleDesc
      });

      showToast(`Global Role "${res.name}" created successfully.`);
      setShowAddRoleModal(false);
      setNewRoleName('');
      setNewRoleDesc('');
      
      // Refresh and select new
      await fetchRoles();
      setSelectedRoleId(res.id);
    } catch (err) {
      showToast(`Error creating role: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Clone an existing role configuration into a new role template
  const handleCloneRole = async (e) => {
    e.preventDefault();
    if (!cloneRoleName || !cloningRoleId) return;

    setActionLoading(true);
    try {
      // 1. Create the new role template
      const res = await api.post('/superadmin/roles', {
        name: cloneRoleName,
        description: cloneRoleDesc
      });

      // 2. Extract permission keys from source role
      const sourceRole = roles.find(r => r.id === cloningRoleId);
      if (sourceRole && sourceRole.permissions.length > 0) {
        const dbPermissions = sourceRole.permissions.map(mapToDbPermission);
        
        // 3. Map/insert clone permissions to database
        await api.patch(`/superadmin/roles/${res.id}/permissions`, {
          permissions: dbPermissions
        });
      }

      showToast(`Global Role blueprint "${cloneRoleName}" cloned successfully.`);
      setShowCloneModal(false);
      setCloneRoleName('');
      setCloneRoleDesc('');
      setCloningRoleId('');

      // Refresh list and select the new role
      await fetchRoles();
      setSelectedRoleId(res.id);
    } catch (err) {
      showToast(`Error cloning role: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async (id, name, isSystem) => {
    if (isSystem) {
      showToast('System predefined roles cannot be deleted.');
      return;
    }
    if (window.confirm(`Delete global role "${name}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/superadmin/roles/${id}`);
        setRoles(roles.filter(r => r.id !== id));
        setSelectedRoleId(roles[0]?.id || '');
        showToast(`Global Role "${name}" deleted.`);
      } catch (err) {
        showToast(`Failed to delete role: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-navy font-bold text-xs uppercase tracking-wider animate-pulse flex items-center gap-3">
          <Activity className="w-5 h-5 animate-spin text-gold" /> Loading RBAC permission matrix...
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
    <div className="space-y-6 relative pb-12">
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-cream/60 pb-5">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Global RBAC & Access Control</h1>
          <p className="text-slate text-sm font-medium mt-1">Configure systemic employee roles and map module permission parameters across all cluster tenants</p>
        </div>
        <button 
          onClick={() => setShowAddRoleModal(true)}
          className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Custom Role
        </button>
      </div>

      {/* Main Workspace Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Roles Explorer (w-1/3 equivalent) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white/40 border border-border-cream rounded-2xl p-4 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xs text-navy uppercase tracking-wider">Role Blueprints</h3>
              <span className="text-[10px] bg-navy/5 text-navy font-bold px-2 py-0.5 rounded-full">
                {filteredRoles.length}
              </span>
            </div>
            
            {/* Search Roles */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate" />
              <input
                type="text"
                placeholder="Search global blueprints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal placeholder-slate"
              />
            </div>

            {/* Tab Filters */}
            <div className="flex gap-1 p-1 bg-cream/20 border border-border-cream/60 rounded-xl overflow-x-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'system', label: 'System' },
                { id: 'custom', label: 'Custom' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id)}
                  className={`flex-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    roleFilter === tab.id
                      ? 'bg-navy text-white shadow-sm'
                      : 'text-charcoal hover:bg-cream/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Roles List */}
          <div className="space-y-3 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {filteredRoles.length === 0 ? (
              <div className="p-8 text-center bg-white/30 border border-dashed border-border-cream rounded-2xl flex flex-col items-center justify-center space-y-2">
                <Shield className="w-6 h-6 text-slate/60 animate-pulse" />
                <p className="text-[10px] font-bold text-navy uppercase tracking-wider">No blueprints found</p>
              </div>
            ) : (
              filteredRoles.map(r => {
                const IconComponent = getRoleIcon(r.name);
                const totalPerms = modules.length * actions.length;
                const activeCount = r.permissions.length;
                const percentActive = Math.round((activeCount / totalPerms) * 100);
                const isSelected = selectedRoleId === r.id;

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 relative ${
                      isSelected
                        ? 'border-navy bg-white shadow-md ring-1 ring-navy/5'
                        : 'border-border-cream bg-white/60 hover:bg-white hover:border-gold/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-navy text-gold' : 'bg-cream/40 text-navy'}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xs text-navy">{r.name}</h4>
                          <span className={`text-[8px] font-bold uppercase tracking-wider ${r.isSystem ? 'text-navy' : 'text-gold'}`}>
                            {r.isSystem ? 'System Blueprint' : 'Custom Template'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          title="Clone blueprint"
                          onClick={() => {
                            setCloningRoleId(r.id);
                            setCloneRoleName(`Copy of ${r.name}`);
                            setCloneRoleDesc(r.description || '');
                            setShowCloneModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-border-cream hover:border-gold hover:bg-gold-pale text-slate hover:text-navy transition-all"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {!r.isSystem && (
                          <button
                            type="button"
                            title="Delete blueprint"
                            onClick={() => handleDeleteRole(r.id, r.name, r.isSystem)}
                            className="p-1.5 rounded-lg border border-border-cream hover:border-red-400 hover:bg-red-50 text-danger transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-700 font-medium leading-relaxed line-clamp-2">
                      {r.description || 'No description provided.'}
                    </p>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-bold text-navy uppercase tracking-wider">
                        <span>Privileges</span>
                        <span className="font-mono text-xs">{activeCount}/{totalPerms} ({percentActive}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-cream/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gold rounded-full transition-all duration-300" 
                          style={{ width: `${percentActive}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Permission Matrix Details (w-2/3 equivalent) */}
        <div className="lg:col-span-8">
          {activeRole ? (
            <div className="bg-white border border-border-cream rounded-[2rem] p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-cream/60 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display font-semibold text-lg text-navy">
                      Permission Blueprint Matrix: <span className="text-gold font-bold">{activeRole.name}</span>
                    </h3>
                    <span className={`text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold leading-none ${
                      activeRole.isSystem 
                        ? 'bg-navy text-gold border border-gold/10' 
                        : 'bg-gold-pale text-navy border border-gold/30'
                    }`}>
                      {activeRole.isSystem ? 'ReadOnly Defaults' : 'Writable Blueprint'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-medium mt-1">Configure systemic modules and read/write permission flags. Global settings apply templates to new properties.</p>
                </div>

                {/* Bulk Controls & Matrix Search */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate" />
                    <input
                      type="text"
                      placeholder="Search modules..."
                      value={matrixSearchQuery}
                      onChange={(e) => setMatrixSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-cream/10 border border-border-cream rounded-lg focus:outline-none focus:border-gold text-[10px] font-semibold text-charcoal placeholder-slate"
                    />
                  </div>

                  {activeRole.name !== 'Tenant Admin' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGrantAllPermissions}
                        className="px-3 py-1.5 bg-navy text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-navy hover:bg-navy/90 transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-gold" /> Grant All
                      </button>
                      <button
                        type="button"
                        onClick={handleRevokeAllPermissions}
                        className="px-3 py-1.5 bg-white border border-border-cream text-charcoal text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-cream/20 transition-all"
                      >
                        Revoke All
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto border border-border-cream/40 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-cream text-[10px] font-bold text-navy uppercase tracking-wider bg-cream/20">
                      <th className="py-3 px-5 w-1/3">Module / Entity Path</th>
                      {actions.map(act => (
                        <th key={act} className="py-3 px-4 text-center capitalize">{act}</th>
                      ))}
                      <th className="py-3 px-5 text-right">Quick Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-cream/40 text-xs font-semibold">
                    {filteredModules.length === 0 ? (
                      <tr>
                        <td colSpan={actions.length + 2} className="py-8 text-center text-slate text-xs font-semibold">
                          No modules match your query.
                        </td>
                      </tr>
                    ) : (
                      filteredModules.map((mod) => {
                        const modulePerms = actions.map(act => `${mod.key}.${act}`);
                        const activeCount = modulePerms.filter(pk => activeRole.permissions.includes(pk)).length;
                        const allChecked = activeCount === actions.length;

                        return (
                          <tr key={mod.key} className="hover:bg-cream/5 transition-colors">
                            <td className="py-3.5 px-5 font-bold text-charcoal flex items-center gap-2.5">
                              <Lock className="w-3.5 h-3.5 text-slate/60" />
                              <div>
                                <span className="text-navy">{mod.name}</span>
                                <span className="block text-[9px] text-slate font-mono uppercase mt-0.5">{mod.key}.*</span>
                              </div>
                            </td>
                            
                            {/* Checkboxes for Actions */}
                            {actions.map(act => {
                              const permKey = `${mod.key}.${act}`;
                              const isChecked = activeRole.permissions.includes(permKey);
                              return (
                                <td key={act} className="py-3.5 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePermission(permKey)}
                                    disabled={activeRole.name === 'Tenant Admin'}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center mx-auto transition-all ${
                                      isChecked 
                                        ? 'bg-navy border-navy text-gold font-bold' 
                                        : 'border-border-cream hover:border-gold bg-white text-transparent'
                                    } ${activeRole.name === 'Tenant Admin' ? 'cursor-not-allowed opacity-80' : ''}`}
                                  >
                                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </button>
                                </td>
                              );
                            })}

                            {/* Quick Control toggle entire module */}
                            <td className="py-3.5 px-5 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleAllModulePermissions(mod.key, !allChecked)}
                                disabled={activeRole.name === 'Tenant Admin'}
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                                  allChecked 
                                    ? 'bg-red-50 text-danger border border-red-100 hover:bg-red-100'
                                    : 'bg-gold-pale text-navy border border-gold/30 hover:bg-gold/10'
                                } ${activeRole.name === 'Tenant Admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {allChecked ? 'Revoke All' : 'Grant All'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-cream/35 border border-border-cream/60 rounded-2xl flex items-center gap-3">
                <FileLock2 className="w-5 h-5 text-gold shrink-0" />
                <p className="text-[10px] text-slate-800 leading-relaxed font-semibold">
                  <span className="font-bold text-navy">Security Policy Override:</span> Pre-loaded global roles serve as the blueprint defaults for new tenants. Individual Tenant Admins can override permissions for custom local roles inside their property, but cannot access unauthorized modules flag-restricted by their billing plan.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white/40 border border-border-cream rounded-[2rem] text-center space-y-3">
              <Shield className="w-8 h-8 text-slate animate-pulse" />
              <p className="text-sm font-bold text-navy uppercase tracking-wider">Select a role blueprint</p>
              <p className="text-xs text-slate-700 font-medium">Select a role on the left panel to configure its permissions.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL: CREATE GLOBAL ROLE ───────────────────────────────── */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] border border-border-cream p-8 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-display font-bold text-navy text-lg">Create Global System Role</h4>
                <p className="text-xs text-slate mt-0.5">Define a systemic template role distributed to all tenant databases</p>
              </div>
              <button onClick={() => setShowAddRoleModal(false)}>
                <X className="w-5 h-5 text-slate" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Role Identity Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Operational Auditor"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Role Description</label>
                <textarea 
                  rows="3"
                  placeholder="Reviews transaction logs, generates financial compliance reports, and audits inventories."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold resize-none text-charcoal"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddRoleModal(false)}
                  className="w-1/2 px-4 py-2.5 border border-border-cream text-charcoal hover:bg-stone-50 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="w-1/2 px-4 py-2.5 bg-navy disabled:bg-navy/70 text-white hover:bg-navy/90 rounded-xl text-xs font-bold"
                >
                  {actionLoading ? 'Creating...' : 'Register Global Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CLONE GLOBAL ROLE ───────────────────────────────── */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] border border-border-cream p-8 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-display font-bold text-navy text-lg">Clone Global Role Blueprint</h4>
                <p className="text-xs text-slate mt-0.5">Duplicate an existing configuration blueprint into a new template role</p>
              </div>
              <button onClick={() => setShowCloneModal(false)}>
                <X className="w-5 h-5 text-slate" />
              </button>
            </div>

            <form onSubmit={handleCloneRole} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">New Role Identity Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Front Office Supervisor"
                  value={cloneRoleName}
                  onChange={(e) => setCloneRoleName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Role Description</label>
                <textarea 
                  rows="3"
                  placeholder="Provide a description detailing the duties of this cloned role blueprint."
                  value={cloneRoleDesc}
                  onChange={(e) => setCloneRoleDesc(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold resize-none text-charcoal"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowCloneModal(false)}
                  className="w-1/2 px-4 py-2.5 border border-border-cream text-charcoal hover:bg-stone-50 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="w-1/2 px-4 py-2.5 bg-navy disabled:bg-navy/70 text-white hover:bg-navy/90 rounded-xl text-xs font-bold"
                >
                  {actionLoading ? 'Cloning...' : 'Clone Role Blueprint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminRBAC;

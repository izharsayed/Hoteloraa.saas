import React, { useState, useEffect } from 'react';
import { Plus, ToggleLeft, ToggleRight, Key, Shield, User } from 'lucide-react';
import api from '../utils/api.js';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roles] = useState(['MANAGER', 'RECEPTIONIST', 'CAPTAIN', 'CHEF', 'HOUSEKEEPING', 'ACCOUNTANT', 'CASHIER']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userRole, setUserRole] = useState('CAPTAIN');
  const [password, setPassword] = useState('');

  // Password reset state
  const [resettingUser, setResettingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/users');
      setUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load staff directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = { name, email, userRole, password };
      if (phone.trim() !== '') {
        payload.phone = phone.trim();
      }
      await api.post('/users', payload);
      setSuccess('Staff member onboarded successfully');
      setShowAddForm(false);
      setName('');
      setEmail('');
      setPhone('');
      setUserRole('CAPTAIN');
      setPassword('');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create staff member');
    }
  };

  const handleToggleStatus = async (userId) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/users/${userId}/toggle-status`, {});
      setSuccess('User status updated');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put(`/users/${resettingUser.id}/reset-password`, { newPassword });
      setSuccess(`Password reset successfully for ${resettingUser.name}`);
      setResettingUser(null);
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-display font-bold text-3xl text-navy">Staff Directory</h1>
            <p className="text-slate text-sm font-medium mt-1">Manage property users, roles, and status flags.</p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center gap-1 text-xs"
          >
            <Plus className="w-4 h-4" /> Onboard Staff
          </button>
        </div>

        {error && <div className="p-3 bg-danger-pale border border-danger/10 text-danger rounded-xl text-xs font-bold">{error}</div>}
        {success && <div className="p-3 bg-success-pale border border-success/10 text-success rounded-xl text-xs font-bold">{success}</div>}

        {/* Staff Grid */}
        {loading ? (
          <div className="text-center py-10 text-slate font-semibold text-xs animate-pulse">Loading staff records...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((staff) => {
              const initials = staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={staff.id} className="soft-card p-5 flex flex-col justify-between h-48 hover:border-gold transition-all duration-300">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-cream border border-border-cream text-gold flex items-center justify-center font-display font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-sm text-charcoal truncate">{staff.name}</h3>
                      <p className="text-[10px] text-slate font-semibold tracking-wider uppercase flex items-center gap-1 mt-0.5"><Shield className="w-3 h-3 text-gold" /> {staff.userRole}</p>
                      <p className="text-[10px] text-slate mt-1 truncate">{staff.email}</p>
                      {staff.phone && <p className="text-[10px] text-slate">{staff.phone}</p>}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-border-cream/50 pt-3 mt-3">
                    <button 
                      onClick={() => setResettingUser(staff)}
                      className="p-2 text-slate hover:text-navy rounded-lg hover:bg-cream/40 flex items-center gap-1.5 text-[10px] font-bold"
                    >
                      <Key className="w-3.5 h-3.5" /> Password
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(staff.id)}
                      className={`flex items-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded-xl transition-all ${
                        staff.isActive 
                          ? 'bg-success-pale text-success border border-success/10 hover:bg-danger-pale hover:text-danger hover:border-danger/10'
                          : 'bg-danger-pale text-danger border border-danger/10 hover:bg-success-pale hover:text-success hover:border-success/10'
                      }`}
                    >
                      {staff.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4 shrink-0" /> Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 shrink-0" /> Suspended
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Staff Dialog */}
      {showAddForm && (
        <div className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-border-cream rounded-3xl p-6 w-full max-w-md shadow-xl animate-slideIn">
            <h3 className="font-display font-semibold text-lg text-navy mb-4">Onboard Staff Member</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate font-bold uppercase tracking-wider block mb-1">Full Name</label>
                <input 
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate font-bold uppercase tracking-wider block mb-1">Email</label>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold"
                    placeholder="e.g. john@royalpalace.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate font-bold uppercase tracking-wider block mb-1">Phone</label>
                  <input 
                    type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold"
                    placeholder="e.g. +91 99999 99999"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate font-bold uppercase tracking-wider block mb-1">Staff Role</label>
                  <select 
                    value={userRole} onChange={(e) => setUserRole(e.target.value)}
                    className="w-full px-4 py-2 border border-border-cream rounded-xl text-xs bg-white focus:outline-none focus:border-gold"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate font-bold uppercase tracking-wider block mb-1">Password</label>
                  <input 
                    type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold"
                    placeholder="Password (min 6 chars)"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border-cream/50 mt-4">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Onboard Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Dialog */}
      {resettingUser && (
        <div className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-border-cream rounded-3xl p-6 w-full max-w-md shadow-xl animate-slideIn">
            <h3 className="font-display font-semibold text-lg text-navy mb-1">Reset Password</h3>
            <p className="text-slate text-xs mb-4">Set a new password for {resettingUser.name}</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate font-bold uppercase tracking-wider block mb-1">New Password</label>
                <input 
                  type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border-cream/50 mt-4">
                <button type="button" onClick={() => setResettingUser(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Change Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminUsers;

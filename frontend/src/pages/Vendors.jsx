import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Phone, Mail, MapPin, Edit2, Trash2, Building2, X } from 'lucide-react';
import api from '../utils/api';

function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', contactName: '', phone: '', email: '', address: '', category: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendors');
      setVendors(Array.isArray(res) ? res : res.data?.data || res.data || []);
    } catch (e) {
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      if (!payload.email) delete payload.email;
      if (!payload.phone) delete payload.phone;
      if (!payload.address) delete payload.address;
      if (!payload.contactName) delete payload.contactName;
      if (!payload.category) delete payload.category;

      await api.post('/vendors', payload);
      setShowForm(false);
      setForm({ name: '', contactName: '', phone: '', email: '', address: '', category: '' });
      fetchVendors();
    } catch (e) {
      setError(e.message || 'Failed to save vendor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vendor?')) return;
    try {
      await api.delete(`/vendors/${id}`);
      fetchVendors();
    } catch { setError('Failed to delete vendor'); }
  };

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.contactName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Vendors</h1>
          <p className="text-sm text-slate mt-0.5">Manage your supplier contacts and partnerships</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border-cream rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Vendor
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-danger-pale border border-danger/20 rounded-xl text-danger text-sm">{error}</div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-navy/60 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-border-cream rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl relative my-auto animate-scaleUp">
            <button 
              onClick={() => setShowForm(false)} 
              className="absolute top-6 right-6 text-slate hover:text-navy transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-semibold text-lg text-navy mb-6">New Vendor</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Vendor Name *', required: true },
                { key: 'contactName', label: 'Contact Person' },
                { key: 'phone', label: 'Phone' },
                { key: 'email', label: 'Email' },
                { key: 'address', label: 'Address' },
                { key: 'category', label: 'Category (e.g. Food, Supplies)' },
              ].map(({ key, label, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate mb-1">{label}</label>
                  <input
                    type="text"
                    required={required}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none focus:border-gold"
                  />
                </div>
              ))}
              <div className="col-span-full flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)}
                  className="w-1/2 px-4 py-2.5 border border-border-cream rounded-xl text-xs font-bold text-slate hover:bg-cream/30 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="w-1/2 px-4 py-2.5 bg-navy text-white rounded-xl text-xs font-bold hover:bg-navy/90 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendors List */}
      {loading ? (
        <div className="text-center py-12 text-slate text-sm">Loading vendors...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="w-12 h-12 text-slate/30 mx-auto mb-3" />
          <p className="text-slate text-sm">No vendors found. Add your first vendor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(vendor => (
            <div key={vendor.id} className="bg-white border border-border-cream rounded-2xl p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-pale border border-gold/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal text-sm">{vendor.name}</p>
                    {vendor.category && (
                      <span className="text-[10px] px-2 py-0.5 bg-surface-linen rounded-full text-slate font-medium">
                        {vendor.category}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(vendor.id)}
                  className="p-1.5 text-slate hover:text-danger hover:bg-danger-pale rounded-lg transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 text-xs text-slate">
                {vendor.contactName && <p className="flex items-center gap-2"><span className="font-medium text-charcoal">{vendor.contactName}</span></p>}
                {vendor.phone && <p className="flex items-center gap-2"><Phone className="w-3 h-3" />{vendor.phone}</p>}
                {vendor.email && <p className="flex items-center gap-2"><Mail className="w-3 h-3" />{vendor.email}</p>}
                {vendor.address && <p className="flex items-center gap-2"><MapPin className="w-3 h-3" />{vendor.address}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Vendors;

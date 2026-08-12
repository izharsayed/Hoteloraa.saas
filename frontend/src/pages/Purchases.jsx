import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Package, Calendar, CheckCircle, Clock, XCircle, ChevronDown, X } from 'lucide-react';
import api from '../utils/api';

const STATUS_STYLES = {
  PENDING:   { label: 'Pending',   cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  ORDERED:   { label: 'Ordered',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  RECEIVED:  { label: 'Received',  cls: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' },
};

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState({
    vendorId: '',
    expectedDate: '',
    notes: '',
    items: [{ inventoryItemId: '', quantity: 1, unitPrice: 0 }],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPurchases();
    fetchVendors();
    fetchInventory();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchases');
      setPurchases(Array.isArray(res) ? res : res.data?.data || res.data || []);
    } catch { setError('Failed to load purchases'); }
    finally { setLoading(false); }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(Array.isArray(res) ? res : res.data?.data || res.data || []);
    } catch (e) {
      console.error('fetchVendors error:', e);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setInventory(Array.isArray(res) ? res : res.data?.data || res.data || []);
    } catch (e) {
      console.error('fetchInventory error:', e);
    }
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { inventoryItemId: '', quantity: 1, unitPrice: 0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [field]: val };
    return { ...f, items };
  });

  const total = form.items.reduce((sum, item) => sum + (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      if (!payload.vendorId) delete payload.vendorId;
      payload.items = payload.items.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0
      }));
      await api.post('/purchases', payload);
      setShowForm(false);
      setForm({ vendorId: '', expectedDate: '', notes: '', items: [{ inventoryItemId: '', quantity: 1, unitPrice: 0 }] });
      fetchPurchases();
    } catch (e) {
      setError(e.message || 'Failed to create purchase order');
    } finally {
      setSaving(false);
    }
  };

  const handleReceive = async (id) => {
    try {
      await api.post(`/purchases/${id}/receive`);
      fetchPurchases();
    } catch { setError('Failed to mark as received'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Purchase Orders</h1>
          <p className="text-sm text-slate mt-0.5">Track and manage all procurement orders</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Purchase Order
        </button>
      </div>

      {error && (
        <div className="p-3 bg-danger-pale border border-danger/20 rounded-xl text-danger text-sm">{error}</div>
      )}

      {/* New PO Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-navy/60 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-border-cream rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl relative my-auto animate-scaleUp max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowForm(false)} 
              className="absolute top-6 right-6 text-slate hover:text-navy transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-semibold text-lg text-navy mb-6">Create Purchase Order</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Vendor</label>
                  <select
                    required
                    value={form.vendorId}
                    onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none focus:border-gold"
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={form.expectedDate}
                    onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">Order Items</label>
                  <button type="button" onClick={addItem}
                    className="px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-xl hover:bg-navy/90 transition-colors flex items-center gap-1 shadow-sm">
                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                  </button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        required
                        value={item.inventoryItemId}
                        onChange={e => updateItem(i, 'inventoryItemId', e.target.value)}
                        className="flex-1 px-3 py-2 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none focus:border-gold"
                      >
                        <option value="">Select item...</option>
                        {inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.name}</option>)}
                      </select>
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(i, 'quantity', e.target.value)}
                        className="w-20 px-3 py-2 bg-cream/10 border border-border-cream rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-gold"
                      />
                      <input
                        type="number"
                        placeholder="Unit Price"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                        className="w-28 px-3 py-2 bg-cream/10 border border-border-cream rounded-xl text-xs font-mono focus:outline-none focus:border-gold"
                      />
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)}
                          className="p-1.5 text-danger hover:bg-danger-pale rounded-lg transition-all">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-right text-xs font-bold text-navy mt-2 font-mono">
                  Total: ₹{total.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none focus:border-gold resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)}
                  className="w-1/2 px-4 py-2.5 border border-border-cream rounded-xl text-xs font-bold text-slate hover:bg-cream/30 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="w-1/2 px-4 py-2.5 bg-navy text-white rounded-xl text-xs font-bold hover:bg-navy/90 transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchases List */}
      {loading ? (
        <div className="text-center py-12 text-slate text-sm">Loading purchase orders...</div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-slate/30 mx-auto mb-3" />
          <p className="text-slate text-sm">No purchase orders yet. Create your first order.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map(po => {
            const status = STATUS_STYLES[po.status] || STATUS_STYLES.PENDING;
            return (
              <div key={po.id} className="bg-white border border-border-cream rounded-2xl p-5 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-navy" />
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal text-sm">PO #{po.poNumber || po.id?.slice(-6)}</p>
                      <p className="text-xs text-slate">{po.vendor?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold ${status.cls}`}>
                      {status.label}
                    </span>
                    {po.status === 'ORDERED' && (
                      <button onClick={() => handleReceive(po.id)}
                        className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium hover:bg-green-100 transition-all">
                        Mark Received
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-6 text-xs text-slate">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3 h-3" />
                    {po.items?.length || 0} items
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : '—'}
                  </span>
                  {po.totalAmount && (
                    <span className="font-semibold text-charcoal">₹{Number(po.totalAmount).toFixed(2)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Purchases;

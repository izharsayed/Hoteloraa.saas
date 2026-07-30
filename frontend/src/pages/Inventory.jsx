import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, AlertTriangle, Truck, Plus, Search, X, Edit2,
  Trash2, RefreshCw, ArrowUp, ArrowDown, ChevronRight, ChevronLeft,
  TrendingDown, BarChart2, Save, Loader2
} from 'lucide-react';
import api from '../utils/api';

const UNITS = ['KG', 'GRAM', 'LITRE', 'ML', 'PIECE', 'PACKET', 'BOX', 'DOZEN', 'BOTTLE'];

const UNIT_LABELS = {
  KG: 'kg', GRAM: 'g', LITRE: 'L', ML: 'ml',
  PIECE: 'units', PACKET: 'packs', BOX: 'boxes',
  DOZEN: 'dozens', BOTTLE: 'bottles'
};

const EMPTY_FORM = {
  name: '', sku: '', unit: 'KG', quantity: '', minimumStock: '',
  costPrice: '', description: '', vendorName: ''
};

const PAGE_SIZE = 10;

function Inventory() {
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'logs'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | low | good
  const [page, setPage] = useState(1);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);       // item being edited
  const [adjustItem, setAdjustItem] = useState(null);   // item for stock adjustment
  const [deleteConfirm, setDeleteConfirm] = useState(null); // item to delete

  // Forms
  const [form, setForm] = useState(EMPTY_FORM);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustDir, setAdjustDir] = useState(1); // 1 = add, -1 = remove
  const [adjustReason, setAdjustReason] = useState('');

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [itemsData, vendorsData, logsData] = await Promise.all([
        api.get('/inventory'),
        api.get('/vendors').catch(() => []),
        api.get('/inventory/logs').catch(() => [])
      ]);
      setItems(itemsData || []);
      setVendors(vendorsData || []);
      setLogs(logsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived stats ──────────────────────────────────────────────
  const totalItems = items.length;
  const lowStockItems = items.filter(i => i.quantity <= i.minimumStock);
  const lowStockCount = lowStockItems.length;
  const activeVendors = vendors.filter(v => v.isActive !== false).length;
  const totalValue = items.reduce((sum, i) => sum + (i.quantity * (i.costPrice || 0)), 0);

  // ── Filtering & pagination ─────────────────────────────────────
  const filtered = items.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      (item.name || '').toLowerCase().includes(q) ||
      (item.sku || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'low' && item.quantity <= item.minimumStock) ||
      (filterStatus === 'good' && item.quantity > item.minimumStock);
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getVendorName = (desc) => {
    if (!desc) return '—';
    const m = desc.match(/Preferred Vendor:\s*(.*)/);
    return m ? m[1].trim() : '—';
  };

  // ── Add Item ───────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const randomSku = form.sku || `STK-${Math.floor(100 + Math.random() * 900)}`;
      const vendorDesc = form.vendorName ? `Preferred Vendor: ${form.vendorName}` : form.description;
      const body = {
        name: form.name,
        sku: randomSku,
        unit: form.unit,
        quantity: parseFloat(form.quantity) || 0,
        minimumStock: parseFloat(form.minimumStock) || 0,
        costPrice: parseFloat(form.costPrice) || 0,
        description: vendorDesc
      };
      const created = await api.post('/inventory', body);
      setItems(prev => [created, ...prev]);
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      flash('Item added successfully!');
    } catch (err) {
      setError(err.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit Item ──────────────────────────────────────────────────
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name || '',
      sku: item.sku || '',
      unit: item.unit || 'PIECE',
      quantity: item.quantity ?? '',
      minimumStock: item.minimumStock ?? '',
      costPrice: item.costPrice ?? '',
      description: item.description || '',
      vendorName: getVendorName(item.description)
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const vendorDesc = form.vendorName ? `Preferred Vendor: ${form.vendorName}` : form.description;
      const body = {
        name: form.name,
        sku: form.sku,
        unit: form.unit,
        quantity: parseFloat(form.quantity) || 0,
        minimumStock: parseFloat(form.minimumStock) || 0,
        costPrice: parseFloat(form.costPrice) || 0,
        description: vendorDesc
      };
      const updated = await api.put(`/inventory/${editItem.id}`, body);
      setItems(prev => prev.map(i => i.id === editItem.id ? updated : i));
      setEditItem(null);
      setForm(EMPTY_FORM);
      flash('Item updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  // ── Stock Adjustment ───────────────────────────────────────────
  const handleAdjust = async (e) => {
    e.preventDefault();
    const qty = parseFloat(adjustQty);
    if (!qty || !adjustReason.trim()) return;
    try {
      setSaving(true);
      setError('');
      const updated = await api.patch(`/inventory/${adjustItem.id}/adjust-stock`, {
        quantity: qty * adjustDir,
        reason: adjustReason.trim()
      });
      setItems(prev => prev.map(i => i.id === adjustItem.id ? updated : i));
      setAdjustItem(null);
      setAdjustQty('');
      setAdjustReason('');
      flash(`Stock ${adjustDir > 0 ? 'added' : 'removed'} successfully!`);
    } catch (err) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Item ────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setSaving(true);
      setError('');
      await api.delete(`/inventory/${deleteConfirm.id}`);
      setItems(prev => prev.filter(i => i.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      flash('Item removed from inventory.');
    } catch (err) {
      setError(err.message || 'Failed to delete item');
    } finally {
      setSaving(false);
    }
  };

  // ── Shared form fields renderer ────────────────────────────────
  const renderFormFields = () => (
    <>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Item Name *</label>
        <input type="text" required placeholder="e.g. Extra Virgin Olive Oil"
          value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold" disabled={saving} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">SKU / Item ID</label>
          <input type="text" placeholder="Auto-generated"
            value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
            className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-mono" disabled={saving} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Unit</label>
          <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
            className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold" disabled={saving}>
            {UNITS.map(u => <option key={u} value={u}>{UNIT_LABELS[u]} ({u})</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Current Quantity *</label>
          <input type="number" required min="0" placeholder="0"
            value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
            className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-mono font-bold" disabled={saving} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Safety Threshold *</label>
          <input type="number" required min="0" placeholder="0"
            value={form.minimumStock} onChange={e => setForm(p => ({ ...p, minimumStock: e.target.value }))}
            className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-mono font-bold" disabled={saving} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Cost Price (₹ per unit)</label>
        <input type="number" min="0" step="0.01" placeholder="0.00"
          value={form.costPrice} onChange={e => setForm(p => ({ ...p, costPrice: e.target.value }))}
          className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-mono" disabled={saving} />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Preferred Vendor</label>
        {vendors.length > 0 ? (
          <select value={form.vendorName} onChange={e => setForm(p => ({ ...p, vendorName: e.target.value }))}
            className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold" disabled={saving}>
            <option value="">-- None --</option>
            {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
          </select>
        ) : (
          <input type="text" placeholder="Vendor name"
            value={form.vendorName} onChange={e => setForm(p => ({ ...p, vendorName: e.target.value }))}
            className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold" disabled={saving} />
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Inventory & Purchase Management</h1>
          <p className="text-slate text-sm font-medium mt-1">Monitor stock quantities, reorder points, and manage vendor purchases</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} disabled={loading}
            className="p-2 rounded-xl border border-border-cream text-slate hover:text-navy hover:border-navy/20 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setForm(EMPTY_FORM); setShowAddModal(true); }}
            className="btn-primary self-start md:self-auto">
            <Plus className="w-4 h-4" /> Add Inventory Item
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 bg-danger-pale border border-danger/20 rounded-xl text-danger text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-success/10 border border-success/20 rounded-xl text-success text-xs font-semibold">{successMsg}</div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="soft-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gold-pale text-navy shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate text-[10px] font-bold uppercase tracking-wider block">Total Items</span>
            <span className="font-mono font-bold text-xl text-navy">{loading ? '—' : totalItems}</span>
          </div>
        </div>

        <div className={`soft-card p-5 flex items-center gap-4 ${lowStockCount > 0 ? 'border-danger/20' : ''}`}>
          <div className={`p-3 rounded-xl shrink-0 ${lowStockCount > 0 ? 'bg-danger-pale text-danger' : 'bg-success/10 text-success'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate text-[10px] font-bold uppercase tracking-wider block">Low Stock Alerts</span>
            <span className={`font-mono font-bold text-xl ${lowStockCount > 0 ? 'text-danger' : 'text-success'}`}>
              {loading ? '—' : `${lowStockCount} items`}
            </span>
          </div>
        </div>

        <div className="soft-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gold-pale/50 text-gold shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate text-[10px] font-bold uppercase tracking-wider block">Active Vendors</span>
            <span className="font-mono font-bold text-xl text-navy">{loading ? '—' : activeVendors}</span>
          </div>
        </div>

        <div className="soft-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-navy/5 text-navy shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate text-[10px] font-bold uppercase tracking-wider block">Stock Value</span>
            <span className="font-mono font-bold text-xl text-navy">
              {loading ? '—' : `₹${totalValue.toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
      </div>

      {/* Stock & Logs Tabs */}
      <div className="soft-card p-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-border-cream/80 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('stock')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'stock' ? 'border-navy text-navy font-display' : 'border-transparent text-slate hover:text-navy'
            }`}
          >
            Master Stock Index
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'logs' ? 'border-navy text-navy font-display' : 'border-transparent text-slate hover:text-navy'
            }`}
          >
            Order Deduction & Audit Logs
            <span className="px-2 py-0.5 rounded-full bg-gold-pale text-navy text-[10px] font-mono font-bold">
              {logs.length}
            </span>
          </button>
        </div>

        {activeTab === 'stock' ? (
          <div>
            {/* Table header + filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-display font-semibold text-base text-navy">Stock Items & Thresholds</h3>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Status filter pills */}
                <div className="flex rounded-xl border border-border-cream overflow-hidden text-[10px] font-bold">
                  {[['all','All'], ['good','Good'], ['low','Low Stock']].map(([val, label]) => (
                    <button key={val} onClick={() => { setFilterStatus(val); setPage(1); }}
                      className={`px-3 py-1.5 transition-all ${filterStatus === val ? 'bg-navy text-white' : 'bg-white text-slate hover:bg-cream/40'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate" />
                  <input type="text" placeholder="Search name / SKU..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                    className="pl-9 pr-4 py-2 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs bg-cream/20 w-48" />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate">
                <Loader2 className="w-6 h-6 animate-spin text-gold" />
                <span className="text-sm font-semibold">Loading stock data...</span>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-cream text-[10px] font-bold text-slate uppercase tracking-wider">
                        <th className="pb-3">Item ID</th>
                        <th className="pb-3">Description</th>
                        <th className="pb-3 text-center">Quantity</th>
                        <th className="pb-3 text-center">Min. Stock</th>
                        <th className="pb-3 text-right">Cost / Unit</th>
                        <th className="pb-3">Vendor</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-cream/40 text-xs font-semibold">
                      {paged.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-12 text-slate">
                            {searchQuery || filterStatus !== 'all' ? 'No items match your filter.' : 'No inventory items yet. Click "+ Add Inventory Item" to get started.'}
                          </td>
                        </tr>
                      ) : paged.map(item => {
                        const isLow = item.quantity <= item.minimumStock;
                        const unit = UNIT_LABELS[item.unit] || item.unit?.toLowerCase();
                        return (
                          <tr key={item.id} className="hover:bg-gold-pale/10 transition-colors group">
                            <td className="py-3.5 font-mono font-bold text-navy text-[11px]">{item.sku || item.id.slice(0, 8)}</td>
                            <td className="py-3.5 text-charcoal max-w-[180px] truncate" title={item.name}>{item.name}</td>
                            <td className="py-3.5 text-center font-mono font-bold text-charcoal">{item.quantity} <span className="text-slate font-normal">{unit}</span></td>
                            <td className="py-3.5 text-center font-mono text-slate">{item.minimumStock} <span className="text-slate/60 font-normal">{unit}</span></td>
                            <td className="py-3.5 text-right font-mono text-slate">
                              {item.costPrice ? `₹${Number(item.costPrice).toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="py-3.5 text-slate max-w-[130px] truncate" title={getVendorName(item.description)}>
                              {getVendorName(item.description)}
                            </td>
                            <td className="py-3.5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                isLow ? 'bg-danger-pale text-danger border border-danger/20' : 'bg-success/10 text-success border border-success/20'
                              }`}>
                                {isLow ? 'Low Stock' : 'Good'}
                              </span>
                            </td>
                            <td className="py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setAdjustItem(item)} title="Adjust Stock"
                                  className="p-1.5 hover:bg-gold/10 rounded-lg text-gold transition-colors">
                                  <TrendingDown className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => openEdit(item)} title="Edit Item"
                                  className="p-1.5 hover:bg-navy/10 rounded-lg text-navy transition-colors">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setDeleteConfirm(item)} title="Delete Item"
                                  className="p-1.5 hover:bg-danger/10 rounded-lg text-danger transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-cream/40">
                    <span className="text-[10px] text-slate font-semibold">
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} items
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-1.5 rounded-lg border border-border-cream disabled:opacity-40 hover:bg-cream/40 transition-all">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-3 text-xs font-bold text-navy">{page} / {totalPages}</span>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="p-1.5 rounded-lg border border-border-cream disabled:opacity-40 hover:bg-cream/40 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Logs Tab View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-cream text-[10px] font-bold text-slate uppercase tracking-wider">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Inventory Item</th>
                  <th className="pb-3 text-center">Type</th>
                  <th className="pb-3 text-right">Quantity Change</th>
                  <th className="pb-3 text-right">Stock Level</th>
                  <th className="pb-3">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-cream/40 text-xs font-semibold">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate font-medium">
                      No stock deduction or adjustment logs yet. Orders placed with configured recipes will appear here automatically.
                    </td>
                  </tr>
                ) : logs.map(log => {
                  const isDeduction = log.quantityChange < 0;
                  return (
                    <tr key={log.id} className="hover:bg-gold-pale/10 transition-colors">
                      <td className="py-3.5 text-slate font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 font-bold text-navy">
                        {log.inventoryItem?.name || 'Unknown Item'}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          log.changeType === 'ORDER_DEDUCTION' ? 'bg-amber-100 text-amber-800' :
                          log.changeType === 'RESTOCK_CANCEL' ? 'bg-blue-100 text-blue-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {log.changeType?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`py-3.5 text-right font-mono font-bold ${isDeduction ? 'text-red-600' : 'text-emerald-600'}`}>
                        {isDeduction ? '' : '+'}{log.quantityChange} {UNIT_LABELS[log.unit] || log.unit}
                      </td>
                      <td className="py-3.5 text-right font-mono text-slate">
                        {log.newQuantity} <span className="text-slate/60">{UNIT_LABELS[log.unit] || log.unit}</span>
                      </td>
                      <td className="py-3.5 text-slate font-medium max-w-[200px] truncate" title={log.reason}>
                        {log.reason || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ADD ITEM MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-navy/10 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] border border-border-cream p-8 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddModal(false)} disabled={saving}
              className="absolute top-6 right-6 text-slate hover:text-navy transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-semibold text-lg text-navy mb-6">Add New Inventory Item</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              {renderFormFields()}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} disabled={saving}
                  className="w-1/2 px-4 py-2.5 border border-border-cream text-charcoal hover:bg-stone-50 rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="w-1/2 px-4 py-2.5 bg-navy text-white hover:bg-navy/90 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT ITEM MODAL ── */}
      {editItem && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-navy/10 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] border border-border-cream p-8 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditItem(null)} disabled={saving}
              className="absolute top-6 right-6 text-slate hover:text-navy transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-semibold text-lg text-navy mb-6">Edit Inventory Item</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              {renderFormFields()}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setEditItem(null)} disabled={saving}
                  className="w-1/2 px-4 py-2.5 border border-border-cream text-charcoal hover:bg-stone-50 rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="w-1/2 px-4 py-2.5 bg-navy text-white hover:bg-navy/90 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADJUST STOCK MODAL ── */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-navy/10 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] border border-border-cream p-8 w-full max-w-sm shadow-2xl relative">
            <button onClick={() => setAdjustItem(null)} disabled={saving}
              className="absolute top-6 right-6 text-slate hover:text-navy transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-semibold text-lg text-navy mb-1">Adjust Stock</h3>
            <p className="text-slate text-xs font-semibold mb-6 truncate">{adjustItem.name}</p>

            <div className="bg-cream/30 rounded-xl p-4 mb-5 flex items-center justify-between">
              <span className="text-slate text-xs font-semibold">Current Stock</span>
              <span className="font-mono font-bold text-navy text-lg">
                {adjustItem.quantity} <span className="text-sm text-slate">{UNIT_LABELS[adjustItem.unit] || adjustItem.unit}</span>
              </span>
            </div>

            <form onSubmit={handleAdjust} className="space-y-4">
              {/* Direction toggle */}
              <div className="flex rounded-xl border border-border-cream overflow-hidden text-xs font-bold">
                <button type="button" onClick={() => setAdjustDir(1)}
                  className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all ${adjustDir === 1 ? 'bg-success/10 text-success border-r border-success/20' : 'bg-white text-slate hover:bg-cream/40'}`}>
                  <ArrowUp className="w-3.5 h-3.5" /> Add Stock
                </button>
                <button type="button" onClick={() => setAdjustDir(-1)}
                  className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all ${adjustDir === -1 ? 'bg-danger-pale text-danger' : 'bg-white text-slate hover:bg-cream/40'}`}>
                  <ArrowDown className="w-3.5 h-3.5" /> Remove Stock
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">
                  Quantity to {adjustDir > 0 ? 'Add' : 'Remove'} ({UNIT_LABELS[adjustItem.unit] || adjustItem.unit})
                </label>
                <input type="number" required min="0.01" step="any" placeholder="0"
                  value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-mono font-bold" disabled={saving} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Reason *</label>
                <input type="text" required placeholder="e.g. Received from vendor, Used in kitchen..."
                  value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold" disabled={saving} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAdjustItem(null)} disabled={saving}
                  className="w-1/2 px-4 py-2.5 border border-border-cream text-charcoal hover:bg-stone-50 rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className={`w-1/2 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-white transition-all ${
                    adjustDir > 0 ? 'bg-success hover:bg-success/90' : 'bg-danger hover:bg-danger/90'
                  }`}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (adjustDir > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />)}
                  {saving ? 'Saving...' : (adjustDir > 0 ? 'Add Stock' : 'Remove Stock')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-navy/10 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] border border-border-cream p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 bg-danger-pale rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-danger" />
            </div>
            <h3 className="font-display font-semibold text-navy text-lg mb-2">Remove Item?</h3>
            <p className="text-slate text-xs font-semibold mb-1">{deleteConfirm.name}</p>
            <p className="text-slate text-xs mb-6">This will soft-delete the item from inventory. This cannot be undone easily.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={saving}
                className="flex-1 px-4 py-2.5 border border-border-cream text-charcoal hover:bg-stone-50 rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-danger text-white hover:bg-danger/90 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {saving ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;

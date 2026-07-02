import React, { useState, useEffect } from 'react';
import { Settings, Save, Percent, ShieldCheck, Download, Database, Activity, CheckCheck } from 'lucide-react';
import api from '../utils/api.js';

function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [taxRate, setTaxRate] = useState(18);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [kotPrefix, setKotPrefix] = useState('KOT');
  const [bookingPrefix, setBookingPrefix] = useState('BKG');
  const [footerNote, setFooterNote] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/settings');
      if (data) {
        setSettings(data);
        setTaxRate(data.taxRate ?? 18);
        setServiceCharge(data.serviceCharge ?? 0);
        setInvoicePrefix(data.invoicePrefix ?? 'INV');
        setKotPrefix(data.kotPrefix ?? 'KOT');
        setBookingPrefix(data.bookingPrefix ?? 'BKG');
        setFooterNote(data.footerNote ?? '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load property settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/settings', {
        taxRate: Number(taxRate),
        serviceCharge: Number(serviceCharge),
        invoicePrefix,
        kotPrefix,
        bookingPrefix,
        footerNote
      });
      setSuccess('Settings updated successfully');
      fetchSettings();
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    setExportSuccess(false);
    try {
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
      const response = await fetch(`${API_BASE_URL}/tenant/export`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Export failed');
      }
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      const match = contentDisposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : 'hotel-export.json';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      setExportError(err.message || 'Export failed. Please try again.');
      setTimeout(() => setExportError(''), 5000);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl">
      <div>
        <h1 className="font-display font-bold text-3xl text-navy">Tenant Settings</h1>
        <p className="text-slate text-sm font-medium mt-1">Configure invoicing parameters, service fees, and taxation policies.</p>
      </div>

      {error && <div className="p-3 bg-danger-pale border border-danger/10 text-danger rounded-xl text-xs font-bold">{error}</div>}
      {success && <div className="p-3 bg-success-pale border border-success/10 text-success rounded-xl text-xs font-bold">{success}</div>}

      {loading ? (
        <div className="text-center py-10 text-slate font-semibold text-xs animate-pulse">Loading settings...</div>
      ) : (
        <form onSubmit={handleSave} className="soft-card p-6 space-y-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tax Rate */}
            <div>
              <label className="text-[10px] text-slate font-bold uppercase tracking-wider block mb-1">Standard Tax Rate (%)</label>
              <div className="relative">
                <input 
                  type="number" required value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold"
                  placeholder="e.g. 18"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate/60"><Percent className="w-4 h-4" /></span>
              </div>
            </div>

            {/* Service Charge */}
            <div>
              <label className="text-[10px] text-slate font-bold uppercase tracking-wider block mb-1">Service Charge (%)</label>
              <div className="relative">
                <input 
                  type="number" required value={serviceCharge} onChange={(e) => setServiceCharge(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold"
                  placeholder="e.g. 5"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate/60"><Percent className="w-4 h-4" /></span>
              </div>
            </div>

            {/* Invoice Prefix */}
            <div>
              <label className="text-[10px] text-slate font-bold uppercase tracking-wider block mb-1">Invoice Number Prefix</label>
              <input 
                type="text" required value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-4 py-2.5 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold"
                placeholder="INV"
              />
            </div>

            {/* KOT Prefix */}
            <div>
              <label className="text-[10px] text-slate font-bold uppercase tracking-wider block mb-1">KOT Ticket Prefix</label>
              <input 
                type="text" required value={kotPrefix} onChange={(e) => setKotPrefix(e.target.value)}
                className="w-full px-4 py-2.5 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold"
                placeholder="KOT"
              />
            </div>

            {/* Booking Prefix */}
            <div>
              <label className="text-[10px] text-slate font-bold uppercase tracking-wider block mb-1">Booking Ref Prefix</label>
              <input 
                type="text" required value={bookingPrefix} onChange={(e) => setBookingPrefix(e.target.value)}
                className="w-full px-4 py-2.5 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold"
                placeholder="BKG"
              />
            </div>

            {/* Footer Note */}
            <div className="md:col-span-2">
              <label className="text-[10px] text-slate font-bold uppercase tracking-wider block mb-1">Invoice Footer / Notes</label>
              <textarea 
                value={footerNote} onChange={(e) => setFooterNote(e.target.value)}
                className="w-full px-4 py-2.5 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold h-20 resize-none"
                placeholder="e.g. Thank you for dining with us! | GST Registered"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border-cream/50">
            <button 
              type="submit" 
              disabled={saving}
              className="btn-primary flex items-center gap-1.5 text-xs px-6 py-2.5"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Data Management Section */}
      <div className="soft-card p-6 bg-white space-y-4 max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold-pale/50 text-gold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-navy">Data Management & Export</h2>
              <p className="text-slate text-xs font-medium mt-0.5">Download a complete JSON backup of all your property data.</p>
            </div>
          </div>
          <button
            id="btn-export-data-settings"
            onClick={handleExport}
            disabled={exporting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-[0.97] shadow-sm ${
              exportSuccess ? 'bg-success text-white' : 'btn-primary'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {exporting ? (
              <><Activity className="w-4 h-4 animate-spin" /> Exporting...</>
            ) : exportSuccess ? (
              <><CheckCheck className="w-4 h-4" /> Downloaded!</>
            ) : (
              <><Download className="w-4 h-4" /> Export All Data</>
            )}
          </button>
        </div>

        {exportError && (
          <div className="p-3 bg-danger-pale border border-danger/10 text-danger rounded-xl text-xs font-bold">
            {exportError}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {['Rooms', 'Reservations', 'Guests', 'Orders', 'Payments', 'Menu', 'Inventory', 'Staff'].map(tag => (
            <span key={tag} className="px-3 py-1 rounded-full bg-cream text-slate text-[10px] font-bold uppercase tracking-wider border border-border-cream/60">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;

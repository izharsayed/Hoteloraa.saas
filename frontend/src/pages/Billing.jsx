import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CreditCard, 
  IndianRupee, 
  FileText, 
  CheckCircle, 
  Receipt, 
  ArrowRight,
  Plus,
  Percent,
  Check,
  SplitSquareVertical,
  X,
  Trash2,
  Search,
  ArrowUpDown,
  TrendingUp,
  Coins
} from 'lucide-react';
import api from '../utils/api.js';

function Billing() {
  const userJson = localStorage.getItem('user');
  let userObj = { name: 'Staff', hotelName: 'Your Hotel Name' };
  try {
    if (userJson) {
      const u = JSON.parse(userJson);
      userObj = { ...userObj, ...u };
    }
  } catch (e) {}
  const hotelName = userObj.tenantName || userObj.hotelName || userObj.businessName || 'Your Hotel Name';
  const hotelAddress = userObj.address 
    ? [userObj.address, userObj.city, userObj.country].filter(Boolean).join(', ')
    : '';

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Discount / Split / Collection States
  const [customDiscount, setCustomDiscount] = useState('');
  const [discountType, setDiscountType] = useState('flat'); // 'flat' or 'percent'
  const [splitCount, setSplitCount] = useState(1);
  const [showSplitResult, setShowSplitResult] = useState(false);
  const [collectAmount, setCollectAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [printFormat, setPrintFormat] = useState('a4'); // 'a4' or 'pos'
  const [activeActionTab, setActiveActionTab] = useState('settle'); // 'settle', 'discount', 'split'

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Add Item to Check States
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.get('/orders');
      
      const mappedInvoices = data.map(order => ({
        id: order.orderNumber || order.id.slice(0, 8).toUpperCase(),
        orderId: order.id,
        type: order.table ? 'POS Table' : 'Room Service',
        guest: order.table ? `Table ${order.table.name}` : (order.user ? order.user.name : 'Walk-in'),
        amount: order.subtotal || 0,
        room: order.table?.floor || 'Restaurant',
        status: order.status === 'COMPLETED' ? 'Paid' : 'Unpaid',
        discount: order.discountAmount || 0,
        paidAmount: order.payment ? order.payment.amount : 0,
        gstRate: 5,
        serviceChargeRate: 0,
        items: order.items ? order.items.map(item => ({
          name: item.menuItem?.name || 'Item',
          price: item.totalPrice
        })) : [],
        payments: order.payment ? [{ 
          method: order.payment.method, 
          amount: order.payment.amount, 
          date: order.payment.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
        }] : []
      }));

      setInvoices(mappedInvoices);

      // Optionally update selected invoice if it's currently open
      if (selectedInvoice) {
        const updatedSelected = mappedInvoices.find(inv => inv.orderId === selectedInvoice.orderId);
        if (updatedSelected) {
          // Keep local discount if user hasn't saved it yet
          setSelectedInvoice({
            ...updatedSelected,
            discount: selectedInvoice.discount,
            gstRate: selectedInvoice.gstRate,
            serviceChargeRate: selectedInvoice.serviceChargeRate
          });
        }
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(() => loadOrders(true), 10000);
    return () => clearInterval(timer);
  }, [selectedInvoice]);

  const handleSelectInvoice = (inv) => {
    setSelectedInvoice(inv);
    setCustomDiscount('');
    setDiscountType('flat');
    setSplitCount(1);
    setShowSplitResult(false);
    setCollectAmount('');
    setPaymentReference('');
    setActiveActionTab('settle');
  };

  const calculateTaxes = (amount, discount, gstRate = 5, serviceChargeRate = 0) => {
    const taxable = Math.max(0, amount - discount);
    const serviceCharge = (taxable * serviceChargeRate) / 100;
    const baseWithService = taxable + serviceCharge;
    const cgst = (baseWithService * (gstRate / 2)) / 100;
    const sgst = (baseWithService * (gstRate / 2)) / 100;
    const total = baseWithService + cgst + sgst;
    return { taxable, serviceCharge, cgst, sgst, total };
  };

  const handleUpdateTaxRates = (id, field, value) => {
    const updated = invoices.map(inv => {
      if (inv.id === id) {
        return { ...inv, [field]: value };
      }
      return inv;
    });
    setInvoices(updated);
    setSelectedInvoice(updated.find(inv => inv.id === id));
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    
    // Map frontend payment method to backend enum
    let mappedMethod = 'CASH';
    if (paymentMethod === 'Card/UPI') mappedMethod = 'CARD';
    if (paymentMethod === 'Bank Transfer') mappedMethod = 'BANK_TRANSFER';
    if (paymentMethod === 'Room Charge') mappedMethod = 'ROOM_CHARGE';

    try {
      const payload = {
        orderId: selectedInvoice.orderId,
        paymentMethod: mappedMethod,
        discountAmount: selectedInvoice.discount || 0,
        reference: ['Card/UPI', 'Bank Transfer'].includes(paymentMethod) ? paymentReference : undefined,
        notes: `Collected via ${paymentMethod}`
      };
      
      await api.post('/billing/generate', payload);
      showToast(`Bill settled successfully via ${paymentMethod}`);
      
      await loadOrders(true);
      setSelectedInvoice(null);
      setCollectAmount('');
      setPaymentReference('');
    } catch (err) {
      showToast(err.message || 'Failed to settle bill');
    }
  };

  const handleApplyDiscount = () => {
    if (!selectedInvoice) return;
    const discountVal = parseFloat(customDiscount) || 0;
    if (discountVal < 0) {
      showToast('Invalid discount amount');
      return;
    }

    let finalDiscountAmount = discountVal;
    if (discountType === 'percent') {
      finalDiscountAmount = (selectedInvoice.amount * discountVal) / 100;
    }

    if (finalDiscountAmount > selectedInvoice.amount) {
      showToast('Discount cannot exceed the base amount');
      return;
    }

    const updated = invoices.map(inv => {
      if (inv.id === selectedInvoice.id) {
        return { ...inv, discount: finalDiscountAmount };
      }
      return inv;
    });
    setInvoices(updated);
    setSelectedInvoice(updated.find(inv => inv.id === selectedInvoice.id));
    showToast(`Discount of ₹${finalDiscountAmount.toLocaleString()} applied to invoice.`);
    setCustomDiscount('');
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!selectedInvoice || !newItemName || !newItemPrice) return;
    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price <= 0) {
      showToast('Invalid item price');
      return;
    }

    const updated = invoices.map(inv => {
      if (inv.id === selectedInvoice.id) {
        const updatedItems = [...inv.items, { name: newItemName, price }];
        const updatedAmount = inv.amount + price;
        return {
          ...inv,
          amount: updatedAmount,
          items: updatedItems
        };
      }
      return inv;
    });

    setInvoices(updated);
    setSelectedInvoice(updated.find(inv => inv.id === selectedInvoice.id));
    setNewItemName('');
    setNewItemPrice('');
    showToast(`Added "${newItemName}" (₹${price}) to check.`);
  };

  const handleDeleteItem = (itemIndex) => {
    if (!selectedInvoice) return;
    const itemToDelete = selectedInvoice.items[itemIndex];
    if (!itemToDelete) return;

    const updated = invoices.map(inv => {
      if (inv.id === selectedInvoice.id) {
        const updatedItems = inv.items.filter((_, idx) => idx !== itemIndex);
        const updatedAmount = inv.amount - itemToDelete.price;
        const newDiscount = Math.min(inv.discount, updatedAmount);
        return {
          ...inv,
          amount: Math.max(0, updatedAmount),
          discount: newDiscount,
          items: updatedItems
        };
      }
      return inv;
    });

    setInvoices(updated);
    setSelectedInvoice(updated.find(inv => inv.id === selectedInvoice.id));
    showToast(`Removed "${itemToDelete.name}" from check.`);
  };

  // Calculate KPI stats
  const outstandingDues = invoices.reduce((acc, inv) => {
    if (inv.status === 'Paid') return acc;
    const taxes = calculateTaxes(inv.amount, inv.discount, inv.gstRate, inv.serviceChargeRate);
    const grandTotal = Math.round(taxes.total);
    return acc + (grandTotal - inv.paidAmount);
  }, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const settlementsToday = invoices.reduce((acc, inv) => {
    const todayPayments = inv.payments
      .filter(p => p.date === todayStr)
      .reduce((sum, p) => sum + p.amount, 0);
    return acc + todayPayments;
  }, 0);

  const pendingChecksCount = invoices.filter(inv => inv.status !== 'Paid').length;

  const paymentShare = invoices.reduce((acc, inv) => {
    inv.payments.forEach(p => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
    });
    return acc;
  }, { 'Cash': 0, 'Card/UPI': 0, 'Bank Transfer': 0, 'Room Charge': 0 });

  const totalShare = paymentShare['Cash'] + paymentShare['Card/UPI'] + paymentShare['Bank Transfer'] + paymentShare['Room Charge'] || 1;
  const cashPct = Math.round((paymentShare['Cash'] / totalShare) * 100);
  const cardPct = Math.round((paymentShare['Card/UPI'] / totalShare) * 100);
  const bankPct = Math.round((paymentShare['Bank Transfer'] / totalShare) * 100);
  const roomPct = Math.round((paymentShare['Room Charge'] / totalShare) * 100);

  // Filter and sort invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.room.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const matchesType = typeFilter === 'All' || inv.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return b.id.localeCompare(a.id);
    } else if (sortBy === 'amount-desc') {
      const aTaxes = calculateTaxes(a.amount, a.discount, a.gstRate, a.serviceChargeRate);
      const bTaxes = calculateTaxes(b.amount, b.discount, b.gstRate, b.serviceChargeRate);
      return Math.round(bTaxes.total) - Math.round(aTaxes.total);
    } else if (sortBy === 'amount-asc') {
      const aTaxes = calculateTaxes(a.amount, a.discount, a.gstRate, a.serviceChargeRate);
      const bTaxes = calculateTaxes(b.amount, b.discount, b.gstRate, b.serviceChargeRate);
      return Math.round(aTaxes.total) - Math.round(bTaxes.total);
    }
    return 0;
  });

  return (
    <div className="space-y-6 animate-fadeIn relative lg:h-[calc(100vh-8rem)] lg:overflow-hidden lg:flex lg:flex-col">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-navy border border-gold text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl shadow-stone-900/10 animate-slideIn">
          <div className="w-5 h-5 bg-gold/10 rounded-full flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-gold" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Fixed Section on Desktop */}
      <div className="flex-shrink-0 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-xl text-navy">Cashier Billing & Folios Control</h1>
            <p className="text-slate text-[11px] font-medium mt-0.5">Audit active guest ledger checks, apply discounts, process card/cash settlements, and print receipts</p>
          </div>
        </div>

        {/* KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="soft-card p-4 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[9px] font-bold text-slate uppercase tracking-wider block">Outstanding Dues</span>
              <span className="text-lg font-display font-bold text-navy mt-1 block">₹{outstandingDues.toLocaleString()}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-danger-pale flex items-center justify-center">
              <Coins className="w-4 h-4 text-danger" />
            </div>
          </div>

          <div className="soft-card p-4 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[9px] font-bold text-slate uppercase tracking-wider block">Settled Today</span>
              <span className="text-lg font-display font-bold text-success mt-1 block">₹{settlementsToday.toLocaleString()}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-success-pale flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
          </div>

          <div className="soft-card p-4 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[9px] font-bold text-slate uppercase tracking-wider block">Active Checks</span>
              <span className="text-lg font-display font-bold text-navy mt-1 block">{pendingChecksCount} pending</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-gold-pale flex items-center justify-center">
              <Receipt className="w-4 h-4 text-gold" />
            </div>
          </div>

          <div className="soft-card p-4 flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-[9px] font-bold text-slate uppercase tracking-wider block">Collection Share</span>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden flex bg-slate-100">
                  {paymentShare['Cash'] > 0 && <div className="h-full bg-gold" style={{ width: `${(paymentShare['Cash'] / totalShare) * 100}%` }} title={`Cash: ${cashPct}%`} />}
                  {paymentShare['Card/UPI'] > 0 && <div className="h-full bg-navy" style={{ width: `${(paymentShare['Card/UPI'] / totalShare) * 100}%` }} title={`Card/UPI: ${cardPct}%`} />}
                  {paymentShare['Bank Transfer'] > 0 && <div className="h-full bg-slate" style={{ width: `${(paymentShare['Bank Transfer'] / totalShare) * 100}%` }} title={`Bank Transfer: ${bankPct}%`} />}
                  {paymentShare['Room Charge'] > 0 && <div className="h-full bg-warning" style={{ width: `${(paymentShare['Room Charge'] / totalShare) * 100}%` }} title={`Room Charge: ${roomPct}%`} />}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-border-cream/40 text-[9px] font-semibold text-charcoal">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block shrink-0" />
                <span className="text-slate">Cash:</span>
                <span className="font-bold">₹{paymentShare['Cash'].toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-navy inline-block shrink-0" />
                <span className="text-slate">UPI/Card:</span>
                <span className="font-bold">₹{paymentShare['Card/UPI'].toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col space-y-4 relative">
        {/* Main List of invoices */}
        <div className="flex flex-col min-h-0 flex-1 space-y-4">
          {/* Controls Bar */}
          <div className="soft-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
              <input
                type="text"
                placeholder="Search guest, invoice or room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none focus:border-gold"
              />
            </div>
            <div className="flex items-center gap-3 flex-wrap md:flex-nowrap w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate uppercase tracking-wider font-sans">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate uppercase tracking-wider font-sans">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="Room Folio">Room Folio</option>
                  <option value="POS Table">POS Table</option>
                  <option value="Room Service">Room Service</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-1.5 bg-cream/10 border border-border-cream rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="amount-desc">Amount: High-Low</option>
                  <option value="amount-asc">Amount: Low-High</option>
                </select>
              </div>
            </div>
          </div>

          <div className="soft-card p-6 shadow-sm flex-1 min-h-0 flex flex-col">
            <h3 className="font-display font-semibold text-lg text-navy mb-4 flex-shrink-0">Active & Pending Checks</h3>
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="sticky top-0 bg-white z-10 border-b border-border-cream text-[10px] font-bold text-slate uppercase tracking-wider">
                    <th className="pb-3">Invoice ID</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Guest / Area</th>
                    <th className="pb-3 text-right">Base Amount</th>
                    <th className="pb-3 text-right">Discount</th>
                    <th className="pb-3 text-right">Grand Total</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-cream/40 text-xs font-semibold">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-xs text-slate font-semibold">
                        No active checks found matching your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const taxes = calculateTaxes(inv.amount, inv.discount, inv.gstRate, inv.serviceChargeRate);
                      return (
                        <tr 
                          key={inv.id} 
                          onClick={() => handleSelectInvoice(inv)}
                          className={`hover:bg-gold-pale/30 cursor-pointer transition-all ${selectedInvoice?.id === inv.id ? 'bg-gold-pale/50' : ''}`}
                        >
                          <td className="py-4 font-mono font-bold text-navy">{inv.id}</td>
                          <td className="py-4 text-slate">{inv.type}</td>
                          <td className="py-4">
                            <span className="font-bold text-charcoal block">{inv.guest}</span>
                            <span className="text-[10px] text-slate font-mono font-medium">{inv.room}</span>
                          </td>
                          <td className="py-4 font-mono font-bold text-slate text-right">₹{inv.amount.toLocaleString()}</td>
                          <td className="py-4 font-mono font-bold text-danger text-right">
                            {inv.discount > 0 ? `-₹${inv.discount.toLocaleString()}` : '—'}
                          </td>
                          <td className="py-4 font-mono font-bold text-navy text-right">₹{Math.round(taxes.total).toLocaleString()}</td>
                          <td className="py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              inv.status === 'Paid' 
                                ? 'bg-success/10 text-success border border-success/20' 
                                : inv.status === 'Partial'
                                ? 'bg-blue-50 text-blue-800 border border-blue-300/40'
                                : 'bg-warning-pale text-warning border border-warning/20'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <ArrowRight className="w-4 h-4 text-slate hover:text-gold transition-colors inline" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        </div>

        {/* Right Detail Pane (Popup Modal) */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:static print:block print:p-0">
            <div 
              className="absolute inset-0 bg-navy/60 backdrop-blur-sm transition-opacity print:hidden"
              onClick={() => setSelectedInvoice(null)}
            />
            <div className="relative bg-white rounded-3xl w-full max-w-[500px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-fadeIn print:w-full print:border-none print:shadow-none print:max-h-none print:rounded-none print:block">
              <div className="flex justify-between items-center p-5 border-b border-border-cream bg-cream/20 shrink-0 print:hidden">
                <h3 className="font-display font-bold text-navy text-lg">Invoice Details</h3>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate hover:bg-white hover:text-navy rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 flex flex-col relative bg-slate-50/30 print:p-0 print:bg-white">
                <div id="printable-area" className="space-y-3.5 flex flex-col justify-between flex-1 bg-white p-5 rounded-2xl border border-border-cream shadow-sm print:border-none print:shadow-none print:p-0">
                  <div className="flex justify-between items-start border-b border-border-cream pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate">{selectedInvoice.type}</span>
                      <h3 className="font-mono font-bold text-lg text-navy mt-1">{selectedInvoice.id}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      selectedInvoice.status === 'Paid' 
                        ? 'bg-success/10 text-success border border-success/20' 
                        : selectedInvoice.status === 'Partial'
                        ? 'bg-blue-50 text-blue-800 border border-blue-300/40'
                        : 'bg-warning-pale text-warning border border-warning/20'
                    }`}>
                      {selectedInvoice.status}
                    </span>
                  </div>

              {/* Dynamic Tax Configuration Toggles */}
              {selectedInvoice.status !== 'Paid' && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-cream/10 border border-border-cream/50 rounded-2xl text-[10px]">
                  <div className="space-y-1">
                    <label className="font-bold text-navy uppercase block">GST Setup</label>
                    <select
                      value={selectedInvoice.gstRate}
                      onChange={(e) => handleUpdateTaxRates(selectedInvoice.id, 'gstRate', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-border-cream rounded-lg focus:outline-none focus:border-gold"
                    >
                      <option value="18">Standard (18%)</option>
                      <option value="5">F&B (5%)</option>
                      <option value="0">Exempt (0%)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-navy uppercase block">Service Charge</label>
                    <select
                      value={selectedInvoice.serviceChargeRate}
                      onChange={(e) => handleUpdateTaxRates(selectedInvoice.id, 'serviceChargeRate', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-border-cream rounded-lg focus:outline-none focus:border-gold"
                    >
                      <option value="0">None (0%)</option>
                      <option value="5">Optional (5%)</option>
                      <option value="10">Standard (10%)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Charges Breakdown */}
              <div className="space-y-2">
                <span className="text-slate text-[10px] font-bold uppercase tracking-wider block">Charges Breakdown</span>
                <div className="bg-white p-3 rounded-2xl border border-border-cream/60 space-y-2 max-h-48 overflow-y-auto">
                  {selectedInvoice.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-xs group py-1 border-b border-border-cream/30 last:border-0">
                      <span className="text-slate font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-charcoal font-bold">₹{item.price.toLocaleString()}</span>
                        {selectedInvoice.status !== 'Paid' && (
                          <button
                            onClick={() => handleDeleteItem(index)}
                            className="text-danger hover:text-danger/80 p-0.5 rounded hover:bg-danger-pale transition-all opacity-60 group-hover:opacity-100"
                            title="Remove Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inline Add Item Form */}
                {selectedInvoice.status !== 'Paid' && (
                  <form onSubmit={handleAddItem} className="bg-white/80 p-3 rounded-2xl border border-dashed border-border-cream space-y-2">
                    <span className="text-[9px] font-bold text-navy uppercase block">Add Charge Item</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Item name (e.g. Extra Bed)"
                        required
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-border-cream rounded-lg text-xs font-semibold focus:outline-none focus:border-gold"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        required
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        className="w-20 px-2 py-1 bg-white border border-border-cream rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-gold"
                      />
                      <button
                        type="submit"
                        className="px-2.5 bg-navy text-white hover:bg-navy/90 rounded-lg text-xs font-bold shrink-0 flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Guest metadata */}
              <div className="space-y-1.5 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate font-medium">Customer:</span>
                  <span className="text-charcoal">{selectedInvoice.guest}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate font-medium">Location:</span>
                  <span className="text-charcoal">{selectedInvoice.room}</span>
                </div>
                <div className="flex justify-between border-t border-border-cream/50 pt-2">
                  <span className="text-slate">Base Items Subtotal:</span>
                  <span className="font-mono text-charcoal">₹{selectedInvoice.amount.toLocaleString()}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-danger">
                    <span>Discount Applied:</span>
                    <span className="font-mono">-₹{selectedInvoice.discount.toLocaleString()}</span>
                  </div>
                )}
                
                {/* Tax Breakdown */}
                {(() => {
                  const taxes = calculateTaxes(
                    selectedInvoice.amount, 
                    selectedInvoice.discount, 
                    selectedInvoice.gstRate, 
                    selectedInvoice.serviceChargeRate
                  );
                  const grandTotal = Math.round(taxes.total);
                  const remaining = Math.max(0, grandTotal - selectedInvoice.paidAmount);
                  return (
                    <>
                      {taxes.serviceCharge > 0 && (
                        <div className="flex justify-between text-slate font-medium text-[11px]">
                          <span>Service Charge ({selectedInvoice.serviceChargeRate}%):</span>
                          <span className="font-mono">₹{taxes.serviceCharge.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate font-medium text-[11px]">
                        <span>CGST ({(selectedInvoice.gstRate / 2)}%):</span>
                        <span className="font-mono">₹{taxes.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate font-medium text-[11px]">
                        <span>SGST ({(selectedInvoice.gstRate / 2)}%):</span>
                        <span className="font-mono">₹{taxes.sgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-navy pb-1 pt-1.5 text-[13px] font-bold text-navy">
                        <span>Grand Total (Net):</span>
                        <span className="font-mono">₹{grandTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-success text-[11px]">
                        <span>Total Paid so far:</span>
                        <span className="font-mono">₹{selectedInvoice.paidAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-navy font-bold text-xs border-t border-dashed border-border-cream/80 pt-1.5">
                        <span>Balance Due:</span>
                        <span className="font-mono">₹{remaining.toLocaleString()}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Active Actions */}
              {selectedInvoice.status !== 'Paid' ? (
                <div className="space-y-4 pt-4 border-t border-border-cream">
                  {/* Tab Selector */}
                  <div className="flex bg-surface-linen p-1 rounded-xl border border-border-cream">
                    <button
                      type="button"
                      onClick={() => setActiveActionTab('settle')}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        activeActionTab === 'settle' ? 'bg-navy text-white shadow-sm' : 'text-slate hover:text-navy'
                      }`}
                    >
                      Settle Dues
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveActionTab('discount')}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        activeActionTab === 'discount' ? 'bg-navy text-white shadow-sm' : 'text-slate hover:text-navy'
                      }`}
                    >
                      Discount
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveActionTab('split')}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        activeActionTab === 'split' ? 'bg-navy text-white shadow-sm' : 'text-slate hover:text-navy'
                      }`}
                    >
                      Split Bill
                    </button>
                  </div>

                  {/* Tab Contents */}
                  {activeActionTab === 'settle' && (
                    /* Record Partial / Split Payment Form */
                    <form onSubmit={handleRecordPayment} className="space-y-2.5 p-3 bg-cream/15 border border-border-cream/50 rounded-2xl animate-fadeIn">
                      <label className="text-[9px] font-bold text-navy uppercase block">Record Payment Settlement</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[8px] text-slate font-bold uppercase block mb-1">Amount (₹)</span>
                          <input 
                            type="number"
                            placeholder="All remaining"
                            value={collectAmount}
                            onChange={(e) => setCollectAmount(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-border-cream rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-gold"
                          />
                        </div>
                        <div>
                          <span className="text-[8px] text-slate font-bold uppercase block mb-1">Method</span>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-border-cream rounded-lg text-xs font-semibold focus:outline-none focus:border-gold"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Card/UPI">Card/UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Room Charge">Room Charge</option>
                          </select>
                        </div>
                      </div>

                      {/* Conditional Reference Input */}
                      {['Card/UPI', 'Bank Transfer'].includes(paymentMethod) && (
                        <div className="space-y-1">
                          <span className="text-[8px] text-slate font-bold uppercase block">Transaction Reference / ID</span>
                          <input 
                            type="text"
                            placeholder="e.g. TXN-192830"
                            required
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-border-cream rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-gold"
                          />
                        </div>
                      )}

                      <button 
                        type="submit"
                        className="w-full py-2 bg-navy text-white hover:bg-navy/90 rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-gold" /> Collect Payment
                      </button>
                    </form>
                  )}

                  {activeActionTab === 'discount' && (
                    /* Apply Discount Field */
                    <div className="space-y-2 p-3 bg-cream/15 border border-border-cream/50 rounded-2xl animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-navy uppercase block">Apply Discount</label>
                        <div className="flex bg-white border border-border-cream rounded-lg overflow-hidden p-0.5 text-[8px] font-bold">
                          <button
                            type="button"
                            onClick={() => setDiscountType('flat')}
                            className={`px-2 py-0.5 rounded ${discountType === 'flat' ? 'bg-navy text-white' : 'text-slate'}`}
                          >
                            Flat (₹)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountType('percent')}
                            className={`px-2 py-0.5 rounded ${discountType === 'percent' ? 'bg-navy text-white' : 'text-slate'}`}
                          >
                            Percent (%)
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder={discountType === 'flat' ? "e.g. 200" : "e.g. 10"}
                          value={customDiscount}
                          onChange={(e) => setCustomDiscount(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-border-cream rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-gold"
                        />
                        <button 
                          onClick={handleApplyDiscount}
                          className="px-3 bg-navy text-white hover:bg-navy/90 rounded-xl text-xs font-bold shrink-0"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}

                  {activeActionTab === 'split' && (
                    /* Split Bill Calculator */
                    <div className="space-y-2 p-3 bg-cream/15 border border-border-cream/50 rounded-2xl animate-fadeIn">
                      <label className="text-[9px] font-bold text-navy uppercase block flex items-center gap-1">
                        <SplitSquareVertical className="w-3.5 h-3.5 text-gold" /> Split Bill Calculator
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          min="1"
                          placeholder="No. of guests"
                          value={splitCount}
                          onChange={(e) => setSplitCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-3 py-1.5 bg-white border border-border-cream rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-gold"
                        />
                        <button 
                          onClick={() => setShowSplitResult(true)}
                          className="px-3 bg-navy text-white hover:bg-navy/90 rounded-xl text-xs font-bold shrink-0"
                        >
                          Calculate
                        </button>
                      </div>
                      {showSplitResult && (
                        <p className="text-[10px] font-bold text-navy mt-1">
                          Each Share: ₹{Math.round(calculateTaxes(selectedInvoice.amount, selectedInvoice.discount, selectedInvoice.gstRate, selectedInvoice.serviceChargeRate).total / splitCount).toLocaleString()} (for {splitCount} guests)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 pt-4 border-t border-border-cream text-center text-xs font-semibold">
                  <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="font-bold text-charcoal">Invoice Fully Settled</p>
                </div>
              )}

              {/* View/Print Receipt trigger (always show) */}
              <button 
                onClick={() => setShowReceiptModal(true)}
                className="w-full btn-secondary flex items-center justify-center gap-2 mt-4"
              >
                <FileText className="w-4 h-4" /> View & Print Bill
              </button>
            </div>
              </div>
            </div>
          </div>
        )}

      {/* Receipt Preview Modal */}
      {showReceiptModal && selectedInvoice && createPortal(
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 print-modal-overlay">
          <div className={`bg-white rounded-[2rem] border border-border-cream flex flex-col w-full ${printFormat === 'pos' ? 'max-w-md' : 'max-w-2xl'} shadow-2xl relative max-h-[90vh] overflow-hidden print:p-0 print:shadow-none print:border-none print:max-w-none print:max-h-none print:overflow-visible print:block`}>
            {/* Dynamic Print CSS */}
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                @page {
                  size: ${printFormat === 'pos' ? '80mm auto' : 'auto'};
                  margin: 0;
                }
                body * {
                  visibility: hidden;
                }
                .print-modal-overlay, .print-modal-overlay * {
                  visibility: visible !important;
                }
                .print-modal-overlay {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  height: auto;
                  background: white !important;
                  display: block !important;
                }
                /* Absolute position to print start */
                #printable-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: ${printFormat === 'pos' ? '80mm' : '100%'} !important;
                  margin: 0 auto !important;
                  padding: ${printFormat === 'pos' ? '0' : '20px'} !important;
                  font-family: ${printFormat === 'pos' ? 'monospace' : 'sans-serif'} !important;
                  background: white !important;
                }
                .print\\:hidden {
                  display: none !important;
                }
                /* Allow page breaks and remove scrolling containers limitations during print */
                html, body, #root, #root *, .fixed, .relative, .overflow-y-auto {
                  height: auto !important;
                  max-height: none !important;
                  overflow: visible !important;
                }
              }
            `}} />

            {/* Close button - hidden on print */}
            <button 
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-6 right-6 z-10 text-slate hover:text-navy transition-colors print:hidden"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Format Selector Tab Bar - Hidden on print */}
            <div className="flex justify-center border-b border-border-cream p-8 pb-4 shrink-0 print:hidden">
              <div className="flex bg-surface-linen/50 p-1 rounded-xl border border-border-cream">
                <button
                  type="button"
                  onClick={() => setPrintFormat('a4')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    printFormat === 'a4' ? 'bg-navy text-white shadow-sm' : 'text-slate hover:text-navy'
                  }`}
                >
                  Standard A4 Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('pos')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    printFormat === 'pos' ? 'bg-navy text-white shadow-sm' : 'text-slate hover:text-navy'
                  }`}
                >
                  3" POS Receipt
                </button>
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0 print:overflow-visible print:p-0">
              {/* Printable Invoice Container */}
              <div id="printable-area" className="space-y-6">
              {printFormat === 'a4' ? (
                /* ---------------- STANDARD A4 FORMAT ---------------- */
                <div className="space-y-6 font-sans">
                  {/* Receipt Header */}
                  <div className="flex justify-between items-start border-b border-border-cream pb-6">
                    <div>
                      <h2 className="font-display font-bold text-2xl text-navy uppercase tracking-wider">{hotelName}</h2>
                      <p className="text-[10px] text-slate font-bold uppercase tracking-wider mt-1">Powered by Hoteloraa</p>
                    </div>
                    <div className="text-right text-xs">
                      <h3 className="font-bold text-navy text-sm uppercase">Guest Invoice</h3>
                      <p className="text-slate mt-1 font-mono">{selectedInvoice.id}</p>
                      <p className="text-slate font-mono">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Guest & Vendor Info */}
                  <div className="grid grid-cols-2 gap-6 text-xs border-b border-border-cream pb-6">
                    <div>
                      <h4 className="font-bold text-navy uppercase tracking-wider mb-2">Billed To:</h4>
                      <p className="font-bold text-charcoal">{selectedInvoice.guest}</p>
                      <p className="text-slate mt-0.5">{selectedInvoice.room}</p>
                    </div>
                    <div className="text-right">
                      <h4 className="font-bold text-navy uppercase tracking-wider mb-2">Property Address:</h4>
                      <p className="font-bold text-charcoal">{hotelName}</p>
                      {hotelAddress && <p className="text-slate mt-0.5">{hotelAddress}</p>}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-navy text-xs uppercase tracking-wider">Line Items</h4>
                    <div className="border border-border-cream rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-cream/20 text-navy font-bold border-b border-border-cream">
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-cream/30">
                          {selectedInvoice.items.map((item, index) => (
                            <tr key={index}>
                              <td className="p-3 text-slate font-medium">{item.name}</td>
                              <td className="p-3 text-right font-mono font-bold text-charcoal">₹{item.price.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total calculations */}
                  <div className="grid grid-cols-2 gap-6 pt-4">
                    <div className="text-xs space-y-2">
                      <h4 className="font-bold text-navy uppercase tracking-wider">Settlement Ledger</h4>
                      {selectedInvoice.payments.length === 0 ? (
                        <p className="text-slate italic">No payments recorded yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {selectedInvoice.payments.map((p, i) => (
                            <div key={i} className="bg-cream/5 p-2 rounded-xl border border-border-cream/40 text-[11px]">
                              <div className="flex justify-between text-slate font-semibold">
                                <span>{p.method}</span>
                                <span className="font-mono text-charcoal font-bold">₹{p.amount.toLocaleString()}</span>
                              </div>
                              {p.reference && (
                                <p className="text-[9px] text-slate font-mono mt-0.5">Ref: {p.reference}</p>
                              )}
                              <p className="text-[9px] text-slate/60 mt-0.5">{p.date}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs space-y-2">
                      <div className="flex justify-between text-slate font-medium">
                        <span>Subtotal:</span>
                        <span className="font-mono">₹{selectedInvoice.amount.toLocaleString()}</span>
                      </div>
                      {selectedInvoice.discount > 0 && (
                        <div className="flex justify-between text-danger font-medium">
                          <span>Discount:</span>
                          <span className="font-mono">-₹{selectedInvoice.discount.toLocaleString()}</span>
                        </div>
                      )}
                      {(() => {
                        const taxes = calculateTaxes(
                          selectedInvoice.amount, 
                          selectedInvoice.discount, 
                          selectedInvoice.gstRate, 
                          selectedInvoice.serviceChargeRate
                        );
                        const grandTotal = Math.round(taxes.total);
                        const remaining = Math.max(0, grandTotal - selectedInvoice.paidAmount);
                        return (
                          <>
                            {taxes.serviceCharge > 0 && (
                              <div className="flex justify-between text-slate font-medium">
                                <span>Service Charge ({selectedInvoice.serviceChargeRate}%):</span>
                                <span className="font-mono">₹{taxes.serviceCharge.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-slate font-medium">
                              <span>CGST ({(selectedInvoice.gstRate / 2)}%):</span>
                              <span className="font-mono">₹{taxes.cgst.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate font-medium">
                              <span>SGST ({(selectedInvoice.gstRate / 2)}%):</span>
                              <span className="font-mono">₹{taxes.sgst.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t border-navy pt-2 text-sm font-bold text-navy">
                              <span>Grand Total:</span>
                              <span className="font-mono">₹{grandTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-success font-bold text-xs pt-1">
                              <span>Total Paid:</span>
                              <span className="font-mono">₹{selectedInvoice.paidAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-navy font-bold text-xs border-t border-dashed border-border-cream pt-1">
                              <span>Balance Due:</span>
                              <span className="font-mono">₹{remaining.toLocaleString()}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Watermark/Footer */}
                  <div className="border-t border-border-cream pt-6 mt-12 relative overflow-hidden flex flex-col items-center justify-center min-h-[100px]">
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] blur-[2px] pointer-events-none select-none">
                      <h2 className="font-display font-bold text-6xl text-navy tracking-widest uppercase">HOTELORAA</h2>
                    </div>
                    <div className="text-center text-[10px] text-slate font-semibold uppercase tracking-wider relative z-10 bg-white/50 px-4 py-1 rounded-full">
                      Thank you for staying with us! • Powered by Hoteloraa SaaS
                    </div>
                  </div>
                </div>
              ) : (
                /* ---------------- 3" POS THERMAL SLIP ---------------- */
                <div className="font-mono text-xs text-charcoal space-y-4 max-w-[320px] mx-auto p-4 border border-dashed border-slate-300 rounded-xl bg-stone-50/50 print:bg-stone-50/50 print:border print:border-dashed print:border-slate-300">
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-lg text-navy tracking-wider uppercase">{hotelName}</h3>
                    <p className="text-[9px] uppercase text-slate font-bold">F&B POS</p>
                    {hotelAddress && <p className="text-[9px] text-slate">{hotelAddress}</p>}
                    <p className="text-[10px] border-b border-dashed border-slate-300 py-1">--------------------------------</p>
                  </div>

                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between">
                      <span>Receipt No:</span>
                      <span className="font-bold">{selectedInvoice.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date/Time:</span>
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Guest/Table:</span>
                      <span>{selectedInvoice.guest} / {selectedInvoice.room}</span>
                    </div>
                    <p className="text-[10px] border-b border-dashed border-slate-300 py-1">--------------------------------</p>
                  </div>

                  {/* POS Items List */}
                  <div className="space-y-1.5 text-[11px]">
                    {selectedInvoice.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.name}</span>
                        <span className="font-bold">₹{item.price.toFixed(2)}</span>
                      </div>
                    ))}
                    <p className="text-[10px] border-b border-dashed border-slate-300 py-1">--------------------------------</p>
                  </div>

                  {/* POS Calculation block */}
                  {(() => {
                    const taxes = calculateTaxes(
                      selectedInvoice.amount, 
                      selectedInvoice.discount, 
                      selectedInvoice.gstRate, 
                      selectedInvoice.serviceChargeRate
                    );
                    const grandTotal = Math.round(taxes.total);
                    const remaining = Math.max(0, grandTotal - selectedInvoice.paidAmount);
                    return (
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>₹{selectedInvoice.amount.toFixed(2)}</span>
                        </div>
                        {selectedInvoice.discount > 0 && (
                          <div className="flex justify-between text-danger">
                            <span>Discount:</span>
                            <span>-₹{selectedInvoice.discount.toFixed(2)}</span>
                          </div>
                        )}
                        {taxes.serviceCharge > 0 && (
                          <div className="flex justify-between">
                            <span>Svc Chg ({selectedInvoice.serviceChargeRate}%):</span>
                            <span>₹{taxes.serviceCharge.toFixed(2)}</span>
                          </div>
                        )}
                        {selectedInvoice.gstRate > 0 && (
                          <div className="flex justify-between">
                            <span>GST ({selectedInvoice.gstRate}%):</span>
                            <span>₹{(taxes.cgst + taxes.sgst).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-navy text-xs border-t border-dashed border-slate-300 pt-1.5">
                          <span>GRAND TOTAL:</span>
                          <span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-success">
                          <span>TOTAL PAID:</span>
                          <span>₹{selectedInvoice.paidAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-navy border-t border-double border-slate-300 pt-1">
                          <span>BALANCE DUE:</span>
                          <span>₹{remaining.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <p className="text-[10px] border-b border-dashed border-slate-300 py-1">--------------------------------</p>

                  {/* Settlements detail */}
                  {selectedInvoice.payments.length > 0 && (
                    <div className="space-y-1 text-[10px]">
                      <span className="font-bold text-navy block uppercase tracking-wider text-[9px]">Transactions Ledger:</span>
                      {selectedInvoice.payments.map((p, idx) => (
                        <div key={idx} className="flex justify-between text-slate font-medium">
                          <span>{p.method} {p.reference ? `(Ref: ${p.reference})` : ''}:</span>
                          <span>₹{p.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <p className="text-[10px] border-b border-dashed border-slate-300 py-1">--------------------------------</p>
                    </div>
                  )}

                  <div className="text-center text-[10px] space-y-2 pt-2 relative overflow-hidden min-h-[80px] flex flex-col justify-end pb-4">
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] blur-[1px] pointer-events-none select-none">
                      <h3 className="font-bold text-4xl text-navy tracking-widest uppercase">HOTELORAA</h3>
                    </div>
                    <p className="font-bold uppercase tracking-wider relative z-10 bg-white/50 mx-auto px-2 rounded">Thank You!</p>
                    <p className="text-[9px] text-slate relative z-10 bg-white/50 mx-auto px-2 rounded">Please Visit Again</p>
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Print/Dismiss buttons - hidden on print */}
            <div className="flex gap-3 px-8 pb-8 pt-4 border-t border-border-cream shrink-0 print:hidden">
              <button 
                type="button"
                onClick={() => window.print()}
                className="w-1/2 btn-primary flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4 text-gold" /> Print Receipt
              </button>
              <button 
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="w-1/2 btn-secondary"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Billing;

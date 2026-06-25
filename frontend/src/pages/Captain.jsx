import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Utensils, 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Send, 
  X,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  AlertTriangle,
  History,
  TrendingUp,
  XCircle
} from 'lucide-react';
import api from '../utils/api.js';

function Captain() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'history'
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Selection/Search states
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // POS Cart state
  const [cart, setCart] = useState([]);
  const [itemNotes, setItemNotes] = useState({});

  // Editing Order state
  const [editingOrder, setEditingOrder] = useState(null);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editNotes, setEditNotes] = useState({});

  // Loading/Feedback states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPOSData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await api.get('/pos/data');
      if (data) {
        setTables(data.tables || []);
        setCategories(data.menuCategories || []);
        setMenuItems(data.menuItems || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load POS data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.get('/orders');
      setOrders(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadPOSData();
    loadOrders();
    
    // Auto-poll orders and tables for live updates
    const timer = setInterval(() => {
      loadPOSData(true);
      loadOrders(true);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setCart([]);
    setItemNotes({});
    setSuccess('');
    setError('');
  };

  const handleAddToCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === item.id);
      if (existing) {
        return prevCart.map((ci) => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === item.id);
      if (existing && existing.quantity > 1) {
        return prevCart.map((ci) => ci.id === item.id ? { ...ci, quantity: ci.quantity - 1 } : ci);
      }
      return prevCart.filter((ci) => ci.id !== item.id);
    });
  };

  const handleNoteChange = (itemId, note) => {
    setItemNotes((prevNotes) => ({
      ...prevNotes,
      [itemId]: note
    }));
  };

  // Calculations for current POS cart
  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const tax = Math.round(subtotal * 0.18); // 18% GST default
  const total = subtotal + tax;

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const orderPayload = {
        tableId: selectedTable.id,
        items: cart.map((ci) => ({
          menuItemId: ci.id,
          quantity: ci.quantity,
          notes: itemNotes[ci.id] || ''
        }))
      };

      await api.post('/pos/quick-order', orderPayload);
      setSuccess(`KOT placed successfully for Table: ${selectedTable.name}!`);
      setCart([]);
      setItemNotes({});
      setSelectedTable(null);
      loadPOSData();
      loadOrders();
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick action: Serve Order
  const handleServeOrder = async (orderId) => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'SERVED' });
      setSuccess('Order marked as served successfully.');
      loadOrders();
      loadPOSData(true);
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick action: Cancel Order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.delete(`/orders/${orderId}`);
      setSuccess('Order cancelled successfully.');
      loadOrders();
      loadPOSData(true);
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setSubmitting(false);
    }
  };

  // Opening the edit order modal
  const handleOpenEditOrder = async (order) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const fullOrder = await api.get(`/orders/${order.id}`);
      setEditingOrder(fullOrder);
    } catch (err) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Edit order: Voiding an existing item
  const handleVoidItem = async (itemId) => {
    if (!editingOrder) return;
    if (!window.confirm('Are you sure you want to void this item from the order?')) return;
    setError('');
    setSubmitting(true);
    try {
      await api.patch(`/orders/${editingOrder.id}/items/${itemId}/void`);
      setSuccess('Item voided successfully');
      
      // Reload order detail
      const fullOrder = await api.get(`/orders/${editingOrder.id}`);
      setEditingOrder(fullOrder);
      loadOrders(true);
    } catch (err) {
      setError(err.message || 'Failed to void item');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit order: Adding a new item to the active order
  const handleAddNewItemToOrder = async (menuItem) => {
    if (!editingOrder) return;
    setError('');
    setSubmitting(true);
    try {
      const note = editNotes[menuItem.id] || '';
      await api.post(`/orders/${editingOrder.id}/items`, {
        items: [
          {
            menuItemId: menuItem.id,
            quantity: 1,
            notes: note
          }
        ]
      });
      setSuccess(`Added ${menuItem.name} to order.`);
      
      // Clear note
      setEditNotes(prev => ({ ...prev, [menuItem.id]: '' }));

      // Reload order details
      const fullOrder = await api.get(`/orders/${editingOrder.id}`);
      setEditingOrder(fullOrder);
      loadOrders(true);
    } catch (err) {
      setError(err.message || 'Failed to add item to order');
    } finally {
      setSubmitting(false);
    }
  };

  // Filters
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategoryId === 'All' || item.menuCategoryId === selectedCategoryId;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredEditMenuItems = menuItems.filter((item) => {
    return item.name.toLowerCase().includes(editSearchQuery.toLowerCase());
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'CONFIRMED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PREPARING': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'READY': return 'bg-green-50 text-green-700 border-green-200 animate-pulse';
      case 'SERVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      case 'COMPLETED': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 space-y-4">
      {error && <div className="p-3 bg-danger-pale border border-danger/10 text-danger rounded-xl text-xs font-bold shrink-0">{error}</div>}
      {success && <div className="p-3 bg-success-pale border border-success/10 text-success rounded-xl text-xs font-bold shrink-0">{success}</div>}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border-cream pb-1 shrink-0 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-1.5 pb-2 text-sm font-bold transition-all relative whitespace-nowrap ${
            activeTab === 'pos' 
              ? 'text-navy border-b-2 border-gold font-extrabold' 
              : 'text-slate hover:text-navy'
          }`}
        >
          <Utensils className="w-4 h-4 shrink-0" />
          <span>New Order (POS)</span>
        </button>
        <button 
          onClick={() => {
            setActiveTab('history');
            loadOrders();
          }}
          className={`flex items-center gap-1.5 pb-2 text-sm font-bold transition-all relative whitespace-nowrap ${
            activeTab === 'history' 
              ? 'text-navy border-b-2 border-gold font-extrabold' 
              : 'text-slate hover:text-navy'
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span>Active Orders & History</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate font-semibold text-xs animate-pulse">Loading console...</div>
      ) : activeTab === 'pos' ? (
        /* ======================== POS VIEW ======================== */
        !selectedTable ? (
          // View 1: Table selection layout
          <div className="flex-1 space-y-4 min-h-0 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 shrink-0">
              <div>
                <h2 className="font-display font-bold text-xl text-navy">Select Active Table</h2>
                <p className="text-slate text-xs font-medium mt-0.5">Click a table to open menu and record customer orders</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-charcoal bg-white/50 border border-border-cream px-3 py-1.5 rounded-xl">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success"></span> Free</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger"></span> Occupied</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning"></span> Booked</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto soft-card p-6 bg-[#FEF9F1] bg-[radial-gradient(#EBE5DA_1.5px,transparent_1.5px)] bg-[size:24px_24px] rounded-2xl min-h-[300px]">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center mt-4">
                {tables.map((table) => {
                  const colorClass = 
                    table.status === 'OCCUPIED' ? 'bg-danger/10 border-danger text-danger' : 
                    table.status === 'RESERVED' ? 'bg-warning/10 border-warning text-warning' : 
                    'bg-success/10 border-success text-success';
                  
                  return (
                    <div 
                      key={table.id}
                      onClick={() => handleTableSelect(table)}
                      className="flex flex-col items-center gap-2 cursor-pointer group"
                    >
                      <div className={`
                        w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center font-mono shadow-sm transition-all duration-300
                        ${colorClass} hover:scale-105 hover:shadow-md
                      `}>
                        <span className="font-bold text-sm">{table.name}</span>
                        <span className="text-[9px] opacity-75 font-semibold mt-1">{table.capacity} Pax</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          // View 2: POS Menu Ordering Panel
          <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:min-h-0 overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0 relative">
            {/* Left panel: categories and items grid */}
            <div className="flex-none lg:flex-1 h-[65vh] lg:h-auto flex flex-col bg-white border border-border-cream rounded-2xl p-4 lg:min-h-0">
              {/* Top drawer header */}
              <div className="flex justify-between items-center border-b border-border-cream pb-3 shrink-0">
                <div>
                  <h3 className="font-display font-semibold text-navy text-sm">Table Order: {selectedTable.name}</h3>
                  <p className="text-[10px] text-slate font-semibold uppercase tracking-wider">{selectedTable.capacity} Seats capacity</p>
                </div>
                <button 
                  onClick={() => setSelectedTable(null)}
                  className="p-1 text-slate hover:text-navy hover:bg-cream/40 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search and Category navigation bar */}
              <div className="py-3 flex flex-col md:flex-row gap-3 shrink-0">
                {/* Search bar */}
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate/50">
                    <Search className="w-4 h-4" />
                  </span>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold placeholder-slate/50"
                    placeholder="Search dishes..."
                  />
                </div>

                {/* Category selector */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                  <button
                    onClick={() => setSelectedCategoryId('All')}
                    className={`px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                      selectedCategoryId === 'All' 
                        ? 'bg-navy text-gold shadow-sm' 
                        : 'bg-cream/40 text-slate hover:text-navy border border-border-cream/50'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
                        selectedCategoryId === cat.id 
                          ? 'bg-navy text-gold shadow-sm' 
                          : 'bg-cream/40 text-slate hover:text-navy border border-border-cream/50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Grid scrollable */}
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredMenuItems.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleAddToCart(item)}
                      className="p-3 border border-border-cream/70 rounded-xl hover:border-gold hover:bg-gold-pale/10 cursor-pointer flex gap-3 h-28 group transition-all"
                    >
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl.startsWith('/uploads') ? `http://localhost:5000${item.imageUrl}` : item.imageUrl} 
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover border border-border-cream/50 group-hover:border-gold/30 shrink-0 self-center"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-cream/40 flex items-center justify-center text-slate/40 shrink-0 self-center">
                          <Utensils className="w-6 h-6 text-slate/30" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-semibold text-xs text-charcoal group-hover:text-navy truncate">{item.name}</h4>
                            <span className={`w-2.5 h-2.5 rounded-full border border-white shrink-0 mt-0.5 ${item.isVeg ? 'bg-success' : 'bg-danger'}`} />
                          </div>
                          <p className="text-[10px] text-slate line-clamp-2 mt-1">{item.description}</p>
                        </div>

                        <div className="flex justify-between items-center border-t border-border-cream/40 pt-1.5 mt-1">
                          <span className="font-mono text-xs font-bold text-navy">₹{item.price}</span>
                          <span className="w-5 h-5 rounded-lg bg-gold-pale border border-gold/10 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-navy transition-all">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right panel: Cart Checkout details */}
            <div id="pos-cart" className="flex-none w-full lg:w-80 bg-white border border-border-cream rounded-2xl p-4 flex flex-col justify-between shrink-0 lg:min-h-0">
              <div className="flex flex-col lg:min-h-0 flex-1">
                <div className="flex items-center gap-2 border-b border-border-cream pb-3 shrink-0 text-navy font-display font-semibold text-sm">
                  <ShoppingBag className="w-4 h-4 text-gold" /> Check Order Cart
                </div>

                {/* Cart List */}
                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate text-xs font-semibold py-20 text-center">
                    <ShoppingBag className="w-10 h-10 text-slate/30 mb-2" />
                    Your cart is empty.
                    <span className="text-[10px] text-slate/50 block font-normal mt-1">Tap items on the left to add.</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-0">
                    {cart.map((ci) => (
                      <div key={ci.id} className="p-3 bg-cream/30 border border-border-cream/50 rounded-xl space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs text-charcoal truncate">{ci.name}</h4>
                            <span className="font-mono text-[10px] text-navy font-bold">₹{ci.price}</span>
                          </div>
                          {/* Adjust quantity controls */}
                          <div className="flex items-center gap-2 border border-border-cream bg-white px-2 py-1 rounded-xl shrink-0">
                            <button onClick={() => handleRemoveFromCart(ci)} className="text-slate hover:text-navy"><Minus className="w-3 h-3" /></button>
                            <span className="font-mono text-xs font-bold text-navy">{ci.quantity}</span>
                            <button onClick={() => handleAddToCart(ci)} className="text-slate hover:text-navy"><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                        
                        {/* Notes input per item */}
                        <input 
                          type="text"
                          value={itemNotes[ci.id] || ''}
                          onChange={(e) => handleNoteChange(ci.id, e.target.value)}
                          className="w-full px-2.5 py-1 border border-border-cream/50 bg-white rounded-lg text-[9px] focus:outline-none"
                          placeholder="Add preparation note (e.g. no onion, spicy)..."
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Calculations Footer */}
              {cart.length > 0 && (
                <div className="border-t border-border-cream pt-4 mt-2 space-y-4 shrink-0">
                  <div className="space-y-1.5 text-xs text-slate font-medium">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono text-charcoal">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%):</span>
                      <span className="font-mono text-charcoal">₹{tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-border-cream/50 pt-2 text-navy font-bold">
                      <span>Total Amount:</span>
                      <span className="font-mono text-sm">₹{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="w-full py-3 bg-[#0B1F3A] hover:bg-[#142d50] disabled:bg-[#0B1F3A]/70 text-white rounded-full font-bold text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 uppercase"
                  >
                    <Send className="w-3.5 h-3.5" /> {submitting ? 'Placing Order...' : 'Send to Kitchen'}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Cart Floating Action Bar */}
            {cart.length > 0 && (
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border-cream p-4 flex justify-between items-center shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-40">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-navy">{cart.length} Items Selected</span>
                  <span className="text-sm font-extrabold text-charcoal">₹{total.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => document.getElementById('pos-cart')?.scrollIntoView({ behavior: 'smooth' })} 
                  className="px-6 py-2.5 bg-[#0B1F3A] text-gold rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:bg-[#142d50] transition-all"
                >
                  View Cart
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        /* ======================== HISTORY VIEW ======================== */
        <div className="flex-1 flex flex-col bg-white border border-border-cream rounded-2xl p-6 min-h-0">
          <div className="flex justify-between items-center border-b border-border-cream pb-3 mb-4 shrink-0">
            <div>
              <h3 className="font-display font-bold text-navy text-lg">Active & Recent Orders</h3>
              <p className="text-slate text-xs mt-0.5">Manage existing running tables, add extra items, void entries or change status</p>
            </div>
            <button 
              onClick={() => loadOrders()}
              className="px-3 py-1.5 bg-cream/40 text-navy font-bold text-xs rounded-xl hover:bg-cream/60 transition-all border border-border-cream/50"
            >
              Refresh Orders
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate text-xs font-semibold py-20 text-center">
                <ShoppingBag className="w-10 h-10 text-slate/30 mb-2" />
                No orders recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const itemsCount = (order.items || []).length;
                  const isClosed = ['SERVED', 'CANCELLED', 'COMPLETED'].includes(order.status);
                  
                  return (
                    <div 
                      key={order.id} 
                      className="p-5 border border-border-cream/70 rounded-2xl bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-gold hover:shadow-md"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-navy">{order.orderNumber}</span>
                          <span className={`px-2 py-0.5 border rounded-lg text-[9px] font-bold tracking-wider ${getStatusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate font-medium mt-1">
                          <span className="flex items-center gap-1"><Utensils className="w-3.5 h-3.5 text-slate/60 shrink-0" /> {order.table?.name || 'Quick POS'}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate/60 shrink-0" /> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <span>Captain: {order.user?.name || 'POS'}</span>
                          <span>Items: {itemsCount}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-border-cream/50 pt-3 md:pt-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate block font-bold uppercase tracking-wider">Amount</span>
                          <span className="font-mono font-extrabold text-navy text-sm">₹{order.totalAmount.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Edit Order */}
                          <button
                            onClick={() => handleOpenEditOrder(order)}
                            className="p-2 border border-border-cream text-navy hover:bg-gold-pale/10 hover:border-gold rounded-xl transition-all"
                            title="Edit Order / Add Items"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Quick Serve */}
                          {order.status !== 'SERVED' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleServeOrder(order.id)}
                              disabled={submitting}
                              className="px-3.5 py-2 bg-success text-white hover:bg-success/90 font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-sm shadow-success/15"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Serve</span>
                            </button>
                          )}

                          {/* Quick Cancel */}
                          {!isClosed && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={submitting}
                              className="p-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Cancel Order"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================== EDIT ORDER MODAL ======================== */}
      {editingOrder && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-white border border-border-cream rounded-3xl p-6 w-[800px] max-w-full h-[600px] max-h-[90vh] shadow-2xl flex flex-col justify-between animate-scaleUp">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border-cream pb-3 shrink-0">
              <div>
                <h3 className="font-display font-bold text-navy text-lg">Edit Order: {editingOrder.orderNumber}</h3>
                <p className="text-slate text-xs font-semibold">Table: {editingOrder.table?.name || 'Quick POS'} | Status: {editingOrder.status}</p>
              </div>
              <button 
                onClick={() => {
                  setEditingOrder(null);
                  loadOrders();
                }} 
                className="p-1 text-slate hover:text-navy hover:bg-cream/40 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body Grid */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 py-4 overflow-y-auto">
              
              {/* Left Column: Active Items (Option to Void) */}
              <div className="flex flex-col min-h-0 border-r border-border-cream/50 pr-0 md:pr-4">
                <h4 className="font-display font-semibold text-navy text-xs mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShoppingBag className="w-4 h-4 text-gold" /> Current Order Items
                </h4>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {(editingOrder.items || []).map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 border rounded-xl flex items-center justify-between gap-3 ${
                        item.isVoid 
                          ? 'bg-red-50/50 border-red-100 text-slate opacity-60 line-through' 
                          : 'bg-cream/20 border-border-cream/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <h5 className="font-semibold text-xs text-charcoal truncate">{item.menuItem?.name}</h5>
                        <p className="text-[10px] text-slate mt-0.5">
                          Quantity: <span className="font-mono font-bold text-navy">{item.quantity}</span> | ₹{item.unitPrice} each
                        </p>
                        {item.notes && <p className="text-[9px] text-slate italic mt-0.5">Note: {item.notes}</p>}
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-xs font-bold text-navy">₹{item.totalPrice}</span>
                        {!item.isVoid && !['CANCELLED', 'SERVED', 'COMPLETED'].includes(editingOrder.status) && (
                          <button
                            onClick={() => handleVoidItem(item.id)}
                            disabled={submitting}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                            title="Void Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-border-cream/50 pt-3 flex justify-between items-center text-xs font-bold text-navy shrink-0">
                  <span>Running Total:</span>
                  <span className="font-mono text-sm">₹{editingOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Right Column: Add New Items */}
              <div className="flex flex-col min-h-0 pl-0 md:pl-2">
                <h4 className="font-display font-semibold text-navy text-xs mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <Plus className="w-4 h-4 text-gold" /> Add Items to Kitchen
                </h4>

                {/* Search */}
                <div className="mb-3 shrink-0">
                  <input 
                    type="text"
                    value={editSearchQuery}
                    onChange={(e) => setEditSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold placeholder-slate/50"
                    placeholder="Search menu items..."
                  />
                </div>

                {/* Menu items scrollable list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredEditMenuItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-2.5 border border-border-cream/50 rounded-xl hover:border-gold hover:bg-gold-pale/10 flex flex-col gap-2 transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h5 className="font-semibold text-xs text-charcoal">{item.name}</h5>
                          <span className="font-mono text-[10px] text-navy font-bold">₹{item.price}</span>
                        </div>
                        
                        {['CANCELLED', 'SERVED', 'COMPLETED'].includes(editingOrder.status) ? (
                          <span className="text-[10px] text-slate font-medium">Order Closed</span>
                        ) : (
                          <button
                            onClick={() => handleAddNewItemToOrder(item)}
                            disabled={submitting}
                            className="px-2 py-1 bg-navy text-gold text-[10px] font-bold rounded-lg hover:bg-navy/90 flex items-center gap-1 shadow-sm"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>

                      {/* Optional Notes */}
                      <input 
                        type="text"
                        value={editNotes[item.id] || ''}
                        onChange={(e) => setEditNotes({ ...editNotes, [item.id]: e.target.value })}
                        className="w-full px-2 py-1 border border-border-cream/40 bg-cream/10 rounded-lg text-[9px] focus:outline-none"
                        placeholder="Add preparation note (e.g. no spicy)..."
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-border-cream pt-4 flex justify-end shrink-0">
              <button
                onClick={() => {
                  setEditingOrder(null);
                  loadOrders();
                }}
                className="px-6 py-2.5 bg-[#0B1F3A] hover:bg-[#142d50] text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                Done / Exit Edit
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Captain;

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Receipt, ShieldAlert, CreditCard, CheckCircle2, ChevronRight, RefreshCw, X } from 'lucide-react';
import api from '../utils/api';
import { useLocation } from 'react-router-dom';

function CheckOut() {
  const location = useLocation();
  const [occupiedRooms, setOccupiedRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Settlement Form Inputs
  const [extraChargesInput, setExtraChargesInput] = useState('0');
  const [discountInput, setDiscountInput] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(18); // default to 18%

  // Itemized Extra Charges states
  const [customExtras, setCustomExtras] = useState([]); // [{ id, desc, amount }]
  const [newExtraDesc, setNewExtraDesc] = useState('');
  const [newExtraAmount, setNewExtraAmount] = useState('');

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printInvoiceData, setPrintInvoiceData] = useState(null);
  const [printFormat, setPrintFormat] = useState('a4'); // 'a4' or 'pos'
  
  // Preserve checkout details for post-checkout final printing
  const [completedCheckoutDetails, setCompletedCheckoutDetails] = useState(null);

  const fetchPendingCheckOuts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/check-out/pending');
      setOccupiedRooms(data || []);
      
      if (location.state?.roomId) {
        const roomToSelect = (data || []).find(r => r.room?.id === location.state.roomId);
        if (roomToSelect) {
          setSelectedRoom(roomToSelect);
          setCheckoutComplete(false);
          setExtraChargesInput('0');
          setDiscountInput('0');
          setPaymentMethod('CASH');
          setNotes('');
        }
      }
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to fetch pending departures');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await api.get('/settings');
      if (data && typeof data.taxRate === 'number') {
        setTaxRate(data.taxRate);
      }
    } catch (e) {
      console.warn('Could not fetch settings, using default 18% tax rate:', e.message);
    }
  };

  useEffect(() => {
    fetchPendingCheckOuts();
    fetchSettings();
  }, []);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setCheckoutComplete(false);
    setExtraChargesInput('0');
    setCustomExtras([]);
    setNewExtraDesc('');
    setNewExtraAmount('');
    setDiscountInput('0');
    setPaymentMethod('CASH');
    setNotes('');
  };

  const handleAddCustomExtra = (e) => {
    e.preventDefault();
    if (!newExtraDesc.trim() || !newExtraAmount.trim()) return;
    const amountVal = parseFloat(newExtraAmount) || 0;
    if (amountVal <= 0) return;

    const newItem = {
      id: Date.now().toString(),
      desc: newExtraDesc.trim(),
      amount: amountVal
    };

    const updatedList = [...customExtras, newItem];
    setCustomExtras(updatedList);
    
    // Automatically recalculate extraChargesInput total sum
    const totalExtras = updatedList.reduce((sum, item) => sum + item.amount, 0);
    setExtraChargesInput(totalExtras.toString());

    setNewExtraDesc('');
    setNewExtraAmount('');
  };

  const handleRemoveCustomExtra = (itemId) => {
    const updatedList = customExtras.filter(item => item.id !== itemId);
    setCustomExtras(updatedList);

    const totalExtras = updatedList.reduce((sum, item) => sum + item.amount, 0);
    setExtraChargesInput(totalExtras.toString());
  };

  const buildFolio = (room, includeCustomExtras = false) => {
    if (!room) return [];
    const items = [];

    // 1. Room Charges
    items.push({
      desc: `Room Charges (${room.totalNights} night(s) @ ₹${room.ratePerNight}/night)`,
      amount: room.roomCharges
    });

    // 2. Existing Extra Charges
    if (room.extraCharges > 0) {
      items.push({
        desc: 'Room Extras (Mini Bar, Laundry, etc.)',
        amount: room.extraCharges
      });
    }

    // 3. Dynamic Custom Extras Added at Checkout
    if (includeCustomExtras) {
      customExtras.forEach(item => {
        items.push({
          desc: item.desc,
          amount: item.amount
        });
      });
    }

    // 4. Existing Discount
    if (room.discount > 0) {
      items.push({
        desc: 'Discount Applied',
        amount: -room.discount
      });
    }

    // 5. Restaurant Dine-In Orders
    if (room.orders && room.orders.length > 0) {
      room.orders.forEach((order) => {
        items.push({
          desc: `Restaurant Order (${order.orderNumber})`,
          amount: order.totalAmount
        });
      });
    }

    return items;
  };

  const handleCheckoutSettle = async () => {
    if (!selectedRoom) return;
    try {
      setSubmitting(true);
      setError(null);

      const extraVal = parseFloat(extraChargesInput) || 0;
      const discVal = parseFloat(discountInput) || 0;
      const subtotal = baseTotal + extraVal - discVal;
      const taxAmount = Math.round(subtotal * (taxRate / 100));

      const payload = {
        reservationId: selectedRoom.id,
        // Send extraVal + taxAmount so the final payment/totalAmount correctly includes tax
        extraCharges: extraVal + taxAmount,
        discount: discVal,
        paymentMethod,
        notes: notes || undefined,
      };

      await api.post('/check-out', payload);

      setCompletedCheckoutDetails({
        roomNumber: selectedRoom.room?.number,
        roomType: selectedRoom.room?.roomType?.name || 'Standard Room',
        guestName: selectedRoom.guest?.name,
        guestEmail: selectedRoom.guest?.email,
        guestPhone: selectedRoom.guest?.phone,
        bookingRef: selectedRoom.bookingRef,
        checkInDate: selectedRoom.checkInDate,
        checkOutDate: selectedRoom.checkOutDate,
        totalNights: selectedRoom.totalNights,
        ratePerNight: selectedRoom.ratePerNight,
        folioItems: [
          ...folioList,
          ...(discVal > 0 ? [{ desc: 'Additional Discount Added', amount: -discVal }] : [])
        ],
        subtotal: subtotal,
        taxAmount: taxAmount,
        grandTotal: grandTotal,
        paymentMethod: paymentMethod,
        notes: notes,
        isDraft: false
      });

      setCheckoutComplete(true);
      // Remove from occupied rooms list
      setOccupiedRooms(occupiedRooms.filter(r => r.id !== selectedRoom.id));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to complete check-out');
      alert(err.message || 'Failed to complete check-out');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDraftPrint = () => {
    if (!selectedRoom) return;
    const extraVal = parseFloat(extraChargesInput) || 0;
    const discVal = parseFloat(discountInput) || 0;
    const subtotal = baseTotal + extraVal - discVal;
    const taxAmount = Math.round(subtotal * (taxRate / 100));
    
    setPrintInvoiceData({
      roomNumber: selectedRoom.room?.number,
      roomType: selectedRoom.room?.roomType?.name || 'Standard Room',
      guestName: selectedRoom.guest?.name,
      guestEmail: selectedRoom.guest?.email,
      guestPhone: selectedRoom.guest?.phone,
      bookingRef: selectedRoom.bookingRef,
      checkInDate: selectedRoom.checkInDate,
      checkOutDate: selectedRoom.checkOutDate,
      totalNights: selectedRoom.totalNights,
      ratePerNight: selectedRoom.ratePerNight,
      folioItems: [
        ...folioList,
        ...(discVal > 0 ? [{ desc: 'Additional Discount Added', amount: -discVal }] : [])
      ],
      subtotal: subtotal,
      taxAmount: taxAmount,
      grandTotal: grandTotal,
      paymentMethod: paymentMethod,
      notes: notes,
      isDraft: true
    });
    setShowPrintModal(true);
  };

  // Calculations
  const folioList = buildFolio(selectedRoom, true);
  const baseTotal = buildFolio(selectedRoom, false).reduce((acc, curr) => acc + curr.amount, 0);
  const extraVal = parseFloat(extraChargesInput) || 0;
  const discVal = parseFloat(discountInput) || 0;
  const subtotal = baseTotal + extraVal - discVal;
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const grandTotal = Math.max(0, subtotal + taxAmount);

  return (
    <div className="space-y-4 animate-fadeIn lg:h-[calc(100vh-7.5rem)] lg:flex lg:flex-col lg:overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 flex-shrink-0">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Folio & Check-Out</h1>
          <p className="text-slate text-xs font-medium mt-0.5">Review guest ledgers, settle room folios, and complete checkout departure</p>
        </div>
        <button 
          onClick={fetchPendingCheckOuts}
          className="flex items-center gap-2 text-xs font-bold text-navy bg-white border border-border-cream px-3.5 py-1.5 rounded-xl hover:bg-cream/10 active:scale-95 transition-all shadow-sm self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh departures
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
        {/* Left Side: Occupied Rooms directory (Vertical Layout) */}
        <div className="lg:col-span-4 flex flex-col min-h-0 soft-card p-4 md:p-5 bg-white h-full overflow-hidden">
          <div className="flex justify-between items-center mb-3 flex-shrink-0">
            <h3 className="font-display font-semibold text-base text-navy">Occupied Rooms</h3>
            <span className="text-[10px] font-bold text-gold bg-gold-pale px-2 py-0.5 rounded-md border border-gold/20">
              {occupiedRooms.length} Active
            </span>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-slate text-sm font-semibold">
              <RefreshCw className="w-4 h-4 animate-spin text-gold" />
              Loading occupied rooms...
            </div>
          ) : error ? (
            <div className="py-6 text-center text-rose-600 text-sm font-medium">
              {error}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2.5">
              {occupiedRooms.map((res) => (
                <div 
                  key={res.id} 
                  onClick={() => handleSelectRoom(res)}
                  className={`
                    cursor-pointer p-3.5 border rounded-2xl flex items-center justify-between transition-all duration-200
                    ${selectedRoom?.id === res.id 
                      ? 'border-navy bg-navy text-white shadow-md' 
                      : 'border-border-cream hover:border-gold bg-white hover:bg-gold-pale/10 text-charcoal'
                    }
                  `}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        selectedRoom?.id === res.id ? 'bg-gold text-navy' : 'bg-cream/40 text-slate border border-border-cream/60'
                      }`}>
                        Room {res.room?.number}
                      </span>
                      <span className={`text-[10px] ${selectedRoom?.id === res.id ? 'text-gold/80' : 'text-slate'}`}>
                        {res.room?.roomType?.name || 'Deluxe'}
                      </span>
                    </div>
                    <h4 className={`font-display font-bold text-sm truncate ${selectedRoom?.id === res.id ? 'text-white' : 'text-navy'}`}>
                      {res.guest?.name}
                    </h4>
                    <p className={`text-[10px] mt-0.5 ${selectedRoom?.id === res.id ? 'text-slate-200' : 'text-slate'}`}>
                      In: {new Date(res.checkInDate).toLocaleDateString()} ({res.totalNights} night{res.totalNights > 1 ? 's' : ''})
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${selectedRoom?.id === res.id ? 'text-gold translate-x-0.5' : 'text-slate'}`} />
                </div>
              ))}
              {occupiedRooms.length === 0 && (
                <div className="py-8 text-center text-slate text-sm">
                  No currently occupied rooms found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Guest Folio Checkout Summary (Expanded Width) */}
        <div className="lg:col-span-8 flex flex-col min-h-0 soft-card p-4 md:p-5 bg-white h-full overflow-hidden">
          {selectedRoom ? (
            !checkoutComplete ? (
              <div className="flex flex-col h-full min-h-0">
                {/* Header (Compact Single-Row Design) */}
                <div className="border-b border-border-cream pb-2 flex-shrink-0 flex justify-between items-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] text-slate font-bold uppercase tracking-wider bg-cream/40 px-2 py-0.5 rounded border border-border-cream/60">FOLIO LEDGER</span>
                    <h3 className="font-display font-bold text-base text-navy">Room {selectedRoom.room?.number}</h3>
                    <span className="text-slate-300">•</span>
                    <p className="text-xs text-slate">Guest: <span className="font-semibold text-navy">{selectedRoom.guest?.name}</span></p>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-gold bg-gold-pale px-2 py-0.5 rounded border border-gold/20 shrink-0">
                    {selectedRoom.bookingRef}
                  </span>
                </div>

                {/* 2-Column Horizontal Inner Layout to fit screen without scrolling */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 py-3 overflow-y-auto">
                  {/* Left Column: Charges Ledger & Itemized Extras */}
                  <div className="space-y-3 flex flex-col min-h-0">
                    <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                      <span className="text-slate text-[10px] font-bold uppercase tracking-wider block">Line Item Charges</span>
                      <div className="space-y-1.5 flex-1 max-h-48 overflow-y-auto pr-1 bg-cream/10 p-2.5 rounded-xl border border-border-cream/50">
                        {folioList.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs border-b border-border-cream/30 last:border-0 pb-1 last:pb-0">
                            <span className="text-charcoal font-medium truncate max-w-[200px]">{item.desc}</span>
                            <span className="font-mono text-navy font-semibold shrink-0">₹{item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Itemized Custom Extras Builder */}
                    <div className="space-y-1.5 p-2.5 bg-cream/10 border border-border-cream/50 rounded-xl shrink-0">
                      <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Add Extras Itemized</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="e.g. Water Bottle, Laundry"
                          value={newExtraDesc}
                          onChange={(e) => setNewExtraDesc(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                        />
                        <input 
                          type="number"
                          min="1"
                          placeholder="Price (₹)"
                          value={newExtraAmount}
                          onChange={(e) => setNewExtraAmount(e.target.value)}
                          className="w-20 px-3 py-1.5 bg-white border border-border-cream/80 rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomExtra}
                          className="px-3 py-1.5 bg-navy text-white hover:bg-navy/90 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
                        >
                          + Add
                        </button>
                      </div>

                      {customExtras.length > 0 && (
                        <div className="mt-1.5 p-2 bg-white/80 border border-border-cream/40 rounded-xl space-y-1 max-h-20 overflow-y-auto">
                          {customExtras.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-[10px] text-charcoal font-medium">
                              <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0"></span>
                                {item.desc}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-navy font-bold">₹{item.amount}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomExtra(item.id)}
                                  className="text-rose-500 hover:text-rose-700 p-0.5"
                                  title="Remove item"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Settle Form, Totals & Actions */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Total Extras (₹)</label>
                          <input 
                            type="text"
                            readOnly
                            disabled
                            value={extraChargesInput}
                            className="w-full px-3 py-1.5 bg-cream/20 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-bold text-charcoal font-mono cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Add Discount (₹)</label>
                          <input 
                            type="number"
                            min="0"
                            value={discountInput}
                            onChange={(e) => setDiscountInput(e.target.value)}
                            className="w-full px-3 py-1.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Payment Method</label>
                        <select 
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-1.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                        >
                          <option value="CASH">Cash</option>
                          <option value="CARD">Card</option>
                          <option value="UPI">UPI</option>
                          <option value="BANK_TRANSFER">Bank Transfer</option>
                          <option value="WALLET">Wallet</option>
                          <option value="CREDIT">Credit</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Notes</label>
                        <input 
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Damage remarks, laundry notes..."
                          className="w-full px-3 py-1.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-medium text-charcoal"
                        />
                      </div>
                    </div>

                    {/* Summary & Action Buttons */}
                    <div className="space-y-2.5 pt-2 border-t border-border-cream">
                      <div className="space-y-1 bg-cream/10 p-2.5 rounded-xl border border-border-cream/50 text-xs">
                        <div className="flex justify-between text-slate font-semibold text-[11px]">
                          <span>Subtotal:</span>
                          <span className="font-mono">₹{baseTotal.toLocaleString()}</span>
                        </div>
                        {extraVal > 0 && (
                          <div className="flex justify-between text-amber-600 font-semibold text-[11px]">
                            <span>Extras:</span>
                            <span className="font-mono">+₹{extraVal.toLocaleString()}</span>
                          </div>
                        )}
                        {discVal > 0 && (
                          <div className="flex justify-between text-rose-600 font-semibold text-[11px]">
                            <span>Discount:</span>
                            <span className="font-mono">-₹{discVal.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate font-semibold text-[11px]">
                          <span>Tax ({taxRate}% GST):</span>
                          <span className="font-mono">₹{taxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-navy pt-1.5 border-t border-dashed border-border-cream/50 text-sm">
                          <span>Grand Total:</span>
                          <span className="font-mono text-base text-navy font-bold">
                            ₹{grandTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={handleCheckoutSettle}
                          disabled={submitting}
                          className="flex-1 btn-primary py-2.5 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 font-bold"
                        >
                          {submitting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-gold" /> Completing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-3.5 h-3.5 text-gold" /> Settle &amp; Check-Out
                            </>
                          )}
                        </button>
                        <button 
                          type="button"
                          onClick={handleOpenDraftPrint}
                          className="btn-secondary px-3 py-2.5 text-xs flex items-center justify-center gap-1.5 shrink-0"
                          title="View &amp; Print Draft Folio"
                        >
                          <Receipt className="w-3.5 h-3.5 text-gold" /> Draft
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Settle completed success banner
              <div className="text-center py-8 space-y-4 animate-scaleUp">
                <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
                <div>
                  <h3 className="font-display font-bold text-lg text-navy">Checkout Completed</h3>
                  <p className="text-xs text-slate mt-1">Folio payment settled successfully.</p>
                  <p className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-200/50 py-2 rounded-xl mt-3">
                    Room {selectedRoom.room?.number} marked as **DIRTY** for housekeeping.
                  </p>
                </div>
                <div className="pt-2 space-y-2">
                  <button 
                    onClick={() => {
                      setPrintInvoiceData(completedCheckoutDetails);
                      setShowPrintModal(true);
                    }}
                    className="w-full btn-accent flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4 text-navy" /> Print Final Invoice
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedRoom(null);
                    }}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    Reset Departure View
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-16 space-y-4">
              <Receipt className="w-12 h-12 text-slate/50 mx-auto" />
              <p className="text-sm font-semibold text-slate">Select an occupied room on the left to load guest folio records and process checkout</p>
            </div>
          )}
        </div>
      </div>
      {/* ─── INVOICE PRINT PREVIEW MODAL (Compact Horizontal Wide Layout) ───────────────────────────────── */}
      {showPrintModal && printInvoiceData && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className={`bg-white rounded-3xl border border-border-cream p-4 md:p-5 w-full ${printFormat === 'pos' ? 'max-w-md' : 'max-w-3xl'} shadow-2xl relative max-h-[85vh] overflow-y-auto print:p-0 print:shadow-none print:border-none animate-fadeIn my-auto`}>
            {/* Dynamic Print CSS */}
            <style>{`
              @media print {
                /* Hide everything in the body by default */
                body * {
                  visibility: hidden !important;
                }
                /* Show ONLY the printable invoice area and its children */
                #printable-area, #printable-area * {
                  visibility: visible !important;
                }
                /* Reset the modal fixed layout, positioning, background, and borders */
                .fixed.inset-0.z-50, .fixed.inset-0.z-\\[100\\] {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  display: block !important;
                  background: transparent !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  overflow: visible !important;
                }
                .fixed.inset-0.z-50 > div, .fixed.inset-0.z-\\[100\\] > div {
                  position: relative !important;
                  width: 100% !important;
                  max-width: none !important;
                  height: auto !important;
                  max-height: none !important;
                  overflow: visible !important;
                  display: block !important;
                  background: white !important;
                  border: none !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                /* Size and pad the printable area */
                #printable-area {
                  width: ${printFormat === 'pos' ? '80mm' : '100%'} !important;
                  margin: 0 auto !important;
                  padding: 20px !important;
                  display: block !important;
                  box-sizing: border-box !important;
                  font-family: ${printFormat === 'pos' ? 'monospace' : 'inherit'} !important;
                }
                /* Allow page breaks and remove scrolling containers limitations during print */
                html, body, #root, #root * {
                  height: auto !important;
                  max-height: none !important;
                  overflow: visible !important;
                }
              }
            `}</style>

            {/* Close button - hidden on print */}
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 text-slate hover:text-navy transition-colors print:hidden p-1 rounded-xl hover:bg-cream/50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Format Selector Tab Bar - Hidden on print */}
            <div className="flex justify-center border-b border-border-cream pb-2.5 mb-3 print:hidden">
              <div className="flex bg-surface-linen/50 p-1 rounded-xl border border-border-cream">
                <button
                  type="button"
                  onClick={() => setPrintFormat('a4')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    printFormat === 'a4' ? 'bg-navy text-white shadow-sm' : 'text-slate hover:text-navy'
                  }`}
                >
                  Standard A4 Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('pos')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    printFormat === 'pos' ? 'bg-navy text-white shadow-sm' : 'text-slate hover:text-navy'
                  }`}
                >
                  3" POS Receipt
                </button>
              </div>
            </div>

            {/* Printable Invoice Area */}
            <div id="printable-area" className="text-left">
              {printFormat === 'a4' ? (
                /* ---------------- STANDARD A4 FORMAT (COMPACT HORIZONTAL 2-COLUMN) ---------------- */
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-border-cream pb-2.5">
                    <div>
                      <h2 className="font-display font-bold text-xl text-navy">HOTELORAA</h2>
                      <p className="text-[9px] text-gold font-bold uppercase tracking-wider mt-0.5">Luxury PMS &amp; POS Suite</p>
                    </div>
                    <div className="text-right text-[11px]">
                      <h3 className="font-bold text-navy text-xs uppercase">
                        {printInvoiceData.isDraft ? 'Draft Folio Invoice' : 'Settled Folio Receipt'}
                      </h3>
                      <p className="text-slate mt-0.5 font-mono">Invoice: INV-{printInvoiceData.bookingRef.split('-')[1] || printInvoiceData.bookingRef}</p>
                      <p className="text-slate font-mono">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Guest & Stay Info */}
                  <div className="grid grid-cols-2 gap-3 text-[11px] border-b border-border-cream pb-2.5">
                    <div>
                      <h4 className="font-bold text-navy uppercase tracking-wider mb-1 text-[10px]">Guest Details:</h4>
                      <p className="font-bold text-charcoal">{printInvoiceData.guestName}</p>
                      {printInvoiceData.guestPhone && <p className="text-slate mt-0.5">Phone: {printInvoiceData.guestPhone}</p>}
                      {printInvoiceData.guestEmail && <p className="text-slate mt-0.5">Email: {printInvoiceData.guestEmail}</p>}
                    </div>
                    <div className="text-right">
                      <h4 className="font-bold text-navy uppercase tracking-wider mb-1 text-[10px]">Stay Info:</h4>
                      <p className="font-bold text-charcoal">Room {printInvoiceData.roomNumber} ({printInvoiceData.roomType})</p>
                      <p className="text-slate mt-0.5">Check-In: {new Date(printInvoiceData.checkInDate).toLocaleDateString()}</p>
                      <p className="text-slate mt-0.5">Check-Out: {new Date(printInvoiceData.checkOutDate).toLocaleDateString()}</p>
                      <p className="text-slate mt-0.5">Nights: {printInvoiceData.totalNights} night(s)</p>
                    </div>
                  </div>

                  {/* Horizontal 2-Column: Items Table (Left) + Settlement & Totals (Right) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Items Table (Left Column) */}
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-navy text-[10px] uppercase tracking-wider">Charge Ledger Details</h4>
                      <div className="border border-border-cream rounded-xl overflow-hidden">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-cream/20 text-navy font-bold border-b border-border-cream">
                              <th className="p-2">Description</th>
                              <th className="p-2 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-cream/30">
                            {printInvoiceData.folioItems.map((item, index) => (
                              <tr key={index}>
                                <td className="p-2 text-slate font-medium">{item.desc}</td>
                                <td className="p-2 text-right font-mono font-bold text-charcoal">
                                  {item.amount < 0 ? `-₹${Math.abs(item.amount).toLocaleString()}` : `₹${item.amount.toLocaleString()}`}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Settlement & Financial Totals (Right Column) */}
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-navy text-[10px] uppercase tracking-wider">Settlement &amp; Summary</h4>
                      <div className="bg-cream/5 p-2.5 rounded-xl border border-border-cream/60 space-y-1 text-xs">
                        <div className="flex justify-between text-[11px] text-slate font-semibold">
                          <span>Payment Status:</span>
                          <span className={`font-bold ${printInvoiceData.isDraft ? 'text-amber-600' : 'text-success'}`}>
                            {printInvoiceData.isDraft ? 'UNSETTLED (DRAFT)' : 'PAID (SETTLED)'}
                          </span>
                        </div>
                        {!printInvoiceData.isDraft && (
                          <div className="flex justify-between text-[11px] text-slate font-semibold">
                            <span>Payment Method:</span>
                            <span className="font-bold text-navy">{printInvoiceData.paymentMethod}</span>
                          </div>
                        )}
                        {printInvoiceData.notes && (
                          <div className="text-[10px] text-slate/70 pt-1 border-t border-border-cream/40">
                            <span className="font-bold block">Remarks:</span>
                            <span className="italic">"{printInvoiceData.notes}"</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-border-cream/80 space-y-1 text-xs">
                        <div className="flex justify-between text-slate font-medium text-[11px]">
                          <span>Subtotal:</span>
                          <span className="font-mono">₹{printInvoiceData.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate font-medium text-[11px]">
                          <span>Tax ({taxRate}% GST):</span>
                          <span className="font-mono">₹{printInvoiceData.taxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-navy pt-1.5 border-t border-dashed border-border-cream/50">
                          <span>Total Amount:</span>
                          <span className="font-mono text-sm font-bold">₹{printInvoiceData.grandTotal.toLocaleString()}</span>
                        </div>
                        {!printInvoiceData.isDraft && (
                          <>
                            <div className="flex justify-between text-success font-medium text-[11px]">
                              <span>Amount Paid:</span>
                              <span className="font-mono">₹{printInvoiceData.grandTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-bold text-slate pt-1 border-t border-border-cream/20">
                              <span>Balance Due:</span>
                              <span className="font-mono text-navy font-bold">₹0</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer notice */}
                  <div className="text-center text-[9px] text-slate/50 pt-3 border-t border-border-cream/30">
                    Thank you for staying at our property. Have a safe journey!
                  </div>
                </div>
              ) : (
                /* ---------------- 3" POS THERMAL SLIP ---------------- */
                <div className="font-mono text-xs text-charcoal space-y-4 max-w-[320px] mx-auto p-4 border border-dashed border-slate-300 rounded-xl bg-stone-50/50 print:bg-white print:border-0 print:p-0">
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-lg text-navy tracking-wider">HOTELORAA</h3>
                    <p className="text-[9px] uppercase text-slate font-bold">Checkout Receipt</p>
                    <p className="text-[10px] border-b border-dashed border-slate-300 py-1">--------------------------------</p>
                  </div>

                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between">
                      <span>Invoice No:</span>
                      <span className="font-bold">INV-{printInvoiceData.bookingRef.split('-')[1] || printInvoiceData.bookingRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date/Time:</span>
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Guest:</span>
                      <span className="font-bold truncate max-w-[150px]">{printInvoiceData.guestName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Room:</span>
                      <span>Room {printInvoiceData.roomNumber} ({printInvoiceData.roomType})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stay:</span>
                      <span>{new Date(printInvoiceData.checkInDate).toLocaleDateString()} - {new Date(printInvoiceData.checkOutDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nights:</span>
                      <span>{printInvoiceData.totalNights} night(s)</span>
                    </div>
                    <p className="text-[10px] border-b border-dashed border-slate-300 py-1">--------------------------------</p>
                  </div>

                  {/* POS Items List */}
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between font-bold border-b border-dashed border-slate-200 pb-1 mb-1">
                      <span>Description</span>
                      <span>Amount</span>
                    </div>
                    {printInvoiceData.folioItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate max-w-[180px]">{item.desc}</span>
                        <span className="font-bold">
                          {item.amount < 0 ? `-₹${Math.abs(item.amount).toLocaleString()}` : `₹${item.amount.toLocaleString()}`}
                        </span>
                      </div>
                    ))}
                    <p className="text-[10px] border-b border-dashed border-slate-300 py-1">--------------------------------</p>
                  </div>

                  {/* POS Calculation block */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{printInvoiceData.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({taxRate}% GST):</span>
                      <span>₹{printInvoiceData.taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-navy text-xs border-t border-dashed border-slate-300 pt-1.5">
                      <span>GRAND TOTAL:</span>
                      <span>₹{printInvoiceData.grandTotal.toLocaleString()}</span>
                    </div>
                    {!printInvoiceData.isDraft ? (
                      <>
                        <div className="flex justify-between font-bold text-success">
                          <span>TOTAL PAID:</span>
                          <span>₹{printInvoiceData.grandTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-navy border-t border-double border-slate-300 pt-1">
                          <span>BALANCE DUE:</span>
                          <span>₹0</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center font-bold text-amber-600 border border-dashed border-amber-300 bg-amber-50/50 py-1 rounded mt-1.5 uppercase text-[10px]">
                        UNSETTLED (DRAFT)
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] border-b border-dashed border-slate-300 py-1">--------------------------------</p>

                  {/* Settlement details */}
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between text-slate font-semibold">
                      <span>Status:</span>
                      <span className={`font-bold ${printInvoiceData.isDraft ? 'text-amber-600' : 'text-success'}`}>
                        {printInvoiceData.isDraft ? 'UNSETTLED' : 'PAID'}
                      </span>
                    </div>
                    {!printInvoiceData.isDraft && (
                      <div className="flex justify-between text-slate font-semibold">
                        <span>Method:</span>
                        <span className="font-bold text-navy">{printInvoiceData.paymentMethod}</span>
                      </div>
                    )}
                    {printInvoiceData.notes && (
                      <div className="pt-1.5 text-[9px] text-slate/70">
                        <span className="font-bold block">Remarks:</span>
                        <span className="italic">"{printInvoiceData.notes}"</span>
                      </div>
                    )}
                    <p className="text-[10px] border-b border-dashed border-slate-300 py-1">--------------------------------</p>
                  </div>

                  <div className="text-center text-[10px] space-y-1 pt-1">
                    <p className="font-bold uppercase tracking-wider">Thank You!</p>
                    <p className="text-[9px] text-slate">Safe Journey!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Print/Dismiss buttons - hidden on print */}
            <div className="flex gap-2.5 mt-4 pt-3 border-t border-border-cream print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 btn-primary flex items-center justify-center gap-2 text-xs py-2"
              >
                <Receipt className="w-4 h-4 text-gold" /> Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="w-1/2 btn-secondary flex items-center justify-center gap-2 text-xs py-2"
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

export default CheckOut;

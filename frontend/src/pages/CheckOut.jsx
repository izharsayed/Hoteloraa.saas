import React, { useState, useEffect } from 'react';
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

  // Print Invoice Modal State
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
    setDiscountInput('0');
    setPaymentMethod('CASH');
    setNotes('');
  };

  const buildFolio = (room) => {
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

    // 3. Existing Discount
    if (room.discount > 0) {
      items.push({
        desc: 'Discount Applied',
        amount: -room.discount
      });
    }

    // 4. Restaurant Dine-In Orders
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
          ...(extraVal > 0 ? [{ desc: 'Additional Extras Added', amount: extraVal }] : []),
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
        ...(extraVal > 0 ? [{ desc: 'Additional Extras Added', amount: extraVal }] : []),
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
  const folioList = buildFolio(selectedRoom);
  const baseTotal = folioList.reduce((acc, curr) => acc + curr.amount, 0);
  const extraVal = parseFloat(extraChargesInput) || 0;
  const discVal = parseFloat(discountInput) || 0;
  const subtotal = baseTotal + extraVal - discVal;
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const grandTotal = Math.max(0, subtotal + taxAmount);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Folio & Check-Out</h1>
          <p className="text-slate text-sm font-medium mt-1">Review guest ledgers, settle room folios, and complete checkout departure</p>
        </div>
        <button 
          onClick={fetchPendingCheckOuts}
          className="flex items-center gap-2 text-xs font-bold text-navy bg-white border border-border-cream px-4 py-2 rounded-xl hover:bg-cream/10 active:scale-95 transition-all shadow-sm self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh departures
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Occupied Rooms directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="soft-card p-6 bg-white">
            <h3 className="font-display font-semibold text-lg text-navy mb-4">Occupied Rooms</h3>
            
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {occupiedRooms.map((res) => (
                  <div 
                    key={res.id} 
                    onClick={() => handleSelectRoom(res)}
                    className={`
                      cursor-pointer p-5 border rounded-2xl flex items-center justify-between transition-all duration-300
                      ${selectedRoom?.id === res.id 
                        ? 'border-gold bg-gold-pale/50 shadow-md ring-1 ring-gold' 
                        : 'border-border-cream hover:border-gold bg-white hover:bg-gold-pale/10'
                      }
                    `}
                  >
                    <div>
                      <span className="text-[10px] text-slate font-bold uppercase tracking-wider">Room {res.room?.number}</span>
                      <h4 className="font-display font-bold text-base text-navy mt-0.5">{res.guest?.name}</h4>
                      <p className="text-[10px] text-slate mt-1">Checked in: {new Date(res.checkInDate).toLocaleDateString()} ({res.totalNights} night(s))</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate" />
                  </div>
                ))}
                {occupiedRooms.length === 0 && (
                  <div className="col-span-2 py-8 text-center text-slate text-sm">
                    No currently occupied rooms found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Guest Folio Checkout Summary */}
        <div className="soft-card p-6 bg-white h-fit">
          {selectedRoom ? (
            !checkoutComplete ? (
              <div className="space-y-6">
                <div className="border-b border-border-cream pb-4">
                  <span className="text-[10px] text-slate font-bold uppercase tracking-wider">GUEST FOLIO LEDGER</span>
                  <h3 className="font-display font-bold text-lg text-navy mt-0.5">Room {selectedRoom.room?.number}</h3>
                  <p className="text-xs text-slate mt-0.5">Guest: {selectedRoom.guest?.name}</p>
                </div>

                {/* Folio item list */}
                <div className="space-y-3">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider block">Line Item Charges</span>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {folioList.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-border-cream/30 pb-2">
                        <span className="text-charcoal font-medium">{item.desc}</span>
                        <span className="font-mono text-navy font-semibold">₹{item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settle Form Inputs */}
                <div className="space-y-4 pt-4 border-t border-border-cream">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Add Extras (₹)</label>
                      <input 
                        type="number"
                        min="0"
                        value={extraChargesInput}
                        onChange={(e) => setExtraChargesInput(e.target.value)}
                        className="w-full px-3 py-2 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Add Discount (₹)</label>
                      <input 
                        type="number"
                        min="0"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        className="w-full px-3 py-2 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Payment Method</label>
                    <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
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
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Damage remarks, laundry notes, etc."
                      rows={2}
                      className="w-full px-3 py-2 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-medium text-charcoal resize-none"
                    />
                  </div>
                </div>

                {/* Totals split */}
                <div className="space-y-2 border-t border-border-cream pt-4">
                  <div className="flex justify-between text-xs text-slate font-semibold">
                    <span>Base Charges Subtotal:</span>
                    <span className="font-mono">₹{baseTotal.toLocaleString()}</span>
                  </div>
                  {extraVal > 0 && (
                    <div className="flex justify-between text-xs text-amber-600 font-semibold">
                      <span>Additional Extras:</span>
                      <span className="font-mono">₹{extraVal.toLocaleString()}</span>
                    </div>
                  )}
                  {discVal > 0 && (
                    <div className="flex justify-between text-xs text-rose-600 font-semibold">
                      <span>Additional Discount:</span>
                      <span className="font-mono">-₹{discVal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-slate font-semibold">
                    <span>Tax ({taxRate}% GST):</span>
                    <span className="font-mono">₹{taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-navy pt-2 border-t border-dashed border-border-cream/50">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-navy font-bold">
                      ₹{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Settle / Checkout trigger */}
                <div className="pt-2 space-y-2">
                  <button 
                    onClick={handleCheckoutSettle}
                    disabled={submitting}
                    className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-gold" /> Completing Checkout...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 text-gold" /> Settle Payment & Check-Out
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={handleOpenDraftPrint}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4 text-gold" /> View & Print Draft Folio
                  </button>
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
      {/* ─── INVOICE PRINT PREVIEW MODAL ───────────────────────────────── */}
      {showPrintModal && printInvoiceData && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 print:p-0">
          <div className={`bg-white rounded-[2rem] border border-border-cream p-6 md:p-8 w-full ${printFormat === 'pos' ? 'max-w-md' : 'max-w-2xl'} shadow-2xl relative max-h-[90vh] overflow-y-auto print:p-0 print:shadow-none print:border-none animate-fadeIn`}>
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
                .fixed.inset-0.z-50 {
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
                .fixed.inset-0.z-50 > div {
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
            `}</style>            {/* Close button - hidden on print */}
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-6 right-6 text-slate hover:text-navy transition-colors print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Format Selector Tab Bar - Hidden on print */}
            <div className="flex justify-center border-b border-border-cream pb-4 mb-6 print:hidden">
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

            {/* Printable Invoice Area */}
            <div id="printable-area" className="text-left">
              {printFormat === 'a4' ? (
                /* ---------------- STANDARD A4 FORMAT ---------------- */
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-border-cream pb-4">
                    <div>
                      <h2 className="font-display font-bold text-2xl text-navy">HOTELORAA</h2>
                      <p className="text-[10px] text-gold font-bold uppercase tracking-wider mt-1">Luxury PMS & POS Suite</p>
                    </div>
                    <div className="text-right text-xs">
                      <h3 className="font-bold text-navy text-sm uppercase">
                        {printInvoiceData.isDraft ? 'Draft Folio Invoice' : 'Settled Folio Receipt'}
                      </h3>
                      <p className="text-slate mt-1 font-mono">Invoice: INV-{printInvoiceData.bookingRef.split('-')[1] || printInvoiceData.bookingRef}</p>
                      <p className="text-slate font-mono">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Guest & Stay Info */}
                  <div className="grid grid-cols-2 gap-4 text-xs border-b border-border-cream pb-4">
                    <div>
                      <h4 className="font-bold text-navy uppercase tracking-wider mb-2">Guest Details:</h4>
                      <p className="font-bold text-charcoal">{printInvoiceData.guestName}</p>
                      {printInvoiceData.guestPhone && <p className="text-slate mt-0.5">Phone: {printInvoiceData.guestPhone}</p>}
                      {printInvoiceData.guestEmail && <p className="text-slate mt-0.5">Email: {printInvoiceData.guestEmail}</p>}
                    </div>
                    <div className="text-right">
                      <h4 className="font-bold text-navy uppercase tracking-wider mb-2">Stay Info:</h4>
                      <p className="font-bold text-charcoal">Room {printInvoiceData.roomNumber} ({printInvoiceData.roomType})</p>
                      <p className="text-slate mt-0.5">Check-In: {new Date(printInvoiceData.checkInDate).toLocaleDateString()}</p>
                      <p className="text-slate mt-0.5">Check-Out: {new Date(printInvoiceData.checkOutDate).toLocaleDateString()}</p>
                      <p className="text-slate mt-0.5">Nights: {printInvoiceData.totalNights} night(s)</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-navy text-xs uppercase tracking-wider">Charge Ledger Details</h4>
                    <div className="border border-border-cream rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-cream/20 text-navy font-bold border-b border-border-cream">
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-cream/30">
                          {printInvoiceData.folioItems.map((item, index) => (
                            <tr key={index}>
                              <td className="p-3 text-slate font-medium">{item.desc}</td>
                              <td className="p-3 text-right font-mono font-bold text-charcoal">
                                {item.amount < 0 ? `-₹${Math.abs(item.amount).toLocaleString()}` : `₹${item.amount.toLocaleString()}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total calculations */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-xs space-y-2">
                      <h4 className="font-bold text-navy uppercase tracking-wider">Settlement & Notes</h4>
                      <div className="bg-cream/5 p-3 rounded-xl border border-border-cream/40 space-y-1.5">
                        <div className="flex justify-between text-slate font-semibold">
                          <span>Payment Status:</span>
                          <span className={`font-bold ${printInvoiceData.isDraft ? 'text-amber-600' : 'text-success'}`}>
                            {printInvoiceData.isDraft ? 'UNSETTLED (DRAFT)' : 'PAID (SETTLED)'}
                          </span>
                        </div>
                        {!printInvoiceData.isDraft && (
                          <div className="flex justify-between text-slate font-semibold">
                            <span>Payment Method:</span>
                            <span className="font-bold text-navy">{printInvoiceData.paymentMethod}</span>
                          </div>
                        )}
                        {printInvoiceData.notes && (
                          <div className="text-[10px] text-slate/70 pt-1.5 border-t border-border-cream/40">
                            <span className="font-bold block">Remarks:</span>
                            <span className="italic">"{printInvoiceData.notes}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs space-y-2">
                      <div className="flex justify-between text-slate font-medium">
                        <span>Subtotal:</span>
                        <span className="font-mono">₹{printInvoiceData.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate font-medium">
                        <span>Tax ({taxRate}% GST):</span>
                        <span className="font-mono">₹{printInvoiceData.taxAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-navy pt-2 border-t border-dashed border-border-cream/50">
                        <span>Total Amount:</span>
                        <span className="font-mono text-base font-bold">₹{printInvoiceData.grandTotal.toLocaleString()}</span>
                      </div>
                      {!printInvoiceData.isDraft && (
                        <>
                          <div className="flex justify-between text-success font-medium">
                            <span>Amount Paid:</span>
                            <span className="font-mono">₹{printInvoiceData.grandTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold text-slate pt-1.5 border-t border-border-cream/20">
                            <span>Balance Due:</span>
                            <span className="font-mono text-navy font-bold">₹0</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Footer notice */}
                  <div className="text-center text-[10px] text-slate/50 pt-8 border-t border-border-cream/30">
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
            <div className="flex gap-3 mt-8 pt-4 border-t border-border-cream print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 btn-primary flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4 text-gold" /> Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="w-1/2 btn-secondary flex items-center justify-center gap-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckOut;

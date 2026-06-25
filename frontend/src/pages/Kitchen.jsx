import React, { useState, useEffect, useMemo } from 'react';
import { ChefHat, Clock, Check, Utensils, CheckSquare, Square, X } from 'lucide-react';
import api from '../utils/api.js';

function Kitchen() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Force update elapsed timers every 10 seconds and poll KOT tickets
  const loadTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/kot');
      const activeKots = (response || []).filter(kot => 
        kot.status !== 'CANCELLED' && 
        kot.order?.status !== 'SERVED' && 
        kot.order?.status !== 'COMPLETED'
      );
      
      const mapped = activeKots.map(kot => {
        const orderType = kot.order?.table ? 'Dine-In' : 'Takeaway';
        return {
          id: kot.id,
          kotNumber: kot.kotNumber,
          orderId: kot.order?.id,
          table: kot.order?.table?.name || 'Quick POS',
          captain: kot.user?.name || 'POS System',
          orderType,
          status: kot.status === 'PENDING' ? 'Pending' : kot.status === 'IN_PROGRESS' ? 'InProgress' : 'Ready',
          createdAt: new Date(kot.createdAt),
          items: (kot.items || []).map(item => ({
            name: item.orderItem?.menuItem?.name || 'Unknown Item',
            qty: item.quantity,
            checked: kot.status === 'READY',
            notes: item.notes
          }))
        };
      });
      setTickets(mapped);
    } catch (err) {
      console.error('Failed to load tickets', err);
      setError(err.message || 'Failed to load tickets');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    const timer = setInterval(() => {
      loadTickets(true);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const [activeTicket, setActiveTicket] = useState(null);

  const getElapsedTime = (createdAt) => {
    if (!createdAt || isNaN(createdAt.getTime())) return 0;
    const diffMs = Date.now() - createdAt.getTime();
    return Math.floor(diffMs / 60000);
  };

  const isDelayed = (ticket) => {
    const elapsed = getElapsedTime(ticket.createdAt);
    if (ticket.status === 'Pending' && elapsed >= 10) return true;
    if (ticket.status === 'InProgress' && elapsed >= 15) return true;
    return false;
  };

  const handleStartPrep = async (id) => {
    try {
      setError('');
      await api.patch(`/kot/${id}/status`, { status: 'IN_PROGRESS' });
      await loadTickets(true);
    } catch (err) {
      setError(err.message || 'Failed to start preparation');
    }
  };

  const handleMarkReady = async (id) => {
    try {
      setError('');
      await api.patch(`/kot/${id}/status`, { status: 'READY' });
      await loadTickets(true);
    } catch (err) {
      setError(err.message || 'Failed to mark KOT ready');
    }
  };

  const handleMarkServed = async (id, orderId) => {
    try {
      setError('');
      if (orderId) {
        await api.patch(`/orders/${orderId}/status`, { status: 'SERVED' });
      }
      await loadTickets(true);
    } catch (err) {
      setError(err.message || 'Failed to mark served');
    }
  };

  const toggleItemCheck = (ticketId, itemIdx) => {
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        const updatedItems = t.items.map((item, idx) => 
          idx === itemIdx ? { ...item, checked: !item.checked } : item
        );
        return { ...t, items: updatedItems };
      }
      return t;
    });
    setTickets(updated);
    if (activeTicket && activeTicket.id === ticketId) {
      setActiveTicket(updated.find(t => t.id === ticketId));
    }
  };

  // Split tickets by status columns
  const pendingTickets = tickets.filter(t => t.status === 'Pending');
  const inProgressTickets = tickets.filter(t => t.status === 'InProgress');
  const readyTickets = tickets.filter(t => t.status === 'Ready');

  // Compute aggregated items for kitchen staff summary
  const aggregatedItems = useMemo(() => {
    const summary = {};
    const activeTickets = tickets.filter(t => t.status === 'Pending' || t.status === 'InProgress');
    
    activeTickets.forEach(ticket => {
      ticket.items.forEach(item => {
        // Exclude items that are already checked off
        if (!item.checked) {
          if (!summary[item.name]) summary[item.name] = 0;
          summary[item.name] += item.qty;
        }
      });
    });

    return Object.entries(summary)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
  }, [tickets]);

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden animate-fadeIn select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">KOT Live Kitchen Monitor</h1>
          <p className="text-slate text-sm font-medium mt-1">
            Active kitchen order tickets. Orders flagged red are delayed and need priority.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-navy text-gold rounded-xl font-mono text-sm font-semibold border border-gold/20 shadow-sm">
          <ChefHat className="w-5 h-5" />
          <span>Active Tickets: {tickets.length}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-6 overflow-hidden">
        
        {/* KOT Columns */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto pr-2">
        
        {/* Pending Column */}
        <div className="bg-[#FEF9F1] border border-border-cream/80 rounded-2xl flex flex-col h-full min-h-[300px]">
          <div className="p-4 border-b border-border-cream/80 bg-white/50 rounded-t-2xl flex justify-between items-center border-t-4 border-warning">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Pending Orders</h3>
            <span className="font-mono text-xs px-2 py-0.5 bg-warning-pale text-warning border border-warning/20 font-bold rounded-lg">
              {pendingTickets.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {pendingTickets.map((ticket) => {
              const elapsed = getElapsedTime(ticket.createdAt);
              const delayed = isDelayed(ticket);
              return (
                <div 
                  key={ticket.id} 
                  onClick={() => setActiveTicket(ticket)}
                  className={`
                    cursor-pointer p-5 border rounded-2xl transition-all duration-300 relative bg-white group
                    ${delayed 
                      ? 'border-danger bg-danger-pale/40 hover:shadow-lg shadow-danger/5 border-t-4' 
                      : 'border-border-cream hover:border-gold hover:shadow-md'
                    }
                  `}
                >
                  {/* Delayed pulsing badge */}
                  {delayed && (
                    <span className="absolute top-4 right-4 bg-danger text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg animate-pulse">
                      Delayed ({elapsed}m)
                    </span>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-mono font-bold text-sm text-navy">{ticket.kotNumber}</h4>
                      <p className="text-[10px] text-slate font-semibold uppercase mt-0.5">{ticket.orderType}</p>
                    </div>
                    {!delayed && (
                      <span className="text-[10px] text-slate font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate" /> {elapsed}m
                      </span>
                    )}
                  </div>

                  <div className="border-b border-border-cream/40 pb-3 mb-4">
                    <span className={`
                      text-xs font-bold px-2.5 py-0.5 rounded-md
                      ${ticket.orderType === 'Swiggy' && 'bg-[#FC8019]/10 text-[#FC8019] border border-[#FC8019]/20'}
                      ${ticket.orderType === 'Zomato' && 'bg-[#CB202D]/10 text-[#CB202D] border border-[#CB202D]/20'}
                      ${ticket.orderType === 'Dine-In' && 'bg-cream text-charcoal border border-border-cream'}
                    `}>
                      {ticket.table}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-charcoal mb-5">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.name}</span>
                        <span className="font-semibold font-mono text-slate">x{item.qty}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartPrep(ticket.id);
                    }}
                    className="w-full py-2 bg-navy text-gold text-xs font-bold rounded-xl hover:bg-navy/95 active:scale-98 transition-all"
                  >
                    Start Preparation
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="bg-[#FEF9F1] border border-border-cream/80 rounded-2xl flex flex-col h-full min-h-[300px]">
          <div className="p-4 border-b border-border-cream/80 bg-white/50 rounded-t-2xl flex justify-between items-center border-t-4 border-navy">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">In Preparation</h3>
            <span className="font-mono text-xs px-2 py-0.5 bg-gold-pale text-navy border border-gold/30 font-bold rounded-lg">
              {inProgressTickets.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {inProgressTickets.map((ticket) => {
              const elapsed = getElapsedTime(ticket.createdAt);
              const delayed = isDelayed(ticket);
              return (
                <div 
                  key={ticket.id} 
                  onClick={() => setActiveTicket(ticket)}
                  className={`
                    cursor-pointer p-5 border rounded-2xl transition-all duration-300 relative bg-white group
                    ${delayed 
                      ? 'border-danger bg-danger-pale/40 hover:shadow-lg shadow-danger/5 border-t-4' 
                      : 'border-border-cream hover:border-gold hover:shadow-md'
                    }
                  `}
                >
                  {/* Delayed pulsing badge */}
                  {delayed && (
                    <span className="absolute top-4 right-4 bg-danger text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg animate-pulse">
                      Delayed ({elapsed}m)
                    </span>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-mono font-bold text-sm text-navy">{ticket.kotNumber}</h4>
                      <p className="text-[10px] text-slate font-semibold uppercase mt-0.5">{ticket.orderType}</p>
                    </div>
                    {!delayed && (
                      <span className="text-[10px] text-slate font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate" /> {elapsed}m
                      </span>
                    )}
                  </div>

                  <div className="border-b border-border-cream/40 pb-3 mb-4 flex justify-between items-center">
                    <span className={`
                      text-xs font-bold px-2.5 py-0.5 rounded-md
                      ${ticket.orderType === 'Swiggy' && 'bg-[#FC8019]/10 text-[#FC8019] border border-[#FC8019]/20'}
                      ${ticket.orderType === 'Zomato' && 'bg-[#CB202D]/10 text-[#CB202D] border border-[#CB202D]/20'}
                      ${ticket.orderType === 'Dine-In' && 'bg-cream text-charcoal border border-border-cream'}
                    `}>
                      {ticket.table}
                    </span>
                    <span className="text-[10px] text-slate font-medium">
                      {ticket.items.filter(i => i.checked).length}/{ticket.items.length} Checked
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-charcoal mb-5">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className={`flex justify-between ${item.checked ? 'line-through text-slate' : ''}`}>
                        <span className="flex items-center gap-1.5">
                          {item.checked ? <Check className="w-3.5 h-3.5 text-success" /> : <div className="w-3.5 h-3.5" />}
                          {item.name}
                        </span>
                        <span className="font-semibold font-mono text-slate">x{item.qty}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkReady(ticket.id);
                    }}
                    className="w-full py-2 bg-gold hover:bg-gold-light text-navy text-xs font-bold rounded-xl active:scale-98 transition-all"
                  >
                    Mark Ready
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ready / Served Column */}
        <div className="bg-[#FEF9F1] border border-border-cream/80 rounded-2xl flex flex-col h-full min-h-[300px]">
          <div className="p-4 border-b border-border-cream/80 bg-white/50 rounded-t-2xl flex justify-between items-center border-t-4 border-success">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Ready for Service</h3>
            <span className="font-mono text-xs px-2 py-0.5 bg-success-pale text-success border border-success/20 font-bold rounded-lg">
              {readyTickets.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {readyTickets.map((ticket) => {
              const elapsed = getElapsedTime(ticket.createdAt);
              return (
                <div 
                  key={ticket.id} 
                  onClick={() => setActiveTicket(ticket)}
                  className="cursor-pointer p-5 border border-success bg-success-pale/35 hover:shadow-md rounded-2xl transition-all duration-300 relative bg-white group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-mono font-bold text-sm text-navy">{ticket.kotNumber}</h4>
                      <p className="text-[10px] text-slate font-semibold uppercase mt-0.5">{ticket.orderType}</p>
                    </div>
                    <span className="text-[10px] text-slate font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate" /> Done
                    </span>
                  </div>

                  <div className="border-b border-border-cream/40 pb-3 mb-4">
                    <span className={`
                      text-xs font-bold px-2.5 py-0.5 rounded-md
                      ${ticket.orderType === 'Swiggy' && 'bg-[#FC8019]/10 text-[#FC8019] border border-[#FC8019]/20'}
                      ${ticket.orderType === 'Zomato' && 'bg-[#CB202D]/10 text-[#CB202D] border border-[#CB202D]/20'}
                      ${ticket.orderType === 'Dine-In' && 'bg-cream text-charcoal border border-border-cream'}
                    `}>
                      {ticket.table}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate line-through mb-5">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-success" />
                          {item.name}
                        </span>
                        <span className="font-semibold font-mono">x{item.qty}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkServed(ticket.id, ticket.orderId);
                    }}
                    className="w-full py-2 bg-success text-white text-xs font-bold rounded-xl hover:bg-success/90 active:scale-98 transition-all"
                  >
                    Mark Served
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        </div>

        {/* Aggregated Items Side Panel */}
        <div className="w-full xl:w-80 bg-[#FEF9F1] border border-border-cream/80 rounded-2xl flex flex-col h-full min-h-[300px] shrink-0">
          <div className="p-4 border-b border-border-cream/80 bg-white/50 rounded-t-2xl flex justify-between items-center border-t-4 border-navy">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Aggregated Dishes</h3>
            <span className="font-mono text-xs px-2 py-0.5 bg-navy text-gold font-bold rounded-lg border border-gold/20">
              {aggregatedItems.reduce((acc, curr) => acc + curr.qty, 0)} Total
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {aggregatedItems.length === 0 ? (
              <div className="text-center text-slate text-xs py-8">
                No active items needed.
              </div>
            ) : (
              aggregatedItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border border-border-cream rounded-xl bg-white hover:border-gold transition-colors">
                  <span className="text-sm font-semibold text-navy">{item.name}</span>
                  <span className="font-mono font-bold text-navy bg-gold-pale px-2.5 py-1 rounded-lg">
                    x{item.qty}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Ticket Item Details Check-off Modal */}
      {activeTicket && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-border-cream rounded-[2rem] w-full max-w-md p-8 shadow-xl relative">
            <button 
              onClick={() => setActiveTicket(null)}
              className="absolute top-6 right-6 text-slate hover:text-navy transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="border-b border-border-cream pb-4 mb-6">
              <span className="text-[10px] text-slate font-bold uppercase tracking-wider">KOT DETAILS MONITOR</span>
              <h3 className="font-mono font-bold text-xl text-navy mt-1">{activeTicket.kotNumber}</h3>
              <p className="text-xs text-slate mt-1">Captain: {activeTicket.captain} | Order: {activeTicket.orderType}</p>
            </div>

            <div className="space-y-4 mb-8">
              <span className="text-slate text-[10px] font-bold uppercase tracking-wider block">Interactive Item checklist</span>
              <div className="space-y-2">
                {activeTicket.items.map((item, idx) => (
                  <div 
                    key={idx}
                    onClick={() => toggleItemCheck(activeTicket.id, idx)}
                    className={`
                      cursor-pointer p-4 border rounded-xl flex items-center justify-between transition-all select-none
                      ${item.checked 
                        ? 'border-success bg-success-pale/30 text-slate line-through' 
                        : 'border-border-cream bg-cream/10 text-charcoal hover:border-gold'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {item.checked ? (
                        <CheckSquare className="w-5 h-5 text-success" />
                      ) : (
                        <Square className="w-5 h-5 text-slate" />
                      )}
                      <span className="text-xs font-semibold">{item.name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate">Qty: {item.qty}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              {activeTicket.status === 'Pending' && (
                <button 
                  onClick={() => {
                    handleStartPrep(activeTicket.id);
                    setActiveTicket(null);
                  }}
                  className="w-full btn-primary"
                >
                  Start Preparing
                </button>
              )}
              {activeTicket.status === 'InProgress' && (
                <button 
                  onClick={() => {
                    handleMarkReady(activeTicket.id);
                    setActiveTicket(null);
                  }}
                  className="w-full btn-accent"
                >
                  Mark Ready
                </button>
              )}
              {activeTicket.status === 'Ready' && (
                <button 
                  onClick={() => {
                    handleMarkServed(activeTicket.id, activeTicket.orderId);
                    setActiveTicket(null);
                  }}
                  className="w-full btn-primary bg-success hover:bg-success/90"
                >
                  Mark Served
                </button>
              )}
              <button 
                onClick={() => setActiveTicket(null)}
                className="w-1/3 btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Kitchen;

import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, Search, RefreshCw, Eye, MessageSquare, AlertTriangle, 
  CheckCircle, Clock, ChevronDown, ChevronUp, User, Building, Trash2 
} from 'lucide-react';
import api, { assetUrl } from '../utils/api.js';

function SuperAdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/superadmin/tickets');
      setTickets(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      setUpdatingId(ticketId);
      await api.patch(`/superadmin/tickets/${ticketId}`, { status: newStatus });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert(err.message || 'Failed to update ticket status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdatePriority = async (ticketId, newPriority) => {
    try {
      setUpdatingId(ticketId);
      await api.patch(`/superadmin/tickets/${ticketId}`, { priority: newPriority });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, priority: newPriority } : t));
    } catch (err) {
      alert(err.message || 'Failed to update ticket priority');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedTicketId(prev => prev === id ? null : id);
  };

  // Filter and search
  const filteredTickets = tickets.filter(t => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      (t.title || '').toLowerCase().includes(query) ||
      (t.description || '').toLowerCase().includes(query) ||
      (t.tenant?.name || '').toLowerCase().includes(query) ||
      (t.user?.name || '').toLowerCase().includes(query) ||
      (t.user?.email || '').toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'URGENT': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LOW': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-red-50 text-red-700 border-red-200';
      case 'IN_PROGRESS': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'RESOLVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CLOSED': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'BUG': return 'Bug / Error';
      case 'QUESTION': return 'Question';
      case 'FEATURE_REQUEST': return 'Feature Request';
      case 'BILLING': return 'Billing / Sub';
      default: return cat;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy flex items-center gap-2">
            <LifeBuoy className="w-8 h-8 text-gold" /> Support Tickets
          </h1>
          <p className="text-slate text-sm font-medium mt-1">
            Resolve tenant-reported errors, billing questions, and feature requests
          </p>
        </div>
        <button 
          onClick={fetchTickets} 
          disabled={loading}
          className="p-2.5 rounded-xl border border-border-cream text-slate hover:text-navy hover:bg-cream/20 transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-danger-pale border border-danger/10 text-danger rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-[1.5rem] border border-border-cream">
        {/* Status filter tabs */}
        <div className="flex rounded-xl border border-border-cream overflow-hidden text-[10px] font-bold">
          {[['ALL', 'All'], ['OPEN', 'Open'], ['IN_PROGRESS', 'In Progress'], ['RESOLVED', 'Resolved'], ['CLOSED', 'Closed']].map(([val, label]) => (
            <button 
              key={val} 
              onClick={() => setStatusFilter(val)}
              className={`px-4 py-2 transition-all ${statusFilter === val ? 'bg-navy text-white' : 'bg-white text-slate hover:bg-cream/40'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate" />
          <input 
            type="text" 
            placeholder="Search tickets, tenants..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs bg-cream/20 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="soft-card bg-white p-6">
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate text-xs font-semibold animate-pulse">
            Loading tickets ledger...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-20 text-slate text-xs font-semibold">
            No support tickets match the selected filters.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map(ticket => {
              const isExpanded = expandedTicketId === ticket.id;
              const formattedDate = new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={ticket.id} 
                  className={`border rounded-2xl transition-all ${
                    isExpanded ? 'border-gold bg-gold-pale/5' : 'border-border-cream bg-white hover:bg-cream/10'
                  }`}
                >
                  {/* Summary Row */}
                  <div 
                    onClick={() => toggleExpand(ticket.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-cream text-navy rounded border border-border-cream uppercase font-sans">
                          {getCategoryLabel(ticket.category)}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-gold-pale/30 text-amber-800 rounded border border-gold/20 uppercase font-sans">
                          Module: {ticket.module || 'OTHER'}
                        </span>
                        <h4 className="font-display font-semibold text-navy text-sm truncate">
                          {ticket.title}
                        </h4>
                      </div>
                      
                      {/* Subtitle stay info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate font-medium">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-gold" /> 
                          {ticket.tenant?.name || 'Unknown'} ({ticket.tenant?.slug || '—'})
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gold" /> 
                          {ticket.user?.name || 'Unknown'} ({ticket.user?.email || '—'})
                        </span>
                        <span>
                          Reported: {formattedDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Priority selector */}
                      <div onClick={e => e.stopPropagation()}>
                        <select 
                          value={ticket.priority} 
                          onChange={e => handleUpdatePriority(ticket.id, e.target.value)}
                          disabled={updatingId === ticket.id}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer ${getPriorityBadgeClass(ticket.priority)}`}
                        >
                          <option value="LOW">Low Priority</option>
                          <option value="MEDIUM">Medium Priority</option>
                          <option value="HIGH">High Priority</option>
                          <option value="URGENT">Urgent Priority</option>
                        </select>
                      </div>

                      {/* Status selector */}
                      <div onClick={e => e.stopPropagation()}>
                        <select 
                          value={ticket.status} 
                          onChange={e => handleUpdateStatus(ticket.id, e.target.value)}
                          disabled={updatingId === ticket.id}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer ${getStatusBadgeClass(ticket.status)}`}
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-border-cream/50 pt-4 bg-cream/10 rounded-b-2xl space-y-4 animate-fadeIn">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate block">Problem Details</span>
                        <p className="text-xs text-charcoal leading-relaxed whitespace-pre-wrap font-semibold">
                          {ticket.description}
                        </p>
                      </div>

                      {ticket.attachmentUrl && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate block">Attachment / Screenshot</span>
                          <div className="relative group max-w-sm rounded-xl overflow-hidden border border-border-cream shadow-md hover:shadow-lg transition-all bg-white p-1">
                            <a 
                              href={assetUrl(ticket.attachmentUrl)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="block relative overflow-hidden rounded-lg aspect-[16/10]"
                            >
                              <img 
                                src={assetUrl(ticket.attachmentUrl)} 
                                alt="Ticket screenshot" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-bold bg-navy/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20">
                                  <Eye className="w-3.5 h-3.5" /> View Full Image
                                </span>
                              </div>
                            </a>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-[9px] text-slate font-mono bg-white p-3 rounded-xl border border-border-cream/40">
                        <span>Ticket ID: {ticket.id}</span>
                        <span>Tenant ID: {ticket.tenantId}</span>
                        <span>User ID: {ticket.userId}</span>
                        <span>Module Code: {ticket.module || 'OTHER'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SuperAdminTickets;

import React, { useState, useEffect } from 'react';
import { Bed, CheckCircle2, AlertCircle, Wrench, Ban, RefreshCw, Filter, SlidersHorizontal, X } from 'lucide-react';
import api from '../utils/api';

function Rooms() {
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [editingRoom, setEditingRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapDbStatusToUi = (dbStatus) => {
    switch (dbStatus) {
      case 'AVAILABLE': return 'Available';
      case 'OCCUPIED': return 'Occupied';
      case 'CHECKOUT_PENDING': return 'Dirty';
      case 'CLEANING': return 'Cleaning';
      case 'MAINTENANCE': return 'Maintenance';
      case 'RESERVED': return 'Reserved';
      default: return 'Out Of Service';
    }
  };

  const mapUiStatusToDb = (uiStatus) => {
    switch (uiStatus) {
      case 'Available': return 'AVAILABLE';
      case 'Occupied': return 'OCCUPIED';
      case 'Dirty': return 'CHECKOUT_PENDING';
      case 'Cleaning': return 'CLEANING';
      case 'Maintenance': return 'MAINTENANCE';
      case 'Reserved': return 'RESERVED';
      default: return 'MAINTENANCE';
    }
  };

  const formatFloor = (floorStr) => {
    if (!floorStr) return '1st Floor';
    const f = String(floorStr).trim();
    if (f.toLowerCase().includes('floor')) return f;
    const num = parseInt(f, 10);
    if (!isNaN(num)) {
      const j = num % 10, k = num % 100;
      if (j === 1 && k !== 11) {
        return `${num}st Floor`;
      }
      if (j === 2 && k !== 12) {
        return `${num}nd Floor`;
      }
      if (j === 3 && k !== 13) {
        return `${num}rd Floor`;
      }
      return `${num}th Floor`;
    }
    return `${f} Floor`;
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/rooms');
      const mapped = (data || []).map(r => ({
        id: r.id,
        number: r.number,
        type: r.roomType?.name || 'Standard',
        status: mapDbStatusToUi(r.status),
        floor: formatFloor(r.floor),
        rate: `₹${(r.roomType?.basePrice || 2500).toLocaleString()}`
      }));
      setRooms(mapped);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleStatusChange = async (number, newStatus) => {
    try {
      const room = rooms.find(r => r.number === number);
      if (!room) return;
      
      const dbStatus = mapUiStatusToDb(newStatus);
      await api.patch(`/rooms/${room.id}/status`, {
        status: dbStatus
      });
      
      fetchRooms();
      setEditingRoom(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update room status');
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesType = selectedType === 'All' || room.type === selectedType || (selectedType === 'Suite' && room.type.includes('Suite'));
    const matchesStatus = selectedStatus === 'All' || room.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-success-pale text-success border-success/30';
      case 'Occupied':
        return 'bg-danger-pale text-danger border-danger/30';
      case 'Dirty':
        return 'bg-amber-100 text-amber-800 border-amber-300/40';
      case 'Cleaning':
        return 'bg-blue-50 text-blue-800 border-blue-300/40';
      case 'Maintenance':
        return 'bg-stone-100 text-stone-800 border-stone-300/40';
      case 'Reserved':
        return 'bg-purple-50 text-purple-800 border-purple-300/40';
      default:
        return 'bg-stone-200 text-stone-600 border-stone-400/40';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available': return CheckCircle2;
      case 'Occupied': return Bed;
      case 'Dirty': return AlertCircle;
      case 'Cleaning': return RefreshCw;
      case 'Maintenance': return Wrench;
      default: return Ban;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Rooms Directory</h1>
          <p className="text-slate text-sm font-medium mt-1">Real-time room occupancy status, nightly rates, and maintenance scheduling</p>
        </div>
        <button 
          onClick={fetchRooms}
          className="flex items-center gap-2 text-xs font-bold text-navy bg-white border border-border-cream px-4 py-2 rounded-xl hover:bg-cream/10 active:scale-95 transition-all shadow-sm self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Directory
        </button>
      </div>

      {/* Filters bar */}
      <div className="soft-card p-4 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate text-xs font-bold uppercase tracking-wider pr-2">
            <Filter className="w-4 h-4" /> Filter By:
          </div>
          {/* Room Type Filter */}
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 border border-border-cream rounded-xl text-xs font-semibold text-charcoal focus:outline-none bg-cream/10"
          >
            <option value="All">All Room Types</option>
            <option value="Standard">Standard</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Suite">Suites</option>
          </select>

          {/* Status Filter */}
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 border border-border-cream rounded-xl text-xs font-semibold text-charcoal focus:outline-none bg-cream/10"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Dirty">Dirty</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Reserved">Reserved</option>
            <option value="Out Of Service">Out Of Service</option>
          </select>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-4 text-xs font-bold text-slate uppercase tracking-wider">
          <span className="text-success">{rooms.filter(r => r.status === 'Available').length} Ready</span>
          <span className="text-danger">{rooms.filter(r => r.status === 'Occupied').length} Occupied</span>
          <span className="text-amber-600">{rooms.filter(r => r.status === 'Dirty').length} Dirty</span>
        </div>
      </div>

      {/* Grid of rooms */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-2 text-slate text-sm font-semibold">
          <RefreshCw className="w-4 h-4 animate-spin text-gold" />
          Loading rooms...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-rose-600 text-sm font-medium">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredRooms.map((room) => {
            const StatusIcon = getStatusIcon(room.status);
            return (
              <div 
                key={room.number}
                onClick={() => setEditingRoom(room)}
                className="soft-card p-5 cursor-pointer relative group flex flex-col justify-between h-44 bg-white"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs text-slate font-bold">{room.floor}</span>
                    <h3 className="font-display font-bold text-xl text-navy mt-1">Room {room.number}</h3>
                  </div>
                  <div className={`p-2 rounded-xl border ${getStatusStyle(room.status)}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                </div>

                <div className="border-t border-border-cream/50 pt-3 mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate font-semibold uppercase tracking-wider">{room.type}</p>
                    <p className="font-mono text-xs text-navy font-bold mt-0.5">{room.rate} <span className="text-[10px] text-slate font-normal">/ night</span></p>
                  </div>
                  <span className="text-[10px] font-bold text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                    Manage &rarr;
                  </span>
                </div>
              </div>
            );
          })}
          {filteredRooms.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate text-sm">
              No rooms match the selected filters.
            </div>
          )}
        </div>
      )}

      {/* Room Status Editor Modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-border-cream rounded-[2rem] w-full max-w-md p-8 shadow-xl relative">
            <button 
              onClick={() => setEditingRoom(null)}
              className="absolute top-6 right-6 text-slate hover:text-navy transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="border-b border-border-cream pb-4 mb-6">
              <span className="text-[10px] text-slate font-bold uppercase tracking-wider">ROOM OPERATIONS</span>
              <h3 className="font-display font-bold text-xl text-navy mt-1">Room {editingRoom.number}</h3>
              <p className="text-xs text-slate mt-1">{editingRoom.type} | Current Status: <strong className="text-navy">{editingRoom.status}</strong></p>
            </div>

            <div className="space-y-4">
              <span className="text-slate text-[10px] font-bold uppercase tracking-wider block">Update Status</span>
              <div className="grid grid-cols-2 gap-3">
                {['Available', 'Occupied', 'Dirty', 'Cleaning', 'Maintenance', 'Reserved'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(editingRoom.number, status)}
                    className={`
                      py-3 px-4 text-xs font-bold rounded-xl border text-center transition-all
                      ${editingRoom.status === status 
                        ? 'bg-navy border-navy text-gold' 
                        : 'bg-white border-border-cream text-charcoal hover:bg-gold-pale/30'
                      }
                    `}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-border-cream">
              <button 
                onClick={() => setEditingRoom(null)}
                className="w-full btn-secondary"
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

export default Rooms;

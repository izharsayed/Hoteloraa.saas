import React, { useState, useEffect } from 'react';
import { Bed, CheckCircle2, AlertCircle, Wrench, Ban, RefreshCw, Filter, SlidersHorizontal, X, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';

function Rooms() {
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [editingRoom, setEditingRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New room and delete states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('');
  const [newRoomTypeId, setNewRoomTypeId] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [roomTypes, setRoomTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // New room type creation states
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypePrice, setNewTypePrice] = useState('');
  const [newTypeOccupancy, setNewTypeOccupancy] = useState(2);
  const [newTypeAmenities, setNewTypeAmenities] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [submittingType, setSubmittingType] = useState(false);

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

  const fetchRoomTypes = async () => {
    try {
      const data = await api.get('/room-types');
      setRoomTypes(data || []);
    } catch (err) {
      console.error('Failed to fetch room types:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchRoomTypes();
  }, []);

  const resetAddForm = () => {
    setNewRoomNumber('');
    setNewRoomFloor('');
    setNewRoomTypeId('');
    setNewRoomDesc('');
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!newRoomNumber || !newRoomFloor || !newRoomTypeId) return;
    try {
      setSubmitting(true);
      await api.post('/rooms', {
        number: newRoomNumber,
        floor: newRoomFloor,
        roomTypeId: newRoomTypeId,
        description: newRoomDesc || undefined
      });
      fetchRooms();
      setShowAddModal(false);
      resetAddForm();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm(`Are you sure you want to delete Room ${editingRoom.number}?`)) return;
    try {
      setDeleting(true);
      await api.delete(`/rooms/${id}`);
      fetchRooms();
      setEditingRoom(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete room');
    } finally {
      setDeleting(false);
    }
  };

  const resetAddTypeForm = () => {
    setNewTypeName('');
    setNewTypePrice('');
    setNewTypeOccupancy(2);
    setNewTypeAmenities('');
    setNewTypeDesc('');
  };

  const handleAddRoomType = async (e) => {
    e.preventDefault();
    if (!newTypeName || !newTypePrice || !newTypeOccupancy) return;
    try {
      setSubmittingType(true);
      const amenitiesArr = newTypeAmenities
        ? newTypeAmenities.split(',').map(a => a.trim()).filter(Boolean)
        : [];
      
      await api.post('/room-types', {
        name: newTypeName,
        basePrice: parseFloat(newTypePrice) || 0,
        maxOccupancy: parseInt(newTypeOccupancy, 10) || 2,
        amenities: amenitiesArr,
        description: newTypeDesc || undefined
      });
      
      await fetchRoomTypes();
      setShowAddTypeModal(false);
      resetAddTypeForm();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to create room type');
    } finally {
      setSubmittingType(false);
    }
  };

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
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-xs font-bold text-white bg-navy border border-navy px-4 py-2 rounded-xl hover:bg-navy/90 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} />
            Add Room
          </button>
          <button 
            onClick={() => setShowAddTypeModal(true)}
            className="flex items-center gap-2 text-xs font-bold text-navy bg-white border border-border-cream px-4 py-2 rounded-xl hover:bg-cream/10 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Room Type
          </button>
          <button 
            onClick={fetchRooms}
            className="flex items-center gap-2 text-xs font-bold text-navy bg-white border border-border-cream px-4 py-2 rounded-xl hover:bg-cream/10 active:scale-95 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Directory
          </button>
        </div>
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
            {roomTypes.map(type => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
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
                type="button"
                onClick={() => handleDeleteRoom(editingRoom.id)}
                disabled={deleting}
                className="w-1/2 flex items-center justify-center gap-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold py-2.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : 'Delete Room'}
              </button>
              <button 
                onClick={() => setEditingRoom(null)}
                className="w-1/2 btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-border-cream rounded-[2rem] w-full max-w-md p-8 shadow-xl relative">
            <button 
              onClick={() => {
                setShowAddModal(false);
                resetAddForm();
              }}
              className="absolute top-6 right-6 text-slate hover:text-navy transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="border-b border-border-cream pb-4 mb-6">
              <span className="text-[10px] text-slate font-bold uppercase tracking-wider">ROOMS</span>
              <h3 className="font-display font-bold text-xl text-navy mt-1">Add New Room</h3>
              <p className="text-xs text-slate mt-1">Configure room number, floor allocation, and type</p>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Room Number *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 104 or 205"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Floor *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 1 or Ground Floor"
                  value={newRoomFloor}
                  onChange={(e) => setNewRoomFloor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Room Type *</label>
                <select 
                  required
                  value={newRoomTypeId}
                  onChange={(e) => setNewRoomTypeId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                >
                  <option value="">Select Room Type</option>
                  {roomTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} (₹{type.basePrice.toLocaleString()} / night)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Description (Optional)</label>
                <textarea 
                  placeholder="Additional features, bed configuration, views, etc."
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border-cream">
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddForm();
                  }}
                  className="w-1/2 btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 btn-primary flex items-center justify-center gap-1.5"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Type Modal */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-border-cream rounded-[2rem] w-full max-w-md p-8 shadow-xl relative">
            <button 
              onClick={() => {
                setShowAddTypeModal(false);
                resetAddTypeForm();
              }}
              className="absolute top-6 right-6 text-slate hover:text-navy transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="border-b border-border-cream pb-4 mb-6">
              <span className="text-[10px] text-slate font-bold uppercase tracking-wider">ROOMS</span>
              <h3 className="font-display font-bold text-xl text-navy mt-1">Add Room Type</h3>
              <p className="text-xs text-slate mt-1">Define pricing, occupancy rules, and amenities</p>
            </div>

            <form onSubmit={handleAddRoomType} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Room Type Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Executive Suite or Deluxe Double"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Base Price Per Night (₹) *</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  placeholder="e.g. 4500"
                  value={newTypePrice}
                  onChange={(e) => setNewTypePrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Max Occupancy *</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="e.g. 2"
                  value={newTypeOccupancy}
                  onChange={(e) => setNewTypeOccupancy(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Amenities (Comma separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. AC, Free Wi-Fi, Smart TV, Mini Fridge"
                  value={newTypeAmenities}
                  onChange={(e) => setNewTypeAmenities(e.target.value)}
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-navy uppercase tracking-wider block">Description (Optional)</label>
                <textarea 
                  placeholder="Describe properties, views, layout or specific amenities..."
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-cream/10 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold text-charcoal resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border-cream">
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddTypeModal(false);
                    resetAddTypeForm();
                  }}
                  className="w-1/2 btn-secondary"
                  disabled={submittingType}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 btn-primary flex items-center justify-center gap-1.5"
                  disabled={submittingType}
                >
                  {submittingType ? 'Creating...' : 'Create Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rooms;

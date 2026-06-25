import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Trees, 
  Crown, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  Info,
  CalendarCheck,
  Utensils,
  Plus,
  Trash2,
  X,
  Layers,
  Sunset
} from 'lucide-react';
import api from '../utils/api.js';

function Tables() {
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Table Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableFloor, setNewTableFloor] = useState('');
  const [newTableZone, setNewTableZone] = useState('Main Hall');

  // Floors & Manage Floors State
  const [floors, setFloors] = useState([]);
  const [isManageFloorsModalOpen, setIsManageFloorsModalOpen] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');

  // Dynamically build zones list
  const getDynamicZones = () => {
    const list = [{ name: 'All', icon: null }];
    
    // Add default sections
    list.push({ name: 'Main Hall', icon: Home });
    list.push({ name: 'Garden Terrace', icon: Trees });
    list.push({ name: 'VIP Lounge', icon: Crown });
    list.push({ name: 'Bar Area', icon: Sunset });
    
    // Add dynamic floors
    floors.forEach(f => {
      if (!list.some(x => x.name.toLowerCase() === f.name.toLowerCase())) {
        list.push({ name: f.name, icon: Layers });
      }
    });
    
    return list;
  };

  const zones = getDynamicZones();

  // Load tables from backend
  const loadTables = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const data = await api.get('/tables');
      setTables(data || []);
      
      // Keep selectedTable updated with latest backend data
      if (selectedTable) {
        const updated = (data || []).find(t => t.id === selectedTable.id);
        setSelectedTable(updated || null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load tables');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadFloors = async () => {
    try {
      const data = await api.get('/floors');
      setFloors(data || []);
    } catch (err) {
      console.error('Failed to load floors', err);
    }
  };

  useEffect(() => {
    loadTables();
    loadFloors();
    
    // Polling table updates every 10 seconds for real-time occupancy status
    const interval = setInterval(() => {
      loadTables(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedTable?.id]);

  useEffect(() => {
    if (floors.length > 0 && !newTableFloor) {
      setNewTableFloor(floors[0].name);
    }
  }, [floors]);

  // Handle Add Table
  const handleAddTable = async () => {
    if (!newTableName.trim()) {
      setError('Table name is required');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/tables', {
        name: newTableName.trim(),
        capacity: Number(newTableCapacity),
        floor: newTableFloor || (floors[0]?.name || 'Ground Floor'),
        section: newTableZone
      });
      setSuccess(`Table ${newTableName} created successfully.`);
      setIsAddModalOpen(false);
      setNewTableName('');
      setNewTableCapacity(4);
      setNewTableFloor(floors[0]?.name || '');
      setNewTableZone('Main Hall');
      loadTables();
    } catch (err) {
      setError(err.message || 'Failed to create table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFloor = async () => {
    if (!newFloorName.trim()) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/floors', { name: newFloorName.trim() });
      setNewFloorName('');
      setSuccess(`Floor "${newFloorName.trim()}" added successfully.`);
      await loadFloors();
    } catch (err) {
      setError(err.message || 'Failed to create floor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFloor = async (id) => {
    const floorToDelete = floors.find(f => f.id === id);
    if (!floorToDelete) return;
    if (!window.confirm(`Are you sure you want to delete "${floorToDelete.name}"?`)) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/floors/${id}`);
      setSuccess(`Floor "${floorToDelete.name}" deleted successfully.`);
      await loadFloors();
    } catch (err) {
      setError(err.message || 'Failed to delete floor');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Table
  const handleDeleteTable = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/tables/${id}`);
      setSuccess('Table deleted successfully.');
      setSelectedTable(null);
      loadTables();
    } catch (err) {
      setError(err.message || 'Failed to delete table');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle status changes (AVAILABLE, OCCUPIED, RESERVED)
  const handleStatusChange = async (status) => {
    if (!selectedTable) return;
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/tables/${selectedTable.id}/status`, { status });
      setSuccess(`Table status updated to ${status}.`);
      loadTables();
    } catch (err) {
      setError(err.message || 'Failed to update table status');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate floor metrics
  const totalTablesCount = tables.length || 1; // avoid divide by zero
  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED');
  const reservedTables = tables.filter(t => t.status === 'RESERVED');
  const availableTables = tables.filter(t => t.status === 'AVAILABLE' || t.status === 'CLEANING');
  const occupancyRate = Math.round((occupiedTables.length / totalTablesCount) * 100);
  
  // Calculate estimate dining sales
  const liveSales = tables
    .filter(t => t.status === 'OCCUPIED')
    .reduce((acc, curr) => acc + (curr._count?.orders ? curr._count.orders * 1500 : 0), 0); // Mock dining value per active order

  const filteredTables = selectedZone === 'All' 
    ? tables 
    : tables.filter(t => t.floor === selectedZone || t.section === selectedZone);

  const handleTableClick = (table) => {
    setSelectedTable(table);
    setSuccess('');
    setError('');
  };

  // Determine shape dynamically
  const getTableShape = (capacity) => {
    if (capacity <= 2) return 'circle';
    if (capacity <= 4) return 'square';
    return 'rectangle';
  };

  // Render chair dots positioned absolutely around the table shapes
  const renderChairs = (capacity, status) => {
    const chairs = [];
    const colorClass = 
      status === 'OCCUPIED' ? 'bg-danger' : 
      status === 'RESERVED' ? 'bg-warning' : 'bg-success';

    if (capacity <= 2) {
      chairs.push(<div key="c1" className={`absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c2" className={`absolute -right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
    } else if (capacity <= 4) {
      chairs.push(<div key="c1" className={`absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c2" className={`absolute -right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c3" className={`absolute -top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c4" className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
    } else if (capacity <= 6) {
      chairs.push(<div key="c1" className={`absolute -top-3 left-1/4 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c2" className={`absolute -top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c3" className={`absolute -top-3 left-3/4 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c4" className={`absolute -bottom-3 left-1/4 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c5" className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c6" className={`absolute -bottom-3 left-3/4 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
    } else {
      chairs.push(<div key="c1" className={`absolute -top-3 left-1/4 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c2" className={`absolute -top-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c3" className={`absolute -top-3 left-3/4 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c4" className={`absolute -bottom-3 left-1/4 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c5" className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c6" className={`absolute -bottom-3 left-3/4 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c7" className={`absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
      chairs.push(<div key="c8" className={`absolute -right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${colorClass}`} />);
    }
    return chairs;
  };

  const getStatusText = (status) => {
    if (status === 'AVAILABLE') return 'Free';
    if (status === 'OCCUPIED') return 'Seated';
    if (status === 'RESERVED') return 'Booked';
    if (status === 'CLEANING') return 'Cleaning';
    return status;
  };

  return (
    <div className="h-full flex flex-col space-y-6 overflow-hidden animate-fadeIn">
      {error && <div className="p-3 bg-danger-pale border border-danger/10 text-danger rounded-xl text-xs font-bold shrink-0">{error}</div>}
      {success && <div className="p-3 bg-success-pale border border-success/10 text-success rounded-xl text-xs font-bold shrink-0">{success}</div>}

      {/* Floor Plan Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Interactive Floor Plan</h1>
          <p className="text-slate text-sm font-medium mt-1">Real-time table status, customer capacities, and floor operations</p>
        </div>

        {/* Actions & Zone Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsManageFloorsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-cream/20 text-[#0B1F3A] border border-[#0B1F3A]/20 text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Layers className="w-4 h-4 text-gold" />
            <span>Manage Floors</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B1F3A] hover:bg-[#142d50] text-gold text-xs font-bold rounded-xl transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 bg-surface-linen/50 p-1 border border-border-cream rounded-2xl">
            {zones.map((zone) => {
              const ZoneIcon = zone.icon;
              const isSelected = selectedZone === zone.name;
              return (
                <button
                  key={zone.name}
                  onClick={() => setSelectedZone(zone.name)}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-300
                    ${isSelected 
                      ? 'bg-navy text-gold shadow' 
                      : 'text-slate hover:text-navy hover:bg-white/40'
                    }
                  `}
                >
                  {ZoneIcon && <ZoneIcon className="w-4 h-4" />}
                  <span>{zone.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        
        {/* Left blueprint canvas */}
        <div className="flex-1 soft-card p-8 overflow-y-auto relative bg-[#FEF9F1] bg-[radial-gradient(#EBE5DA_1.5px,transparent_1.5px)] bg-[size:24px_24px] min-h-[400px]">
          <div className="absolute top-4 left-4 bg-white/80 border border-border-cream px-3 py-1.5 rounded-xl flex items-center gap-4 text-xs font-semibold text-charcoal z-10">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success"></span> Free</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger"></span> Seated</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning"></span> Booked</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-full text-slate font-semibold text-xs animate-pulse mt-12">Loading tables layout...</div>
          ) : filteredTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate text-xs font-semibold py-20 mt-12 text-center">
              No tables found in this zone. Click "Add Table" to create one!
            </div>
          ) : (
            /* Tables layout grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-12 mt-16 pb-8 justify-items-center">
              {filteredTables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                const statusBg = 
                  table.status === 'OCCUPIED' ? 'bg-danger/10 border-danger text-danger' : 
                  table.status === 'RESERVED' ? 'bg-warning/10 border-warning text-warning' : 
                  'bg-success/10 border-success text-success';

                const shape = getTableShape(table.capacity);

                return (
                  <div 
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className="flex flex-col items-center gap-3 select-none"
                  >
                    <div className="relative group cursor-pointer">
                      {/* Chair dots around table */}
                      {renderChairs(table.capacity, table.status)}

                      {/* Table shape rendering */}
                      <div className={`
                        flex flex-col items-center justify-center border-2 transition-all duration-300 font-mono shadow-sm
                        ${shape === 'circle' && 'w-20 h-20 rounded-full'}
                        ${shape === 'square' && 'w-20 h-20 rounded-2xl'}
                        ${shape === 'rectangle' && 'w-32 h-20 rounded-2xl'}
                        ${isSelected 
                          ? 'ring-4 ring-gold/40 border-gold bg-gold-pale scale-105' 
                          : `${statusBg} hover:scale-103 hover:shadow-md`
                        }
                      `}>
                        <span className="font-bold text-xs tracking-tight">{table.name}</span>
                        <span className="text-[9px] opacity-75 font-semibold mt-0.5">{table.capacity} Pax</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate font-bold uppercase tracking-wider">
                      {table.floor && table.section && table.floor !== table.section 
                        ? `${table.floor} • ${table.section}` 
                        : (table.floor || table.section || 'Main Hall')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Occupancy Analytics Sidebar */}
        <div className="w-full lg:w-80 shrink-0 soft-card p-6 flex flex-col justify-between overflow-y-auto bg-white">
          {selectedTable ? (
            // Individual Table details
            <div className="space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border-cream pb-4">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-navy">{selectedTable.name}</h3>
                    <p className="text-[10px] text-slate font-semibold uppercase tracking-wider">
                      {selectedTable.floor && selectedTable.section && selectedTable.floor !== selectedTable.section 
                        ? `${selectedTable.floor} • ${selectedTable.section}` 
                        : (selectedTable.floor || selectedTable.section || 'Main Hall')}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedTable.status === 'OCCUPIED' ? 'bg-danger-pale text-danger border border-danger/20' : 
                    selectedTable.status === 'RESERVED' ? 'bg-warning-pale text-warning border border-warning/20' : 
                    'bg-success-pale text-success border border-success/20'
                  }`}>
                    {getStatusText(selectedTable.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-cream/40 rounded-xl border border-border-cream/50">
                    <span className="text-slate block text-[10px] font-bold uppercase tracking-wider">Capacity</span>
                    <span className="font-mono font-bold text-navy text-sm">{selectedTable.capacity} Seats</span>
                  </div>
                  <div className="p-3 bg-cream/40 rounded-xl border border-border-cream/50">
                    <span className="text-slate block text-[10px] font-bold uppercase tracking-wider">Shape</span>
                    <span className="font-semibold text-navy capitalize text-sm">{getTableShape(selectedTable.capacity)}</span>
                  </div>
                </div>

                {/* Status Switcher Controls */}
                <div className="space-y-2 pt-2">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider block">Set Table Status</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleStatusChange('AVAILABLE')}
                      disabled={submitting}
                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                        selectedTable.status === 'AVAILABLE' 
                          ? 'bg-success text-white border-success' 
                          : 'bg-white border-border-cream text-success hover:bg-success-pale'
                      }`}
                    >
                      Free
                    </button>
                    <button 
                      onClick={() => handleStatusChange('OCCUPIED')}
                      disabled={submitting}
                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                        selectedTable.status === 'OCCUPIED' 
                          ? 'bg-danger text-white border-danger' 
                          : 'bg-white border-border-cream text-danger hover:bg-danger-pale'
                      }`}
                    >
                      Seated
                    </button>
                    <button 
                      onClick={() => handleStatusChange('RESERVED')}
                      disabled={submitting}
                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                        selectedTable.status === 'RESERVED' 
                          ? 'bg-warning text-white border-warning' 
                          : 'bg-white border-border-cream text-warning hover:bg-warning-pale'
                      }`}
                    >
                      Booked
                    </button>
                  </div>
                </div>

                {/* Order Details / Check info */}
                {selectedTable.status === 'OCCUPIED' && (
                  <div className="space-y-3 pt-4 border-t border-border-cream">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5 text-gold" /> Running Bill
                      </span>
                      <span className="font-mono text-xs font-bold bg-gold-pale text-gold px-2 py-0.5 rounded">
                        {selectedTable._count?.orders || 0} ACTIVE
                      </span>
                    </div>
                    <div className="text-[11px] text-slate bg-cream/20 p-3 rounded-xl border border-border-cream/30">
                      Table currently marked as occupied. Use Captain POS to manage active items and kitchen tickets.
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6 space-y-2">
                <button
                  onClick={() => handleDeleteTable(selectedTable.id)}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-xl border border-red-200 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Table</span>
                </button>
                <button 
                  onClick={() => setSelectedTable(null)}
                  className="w-full btn-secondary text-xs"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          ) : (
            // Default Overview Analytics
            <div className="space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-semibold text-lg text-navy border-b border-border-cream pb-3">Floor Analytics</h3>
                </div>

                {/* Circular Donut Occupancy */}
                <div className="flex flex-col items-center py-4 bg-cream/30 rounded-2xl border border-border-cream/30">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      {/* Gray track */}
                      <path
                        className="text-border-cream"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Gold ring */}
                      <path
                        className="text-gold transition-all duration-500 ease-out"
                        strokeDasharray={`${occupancyRate}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-2xl font-bold text-navy leading-none">{occupancyRate}%</span>
                      <span className="text-[9px] text-slate font-bold uppercase tracking-wider mt-1">Occupied</span>
                    </div>
                  </div>
                </div>

                {/* Sales metrics */}
                <div className="space-y-3 bg-navy text-white p-4 rounded-2xl shadow-sm border border-gold/30">
                  <span className="text-[10px] text-gold font-mono font-bold uppercase tracking-wider">Estimated dining value</span>
                  <div className="flex justify-between items-end mt-1">
                    <div>
                      <span className="text-slate text-[9px] block">Live Dine Sales</span>
                      <span className="font-mono text-xl text-white font-bold">₹{liveSales.toLocaleString()}</span>
                    </div>
                    <DollarSign className="w-5 h-5 text-gold mb-1" />
                  </div>
                </div>

                {/* Mini directory list of active tables */}
                <div className="space-y-3">
                  <span className="text-slate text-[10px] font-bold uppercase tracking-wider block">Active Dining Tables</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {tables.filter(t => t.status === 'OCCUPIED').map(table => (
                      <div 
                        key={table.id}
                        onClick={() => handleTableClick(table)}
                        className="flex justify-between items-center p-2.5 bg-cream/40 border border-border-cream/50 rounded-xl hover:border-gold cursor-pointer transition-all text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-navy text-gold text-[10px] font-bold rounded-lg flex items-center justify-center font-mono">
                            {table.name.replace(/\D/g, '') || table.name.slice(0,3)}
                          </span>
                          <span className="font-semibold text-charcoal">{table.name}</span>
                        </div>
                        <span className="font-mono text-navy font-bold">₹1,500</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Counts footer */}
              <div className="border-t border-border-cream pt-4 text-[10px] font-bold text-slate flex justify-between uppercase tracking-wider mt-4">
                <span className="text-success">{availableTables.length} Free</span>
                <span className="text-danger">{occupiedTables.length} Seated</span>
                <span className="text-warning">{reservedTables.length} Booked</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white border border-border-cream rounded-3xl p-6 w-96 max-w-[90%] shadow-xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-border-cream pb-3">
              <h3 className="font-display font-bold text-navy text-lg">Add New Restaurant Table</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1 text-slate hover:text-navy hover:bg-cream/40 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Table Name / Number</label>
                <input 
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full px-3 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold placeholder-slate/40"
                  placeholder="e.g. Table 16 or T16"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Capacity (Pax)</label>
                <select 
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold bg-white"
                >
                  <option value="2">2 Seater (Circle)</option>
                  <option value="4">4 Seater (Square)</option>
                  <option value="6">6 Seater (Rectangle)</option>
                  <option value="8">8 Seater (Rectangle)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Floor</label>
                <select 
                  value={newTableFloor}
                  onChange={(e) => setNewTableFloor(e.target.value)}
                  className="w-full px-3 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold bg-white"
                >
                  {floors.map((f) => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">Zone / Area (Section)</label>
                <select 
                  value={newTableZone}
                  onChange={(e) => setNewTableZone(e.target.value)}
                  className="w-full px-3 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold bg-white"
                >
                  <option value="Main Hall">Main Hall</option>
                  <option value="Garden Terrace">Garden Terrace</option>
                  <option value="VIP Lounge">VIP Lounge</option>
                  <option value="Bar Area">Bar Area</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-border-cream text-slate font-bold text-xs rounded-xl hover:bg-cream/40 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddTable}
                disabled={submitting}
                className="px-4 py-2 bg-navy text-gold font-bold text-xs rounded-xl hover:bg-navy/90 transition-all shadow"
              >
                {submitting ? 'Adding...' : 'Add Table'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Floors Modal */}
      {isManageFloorsModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white border border-border-cream rounded-3xl p-6 w-96 max-w-[90%] shadow-xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-border-cream pb-3">
              <h3 className="font-display font-bold text-navy text-lg">Manage Restaurant Floors</h3>
              <button 
                onClick={() => setIsManageFloorsModalOpen(false)} 
                className="p-1 text-slate hover:text-navy hover:bg-cream/40 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* List of existing floors */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-slate text-[10px] font-bold uppercase tracking-wider block">Existing Floors</span>
              {floors.length === 0 ? (
                <div className="text-xs text-slate py-2">No floors created yet.</div>
              ) : (
                floors.map((f) => (
                  <div key={f.id} className="flex justify-between items-center p-2.5 bg-cream/20 border border-border-cream/50 rounded-xl text-xs font-semibold text-charcoal">
                    <span>{f.name}</span>
                    <button
                      onClick={() => handleDeleteFloor(f.id)}
                      disabled={submitting}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Floor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {/* Add Floor Input */}
            <div className="pt-2 border-t border-border-cream space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-1">New Floor Name</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newFloorName}
                    onChange={(e) => setNewFloorName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border-cream rounded-xl text-xs focus:outline-none focus:border-gold placeholder-slate/40"
                    placeholder="e.g. Third Floor"
                  />
                  <button
                    onClick={handleCreateFloor}
                    disabled={submitting || !newFloorName.trim()}
                    className="px-4 py-2 bg-navy text-gold font-bold text-xs rounded-xl hover:bg-navy/90 transition-all shadow"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setIsManageFloorsModalOpen(false)}
                className="px-4 py-2 border border-border-cream text-slate font-bold text-xs rounded-xl hover:bg-cream/40 transition-all"
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

export default Tables;

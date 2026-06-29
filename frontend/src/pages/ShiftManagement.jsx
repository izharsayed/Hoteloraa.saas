import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, Plus, Edit2, Trash2, Users, AlertTriangle, 
  Clock, X, Check, Loader2 
} from 'lucide-react';
import api from '../utils/api';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftFormData, setShiftFormData] = useState({
    name: '', startTime: '09:00', endTime: '17:00',
    gracePeriodMinutes: 15, breakDurationMinutes: 60,
    autoCheckoutTime: '', weeklyOffDays: []
  });

  const [employees, setEmployees] = useState([]); // All users for dropdown
  const [shiftEmployees, setShiftEmployees] = useState([]); // Employees in selected shift
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  useEffect(() => {
    fetchShifts();
    fetchEmployees();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shifts');
      setShifts(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users');
      setEmployees(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchShiftEmployees = async (shiftId) => {
    try {
      const res = await api.get(`/shifts/${shiftId}/employees`);
      setShiftEmployees(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenShiftModal = (shift = null) => {
    if (shift) {
      setCurrentShift(shift);
      setShiftFormData({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        gracePeriodMinutes: shift.gracePeriodMinutes,
        breakDurationMinutes: shift.breakDurationMinutes,
        autoCheckoutTime: shift.autoCheckoutTime || '',
        weeklyOffDays: shift.weeklyOffDays || []
      });
    } else {
      setCurrentShift(null);
      setShiftFormData({
        name: '', startTime: '09:00', endTime: '17:00',
        gracePeriodMinutes: 15, breakDurationMinutes: 60,
        autoCheckoutTime: '', weeklyOffDays: []
      });
    }
    setIsShiftModalOpen(true);
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...shiftFormData,
        autoCheckoutTime: shiftFormData.autoCheckoutTime || null
      };

      if (currentShift) {
        await api.put(`/shifts/${currentShift.id}`, payload);
      } else {
        await api.post('/shifts', payload);
      }
      setIsShiftModalOpen(false);
      fetchShifts();
    } catch (err) {
      alert(err.message || 'Failed to save shift');
    }
  };

  const handleDeleteShift = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;
    try {
      await api.delete(`/shifts/${id}`);
      fetchShifts();
    } catch (err) {
      alert(err.message || 'Failed to delete shift');
    }
  };

  const handleOpenAssignModal = (shift) => {
    setCurrentShift(shift);
    setSelectedUserIds([]);
    fetchShiftEmployees(shift.id);
    setIsAssignModalOpen(true);
  };

  const handleAssignEmployees = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      await api.post(`/shifts/${currentShift.id}/assign`, {
        userIds: selectedUserIds
      });
      setSelectedUserIds([]);
      fetchShiftEmployees(currentShift.id);
      fetchShifts(); // Update counters
    } catch (err) {
      alert(err.message || 'Failed to assign employees');
    }
  };

  const handleUnassignEmployee = async (userId) => {
    if (!window.confirm('Remove employee from this shift?')) return;
    try {
      await api.delete(`/shifts/${currentShift.id}/unassign`, { data: { userId } });
      fetchShiftEmployees(currentShift.id);
      fetchShifts();
    } catch (err) {
      alert(err.message || 'Failed to unassign employee');
    }
  };

  const toggleDay = (day) => {
    setShiftFormData(prev => ({
      ...prev,
      weeklyOffDays: prev.weeklyOffDays.includes(day)
        ? prev.weeklyOffDays.filter(d => d !== day)
        : [...prev.weeklyOffDays, day]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 text-navy animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Shift Management</h1>
          <p className="text-slate text-sm">Create and manage working shifts and assign employees.</p>
        </div>
        <button
          onClick={() => handleOpenShiftModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-navy text-gold font-bold rounded-xl shadow-md hover:bg-navy-light transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Shift
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map(shift => (
          <div key={shift.id} className="bg-white rounded-3xl shadow-sm border border-border-cream p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-display font-bold text-navy text-xl">{shift.name}</h3>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenShiftModal(shift)}
                    className="p-1.5 text-slate hover:text-navy hover:bg-cream rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteShift(shift.id)}
                    className="p-1.5 text-slate hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-slate text-sm">
                  <Clock className="w-4 h-4 text-gold" />
                  <span>{shift.startTime} - {shift.endTime}</span>
                </div>
                <div className="flex items-center gap-3 text-slate text-sm">
                  <CalendarRange className="w-4 h-4 text-gold" />
                  <span>
                    Off: {shift.weeklyOffDays?.length > 0 ? shift.weeklyOffDays.join(', ') : 'None'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate text-sm">
                  <Users className="w-4 h-4 text-gold" />
                  <span>{shift._count?.employeeShifts || 0} employees assigned</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenAssignModal(shift)}
              className="w-full py-2.5 bg-cream/50 hover:bg-cream text-navy font-bold rounded-xl transition-colors border border-border-cream"
            >
              Manage Employees
            </button>
          </div>
        ))}

        {shifts.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate bg-white rounded-3xl border border-border-cream border-dashed">
            No shifts configured. Create one to get started.
          </div>
        )}
      </div>

      {/* CREATE / EDIT SHIFT MODAL */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-navy/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 border-b border-border-cream flex justify-between items-center bg-cream/10">
              <h2 className="font-display font-bold text-navy text-xl">
                {currentShift ? 'Edit Shift' : 'Create New Shift'}
              </h2>
              <button onClick={() => setIsShiftModalOpen(false)} className="text-slate hover:text-navy">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveShift} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate uppercase mb-1">Shift Name</label>
                <input 
                  required
                  type="text" 
                  value={shiftFormData.name}
                  onChange={e => setShiftFormData({...shiftFormData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-border-cream rounded-xl focus:border-gold focus:outline-none"
                  placeholder="e.g. Morning Shift"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate uppercase mb-1">Start Time</label>
                  <input 
                    required
                    type="time" 
                    value={shiftFormData.startTime}
                    onChange={e => setShiftFormData({...shiftFormData, startTime: e.target.value})}
                    className="w-full px-4 py-3 border border-border-cream rounded-xl focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate uppercase mb-1">End Time</label>
                  <input 
                    required
                    type="time" 
                    value={shiftFormData.endTime}
                    onChange={e => setShiftFormData({...shiftFormData, endTime: e.target.value})}
                    className="w-full px-4 py-3 border border-border-cream rounded-xl focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate uppercase mb-1">Grace Period (mins)</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    value={shiftFormData.gracePeriodMinutes}
                    onChange={e => setShiftFormData({...shiftFormData, gracePeriodMinutes: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-border-cream rounded-xl focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate uppercase mb-1">Break (mins)</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    value={shiftFormData.breakDurationMinutes}
                    onChange={e => setShiftFormData({...shiftFormData, breakDurationMinutes: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-border-cream rounded-xl focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate uppercase mb-1">Auto-Checkout Time (Optional)</label>
                <input 
                  type="time" 
                  value={shiftFormData.autoCheckoutTime}
                  onChange={e => setShiftFormData({...shiftFormData, autoCheckoutTime: e.target.value})}
                  className="w-full px-4 py-3 border border-border-cream rounded-xl focus:border-gold focus:outline-none"
                />
                <p className="text-[10px] text-slate mt-1">If set, employees will be auto-checked out at this time if they forget.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate uppercase mb-2">Weekly Off Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        shiftFormData.weeklyOffDays.includes(day)
                          ? 'bg-navy text-gold'
                          : 'bg-cream text-slate hover:bg-cream/70'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-5 py-2.5 text-slate font-bold hover:bg-cream rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-navy text-gold font-bold rounded-xl shadow-md hover:bg-navy-light transition-colors"
                >
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN EMPLOYEES MODAL */}
      {isAssignModalOpen && currentShift && (
        <div className="fixed inset-0 bg-navy/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-border-cream flex justify-between items-center bg-cream/10 shrink-0">
              <div>
                <h2 className="font-display font-bold text-navy text-xl">Manage Shift Employees</h2>
                <p className="text-slate text-sm">{currentShift.name}</p>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate hover:text-navy">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Add New Employees */}
              <div className="bg-cream/30 p-4 rounded-2xl border border-border-cream">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-bold text-slate uppercase">Assign New Employees</label>
                  <button 
                    onClick={handleAssignEmployees}
                    disabled={selectedUserIds.length === 0}
                    className="px-4 py-1.5 bg-navy text-gold text-sm font-bold rounded-lg hover:bg-navy-light disabled:opacity-50 transition-colors"
                  >
                    Assign Selected
                  </button>
                </div>
                
                <div className="bg-white border border-border-cream rounded-xl h-48 overflow-y-auto p-2 space-y-1">
                  {(() => {
                    const unassignedEmployees = employees.filter(emp => !shiftEmployees.some(se => se.userId === emp.id));
                    const isAllSelected = unassignedEmployees.length > 0 && selectedUserIds.length === unassignedEmployees.length;
                    
                    return (
                      <>
                        {unassignedEmployees.length > 0 && (
                          <label className="flex items-center gap-3 p-2 hover:bg-cream/30 rounded-lg cursor-pointer border-b border-border-cream pb-3 mb-2">
                            <input 
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds(unassignedEmployees.map(emp => emp.id));
                                } else {
                                  setSelectedUserIds([]);
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                            />
                            <span className="font-bold text-navy text-sm">Select All</span>
                          </label>
                        )}
                        
                        {unassignedEmployees.length === 0 ? (
                          <div className="text-center text-slate text-sm p-4">All employees are already assigned to this shift.</div>
                        ) : (
                          unassignedEmployees.map(emp => (
                            <label key={emp.id} className="flex items-center gap-3 p-2 hover:bg-cream/50 rounded-lg cursor-pointer transition-colors">
                              <input 
                                type="checkbox"
                                checked={selectedUserIds.includes(emp.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserIds([...selectedUserIds, emp.id]);
                                  } else {
                                    setSelectedUserIds(selectedUserIds.filter(id => id !== emp.id));
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                              />
                              <div>
                                <div className="text-sm font-semibold text-navy">{emp.name}</div>
                                <div className="text-xs text-slate">{emp.userRole.replace('_', ' ')}</div>
                              </div>
                            </label>
                          ))
                        )}
                      </>
                    );
                  })()}
                </div>
                <p className="text-[10px] text-slate mt-2">Assigning an employee will automatically remove them from their previous shift.</p>
              </div>

              {/* Current Employees List */}
              <div>
                <h3 className="text-sm font-bold text-navy uppercase mb-3">Currently Assigned ({shiftEmployees.length})</h3>
                <div className="border border-border-cream rounded-xl divide-y divide-border-cream overflow-hidden">
                  {shiftEmployees.length === 0 ? (
                    <div className="p-4 text-center text-slate text-sm">No employees assigned to this shift.</div>
                  ) : (
                    shiftEmployees.map(se => (
                      <div key={se.id} className="p-3 flex justify-between items-center hover:bg-cream/10">
                        <div>
                          <div className="font-bold text-navy text-sm">{se.user.name}</div>
                          <div className="text-xs text-slate">{se.user.userRole.replace('_', ' ')}</div>
                        </div>
                        <button 
                          onClick={() => handleUnassignEmployee(se.userId)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-xs font-bold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShiftManagement;

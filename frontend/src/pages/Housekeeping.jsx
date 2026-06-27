import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, User, AlertCircle, Check } from 'lucide-react';
import api from '../utils/api';

function Housekeeping() {
  const [housekeepingList, setHousekeepingList] = useState([]);
  const [staff, setStaff] = useState([
    { id: 'static-1', name: 'Sunita Devi' },
    { id: 'static-2', name: 'Amit Kumar' },
    { id: 'static-3', name: 'Ramesh Singh' }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchPromiseRef = useRef(null);

  const fetchHousekeepingTasks = async () => {
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    const promise = (async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch active tasks
        const tasks = await api.get('/housekeeping');
        const activeTasks = (tasks || []).filter(t => t.status !== 'COMPLETED' && t.status !== 'INSPECTED');
        
        // 2. Fetch rooms with status 'CLEANING'
        const dirtyRooms = await api.get('/rooms?status=CLEANING');
        
        // 3. Sync: check if any dirty rooms lack active tasks
        const tasksToCreate = [];
        (dirtyRooms || []).forEach(room => {
          const hasActiveTask = activeTasks.some(t => t.room?.id === room.id);
          if (!hasActiveTask) {
            tasksToCreate.push(room);
          }
        });
        
        // 4. Auto-create tasks if needed
        if (tasksToCreate.length > 0) {
          await Promise.all(
            tasksToCreate.map(room => 
              api.post('/housekeeping', {
                roomId: room.id,
                taskType: 'CLEANING',
                notes: 'Automated cleanup from checkout'
              })
            )
          );
          // Refresh tasks from server
          const updatedTasks = await api.get('/housekeeping');
          setHousekeepingList((updatedTasks || []).filter(t => t.status !== 'COMPLETED' && t.status !== 'INSPECTED'));
        } else {
          setHousekeepingList(activeTasks);
        }
      } catch (e) {
        console.error(e);
        setError(e.message || 'Failed to load housekeeping tasks');
      } finally {
        setLoading(false);
        fetchPromiseRef.current = null;
      }
    })();

    fetchPromiseRef.current = promise;
    return promise;
  };

  const fetchStaff = async () => {
    try {
      const users = await api.get('/users');
      const hkUsers = (users || []).filter(u => u.userRole === 'HOUSEKEEPING' || u.userRole === 'RECEPTIONIST' || u.userRole === 'MANAGER');
      if (hkUsers.length > 0) {
        setStaff(hkUsers.map(u => ({ id: u.id, name: u.name })));
      }
    } catch (e) {
      console.warn('Could not fetch staff from server, using default roster:', e.message);
    }
  };

  useEffect(() => {
    fetchHousekeepingTasks();
    fetchStaff();
  }, []);

  const handleAssignStaff = async (taskId, staffId) => {
    if (staffId === 'Unassigned') return;
    try {
      // 1. Assign staff member
      await api.put(`/housekeeping/${taskId}`, {
        assignedTo: staffId
      });
      
      // 2. Set status to IN_PROGRESS (Cleaning)
      await api.patch(`/housekeeping/${taskId}/status`, {
        status: 'IN_PROGRESS'
      });
      
      fetchHousekeepingTasks();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to assign housekeeper');
    }
  };

  const handleMarkClean = async (taskId) => {
    try {
      await api.patch(`/housekeeping/${taskId}/status`, {
        status: 'COMPLETED'
      });
      fetchHousekeepingTasks();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to complete cleaning task');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Housekeeping Board</h1>
          <p className="text-slate text-sm font-medium mt-1">Assign cleaning staff, track room cleaning statuses, and inspect rooms</p>
        </div>
        <button 
          onClick={fetchHousekeepingTasks}
          className="flex items-center gap-2 text-xs font-bold text-navy bg-white border border-border-cream px-4 py-2 rounded-xl hover:bg-cream/10 active:scale-95 transition-all shadow-sm self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Board
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Active Cleaning Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="soft-card p-6 bg-white">
            <h3 className="font-display font-semibold text-lg text-navy mb-4">Pending Cleaning Queue</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-slate text-sm font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                Loading cleaning queue...
              </div>
            ) : error ? (
              <div className="py-6 text-center text-rose-600 text-sm font-medium">
                {error}
              </div>
            ) : (
              <div className="space-y-4">
                {housekeepingList.map((task) => {
                  const isDirty = task.status === 'PENDING';
                  const uiStatus = isDirty ? 'Dirty' : 'Cleaning';
                  return (
                    <div 
                      key={task.id}
                      className={`
                        p-5 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300
                        ${isDirty ? 'border-amber-300 bg-amber-50/20' : 'border-blue-300 bg-blue-50/10'}
                      `}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-navy text-gold font-display font-bold rounded-xl flex items-center justify-center">
                            {task.room?.number}
                          </span>
                          <div>
                            <h4 className="font-bold text-charcoal text-sm">{task.room?.roomType?.name}</h4>
                            <p className="text-[10px] text-slate mt-0.5 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> {task.notes || 'Automated cleanup from checkout'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Staff Assignment / Status */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Staff selection */}
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate" />
                          <select 
                            value={task.assignedTo || 'Unassigned'}
                            onChange={(e) => handleAssignStaff(task.id, e.target.value)}
                            className="px-3 py-1.5 border border-border-cream rounded-xl text-xs font-semibold text-charcoal focus:outline-none bg-white"
                          >
                            <option value="Unassigned">Assign Staff</option>
                            {staff.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Status badge */}
                        <span className={`
                          px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1
                          ${isDirty ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}
                        `}>
                          {!isDirty && <RefreshCw className="w-3 h-3 animate-spin" />}
                          {uiStatus}
                        </span>

                        {/* Mark clean button */}
                        <button 
                          onClick={() => handleMarkClean(task.id)}
                          className="px-3 py-1.5 bg-success text-white text-xs font-bold rounded-xl hover:bg-success/90 active:scale-95 transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Done
                        </button>
                      </div>
                    </div>
                  );
                })}
                {housekeepingList.length === 0 && (
                  <div className="py-12 text-center text-slate space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                    <p className="font-bold text-charcoal">All Rooms Cleaned</p>
                    <p className="text-xs text-slate">Ready for new guest check-ins.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Staff list & roster */}
        <div className="soft-card p-6 bg-white h-fit space-y-4">
          <h3 className="font-display font-semibold text-navy text-sm border-b border-border-cream pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" /> Housekeeping Roster
          </h3>
          <div className="space-y-3">
            {staff.map((u, index) => (
              <div key={u.id || index} className="flex items-center justify-between p-3 bg-cream/20 border border-border-cream/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy text-gold font-bold flex items-center justify-center text-xs">
                    {u.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-charcoal">{u.name}</h4>
                    <p className="text-[9px] text-slate font-medium">Housekeeper</p>
                  </div>
                </div>
                <span className="text-[10px] text-success font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span> Online
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Housekeeping;

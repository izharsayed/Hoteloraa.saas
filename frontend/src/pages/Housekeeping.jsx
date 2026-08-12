import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, User, AlertCircle, Check } from 'lucide-react';
import api from '../utils/api';

function Housekeeping() {
  const [housekeepingList, setHousekeepingList] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();
  const userRole = user?.userRole || '';
  const isHousekeeper = userRole === 'HOUSEKEEPING' || userRole === 'HOUSEKEEPER';
  
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
      // Use the dedicated housekeeping/staff endpoint — accessible to HOUSEKEEPING role
      // (the /users endpoint requires USERS READ which housekeepers don't have)
      const users = await api.get('/housekeeping/staff');
      setStaff((users || []).map(u => ({ id: u.id, name: u.name })));
    } catch (e) {
      console.warn('Could not fetch housekeeping staff:', e.message);
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

      <div className="space-y-6">
        {/* Cleaning Tasks - now full width */}
        <div>
          <div className="soft-card p-6 bg-white flex flex-col">
            <h3 className="font-display font-semibold text-lg text-navy mb-4 flex-shrink-0">Pending Cleaning Queue</h3>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-12 gap-2 text-slate text-sm font-semibold">
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
                      className="p-5 border border-border-cream/80 bg-white hover:border-gold/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="px-3.5 py-2.5 min-w-[3.5rem] bg-navy text-gold font-mono font-bold text-sm rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gold/20">
                          {task.room?.number}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-navy text-sm tracking-wide flex items-center gap-2 flex-wrap">
                            <span>Room {task.room?.number}</span>
                            <span className="text-xs font-semibold text-slate uppercase bg-cream/30 px-2 py-0.5 rounded-md border border-border-cream/40">
                              {task.room?.roomType?.name || 'Room'}
                            </span>
                          </h4>
                          <p className="text-xs text-slate mt-1 font-medium flex items-center gap-1.5 truncate">
                            <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" /> 
                            <span className="truncate">{task.notes || 'Automated cleanup task'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Staff Assignment / Status */}
                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        {/* Staff selection — only visible on manager/admin side */}
                        {!isHousekeeper && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate" />
                            <select 
                              value={task.assignedTo || 'Unassigned'}
                              onChange={(e) => handleAssignStaff(task.id, e.target.value)}
                              className="px-3.5 py-2 border border-border-cream rounded-xl text-xs font-bold text-navy focus:outline-none focus:border-gold bg-cream/10 cursor-pointer"
                            >
                              <option value="Unassigned">Assign Staff</option>
                              {staff.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Status badge */}
                        <span className={`
                          px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 border
                          ${isDirty ? 'bg-warning-pale text-warning border-warning/30' : 'bg-info-pale text-info border-info/30'}
                        `}>
                          {!isDirty && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          {uiStatus}
                        </span>

                        {/* Mark clean button */}
                        <button 
                          onClick={() => handleMarkClean(task.id)}
                          className="px-4 py-2 bg-success text-white text-xs font-bold rounded-xl hover:bg-success/90 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3px]" /> Done
                        </button>
                      </div>
                    </div>
                  );
                })}
                {housekeepingList.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate space-y-2">
                    <CheckCircle2 className="w-14 h-14 text-success mx-auto mb-1" />
                    <p className="font-bold text-charcoal text-base">All Rooms Cleaned</p>
                    <p className="text-xs text-slate">Ready for new guest check-ins.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Housekeeping;

import React, { useState, useEffect } from 'react';
import { 
  Clock, MapPin, Calendar as CalendarIcon, History, AlertTriangle, 
  CheckCircle, Play, Square, Loader2
} from 'lucide-react';
import api from '../utils/api';

const AttendanceEmployee = () => {
  const [todayRecord, setTodayRecord] = useState(null);
  const [shift, setShift] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Today's Record
      const todayRes = await api.get('/attendance/today');
      setTodayRecord(todayRes?.attendance || null);
      
      // 2. Fetch Active Shift
      const shiftRes = await api.get('/shifts/my-shift');
      setShift(shiftRes);
      
      // 3. Fetch History (last 30 days)
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const historyRes = await api.get(`/attendance/history?startDate=${d.toISOString().split('T')[0]}`);
      setHistory(historyRes?.records || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  const getPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      }
    });
  };

  const handleAction = async (type) => {
    setActionLoading(true);
    setError('');
    setLocationError('');
    
    try {
      let payload = {};
      try {
        const pos = await getPosition();
        payload = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          isManual: false
        };
      } catch (geoErr) {
        console.warn('Geolocation failed', geoErr);
        // We still send request without lat/lng. The backend will reject if geofence is strictly enabled.
        setLocationError('Could not get precise location. Ensure location permissions are granted.');
      }

      if (type === 'checkin') {
        await api.post('/attendance/checkin', payload);
      } else {
        await api.post('/attendance/checkout', payload);
      }
      
      await fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 text-navy animate-spin" />
      </div>
    );
  }

  const isCheckedIn = todayRecord && todayRecord.checkInTime && !todayRecord.checkOutTime;
  const isCheckedOut = todayRecord && todayRecord.checkOutTime;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">My Attendance</h1>
          <p className="text-slate text-sm">Manage your daily check-ins and view your timesheet.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-border-cream flex items-center gap-4">
          <Clock className="w-5 h-5 text-gold" />
          <div className="font-display font-bold text-xl text-navy">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      {locationError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {locationError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Action Card */}
        <div className="md:col-span-1 bg-white rounded-3xl shadow-sm border border-border-cream p-6 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-full">
            <h3 className="font-display font-bold text-navy text-lg">Today's Status</h3>
            <p className="text-slate text-sm">
              {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>

          <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${isCheckedIn ? 'border-amber-400 bg-amber-50 text-amber-600' : isCheckedOut ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-blue-400 bg-blue-50 text-blue-600'} transition-all`}>
            <div className="text-center">
              <span className="block font-bold text-sm tracking-wider uppercase mb-1">
                {isCheckedIn ? 'Working' : isCheckedOut ? 'Finished' : 'Ready'}
              </span>
              {todayRecord?.checkInTime && !isCheckedOut && (
                <span className="text-xs font-medium opacity-80">
                  Since {new Date(todayRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          <div className="w-full">
            {isCheckedOut ? (
              <div className="w-full py-4 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Checked Out for Today
              </div>
            ) : (
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => handleAction('checkin')}
                  disabled={actionLoading || isCheckedIn}
                  className="flex-1 py-4 rounded-xl bg-navy hover:bg-navy-light text-gold font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading && !isCheckedIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                  Check In
                </button>

                <button
                  onClick={() => handleAction('checkout')}
                  disabled={actionLoading || !isCheckedIn}
                  className={`flex-1 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isCheckedIn 
                      ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm' 
                      : 'bg-cream text-slate opacity-50 cursor-not-allowed'
                  }`}
                >
                  {actionLoading && isCheckedIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5" />}
                  Check Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Shift Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-border-cream p-6">
            <h3 className="font-display font-bold text-navy text-lg mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gold" />
              My Current Shift
            </h3>
            
            {shift ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-cream/30 p-4 rounded-xl">
                  <span className="block text-xs text-slate mb-1">Shift Name</span>
                  <strong className="text-navy">{shift.name}</strong>
                </div>
                <div className="bg-cream/30 p-4 rounded-xl">
                  <span className="block text-xs text-slate mb-1">Start Time</span>
                  <strong className="text-navy">{shift.startTime}</strong>
                </div>
                <div className="bg-cream/30 p-4 rounded-xl">
                  <span className="block text-xs text-slate mb-1">End Time</span>
                  <strong className="text-navy">{shift.endTime}</strong>
                </div>
                <div className="bg-cream/30 p-4 rounded-xl">
                  <span className="block text-xs text-slate mb-1">Grace Period</span>
                  <strong className="text-navy">{shift.gracePeriodMinutes} mins</strong>
                </div>
              </div>
            ) : (
              <div className="text-slate text-sm p-4 bg-cream/30 rounded-xl text-center">
                You are not currently assigned to any shift.
              </div>
            )}
          </div>

          {/* Recent History Mini-Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-border-cream overflow-hidden">
            <div className="p-6 border-b border-border-cream">
              <h3 className="font-display font-bold text-navy text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-gold" />
                Recent History
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-cream/30 text-slate font-medium border-b border-border-cream">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Check In</th>
                    <th className="px-6 py-4">Check Out</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-cream">
                  {history.length > 0 ? history.map((record) => (
                    <tr key={record.id} className="hover:bg-cream/10">
                      <td className="px-6 py-4 font-medium text-navy">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate">
                        {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate">
                        {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                          record.status === 'LATE' ? 'bg-amber-100 text-amber-700' :
                          record.status === 'HALF_DAY' ? 'bg-orange-100 text-orange-700' :
                          record.status === 'OVERTIME' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-navy">
                        {record.workingHoursMinutes 
                          ? `${Math.floor(record.workingHoursMinutes / 60)}h ${record.workingHoursMinutes % 60}m` 
                          : '-'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate">
                        No recent attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AttendanceEmployee;

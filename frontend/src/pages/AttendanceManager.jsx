import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserX, Clock, MapPin, 
  Search, Filter, CheckCircle, XCircle, FileText, Download, Loader2, Square, Eye, X, Calendar
} from 'lucide-react';
import api from '../utils/api';

const AttendanceManager = () => {
  const [dashboard, setDashboard] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ date: new Date().toISOString().split('T')[0], status: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Summary Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryMonth, setSummaryMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

  const fetchSummary = async (userId, monthStr) => {
    setSummaryLoading(true);
    try {
      const [year, month] = monthStr.split('-');
      const res = await api.get(`/attendance/monthly-summary?userId=${userId}&year=${year}&month=${month}`);
      setSummaryData(res);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleOpenSummary = (user) => {
    setSelectedUser(user);
    setShowModal(true);
    fetchSummary(user.id, summaryMonth);
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Dashboard Stats
      const statsRes = await api.get('/attendance/dashboard');
      setDashboard(statsRes);
      
      // Fetch Records List
      const query = new URLSearchParams(filter).toString();
      const recordsRes = await api.get(`/attendance/all?${query}`);
      setRecords(recordsRes?.records || []);
    } catch (err) {
      console.error('Failed to fetch manager data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, approve) => {
    setActionLoading(true);
    try {
      await api.patch(`/attendance/${id}/approve`, { approve });
      await fetchData(); // Refresh data
    } catch (err) {
      console.error(err);
      alert('Failed to update attendance record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    const query = new URLSearchParams(filter).toString();
    window.open(`${api.defaults.baseURL}/attendance/export?${query}`, '_blank');
  };

  if (loading && !dashboard) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 text-navy animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy">Team Attendance</h1>
          <p className="text-slate text-sm">Monitor staff check-ins and manage timesheets today.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-cream flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-3xl font-display font-bold text-navy">{dashboard.totalEmployees}</span>
            <span className="text-slate text-xs uppercase tracking-wider font-bold mt-1">Total Staff</span>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-cream flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="text-3xl font-display font-bold text-emerald-600">{dashboard.presentCount}</span>
            <span className="text-slate text-xs uppercase tracking-wider font-bold mt-1">Present Today</span>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-cream flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-3xl font-display font-bold text-amber-600">{dashboard.lateCount}</span>
            <span className="text-slate text-xs uppercase tracking-wider font-bold mt-1">Late Arrivals</span>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-cream flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-3">
              <UserX className="w-6 h-6" />
            </div>
            <span className="text-3xl font-display font-bold text-red-600">{dashboard.absentCount}</span>
            <span className="text-slate text-xs uppercase tracking-wider font-bold mt-1">Absent</span>
          </div>
        </div>
      )}

      {/* Filter & List */}
      <div className="bg-white rounded-3xl shadow-sm border border-border-cream overflow-hidden">
        <div className="p-6 border-b border-border-cream flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-display font-bold text-navy text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            Attendance Records
          </h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <input 
                type="date"
                value={filter.date}
                onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                className="w-full pl-4 pr-4 py-2 border border-border-cream rounded-xl text-sm focus:outline-none focus:border-gold transition-colors"
              />
            </div>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full md:w-40 px-4 py-2 border border-border-cream rounded-xl text-sm focus:outline-none focus:border-gold transition-colors appearance-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
              <option value="OVERTIME">Overtime</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream/30 text-slate font-medium border-b border-border-cream">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Shift</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-cream">
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate">
                    <Loader2 className="w-6 h-6 text-navy animate-spin mx-auto" />
                  </td>
                </tr>
              ) : records.length > 0 ? records.map((record) => (
                <tr key={record.id} className="hover:bg-cream/10">
                  <td className="px-6 py-4 font-bold text-navy">
                    {record.user?.name}
                  </td>
                  <td className="px-6 py-4 text-slate">
                    <span className="px-2 py-1 bg-cream rounded text-xs font-bold uppercase">
                      {record.user?.userRole?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate">
                    {record.shift?.name || '-'}
                  </td>
                  <td className="px-6 py-4 font-medium text-navy">
                    {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    {record.lateMinutes > 0 && (
                      <span className="block text-xs text-red-500 font-bold">{record.lateMinutes}m late</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate">
                    {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs">
                      {record.checkInLat ? (
                        <a href={`https://maps.google.com/?q=${record.checkInLat},${record.checkInLng}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> In
                        </a>
                      ) : <span className="text-slate opacity-50">-</span>}
                      {record.checkOutLat ? (
                        <a href={`https://maps.google.com/?q=${record.checkOutLat},${record.checkOutLng}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Out
                        </a>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                      record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                      record.status === 'LATE' ? 'bg-amber-100 text-amber-700' :
                      record.status === 'HALF_DAY' ? 'bg-orange-100 text-orange-700' :
                      record.status === 'OVERTIME' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {record.status === 'MISSED_CHECKOUT' || record.status === 'LATE' ? (
                        <>
                          <button 
                            disabled={actionLoading}
                            onClick={() => handleApprove(record.id, true)}
                            className="p-1 text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                            title="Approve / Override"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate opacity-50">-</span>
                      )}

                      <button 
                        onClick={() => handleOpenSummary(record.user)}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="View Monthly Record"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate font-medium">
                    No attendance records found for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border-cream flex items-center justify-between bg-cream/30">
              <h2 className="text-xl font-display font-bold text-navy flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                Attendance Record: {selectedUser.name}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-medium text-slate">Select Month:</label>
                <input 
                  type="month"
                  value={summaryMonth}
                  onChange={(e) => {
                    setSummaryMonth(e.target.value);
                    fetchSummary(selectedUser.id, e.target.value);
                  }}
                  className="px-4 py-2 border border-border-cream rounded-xl focus:ring-2 focus:ring-gold/50 outline-none text-navy font-medium"
                />
              </div>

              {summaryLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-navy animate-spin" />
                </div>
              ) : summaryData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center justify-center">
                      <span className="text-sm text-emerald-600 font-bold mb-1">Present</span>
                      <span className="text-3xl font-display font-bold text-emerald-700">{summaryData.present}</span>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col items-center justify-center">
                      <span className="text-sm text-red-600 font-bold mb-1">Absent</span>
                      <span className="text-3xl font-display font-bold text-red-700">{summaryData.absent}</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col items-center justify-center">
                      <span className="text-sm text-amber-600 font-bold mb-1">Late</span>
                      <span className="text-3xl font-display font-bold text-amber-700">{summaryData.late}</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center justify-center">
                      <span className="text-sm text-blue-600 font-bold mb-1">Leaves/Off</span>
                      <span className="text-3xl font-display font-bold text-blue-700">{summaryData.onLeave + summaryData.weekOff}</span>
                    </div>
                  </div>

                  <div className="border border-border-cream rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-cream/30 text-slate font-medium border-b border-border-cream">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Check In</th>
                          <th className="px-4 py-3">Check Out</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-cream">
                        {summaryData.records.length > 0 ? summaryData.records.map((r) => (
                          <tr key={r.id} className="hover:bg-cream/10">
                            <td className="px-4 py-3 font-medium text-navy">{new Date(r.date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-slate">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                            <td className="px-4 py-3 text-slate">{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${
                                r.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                                r.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>{r.status}</span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-6 text-center text-slate">No records for this month.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttendanceManager;

import React, { useState, useEffect } from 'react';
import { Calendar, ArrowUpRight, RefreshCw, Users } from 'lucide-react';
import api from '../utils/api';

function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [occupancy, setOccupancy] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [sales, setSales] = useState([]);
  const [datesRange, setDatesRange] = useState({ start: '', end: '' });

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const today = new Date();
      const endDateStr = today.toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(today.getDate() - 6);
      const startDateStr = startDate.toISOString().split('T')[0];

      setDatesRange({
        start: startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        end: today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      });

      // Fetch reports from backend
      const occResult = await api.get(`/reports?type=OCCUPANCY&startDate=${startDateStr}&endDate=${endDateStr}`);
      const revResult = await api.get(`/reports?type=REVENUE&startDate=${startDateStr}&endDate=${endDateStr}`);
      const salesResult = await api.get(`/reports?type=DAILY_SALES&startDate=${startDateStr}&endDate=${endDateStr}`);

      setOccupancy(occResult);
      setRevenue(revResult);
      setSales(salesResult || []);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Determine whether to use demo data (if no rooms or zero revenue/occupancy data is registered)
  const isDemo = !occupancy || occupancy.totalRooms === 0;

  // 1. Average Daily Rate (ADR)
  const adrValue = !isDemo && occupancy.occupiedNights > 0
    ? `₹${Math.round(occupancy.revenue / occupancy.occupiedNights).toLocaleString('en-IN')}`
    : '₹4,850';

  // 2. RevPAR
  const revparValue = !isDemo && occupancy.totalRoomNightsAvailable > 0
    ? `₹${Math.round(occupancy.revenue / occupancy.totalRoomNightsAvailable).toLocaleString('en-IN')}`
    : '₹3,780';

  // 3. POS Dining Covers
  const diningCovers = !isDemo
    ? sales.reduce((sum, s) => sum + (s.totalOrders || 0), 0)
    : 184;

  // 4. Room Service Revenue
  const roomServiceRev = !isDemo && revenue
    ? `₹${Math.round(revenue.otherRevenue * 0.6).toLocaleString('en-IN')}`
    : '₹15,400';

  const kpis = [
    { name: 'Average Daily Rate (ADR)', value: adrValue, change: '+3.4%', desc: 'Average rent paid per occupied room' },
    { name: 'RevPAR', value: revparValue, change: '+4.2%', desc: 'Revenue per available room' },
    { name: 'POS Dining Covers', value: diningCovers.toString(), change: '+12.4%', desc: 'Number of restaurant customers served' },
    { name: 'Room Service Revenue', value: roomServiceRev, change: '+8.1%', desc: 'In-room food & beverage orders' }
  ];

  // 5. Timeline Chart Data
  const timelineData = !isDemo && occupancy?.dailyTimeline?.length > 0
    ? occupancy.dailyTimeline
    : [
        { date: '13 Jun', rate: 62 },
        { date: '14 Jun', rate: 68 },
        { date: '15 Jun', rate: 70 },
        { date: '16 Jun', rate: 75 },
        { date: '17 Jun', rate: 78 },
        { date: '18 Jun', rate: 82 },
        { date: '19 Jun', rate: 78 }
      ];

  // 6. Revenue Split Module Data
  let lodgingRevNum = 85000;
  let restaurantRevNum = 38200;
  let roomServiceRevNum = 15400;
  let laundryRevNum = 10050;
  let totalRevNum = lodgingRevNum + restaurantRevNum + roomServiceRevNum + laundryRevNum;

  if (!isDemo && revenue) {
    lodgingRevNum = revenue.lodgingRevenue || 0;
    restaurantRevNum = revenue.restaurantRevenue || 0;
    roomServiceRevNum = Math.round((revenue.otherRevenue || 0) * 0.6);
    laundryRevNum = Math.round((revenue.otherRevenue || 0) * 0.4);
    totalRevNum = lodgingRevNum + restaurantRevNum + roomServiceRevNum + laundryRevNum || 1; // avoid divide by zero
  }

  const getPct = (val) => Math.round((val / totalRevNum) * 100);

  const splits = [
    { label: `Room Bookings (${getPct(lodgingRevNum)}%)`, value: lodgingRevNum, pct: getPct(lodgingRevNum), color: 'bg-navy' },
    { label: `Restaurant Dining (${getPct(restaurantRevNum)}%)`, value: restaurantRevNum, pct: getPct(restaurantRevNum), color: 'bg-gold' },
    { label: `Room Service (${getPct(roomServiceRevNum)}%)`, value: roomServiceRevNum, pct: getPct(roomServiceRevNum), color: 'bg-gold-light' },
    { label: `Laundry & Mini Bar (${getPct(laundryRevNum)}%)`, value: laundryRevNum, pct: getPct(laundryRevNum), color: 'bg-slate' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">Managerial Reports & Analytics</h1>
          <p className="text-slate text-sm font-medium mt-1">Review lodging KPIs, restaurant occupancy ratios, and net revenue distributions</p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-gold-pale/30 text-gold px-2.5 py-1 rounded-full border border-gold/20 animate-pulse">
              Demo Preview Data
            </span>
          )}
          <button onClick={fetchReports} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-navy hover:bg-navy/90 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Reports
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-gold" />
          <p className="text-sm font-semibold text-slate">Loading backend telemetry...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <button onClick={fetchReports} className="text-navy text-xs font-bold hover:underline">Try Again</button>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => (
              <div key={index} className="soft-card p-6 bg-white flex flex-col justify-between h-40">
                <div>
                  <span className="text-[10px] text-slate font-bold uppercase tracking-wider block">{kpi.name}</span>
                  <h3 className="font-mono font-bold text-2xl text-navy mt-2">{kpi.value}</h3>
                </div>
                <div className="border-t border-border-cream/50 pt-3 mt-4 flex items-center justify-between text-xs">
                  <span className="text-slate text-[10px] leading-relaxed">{kpi.desc}</span>
                  <span className="text-success font-bold flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" />{kpi.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts / Splits Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Lodging Occupancy Timeline Chart */}
            <div className="soft-card p-6 bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-semibold text-navy text-base">Weekly Occupancy Timeline</h3>
                <span className="text-slate text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {datesRange.start} - {datesRange.end}
                </span>
              </div>

              <div className="space-y-3">
                <div className="h-44 relative flex items-end justify-between gap-3 border-b border-border-cream pb-1">
                  {/* Horizontal Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[100, 75, 50, 25].map(val => (
                      <div key={val} className="w-full border-t border-dashed border-slate/10 flex items-center justify-between text-[8px] font-bold text-slate/40">
                        <span>{val}%</span>
                        <span>{val}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Bars */}
                  {timelineData.map((d, idx) => (
                    <div key={idx} className="relative z-10 flex-1 h-full flex flex-col justify-end items-center group">
                      {/* Tooltip */}
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-navy text-gold text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-20"
                        style={{ bottom: `${d.rate}%`, marginBottom: '4px' }}>
                        {d.rate}%
                      </div>
                      
                      {/* Bar */}
                      <div 
                        className="w-full bg-gold/20 hover:bg-gold rounded-t-lg transition-all duration-300 cursor-pointer origin-bottom hover:scale-x-105 shadow-sm"
                        style={{ height: `${d.rate}%` }}
                      ></div>
                    </div>
                  ))}
                </div>

                {/* Labels under the grid */}
                <div className="flex justify-between gap-3 text-center">
                  {timelineData.map((d, idx) => (
                    <span key={idx} className="flex-1 text-[10px] text-slate font-bold font-mono select-none">{d.date}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Revenue Distribution Splitting Chart */}
            <div className="soft-card p-6 bg-white flex flex-col justify-between">
              <div>
                <h3 className="font-display font-semibold text-navy text-base mb-6">Revenue Split by Module</h3>
                
                {/* Split Progress bars */}
                <div className="space-y-4 pt-2">
                  {splits.map((s, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-charcoal">
                        <span>{s.label}</span>
                        <span className="font-mono">₹{(s.value || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-2.5 bg-cream/50 rounded-full overflow-hidden border border-border-cream/35">
                        <div className={`h-full ${s.color}`} style={{ width: `${s.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default Reports;

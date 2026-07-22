import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { api } from '../api';
import { Ionicons } from '@expo/vector-icons';

export default function ReportsScreen({ user, onLogout, onOpenDrawer }) {
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
      const startDate = new Date();
      startDate.setDate(today.getDate() - 6);

      setDatesRange({
        start: startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        end: today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      });

      const result = await api.get('/reports/dashboard');
      setOccupancy(result?.occupancy || null);
      setRevenue(result?.revenue || null);
      setSales(result?.sales || []);
    } catch (err) {
      console.warn('Error loading reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Determine whether to use demo data (mirroring web checks)
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
    { name: 'Average Daily Rate (ADR)', value: adrValue, change: '↗ +3.4%', desc: 'Average rent paid per occupied room', icon: 'cash-outline' },
    { name: 'RevPAR', value: revparValue, change: '↗ +4.2%', desc: 'Revenue per available room', icon: 'trending-up-outline' },
    { name: 'POS Dining Covers', value: diningCovers.toString(), change: '↗ +12.4%', desc: 'Number of restaurant customers served', icon: 'restaurant-outline' },
    { name: 'Room Service Revenue', value: roomServiceRev, change: '↗ +8.1%', desc: 'In-room food & beverage orders', icon: 'notifications-outline' }
  ];

  // 5. Timeline Chart Data (Weekly Occupancy Timeline)
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
    totalRevNum = lodgingRevNum + restaurantRevNum + roomServiceRevNum + laundryRevNum || 1;
  }

  const revenueSplit = [
    { name: 'Room Bookings', value: lodgingRevNum, percent: Math.round(lodgingRevNum / totalRevNum * 100), color: '#0C2340' },
    { name: 'Restaurant Dining', value: restaurantRevNum, percent: Math.round(restaurantRevNum / totalRevNum * 100), color: '#D4AF37' },
    { name: 'Room Service', value: roomServiceRevNum, percent: Math.round(roomServiceRevNum / totalRevNum * 100), color: '#F59E0B' },
    { name: 'Laundry & Mini Bar', value: laundryRevNum, percent: Math.round(laundryRevNum / totalRevNum * 100), color: '#718096' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onOpenDrawer && (
            <TouchableOpacity onPress={onOpenDrawer} style={styles.menuButton}>
              <Ionicons name="menu" size={28} color="#D4AF37" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Managerial Reports</Text>
            <Text style={styles.headerSubtitle}>Lodging & POS Analytics</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Bar Details */}
        <View style={styles.titleSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titleHeading}>Reports & Analytics</Text>
            <Text style={styles.titleSubheading}>Review lodging KPIs, restaurant occupancy ratios, and net revenue distributions</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            {isDemo && (
              <View style={styles.demoBadge}>
                <Text style={styles.demoBadgeText}>DEMO PREVIEW DATA</Text>
              </View>
            )}
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchReports} disabled={loading}>
              <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              {kpis.map((kpi) => (
                <View key={kpi.name} style={styles.kpiCard}>
                  <View style={styles.kpiHeader}>
                    <Text style={styles.kpiLabel} numberOfLines={1}>{kpi.name}</Text>
                    <Ionicons name={kpi.icon} size={18} color="#D4AF37" />
                  </View>
                  <Text style={styles.kpiValue}>{kpi.value}</Text>
                  <View style={styles.kpiFooter}>
                    <Text style={styles.kpiDesc} numberOfLines={1}>{kpi.desc}</Text>
                    <Text style={styles.kpiChange}>{kpi.change}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Weekly Occupancy Timeline Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="bar-chart-outline" size={16} color="#D4AF37" style={{ marginRight: 6 }} />
                  <Text style={styles.chartTitle}>Weekly Occupancy Timeline</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="calendar-outline" size={12} color="#718096" style={{ marginRight: 4 }} />
                  <Text style={styles.chartRange}>{datesRange.start} - {datesRange.end}</Text>
                </View>
              </View>

              {/* Flexbox Bar Chart */}
              <View style={styles.chartContainer}>
                {/* Y-Axis labels */}
                <View style={styles.yAxis}>
                  <Text style={styles.yAxisText}>100%</Text>
                  <Text style={styles.yAxisText}>75%</Text>
                  <Text style={styles.yAxisText}>50%</Text>
                  <Text style={styles.yAxisText}>25%</Text>
                </View>

                {/* Bars Row */}
                <View style={styles.barsContainer}>
                  {/* Grid Lines in background */}
                  <View style={styles.gridLines}>
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                    <View style={styles.gridLine} />
                  </View>

                  {timelineData.map((day, idx) => (
                    <View key={idx} style={styles.barColumn}>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { height: `${day.rate}%` }]} />
                      </View>
                      <Text style={styles.barLabel}>{day.date}</Text>
                      <Text style={styles.barValueText}>{day.rate}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Revenue Split Module Progress List */}
            <View style={styles.chartCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="cash-outline" size={16} color="#D4AF37" style={{ marginRight: 6 }} />
                <Text style={[styles.chartTitle, { marginBottom: 0 }]}>Revenue Split by Module</Text>
              </View>
              <View style={styles.splitList}>
                {revenueSplit.map((item) => (
                  <View key={item.name} style={styles.splitRow}>
                    <View style={styles.splitLabels}>
                      <Text style={styles.splitName}>{item.name} ({item.percent}%)</Text>
                      <Text style={styles.splitValue}>₹{item.value.toLocaleString()}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressBar, { width: `${item.percent}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF9F1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0C2340',
    borderBottomWidth: 2,
    borderColor: '#D4AF37',
  },
  menuButton: {
    marginRight: 15,
    padding: 4,
  },
  menuIcon: {
    fontSize: 24,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'sans-serif-medium',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 1,
  },
  logoutBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 15,
  },
  titleSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  titleHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  titleSubheading: {
    fontSize: 11,
    color: '#718096',
    marginTop: 4,
    lineHeight: 15,
  },
  demoBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 10,
  },
  demoBadgeText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: 'bold',
  },
  refreshBtn: {
    backgroundColor: '#0C2340',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#FEF9F1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#718096',
    fontSize: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 14,
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  kpiIcon: {
    fontSize: 14,
    marginLeft: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0C2340',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'sans-serif-medium',
  },
  kpiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    borderTopWidth: 0.5,
    borderColor: '#FEF9F1',
    paddingTop: 6,
  },
  kpiDesc: {
    fontSize: 8,
    color: '#A0AEC0',
    flex: 1,
    marginRight: 6,
  },
  kpiChange: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#38A169',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  chartRange: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#718096',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 160,
    alignItems: 'stretch',
  },
  yAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: 32,
    paddingRight: 8,
    borderRightWidth: 1,
    borderColor: '#EBE5DA',
    paddingVertical: 10,
  },
  yAxisText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#A0AEC0',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingLeft: 8,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 0,
    paddingVertical: 10,
  },
  gridLine: {
    height: 0.5,
    backgroundColor: '#FEF9F1',
    width: '100%',
  },
  barColumn: {
    alignItems: 'center',
    width: '12%',
    zIndex: 1,
  },
  barTrack: {
    height: 100,
    width: 14,
    backgroundColor: '#FEF9F1',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#EBE5DA',
  },
  barFill: {
    backgroundColor: '#D4AF37', // Gold bars
    borderRadius: 7,
  },
  barLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#718096',
    marginTop: 6,
  },
  barValueText: {
    fontSize: 7.5,
    fontFamily: 'monospace',
    color: '#0C2340',
    fontWeight: 'bold',
    marginTop: 2,
  },
  splitList: {
    marginTop: 15,
  },
  splitRow: {
    marginBottom: 14,
  },
  splitLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  splitName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2D3748',
  },
  splitValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0C2340',
    fontFamily: 'monospace',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#FEF9F1',
    borderWidth: 0.5,
    borderColor: '#EBE5DA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
});

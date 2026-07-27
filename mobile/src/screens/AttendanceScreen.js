import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { api } from '../api';
import { Ionicons } from '@expo/vector-icons';

export default function AttendanceScreen({ user, onLogout, onOpenDrawer }) {
  const [todayRecord, setTodayRecord] = useState(null);
  const [shift, setShift] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live Clock Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    setLocationError('');
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
      console.warn(err);
      setError('Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  // Polyfilled Geolocation resolver matching web
  const getPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your device'));
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
        setLocationError('Could not get precise location. Ensure location permissions are granted.');
      }

      if (type === 'checkin') {
        await api.post('/attendance/checkin', payload);
        Alert.alert('Success', 'Successfully checked in!');
      } else {
        await api.post('/attendance/checkout', payload);
        Alert.alert('Success', 'Successfully checked out!');
      }
      
      await fetchData(); // Refresh data
    } catch (err) {
      setError(err.message || 'Action failed.');
      Alert.alert('Action Failed', err.message || 'Check-in/Check-out request failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const isCheckedIn = todayRecord && todayRecord.checkInTime && !todayRecord.checkOutTime;
  const isCheckedOut = todayRecord && todayRecord.checkOutTime;

  const getStatusCircleStyle = () => {
    if (isCheckedIn) return styles.circleWorking;
    if (isCheckedOut) return styles.circleFinished;
    return styles.circleReady;
  };

  const getStatusTextStyle = () => {
    if (isCheckedIn) return styles.statusTextWorking;
    if (isCheckedOut) return styles.statusTextFinished;
    return styles.statusTextReady;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    try {
      return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '-';
    }
  };

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
            <Text style={styles.headerTitle}>My Attendance</Text>
            <Text style={styles.headerSubtitle}>Staff Timesheet Panel</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
         {/* Dynamic Live Clock Row */}
         <View style={styles.clockCard}>
           <Ionicons name="time-outline" size={26} color="#D4AF37" style={{ marginRight: 10 }} />
           <Text style={styles.clockText}>
             {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
           </Text>
         </View>

         {/* Warning messages */}
         {error ? (
           <View style={styles.errorBox}>
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <Ionicons name="alert-circle-outline" size={16} color="#C53030" style={{ marginRight: 6 }} />
               <Text style={styles.errorText}>{error}</Text>
             </View>
           </View>
         ) : null}

         {locationError ? (
           <View style={styles.warningBox}>
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <Ionicons name="location-outline" size={16} color="#C53030" style={{ marginRight: 6 }} />
               <Text style={styles.warningText}>{locationError}</Text>
             </View>
           </View>
         ) : null}

        {loading && !actionLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingText}>Fetching attendance records...</Text>
          </View>
        ) : (
          <>
            {/* Left Card: Today's Status */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Today's Status</Text>
              <Text style={styles.cardSubtitle}>
                {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>

              {/* Circle Status Indicator */}
              <View style={[styles.statusCircle, getStatusCircleStyle()]}>
                <Text style={[styles.statusCircleLabel, getStatusTextStyle()]}>
                  {isCheckedIn ? 'WORKING' : isCheckedOut ? 'FINISHED' : 'READY'}
                </Text>
                {todayRecord?.checkInTime && !isCheckedOut && (
                  <Text style={styles.sinceText}>
                    Since {formatTime(todayRecord.checkInTime)}
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                 {isCheckedOut ? (
                  <View style={styles.checkedOutBanner}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#2F855A" style={{ marginRight: 6 }} />
                    <Text style={styles.checkedOutText}>Checked Out for Today</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.checkInBtn, (isCheckedIn || actionLoading) && styles.disabledBtn]}
                      disabled={actionLoading || isCheckedIn}
                      onPress={() => handleAction('checkin')}
                    >
                      {actionLoading && !isCheckedIn ? (
                        <ActivityIndicator size="small" color="#D4AF37" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="play" size={14} color="#0C2340" style={{ marginRight: 4 }} />
                          <Text style={styles.checkInBtnText}>Check In</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.checkOutBtn, 
                        (!isCheckedIn || actionLoading) ? styles.checkOutBtnDisabled : styles.checkOutBtnEnabled
                      ]}
                      disabled={actionLoading || !isCheckedIn}
                      onPress={() => handleAction('checkout')}
                    >
                      {actionLoading && isCheckedIn ? (
                        <ActivityIndicator size="small" color="#E53E3E" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="stop" size={14} color={isCheckedIn ? "#E53E3E" : "#A0AEC0"} style={{ marginRight: 4 }} />
                          <Text style={[styles.checkOutBtnText, isCheckedIn ? styles.checkOutTextEnabled : styles.checkOutTextDisabled]}>
                            Check Out
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* Right Card: Current Shift */}
            <View style={styles.card}>
               <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                 <Ionicons name="calendar-outline" size={16} color="#D4AF37" style={{ marginRight: 6 }} />
                 <Text style={[styles.cardTitle, { marginBottom: 0 }]}>My Current Shift</Text>
               </View>
              {shift ? (
                <View style={styles.shiftGrid}>
                  <View style={styles.shiftItem}>
                    <Text style={styles.shiftLabel}>Shift Name</Text>
                    <Text style={styles.shiftValue}>{shift.name}</Text>
                  </View>
                  <View style={styles.shiftItem}>
                    <Text style={styles.shiftLabel}>Start Time</Text>
                    <Text style={styles.shiftValue}>{shift.startTime}</Text>
                  </View>
                  <View style={styles.shiftItem}>
                    <Text style={styles.shiftLabel}>End Time</Text>
                    <Text style={styles.shiftValue}>{shift.endTime}</Text>
                  </View>
                  <View style={styles.shiftItem}>
                    <Text style={styles.shiftLabel}>Grace Period</Text>
                    <Text style={styles.shiftValue}>{shift.gracePeriodMinutes} mins</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>You are not currently assigned to any shift.</Text>
                </View>
              )}
            </View>

            {/* Bottom Card: Recent History Ledger */}
            <View style={styles.card}>
               <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                 <Ionicons name="receipt-outline" size={16} color="#D4AF37" style={{ marginRight: 6 }} />
                 <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Recent History</Text>
               </View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCol, { flex: 1.2 }]}>Date</Text>
                <Text style={styles.tableCol}>In</Text>
                <Text style={styles.tableCol}>Out</Text>
                <Text style={[styles.tableCol, { textAlign: 'center' }]}>Status</Text>
                <Text style={[styles.tableCol, { textAlign: 'right' }]}>Hrs</Text>
              </View>
              
              {history.length > 0 ? (
                history.map((record) => {
                  const isPresent = record.status === 'PRESENT' || record.status === 'OVERTIME';
                  const isLate = record.status === 'LATE' || record.status === 'HALF_DAY';
                  
                  return (
                    <View key={record.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1.2, fontWeight: 'bold' }]}>
                        {new Date(record.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </Text>
                      <Text style={styles.tableCell}>{formatTime(record.checkInTime)}</Text>
                      <Text style={styles.tableCell}>{formatTime(record.checkOutTime)}</Text>
                      
                      <View style={[styles.tableCell, { alignItems: 'center' }]}>
                        <View style={[
                          styles.statusPill,
                          isPresent ? styles.pillPresent : isLate ? styles.pillLate : styles.pillAbsent
                        ]}>
                          <Text style={[
                            styles.statusPillText,
                            isPresent ? styles.pillTextPresent : isLate ? styles.pillTextLate : styles.pillTextAbsent
                          ]}>
                            {record.status}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.tableCell, { textAlign: 'right', fontFamily: 'monospace' }]}>
                        {record.workingHoursMinutes 
                          ? `${Math.floor(record.workingHoursMinutes / 60)}h ${record.workingHoursMinutes % 60}m` 
                          : '-'}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No recent attendance records found.</Text>
                </View>
              )}
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
    paddingBottom: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 16,
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
  clockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  clockIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  clockText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0C2340',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorBox: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FED7D7',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  errorText: {
    color: '#C53030',
    fontSize: 12,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  warningText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '600',
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#718096',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0C2340',
    alignSelf: 'flex-start',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  statusCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  circleReady: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  circleWorking: {
    borderColor: '#FBBF24',
    backgroundColor: '#FFFBEB',
  },
  circleFinished: {
    borderColor: '#34D399',
    backgroundColor: '#ECFDF5',
  },
  statusCircleLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  statusTextReady: {
    color: '#2563EB',
  },
  statusTextWorking: {
    color: '#D97706',
  },
  statusTextFinished: {
    color: '#059669',
  },
  sinceText: {
    fontSize: 10,
    color: '#718096',
    marginTop: 3,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  checkInBtn: {
    flex: 1,
    backgroundColor: '#0C2340',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  checkInBtnText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkOutBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  checkOutBtnEnabled: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
  },
  checkOutBtnDisabled: {
    backgroundColor: '#FEF9F1',
    borderColor: '#EBE5DA',
    opacity: 0.5,
  },
  checkOutBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkOutTextEnabled: {
    color: '#C53030',
  },
  checkOutTextDisabled: {
    color: '#A0AEC0',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  checkedOutBanner: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedOutText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: 'bold',
  },
  shiftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  shiftItem: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.12)',
    borderRadius: 10,
    padding: 10,
    width: '48%',
    marginBottom: 10,
  },
  shiftLabel: {
    fontSize: 8,
    color: '#718096',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  shiftValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  emptyText: {
    color: '#718096',
    fontSize: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: 1.5,
    borderColor: '#EBE5DA',
    paddingBottom: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  tableCol: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0C2340',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#FEF9F1',
    paddingVertical: 10,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
    color: '#2D3748',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  pillPresent: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  pillLate: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  pillAbsent: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
  },
  statusPillText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  pillTextPresent: {
    color: '#059669',
  },
  pillTextLate: {
    color: '#D97706',
  },
  pillTextAbsent: {
    color: '#C53030',
  },
});

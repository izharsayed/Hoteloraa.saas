import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { api } from '../api';
import { Ionicons } from '@expo/vector-icons';

export default function CheckInScreen({ user, onLogout, onOpenDrawer }) {
  const [pendingReservations, setPendingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState('');
  
  // Selection & Form States
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [idType, setIdType] = useState('AADHAAR');
  const [idNumber, setIdNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingCheckIns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/check-in/pending');
      setPendingReservations(data || []);
    } catch (e) {
      console.warn(e);
      setError('Failed to fetch pending check-ins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCheckIns();
  }, []);

  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking);
    setIsCheckedIn(false);
    setIdType(booking.guest?.idType || 'AADHAAR');
    setIdNumber(booking.guest?.idNumber || '');
    setNotes('');
  };

  const handleCompleteCheckIn = async () => {
    if (!idNumber) {
      Alert.alert('Error', 'Please enter a guest ID verification number.');
      return;
    }

    try {
      setSubmitting(true);
      
      // 1. Update guest ID info if it has changed
      if (
        selectedBooking.guest?.idType !== idType ||
        selectedBooking.guest?.idNumber !== idNumber
      ) {
        await api.put(`/guests/${selectedBooking.guest?.id}`, {
          idType,
          idNumber,
        });
      }

      // 2. Perform check-in
      await api.post('/check-in', {
        reservationId: selectedBooking.id,
        notes: notes || undefined,
      });

      setIsCheckedIn(true);
      fetchPendingCheckIns(); // Refresh registry list
    } catch (err) {
      console.warn(err);
      Alert.alert('Check-In Failed', err.message || 'Failed to complete check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBookings = pendingReservations.filter((booking) => {
    const searchLower = searchId.toLowerCase();
    const guestName = booking.guest?.name?.toLowerCase() || '';
    const guestPhone = booking.guest?.phone?.toLowerCase() || '';
    const ref = booking.bookingRef?.toLowerCase() || '';
    return (
      guestName.includes(searchLower) ||
      guestPhone.includes(searchLower) ||
      ref.includes(searchLower)
    );
  });

  const idTypes = [
    { value: 'AADHAAR', label: 'Aadhaar Card' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'DRIVING_LICENSE', label: 'Driving License' },
    { value: 'NATIONAL_ID', label: 'National ID' },
    { value: 'OTHER', label: 'Other ID' },
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
            <Text style={styles.headerTitle}>Check-In Registry</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Front Desk</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Block */}
        <View style={styles.titleSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleHeading}>Front Desk Check-In</Text>
              <Text style={styles.titleSubheading}>Verify guests, assign room numbers, and issue room access keys</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchPendingCheckIns} disabled={loading}>
              <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Success Banner */}
        {isCheckedIn && selectedBooking ? (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>🛡️</Text>
            <Text style={styles.successTitle}>Check-In Completed!</Text>
            <Text style={styles.successText}>
              Room <Text style={{ fontWeight: 'bold', color: '#0C2340' }}>{selectedBooking.room?.number}</Text> is now marked as Occupied.
            </Text>
            <TouchableOpacity
              style={styles.successCloseBtn}
              onPress={() => {
                setSelectedBooking(null);
                setSearchId('');
                setIsCheckedIn(false);
              }}
            >
              <Text style={styles.successCloseBtnText}>Return to Front Desk</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Search & Pending Check-ins Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Search Reservations</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Search by Guest Name, Booking Ref, or Phone..."
                placeholderTextColor="#A0AEC0"
                value={searchId}
                onChangeText={setSearchId}
              />

              {/* Pending List */}
              {loading ? (
                <View style={styles.centerLoading}>
                  <ActivityIndicator size="small" color="#D4AF37" />
                  <Text style={styles.loadingText}>Loading pending check-ins...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              ) : filteredBookings.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    {searchId ? 'No matching pending reservations found.' : 'No pending check-ins today.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.listWrapper}>
                  {filteredBookings.map((booking) => {
                    const isSelected = selectedBooking?.id === booking.id;
                    return (
                      <TouchableOpacity
                        key={booking.id}
                        style={[styles.bookingRow, isSelected && styles.bookingRowActive]}
                        onPress={() => handleSelectBooking(booking)}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.guestName}>{booking.guest?.name}</Text>
                            <View style={styles.refPill}>
                              <Text style={styles.refPillText}>{booking.bookingRef}</Text>
                            </View>
                          </View>
                          <Text style={styles.guestMeta}>
                            {booking.guest?.phone} | Pre-assigned: Room {booking.room?.number}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.roomType}>{booking.room?.roomType?.name}</Text>
                          <Text style={styles.dateRange}>
                            {new Date(booking.checkInDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} to {new Date(booking.checkOutDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Registration Form when booking is selected */}
            {selectedBooking && (
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Check-In Registration</Text>
                <View style={styles.summaryBox}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>PRIMARY GUEST</Text>
                    <Text style={styles.summaryVal}>👤 {selectedBooking.guest?.name}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>ASSIGNED ROOM</Text>
                    <Text style={styles.summaryVal}>🔑 Room {selectedBooking.room?.number} ({selectedBooking.room?.roomType?.name})</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>DATES & PAX</Text>
                    <Text style={styles.summaryVal}>📅 {new Date(selectedBooking.checkInDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(selectedBooking.checkOutDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} ({selectedBooking.adults} Adults)</Text>
                  </View>
                </View>

                {/* Form fields */}
                <Text style={styles.formLabel}>Identity Document Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 35, marginBottom: 12 }}>
                  {idTypes.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.badgeBtn, idType === opt.value && styles.badgeBtnActive]}
                      onPress={() => setIdType(opt.value)}
                    >
                      <Text style={[styles.badgeBtnText, idType === opt.value && styles.badgeBtnTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.formLabel}>ID Document Number *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter ID document number"
                  placeholderTextColor="#A0AEC0"
                  value={idNumber}
                  onChangeText={setIdNumber}
                />

                <Text style={styles.formLabel}>Check-In Notes / Comments</Text>
                <TextInput
                  style={[styles.formInput, { height: 60 }]}
                  placeholder="Add special requests, baggage notes, or check-in remarks..."
                  placeholderTextColor="#A0AEC0"
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleCompleteCheckIn}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#D4AF37" />
                  ) : (
                    <Text style={styles.submitBtnText}>👤 Check-In Guest & Activate Keys</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Front Desk Guidelines Card */}
            <View style={styles.card}>
              <Text style={[styles.cardHeading, { color: '#D4AF37' }]}>ℹ️ Front Desk Guidelines</Text>
              <View style={styles.guidelinesList}>
                <Text style={styles.guidelineItem}>• Verify guest photo matches ID document provided.</Text>
                <Text style={styles.guidelineItem}>• Take print or digital scan of the ID document for tenant records.</Text>
                <Text style={styles.guidelineItem}>• Verify that pre-assigned room {selectedBooking ? `(Room ${selectedBooking.room?.number})` : ''} matches the category booked.</Text>
                <Text style={styles.guidelineItem}>• Configure digital room card keys on the encoder terminal.</Text>
                <Text style={styles.guidelineItem}>• Add any initial deposit charges to the guest folio ledger.</Text>
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
  refreshBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#0C2340',
    fontSize: 10,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#0C2340',
    marginBottom: 12,
  },
  centerLoading: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#718096',
    fontSize: 11,
  },
  errorBox: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    color: '#C53030',
    fontSize: 11,
  },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#EBE5DA',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: '#718096',
  },
  listWrapper: {
    maxHeight: 220,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  bookingRowActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderColor: '#D4AF37',
  },
  guestName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  refPill: {
    backgroundColor: '#FEF9F1',
    borderWidth: 0.5,
    borderColor: '#EBE5DA',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  refPillText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#718096',
    fontFamily: 'monospace',
  },
  guestMeta: {
    fontSize: 9.5,
    color: '#718096',
    marginTop: 2,
  },
  roomType: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  dateRange: {
    fontSize: 8.5,
    color: '#A0AEC0',
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 15,
  },
  summaryItem: {
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#718096',
    letterSpacing: 0.5,
  },
  summaryVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0C2340',
    marginTop: 2,
  },
  formLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0C2340',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#0C2340',
    fontWeight: '600',
    marginBottom: 12,
  },
  badgeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginRight: 6,
    justifyContent: 'center',
  },
  badgeBtnActive: {
    backgroundColor: '#0C2340',
    borderColor: '#0C2340',
  },
  badgeBtnText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#718096',
  },
  badgeBtnTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#D4AF37',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  guidelinesList: {
    marginTop: 5,
  },
  guidelineItem: {
    fontSize: 10.5,
    color: '#718096',
    lineHeight: 16,
    marginBottom: 4,
  },
  successCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  successText: {
    fontSize: 11.5,
    color: '#718096',
    marginTop: 4,
    textAlign: 'center',
  },
  successCloseBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 15,
  },
  successCloseBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

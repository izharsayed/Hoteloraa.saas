import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { api, getAbsoluteAssetUrl } from '../api';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const SERVICE_CHARGES = {
  'Extra Bed': 1000,
  'Airport Pickup': 1500,
  'Anniversary Decoration': 2000,
  'Birthday Decoration': 1500,
  'Early Check-in': 500,
  'Late Check-in': 500,
  'Sea View': 1000,
};

const SPECIAL_REQUESTS = [
  'Extra Bed', 'Late Check-in', 'Early Check-in', 'Airport Pickup',
  'Non-Smoking Room', 'High Floor', 'Anniversary Decoration', 'Birthday Decoration',
  'Quiet Room', 'Sea View', 'Twin Beds', 'Double Bed'
];

const INTERNAL_FLAGS = [
  'VIP Guest', 'Repeat Guest', 'Blacklisted', 'Special Assistance'
];

export default function ReservationsScreen({ user, onLogout, onOpenDrawer, onNavigate, setCheckoutRoomId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals
  const [showWizard, setShowWizard] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);

  // Wizard Step states
  const [wizardStep, setWizardStep] = useState(1); // 1: Dates & Rooms, 2: Guest & ID Verification, 3: Billing & Confirm
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Booking Form Fields
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [ratePerNight, setRatePerNight] = useState('');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  
  // Primary Guest Details
  const [guestPhone, setGuestPhone] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestFoundId, setGuestFoundId] = useState(null);
  const [searchingGuest, setSearchingGuest] = useState(false);

  // ID Documents List (Primary Guest + Co-Guests)
  // Each doc: { id, idType, idNumber, frontUrl, backUrl, idProofUrl, guestName, gender, dateOfBirth, phone, email, uploadingSide: 'front'|'back'|null }
  const [idDocuments, setIdDocuments] = useState([
    { id: 'primary', idType: 'AADHAAR', idNumber: '', frontUrl: '', backUrl: '', idProofUrl: '', guestName: '', gender: 'MALE', dateOfBirth: '', phone: '', email: '', uploadingSide: null }
  ]);

  // Billing Fields
  const [advancePaid, setAdvancePaid] = useState('0');
  const [advanceMethod, setAdvanceMethod] = useState('CASH');
  const [bookingSource, setBookingSource] = useState('WALK_IN');
  const [notes, setNotes] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Additional Information states
  const [specialRequests, setSpecialRequests] = useState([]);
  const [internalFlags, setInternalFlags] = useState([]);
  const [extraCharges, setExtraCharges] = useState(0);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Helper date formatter
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Set default dates on load
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    setCheckInDate(formatDateString(today));
    setCheckOutDate(formatDateString(tomorrow));
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/reservations');
      setBookings(data || []);
    } catch (err) {
      console.warn(err);
      setError('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleSearchGuest = async () => {
    if (!guestPhone) {
      Alert.alert('Phone Required', 'Please enter a phone number to search.');
      return;
    }
    setSearchingGuest(true);
    try {
      const data = await api.get(`/guests?search=${encodeURIComponent(guestPhone)}`);
      if (data && data.length > 0) {
        const found = data[0];
        setGuestFoundId(found.id);
        setGuestName(found.name);
        setGuestEmail(found.email || '');
        
        // Sync primary ID doc
        setIdDocuments(prev => {
          const next = [...prev];
          next[0] = {
            ...next[0],
            idType: found.idType || 'AADHAAR',
            idNumber: found.idNumber || '',
            idProofUrl: found.idProofUrl || '',
            frontUrl: found.idProofUrl || '', // Fallback preview
            guestName: found.name,
            phone: found.phone || '',
            email: found.email || ''
          };
          return next;
        });

        showToast(`Welcoming back guest ${found.name}!`);
      } else {
        setGuestFoundId(null);
        showToast('Guest record not found. Creating a new profile.');
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setSearchingGuest(false);
    }
  };

  const handleLoadAvailableRooms = async () => {
    if (!checkInDate || !checkOutDate) return;
    setRoomsLoading(true);
    try {
      const data = await api.get(`/rooms/available?checkIn=${checkInDate}&checkOut=${checkOutDate}`);
      setAvailableRooms(data || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setRoomsLoading(false);
    }
  };

  // Fetch rooms when checkIn/checkOut change
  useEffect(() => {
    if (showWizard) {
      handleLoadAvailableRooms();
    }
  }, [checkInDate, checkOutDate, showWizard]);

  // Handle actual ID document gallery picking
  const handlePickImageFromLibrary = async (docId, side) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow photo library access to upload ID photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await uploadImageFile(docId, side, selectedImage.uri);
      }
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Failed to select photo from library.");
    }
  };

  // Handle actual ID document camera capturing
  const handleCaptureImageWithCamera = async (docId, side) => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow camera access to capture ID photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await uploadImageFile(docId, side, selectedImage.uri);
      }
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Failed to capture photo with camera.");
    }
  };

  // Upload local image URI to server /guests/upload-id
  const uploadImageFile = async (docId, side, uri) => {
    setIdDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        return { ...d, uploadingSide: side };
      }
      return d;
    }));

    try {
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: filename,
        type: type,
      });

      const res = await api.upload('/guests/upload-id', formData);
      
      setIdDocuments(prev => prev.map(d => {
        if (d.id === docId) {
          const updated = {
            ...d,
            [`${side}Url`]: res.url,
            idProofUrl: res.url,
            uploadingSide: null
          };
          return updated;
        }
        return d;
      }));
      showToast(`${side.toUpperCase()} ID side uploaded!`);
    } catch (err) {
      console.warn('Upload failed, using local fallback preview:', err);
      // Fallback: Use local URI as preview so it is still visible, but log error
      setIdDocuments(prev => prev.map(d => {
        if (d.id === docId) {
          return {
            ...d,
            [`${side}Url`]: uri,
            idProofUrl: uri,
            uploadingSide: null
          };
        }
        return d;
      }));
      showToast(`${side.toUpperCase()} ID uploaded locally (offline mode).`);
    }
  };

  // Add a Co-Guest slot
  const handleAddCoGuest = () => {
    setIdDocuments(prev => [
      ...prev,
      {
        id: Date.now(),
        idType: 'AADHAAR',
        idNumber: '',
        frontUrl: '',
        backUrl: '',
        idProofUrl: '',
        guestName: '',
        gender: 'MALE',
        dateOfBirth: '',
        phone: '',
        email: '',
        uploadingSide: null
      }
    ]);
    showToast('Co-Guest document slot added.');
  };

  // Remove a Co-Guest slot
  const handleRemoveCoGuest = (docId) => {
    setIdDocuments(prev => prev.filter(d => d.id !== docId));
    showToast('Co-Guest document removed.');
  };

  // Update co-guest fields
  const handleUpdateDocField = (docId, key, val) => {
    setIdDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        return { ...d, [key]: val };
      }
      return d;
    }));
  };

  const handleNextStep = () => {
    if (wizardStep === 1) {
      if (!selectedRoomId) {
        Alert.alert('Error', 'Please select an available room.');
        return;
      }
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (!guestPhone || !guestName) {
        Alert.alert('Error', 'Guest Name and Phone are required.');
        return;
      }
      // Check if primary ID number is entered
      if (!idDocuments[0].idNumber) {
        Alert.alert('Identity Verification Required', 'Please enter primary guest ID Number.');
        return;
      }
      setWizardStep(3);
    } else if (wizardStep === 3) {
      setWizardStep(4);
    }
  };

  const handleCreateReservation = async () => {
    try {
      setSubmittingBooking(true);
      let guestId = guestFoundId;

      // 1. Create primary guest profile if not found
      if (!guestId) {
        const createdGuest = await api.post('/guests', {
          name: guestName,
          phone: guestPhone,
          email: guestEmail || undefined,
          idType: idDocuments[0].idType,
          idNumber: idDocuments[0].idNumber || undefined,
          idProofUrl: idDocuments[0].idProofUrl || undefined
        });
        guestId = createdGuest.id;
      }

      // 2. Format co-guest information inside specialRequestText
      let specialRequestText = [
        ...specialRequests,
        ...internalFlags.map(f => `[${f}]`)
      ].join(', ');

      const coGuestInfos = idDocuments.slice(1).map((doc, idx) => {
        const contact = [doc.phone && `Ph: ${doc.phone}`, doc.email && `Em: ${doc.email}`].filter(Boolean).join(', ');
        const profile = doc.guestName 
          ? `${doc.guestName} (${doc.gender || 'N/A'}, DOB: ${doc.dateOfBirth || 'N/A'}${contact ? `, ${contact}` : ''})` 
          : 'Unnamed Co-Guest';
        return `[Co-Guest ${idx + 1}: ${profile} - ID: ${doc.idType} ${doc.idNumber || 'N/A'} (Img: ${doc.idProofUrl || 'N/A'})]`;
      });

      if (coGuestInfos.length > 0) {
        specialRequestText = specialRequestText 
          ? `${specialRequestText}, ${coGuestInfos.join(', ')}`
          : coGuestInfos.join(', ');
      }

      // Calculate GST and totals
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24))) || 1;
      const roomCharges = nights * (Number(ratePerNight) || 0);
      const subtotal = roomCharges + Number(extraCharges);
      const tax = Math.round(subtotal * 0.12);

      // 3. Submit reservation payload
      const payload = {
        roomId: selectedRoomId,
        guestId,
        checkInDate,
        checkOutDate,
        adults: parseInt(adults) || 2,
        children: parseInt(children) || 0,
        numberOfRooms: 1,
        ratePerNight: Number(ratePerNight),
        ratePlan: 'EP',
        extraCharges: extraCharges + tax,
        discount: 0,
        advancePaid: Number(advancePaid) || 0,
        advanceMethod: advanceMethod || undefined,
        source: bookingSource,
        vehicleNumber: vehicleNumber || undefined,
        companyName: companyName || undefined,
        specialRequest: specialRequestText || undefined,
        notes: notes || undefined
      };

      await api.post('/reservations', payload);
      Alert.alert('Success', 'Booking confirmed successfully! 🎉');
      setShowWizard(false);
      
      // Reset Wizard States
      setWizardStep(1);
      setSelectedRoomId('');
      setRatePerNight('');
      setGuestPhone('');
      setGuestName('');
      setGuestEmail('');
      setGuestFoundId(null);
      setIdDocuments([
        { id: 'primary', idType: 'AADHAAR', idNumber: '', frontUrl: '', backUrl: '', idProofUrl: '', guestName: '', gender: 'MALE', dateOfBirth: '', phone: '', email: '', uploadingSide: null }
      ]);
      setSpecialRequests([]);
      setInternalFlags([]);
      setExtraCharges(0);
      setVehicleNumber('');
      setCompanyName('');
      setAdvancePaid('0');
      setNotes('');
      fetchReservations();
    } catch (err) {
      console.warn(err);
      Alert.alert('Booking Failed', err.message || 'Failed to create reservation.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setSavingStatus(true);
    try {
      await api.patch(`/reservations/${id}/status`, { status: newStatus });
      Alert.alert('Success', `Reservation marked as ${newStatus.toLowerCase().replace('_', ' ')}.`);
      setSelectedBooking(null);
      fetchReservations();
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', err.message || 'Failed to update reservation status.');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleCancelReservation = async (id) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this reservation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Reservation',
          style: 'destructive',
          onPress: async () => {
            setSavingStatus(true);
            try {
              await api.delete(`/reservations/${id}`);
              Alert.alert('Cancelled', 'Reservation cancelled successfully.');
              setSelectedBooking(null);
              fetchReservations();
            } catch (err) {
              console.warn(err);
              Alert.alert('Error', err.message || 'Failed to cancel reservation.');
            } finally {
              setSavingStatus(false);
            }
          }
        }
      ]
    );
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    checkedIn: bookings.filter(b => b.status === 'CHECKED_IN').length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
  };

  const filteredBookings = bookings.filter(b => {
    if (selectedStatus !== 'All' && b.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.bookingRef?.toLowerCase().includes(q) ||
        b.guest?.name?.toLowerCase().includes(q) ||
        b.guest?.phone?.includes(q) ||
        b.room?.number?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING': return styles.pillPending;
      case 'CONFIRMED': return styles.pillConfirmed;
      case 'CHECKED_IN': return styles.pillCheckedIn;
      case 'CHECKED_OUT': return styles.pillCheckedOut;
      default: return styles.pillCancelled;
    }
  };

  const getStatusTextStyle = (status) => {
    switch (status) {
      case 'PENDING': return styles.pillTextPending;
      case 'CONFIRMED': return styles.pillTextConfirmed;
      case 'CHECKED_IN': return styles.pillTextCheckedIn;
      case 'CHECKED_OUT': return styles.pillTextCheckedOut;
      default: return styles.pillTextCancelled;
    }
  };

  // Identity Proof Type Labels
  const idTypeOptions = [
    { value: 'AADHAAR', label: 'Aadhaar Card' },
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'DRIVING_LICENSE', label: 'Driving License' },
    { value: 'PAN_CARD', label: 'PAN Card' },
    { value: 'VOTER_ID', label: 'Voter ID' },
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
            <Text style={styles.headerTitle}>Reservations</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Bookings</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Toast Alert */}
      {toastMessage ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ {toastMessage}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleHeading}>Manage Reservations</Text>
          <Text style={styles.titleSubheading}>Manage guest bookings, check-ins, and check-outs</Text>
          <TouchableOpacity style={styles.actionBtnNavy} onPress={() => setShowWizard(true)}>
            <Text style={styles.actionBtnNavyText}>＋ New Booking</Text>
          </TouchableOpacity>
        </View>

        {/* KPIs Counter Row */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{stats.total}</Text>
            <Text style={styles.kpiLabel}>TOTAL BOOKINGS</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#38A169', borderLeftWidth: 3 }]}>
            <Text style={[styles.kpiValue, { color: '#38A169' }]}>{stats.confirmed}</Text>
            <Text style={styles.kpiLabel}>CONFIRMED</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#2563EB', borderLeftWidth: 3 }]}>
            <Text style={[styles.kpiValue, { color: '#2563EB' }]}>{stats.checkedIn}</Text>
            <Text style={styles.kpiLabel}>CHECKED IN</Text>
          </View>
          <View style={[styles.kpiCard, { borderLeftColor: '#D97706', borderLeftWidth: 3 }]}>
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>{stats.pending}</Text>
            <Text style={styles.kpiLabel}>PENDING</Text>
          </View>
        </View>

        {/* Search and Filters Card */}
        <View style={styles.searchCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search reference, guest name, room..."
            placeholderTextColor="#A0AEC0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
            {['All', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.tabBtn, selectedStatus === st && styles.tabBtnActive]}
                onPress={() => setSelectedStatus(st)}
              >
                <Text style={[styles.tabBtnText, selectedStatus === st && styles.tabBtnTextActive]}>
                  {st === 'All' ? 'All' : st.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bookings Ledger */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingText}>Fetching reservations...</Text>
          </View>
        ) : filteredBookings.length > 0 ? (
          filteredBookings.map((b) => (
            <TouchableOpacity key={b.id} style={styles.bookingCard} onPress={() => setSelectedBooking(b)}>
              <View style={styles.bookingHeader}>
                <View>
                  <Text style={styles.bookingRef}>{b.bookingRef || 'REF-N/A'}</Text>
                  <Text style={styles.bookingGuest}>{b.guest?.name || 'Walk-in Guest'}</Text>
                </View>
                <View style={[styles.statusPill, getStatusStyle(b.status)]}>
                  <Text style={[styles.statusPillText, getStatusTextStyle(b.status)]}>
                    {b.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <View style={styles.bookingBody}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>ROOM</Text>
                  <Text style={styles.metaVal}>{b.room?.number || 'N/A'}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>DATES</Text>
                  <Text style={styles.metaVal}>{new Date(b.checkInDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(b.checkOutDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
                </View>
                <View style={[styles.metaCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.metaLabel}>RATE</Text>
                  <Text style={[styles.metaVal, { fontFamily: 'monospace', color: '#0C2340', fontWeight: 'bold' }]}>₹{b.ratePerNight?.toLocaleString()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reservations found.</Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: NEW RESERVATION WIZARD */}
      <Modal visible={showWizard} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.wizardHeader}>
              <Text style={styles.modalHeading}>New Booking</Text>
              <Text style={styles.stepIndicatorText}>Step {wizardStep} of 4</Text>
            </View>

            {/* STEP 1: Dates & Rooms selection */}
            {wizardStep === 1 && (
              <ScrollView style={{ maxHeight: 380 }}>
                <Text style={styles.modalLabel}>Check-In Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#A0AEC0"
                  value={checkInDate}
                  onChangeText={setCheckInDate}
                />

                <Text style={styles.modalLabel}>Check-Out Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#A0AEC0"
                  value={checkOutDate}
                  onChangeText={setCheckOutDate}
                />

                <Text style={styles.modalLabel}>Select Available Room *</Text>
                {roomsLoading ? (
                  <ActivityIndicator size="small" color="#D4AF37" />
                ) : availableRooms.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomSelectRow}>
                    {availableRooms.map((room) => {
                      const isSelected = selectedRoomId === room.id;
                      return (
                        <TouchableOpacity
                          key={room.id}
                          style={[styles.roomSelectBtn, isSelected && styles.roomSelectBtnActive]}
                          onPress={() => {
                            setSelectedRoomId(room.id);
                            setRatePerNight(String(room.roomType?.basePrice || 2500));
                          }}
                        >
                          <Text style={[styles.roomSelectNum, isSelected && styles.roomSelectNumActive]}>Room {room.number}</Text>
                          <Text style={[styles.roomSelectType, isSelected && styles.roomSelectTypeActive]}>{room.roomType?.name}</Text>
                          <Text style={[styles.roomSelectPrice, isSelected && styles.roomSelectPriceActive]}>₹{room.roomType?.basePrice}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <Text style={styles.errorText}>No rooms available for these dates.</Text>
                )}

                <Text style={styles.modalLabel}>Rate Per Night (₹) *</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={ratePerNight}
                  onChangeText={setRatePerNight}
                />
              </ScrollView>
            )}

            {/* STEP 2: Guest Details & Identity Verification */}
            {wizardStep === 2 && (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* Guest Profile Box */}
                <Text style={styles.sectionDividerText}>Guest Details</Text>

                <Text style={styles.modalLabel}>Guest Phone Number *</Text>
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                  <TextInput
                    style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                    placeholder="Guest Phone"
                    placeholderTextColor="#A0AEC0"
                    keyboardType="phone-pad"
                    value={guestPhone}
                    onChangeText={(val) => {
                      setGuestPhone(val);
                      handleUpdateDocField('primary', 'phone', val);
                    }}
                  />
                  <TouchableOpacity style={styles.searchGuestBtn} onPress={handleSearchGuest} disabled={searchingGuest}>
                    {searchingGuest ? (
                      <ActivityIndicator size="small" color="#FEF9F1" />
                    ) : (
                      <Text style={styles.searchGuestBtnText}>Search</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel}>Guest Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Full Name"
                  placeholderTextColor="#A0AEC0"
                  value={guestName}
                  onChangeText={(val) => {
                    setGuestName(val);
                    handleUpdateDocField('primary', 'guestName', val);
                  }}
                />

                <Text style={styles.modalLabel}>Guest Email</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="email@domain.com"
                  placeholderTextColor="#A0AEC0"
                  value={guestEmail}
                  onChangeText={(val) => {
                    setGuestEmail(val);
                    handleUpdateDocField('primary', 'email', val);
                  }}
                  keyboardType="email-address"
                />

                {/* Identity Verification Details */}
                <View style={styles.idVerificationHeaderRow}>
                  <Text style={styles.sectionDividerText}>🛡️ Identity Verification</Text>
                  <TouchableOpacity style={styles.addCoGuestBtn} onPress={handleAddCoGuest}>
                    <Text style={styles.addCoGuestBtnText}>＋ Add Co-Guest</Text>
                  </TouchableOpacity>
                </View>

                {idDocuments.map((doc, idx) => {
                  const isPrimary = idx === 0;
                  return (
                    <View key={doc.id} style={styles.idDocumentWrapper}>
                      <View style={styles.docBoxHeader}>
                        <Text style={styles.docBoxTitle}>
                          {isPrimary ? '1. Primary Guest ID' : `${idx + 1}. Co-Guest ID`}
                        </Text>
                        {!isPrimary && (
                          <TouchableOpacity onPress={() => handleRemoveCoGuest(doc.id)}>
                            <Text style={styles.removeCoGuestLink}>Remove</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {!isPrimary && (
                        <>
                          <Text style={styles.modalLabel}>Co-Guest Name *</Text>
                          <TextInput
                            style={styles.modalInput}
                            placeholder="Co-Guest Name"
                            placeholderTextColor="#A0AEC0"
                            value={doc.guestName}
                            onChangeText={(v) => handleUpdateDocField(doc.id, 'guestName', v)}
                          />

                          <Text style={styles.modalLabel}>Co-Guest Phone</Text>
                          <TextInput
                            style={styles.modalInput}
                            placeholder="Phone number"
                            placeholderTextColor="#A0AEC0"
                            keyboardType="phone-pad"
                            value={doc.phone}
                            onChangeText={(v) => handleUpdateDocField(doc.id, 'phone', v)}
                          />
                        </>
                      )}

                      {/* Dropdown Options for ID Proof Type */}
                      <Text style={styles.modalLabel}>ID Proof Type *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 35, marginBottom: 8 }}>
                        {idTypeOptions.map((opt) => (
                          <TouchableOpacity
                            key={opt.value}
                            style={[styles.idOptBadge, doc.idType === opt.value && styles.idOptBadgeActive]}
                            onPress={() => handleUpdateDocField(doc.id, 'idType', opt.value)}
                          >
                            <Text style={[styles.idOptBadgeText, doc.idType === opt.value && styles.idOptBadgeTextActive]}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <Text style={styles.modalLabel}>ID Number *</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Enter ID number"
                        placeholderTextColor="#A0AEC0"
                        value={doc.idNumber}
                        onChangeText={(v) => handleUpdateDocField(doc.id, 'idNumber', v)}
                      />

                      {/* Front and Back Upload Panels */}
                      <View style={styles.uploadRow}>
                        {/* Front Card */}
                        <View style={styles.uploadCard}>
                          <Text style={styles.uploadCardLabel}>FRONT SIDE</Text>
                          {doc.frontUrl ? (
                            <Image source={{ uri: getAbsoluteAssetUrl(doc.frontUrl) }} style={styles.uploadPreview} />
                          ) : (
                            <View style={styles.emptyPreview}>
                              <Text style={{ fontSize: 18, color: '#A0AEC0' }}>🖼️</Text>
                              <Text style={styles.emptyPreviewText}>Front side preview</Text>
                            </View>
                          )}
                          <View style={styles.uploadButtons}>
                            <TouchableOpacity
                              style={styles.uploadBtn}
                              onPress={() => handlePickImageFromLibrary(doc.id, 'front')}
                              disabled={doc.uploadingSide !== null}
                            >
                              {doc.uploadingSide === 'front' ? (
                                <ActivityIndicator size="small" color="#0C2340" />
                              ) : (
                                <Text style={styles.uploadBtnText}>⬆ Upload</Text>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.uploadBtn}
                              onPress={() => handleCaptureImageWithCamera(doc.id, 'front')}
                              disabled={doc.uploadingSide !== null}
                            >
                              <Text style={styles.uploadBtnText}>📷 Camera</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Back Card */}
                        <View style={styles.uploadCard}>
                          <Text style={styles.uploadCardLabel}>BACK SIDE</Text>
                          {doc.backUrl ? (
                            <Image source={{ uri: getAbsoluteAssetUrl(doc.backUrl) }} style={styles.uploadPreview} />
                          ) : (
                            <View style={styles.emptyPreview}>
                              <Text style={{ fontSize: 18, color: '#A0AEC0' }}>🖼️</Text>
                              <Text style={styles.emptyPreviewText}>Back side preview</Text>
                            </View>
                          )}
                          <View style={styles.uploadButtons}>
                            <TouchableOpacity
                              style={styles.uploadBtn}
                              onPress={() => handlePickImageFromLibrary(doc.id, 'back')}
                              disabled={doc.uploadingSide !== null}
                            >
                              {doc.uploadingSide === 'back' ? (
                                <ActivityIndicator size="small" color="#0C2340" />
                              ) : (
                                <Text style={styles.uploadBtnText}>⬆ Upload</Text>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.uploadBtn}
                              onPress={() => handleCaptureImageWithCamera(doc.id, 'back')}
                              disabled={doc.uploadingSide !== null}
                            >
                              <Text style={styles.uploadBtnText}>📷 Camera</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* STEP 3: Additional Information */}
            {wizardStep === 3 && (
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionDividerText}>Special Requests</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                  {SPECIAL_REQUESTS.map((req) => {
                    const active = specialRequests.includes(req);
                    const charge = SERVICE_CHARGES[req] || 0;
                    return (
                      <TouchableOpacity
                        key={req}
                        style={[styles.idOptBadge, active && styles.idOptBadgeActive, { marginBottom: 6 }]}
                        onPress={() => {
                          let updated = [...specialRequests];
                          if (updated.includes(req)) {
                            updated = updated.filter(r => r !== req);
                          } else {
                            updated.push(req);
                          }
                          setSpecialRequests(updated);
                          let sum = 0;
                          updated.forEach(r => {
                            sum += SERVICE_CHARGES[r] || 0;
                          });
                          setExtraCharges(sum);
                        }}
                      >
                        <Text style={[styles.idOptBadgeText, active && styles.idOptBadgeTextActive]}>
                          {active ? '✓ ' : ''}{req} {charge > 0 ? ` (+₹${charge})` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.sectionDividerText}>Internal Flags</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                  {INTERNAL_FLAGS.map((flag) => {
                    const active = internalFlags.includes(flag);
                    return (
                      <TouchableOpacity
                        key={flag}
                        style={[
                          styles.idOptBadge, 
                          active && (flag === 'Blacklisted' ? { backgroundColor: '#E53E3E', borderColor: '#E53E3E' } : styles.idOptBadgeActive),
                          { marginBottom: 6 }
                        ]}
                        onPress={() => {
                          let updated = [...internalFlags];
                          if (updated.includes(flag)) {
                            updated = updated.filter(f => f !== flag);
                          } else {
                            updated.push(flag);
                          }
                          setInternalFlags(updated);
                        }}
                      >
                        <Text style={[styles.idOptBadgeText, active && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                          {active ? '✓ ' : ''}{flag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.modalLabel}>Receptionist Notes</Text>
                <TextInput
                  style={[styles.modalInput, { height: 60 }]}
                  placeholder="e.g. Guest requested extra towels, prefers quiet room..."
                  placeholderTextColor="#A0AEC0"
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                />

                <Text style={styles.sectionDividerText}>Optional Details</Text>
                
                <Text style={styles.modalLabel}>Vehicle Number</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. MH 01 AB 1234"
                  placeholderTextColor="#A0AEC0"
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                />

                <Text style={styles.modalLabel}>Company Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Acme Corp"
                  placeholderTextColor="#A0AEC0"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </ScrollView>
            )}

            {/* STEP 4: Billing & Confirmation details */}
            {wizardStep === 4 && (
              <ScrollView style={{ maxHeight: 380 }}>
                {/* Pricing Breakdown Box */}
                <View style={[styles.summaryBox, { marginTop: 6, marginBottom: 12 }]}>
                  <Text style={styles.folioTitle}>PRICING BREAKDOWN</Text>
                  
                  <View style={styles.folioRow}>
                    <Text style={styles.folioRowDesc}>Room Rate (₹{(Number(ratePerNight) || 0).toLocaleString()} × {
                      (() => {
                        const checkIn = new Date(checkInDate);
                        const checkOut = new Date(checkOutDate);
                        return Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24))) || 1;
                      })()
                    } nights)</Text>
                    <Text style={styles.folioRowVal}>₹{
                      (() => {
                        const checkIn = new Date(checkInDate);
                        const checkOut = new Date(checkOutDate);
                        const nights = Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24))) || 1;
                        return (nights * (Number(ratePerNight) || 0)).toLocaleString();
                      })()
                    }</Text>
                  </View>

                  {Number(extraCharges) > 0 ? (
                    <View style={styles.folioRow}>
                      <Text style={styles.folioRowDesc}>Extra Service Charges</Text>
                      <Text style={styles.folioRowVal}>+ ₹{Number(extraCharges).toLocaleString()}</Text>
                    </View>
                  ) : null}

                  <View style={styles.folioRow}>
                    <Text style={styles.folioRowDesc}>GST Tax (12%)</Text>
                    <Text style={styles.folioRowVal}>+ ₹{
                      (() => {
                        const checkIn = new Date(checkInDate);
                        const checkOut = new Date(checkOutDate);
                        const nights = Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24))) || 1;
                        const roomCharges = nights * (Number(ratePerNight) || 0);
                        const subtotal = roomCharges + Number(extraCharges);
                        return Math.round(subtotal * 0.12).toLocaleString();
                      })()
                    }</Text>
                  </View>

                  <View style={styles.folioDivider} />

                  <View style={styles.calculationRow}>
                    <Text style={[styles.calcLabel, { fontWeight: 'bold', color: '#0C2340' }]}>Grand Total:</Text>
                    <Text style={[styles.calcVal, { fontWeight: 'bold', color: '#D4AF37' }]}>₹{
                      (() => {
                        const checkIn = new Date(checkInDate);
                        const checkOut = new Date(checkOutDate);
                        const nights = Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24))) || 1;
                        const roomCharges = nights * (Number(ratePerNight) || 0);
                        const subtotal = roomCharges + Number(extraCharges);
                        const tax = Math.round(subtotal * 0.12);
                        return (subtotal + tax).toLocaleString();
                      })()
                    }</Text>
                  </View>
                </View>

                <Text style={styles.modalLabel}>Adults Count</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={adults}
                  onChangeText={setAdults}
                />

                <Text style={styles.modalLabel}>Children Count</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={children}
                  onChangeText={setChildren}
                />

                <Text style={styles.modalLabel}>Advance Paid (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={advancePaid}
                  onChangeText={setAdvancePaid}
                />

                <Text style={styles.modalLabel}>Source</Text>
                <View style={styles.sourceBadgesRow}>
                  {['WALK_IN', 'PHONE', 'WEBSITE'].map((src) => (
                    <TouchableOpacity
                      key={src}
                      style={[styles.srcBadge, bookingSource === src && styles.srcBadgeActive]}
                      onPress={() => setBookingSource(src)}
                    >
                      <Text style={[styles.srcBadgeText, bookingSource === src && styles.srcBadgeTextActive]}>
                        {src.replace('_', '-')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Wizard Actions Footer */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  if (wizardStep > 1) {
                    setWizardStep(wizardStep - 1);
                  } else {
                    setShowWizard(false);
                  }
                }}
              >
                <Text style={styles.cancelBtnText}>{wizardStep > 1 ? 'Back' : 'Cancel'}</Text>
              </TouchableOpacity>

              {wizardStep < 4 ? (
                <TouchableOpacity style={styles.confirmBtn} onPress={handleNextStep}>
                  <Text style={styles.confirmBtnText}>Next Step</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateReservation} disabled={submittingBooking}>
                  {submittingBooking ? (
                    <ActivityIndicator size="small" color="#FEF9F1" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm Booking</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: DETAIL SHEETS & CHECK-IN / CHECK-OUT STATUS ACTIONS */}
      <Modal visible={!!selectedBooking} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <View>
                <Text style={styles.modalHeading}>{selectedBooking?.bookingRef || 'REF-N/A'}</Text>
                <Text style={styles.modalSubheading}>{selectedBooking?.guest?.name || 'Walk-in Guest'}</Text>
              </View>
              <View style={[styles.statusPill, selectedBooking ? getStatusStyle(selectedBooking.status) : null]}>
                <Text style={[styles.statusPillText, selectedBooking ? getStatusTextStyle(selectedBooking.status) : null]}>
                  {selectedBooking?.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsList}>
              <Text style={styles.detailItem}><Text style={{ fontWeight: 'bold' }}>Phone:</Text> {selectedBooking?.guest?.phone || 'N/A'}</Text>
              <Text style={styles.detailItem}><Text style={{ fontWeight: 'bold' }}>Room Assignment:</Text> Room {selectedBooking?.room?.number || 'N/A'} ({selectedBooking?.room?.roomType?.name || 'N/A'})</Text>
              <Text style={styles.detailItem}><Text style={{ fontWeight: 'bold' }}>Stay Duration:</Text> {selectedBooking?.checkInDate} to {selectedBooking?.checkOutDate}</Text>
              <Text style={styles.detailItem}><Text style={{ fontWeight: 'bold' }}>Rate Plan:</Text> EP • ₹{selectedBooking?.ratePerNight} / night</Text>
              {selectedBooking?.advancePaid ? (
                <Text style={styles.detailItem}><Text style={{ fontWeight: 'bold' }}>Advance Paid:</Text> ₹{selectedBooking.advancePaid}</Text>
              ) : null}
              {selectedBooking?.notes ? (
                <Text style={styles.detailItem}><Text style={{ fontWeight: 'bold' }}>Notes:</Text> {selectedBooking.notes}</Text>
              ) : null}
            </View>

            {/* Action buttons */}
            <View style={styles.statusButtonsGrid}>
              {selectedBooking?.status === 'PENDING' && (
                <TouchableOpacity
                  style={[styles.statusOptionBtn, { borderColor: '#38A169' }]}
                  onPress={() => handleStatusChange(selectedBooking.id, 'CONFIRMED')}
                >
                  <Text style={[styles.statusOptionText, { color: '#38A169' }]}>Confirm Booking</Text>
                </TouchableOpacity>
              )}

              {selectedBooking?.status === 'CONFIRMED' && (
                <TouchableOpacity
                  style={[styles.statusOptionBtn, { borderColor: '#2563EB' }]}
                  onPress={() => handleStatusChange(selectedBooking.id, 'CHECKED_IN')}
                >
                  <Text style={[styles.statusOptionText, { color: '#2563EB' }]}>📥 Check In Guest</Text>
                </TouchableOpacity>
              )}

              {selectedBooking?.status === 'CHECKED_IN' && (
                <TouchableOpacity
                  style={[styles.statusOptionBtn, { borderColor: '#E53E3E' }]}
                  onPress={() => {
                    if (selectedBooking.room?.id && setCheckoutRoomId) {
                      setCheckoutRoomId(selectedBooking.room.id);
                    }
                    setSelectedBooking(null);
                    if (onNavigate) onNavigate('checkout');
                  }}
                >
                  <Text style={[styles.statusOptionText, { color: '#E53E3E' }]}>📝 Check Out & Folio</Text>
                </TouchableOpacity>
              )}

              {['PENDING', 'CONFIRMED'].includes(selectedBooking?.status) && (
                <TouchableOpacity
                  style={[styles.statusOptionBtn, { borderColor: '#E53E3E', backgroundColor: '#FFF5F5' }]}
                  onPress={() => handleCancelReservation(selectedBooking.id)}
                >
                  <Text style={[styles.statusOptionText, { color: '#E53E3E' }]}>❌ Cancel Booking</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setSelectedBooking(null)}>
              <Text style={styles.closeSheetBtnText}>Close Panel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 70,
    right: 20,
    left: 20,
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 12,
    padding: 12,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  toastText: {
    color: '#FEF9F1',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
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
  actionBtnNavy: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  actionBtnNavyText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: 'bold',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 10,
    width: '23.5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  kpiLabel: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#718096',
    marginTop: 4,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
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
    marginBottom: 10,
  },
  tabsContainer: {
    height: 32,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginRight: 6,
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0C2340',
    borderColor: '#0C2340',
  },
  tabBtnText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#718096',
  },
  tabBtnTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  centerLoading: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#718096',
    fontSize: 12,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 0.5,
    borderColor: '#FEF9F1',
    paddingBottom: 8,
    marginBottom: 10,
  },
  bookingRef: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  bookingGuest: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  pillPending: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  pillConfirmed: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  pillCheckedIn: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  pillCheckedOut: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  pillCancelled: { backgroundColor: '#FFF5F5', borderColor: '#FEB2B2' },

  statusPillText: { fontSize: 8.5, fontWeight: 'bold' },
  pillTextPending: { color: '#D97706' },
  pillTextConfirmed: { color: '#059669' },
  pillTextCheckedIn: { color: '#2563EB' },
  pillTextCheckedOut: { color: '#4B5563' },
  pillTextCancelled: { color: '#C53030' },

  bookingBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#A0AEC0',
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2D3748',
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#718096',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  wizardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#FEF9F1',
    paddingBottom: 10,
    marginBottom: 10,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  stepIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  modalSubheading: {
    fontSize: 11,
    color: '#718096',
    marginTop: -10,
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0C2340',
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 36,
    paddingHorizontal: 12,
    fontSize: 11.5,
    color: '#0C2340',
    fontWeight: '600',
    marginBottom: 8,
  },
  roomSelectRow: {
    flexDirection: 'row',
    marginBottom: 8,
    height: 70,
  },
  roomSelectBtn: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    padding: 8,
    marginRight: 8,
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomSelectBtnActive: {
    backgroundColor: '#0C2340',
    borderColor: '#D4AF37',
  },
  roomSelectNum: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  roomSelectNumActive: { color: '#D4AF37' },
  roomSelectType: {
    fontSize: 8,
    color: '#718096',
    marginTop: 2,
    textAlign: 'center',
  },
  roomSelectTypeActive: { color: '#E2E8F0' },
  roomSelectPrice: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 2,
  },
  roomSelectPriceActive: { color: '#FFFFFF' },
  errorText: {
    fontSize: 10.5,
    color: '#E53E3E',
    marginBottom: 8,
  },
  sectionDividerText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#0C2340',
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE5DA',
    paddingBottom: 2,
  },
  idVerificationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  addCoGuestBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addCoGuestBtnText: {
    color: '#0C2340',
    fontSize: 9,
    fontWeight: 'bold',
  },
  idDocumentWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  docBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  docBoxTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  removeCoGuestLink: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E53E3E',
  },
  idOptBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginRight: 6,
    justifyContent: 'center',
  },
  idOptBadgeActive: {
    backgroundColor: '#0C2340',
    borderColor: '#D4AF37',
  },
  idOptBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#718096',
  },
  idOptBadgeTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  uploadCard: {
    width: '48%',
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  uploadCardLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#718096',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  uploadPreview: {
    width: '100%',
    height: 70,
    borderRadius: 6,
  },
  emptyPreview: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPreviewText: {
    fontSize: 8.5,
    color: '#718096',
    marginTop: 4,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  uploadBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  uploadBtnText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#0C2340',
  },
  searchGuestBtn: {
    backgroundColor: '#0C2340',
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  searchGuestBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sourceBadgesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  srcBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginRight: 6,
  },
  srcBadgeActive: {
    backgroundColor: '#0C2340',
    borderColor: '#0C2340',
  },
  srcBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#718096',
  },
  srcBadgeTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    borderTopWidth: 1,
    borderColor: '#FEF9F1',
    paddingTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 10,
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#718096',
    fontSize: 12,
    fontWeight: 'bold',
  },
  confirmBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsList: {
    marginBottom: 15,
  },
  detailItem: {
    fontSize: 12,
    color: '#2D3748',
    marginBottom: 6,
    lineHeight: 16,
  },
  statusButtonsGrid: {
    marginTop: 10,
    marginBottom: 15,
  },
  statusOptionBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeSheetBtn: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeSheetBtnText: {
    color: '#718096',
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryBox: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 15,
  },
  folioTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#718096',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  folioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  folioRowDesc: {
    fontSize: 10.5,
    color: '#2D3748',
    flex: 1,
    marginRight: 10,
  },
  folioRowVal: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  folioDivider: {
    height: 1,
    backgroundColor: '#EBE5DA',
    marginVertical: 10,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calcLabel: {
    fontSize: 10.5,
    color: '#718096',
  },
  calcVal: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#2D3748',
  },
});

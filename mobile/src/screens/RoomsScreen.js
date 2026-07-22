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
  SafeAreaView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';

export default function RoomsScreen({ user, onLogout, onOpenDrawer }) {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals States
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // Add Room Form States
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('');
  const [newRoomTypeId, setNewRoomTypeId] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [submittingRoom, setSubmittingRoom] = useState(false);

  // Add Room Type Form States
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypePrice, setNewTypePrice] = useState('');
  const [newTypeOccupancy, setNewTypeOccupancy] = useState('2');
  const [newTypeAmenities, setNewTypeAmenities] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [submittingType, setSubmittingType] = useState(false);

  // Dropdown options visible states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showFormTypeDropdown, setShowFormTypeDropdown] = useState(false);

  const mapDbStatusToUi = (dbStatus) => {
    switch (dbStatus) {
      case 'AVAILABLE': return 'Available';
      case 'OCCUPIED': return 'Occupied';
      case 'CHECKOUT_PENDING': return 'Dirty';
      case 'CLEANING': return 'Cleaning';
      case 'MAINTENANCE': return 'Maintenance';
      case 'RESERVED': return 'Reserved';
      default: return 'Out Of Service';
    }
  };

  const mapUiStatusToDb = (uiStatus) => {
    switch (uiStatus) {
      case 'Available': return 'AVAILABLE';
      case 'Occupied': return 'OCCUPIED';
      case 'Dirty': return 'CHECKOUT_PENDING';
      case 'Cleaning': return 'CLEANING';
      case 'Maintenance': return 'MAINTENANCE';
      case 'Reserved': return 'RESERVED';
      default: return 'MAINTENANCE';
    }
  };

  const formatFloor = (floorStr) => {
    if (!floorStr) return '1st Floor';
    const f = String(floorStr).trim();
    if (f.toLowerCase().includes('floor')) return f;
    const num = parseInt(f, 10);
    if (!isNaN(num)) {
      const j = num % 10, k = num % 100;
      if (j === 1 && k !== 11) return `${num}st Floor`;
      if (j === 2 && k !== 12) return `${num}nd Floor`;
      if (j === 3 && k !== 13) return `${num}rd Floor`;
      return `${num}th Floor`;
    }
    return `${f} Floor`;
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/rooms');
      const mapped = (data || []).map(r => ({
        id: r.id,
        number: r.number,
        type: r.roomType?.name || 'Standard',
        status: mapDbStatusToUi(r.status),
        floor: formatFloor(r.floor),
        rate: `₹${(r.roomType?.basePrice || 2500).toLocaleString()}`
      }));
      setRooms(mapped);
    } catch (e) {
      console.warn(e);
      setError(e.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const data = await api.get('/room-types');
      setRoomTypes(data || []);
    } catch (err) {
      console.warn('Failed to fetch room types:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchRoomTypes();
  }, []);

  const handleAddRoom = async () => {
    if (!newRoomNumber || !newRoomFloor || !newRoomTypeId) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    try {
      setSubmittingRoom(true);
      await api.post('/rooms', {
        number: newRoomNumber,
        floor: newRoomFloor,
        roomTypeId: newRoomTypeId,
        description: newRoomDesc || undefined
      });
      fetchRooms();
      setShowAddRoomModal(false);
      setNewRoomNumber('');
      setNewRoomFloor('');
      setNewRoomTypeId('');
      setNewRoomDesc('');
      Alert.alert('Success', 'Room added successfully!');
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', err.message || 'Failed to create room');
    } finally {
      setSubmittingRoom(false);
    }
  };

  const handleAddRoomType = async () => {
    if (!newTypeName || !newTypePrice || !newTypeOccupancy) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    try {
      setSubmittingType(true);
      const amenitiesArr = newTypeAmenities
        ? newTypeAmenities.split(',').map(a => a.trim()).filter(Boolean)
        : [];
      
      await api.post('/room-types', {
        name: newTypeName,
        basePrice: parseFloat(newTypePrice) || 0,
        maxOccupancy: parseInt(newTypeOccupancy, 10) || 2,
        amenities: amenitiesArr,
        description: newTypeDesc || undefined
      });
      
      await fetchRoomTypes();
      setShowAddTypeModal(false);
      setNewTypeName('');
      setNewTypePrice('');
      setNewTypeOccupancy('2');
      setNewTypeAmenities('');
      setNewTypeDesc('');
      Alert.alert('Success', 'Room type added successfully!');
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', err.message || 'Failed to create room type');
    } finally {
      setSubmittingType(false);
    }
  };

  const handleStatusChange = async (room, newStatus) => {
    try {
      const dbStatus = mapUiStatusToDb(newStatus);
      await api.patch(`/rooms/${room.id}/status`, {
        status: dbStatus
      });
      fetchRooms();
      setEditingRoom(null);
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', err.message || 'Failed to update room status');
    }
  };

  const handleDeleteRoom = async (room) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete Room ${room.number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/rooms/${room.id}`);
              fetchRooms();
              setEditingRoom(null);
              Alert.alert('Deleted', 'Room deleted successfully.');
            } catch (err) {
              console.warn(err);
              Alert.alert('Error', err.message || 'Failed to delete room');
            }
          }
        }
      ]
    );
  };

  // Status Counters matching web layout
  const readyCount = rooms.filter(r => r.status === 'Available').length;
  const occupiedCount = rooms.filter(r => r.status === 'Occupied').length;
  const dirtyCount = rooms.filter(r => r.status === 'Dirty').length;

  const filteredRooms = rooms.filter(room => {
    const matchesType = selectedType === 'All' || room.type === selectedType || (selectedType === 'Suite' && room.type.includes('Suite'));
    const matchesStatus = selectedStatus === 'All' || room.status === selectedStatus;
    return matchesType && matchesStatus;
  });

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Available': return styles.badgeAvailable;
      case 'Occupied': return styles.badgeOccupied;
      case 'Dirty': return styles.badgeDirty;
      case 'Cleaning': return styles.badgeCleaning;
      case 'Maintenance': return styles.badgeMaintenance;
      case 'Reserved': return styles.badgeReserved;
      default: return styles.badgeOOS;
    }
  };

  const getStatusTextStyle = (status) => {
    switch (status) {
      case 'Available': return styles.textAvailable;
      case 'Occupied': return styles.textOccupied;
      case 'Dirty': return styles.textDirty;
      case 'Cleaning': return styles.textCleaning;
      case 'Maintenance': return styles.textMaintenance;
      case 'Reserved': return styles.textReserved;
      default: return styles.textOOS;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available': return 'checkmark-circle-outline';
      case 'Occupied': return 'bed-outline';
      case 'Dirty': return 'alert-circle-outline';
      case 'Cleaning': return 'refresh';
      case 'Maintenance': return 'construct-outline';
      case 'Reserved': return 'calendar-outline';
      default: return 'ban-outline';
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
            <Text style={styles.headerTitle}>Rooms Directory</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Front Desk</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title and Buttons Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleHeading}>Rooms Management</Text>
          <Text style={styles.titleSubheading}>Real-time room occupancy status, nightly rates, and maintenance scheduling</Text>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionBtnNavy} onPress={() => setShowAddRoomModal(true)}>
              <Text style={styles.actionBtnNavyText}>＋ Add Room</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnWhite} onPress={() => setShowAddTypeModal(true)}>
              <Text style={styles.actionBtnWhiteText}>＋ Add Room Type</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnIcon} onPress={fetchRooms}>
              <Ionicons name="refresh" size={14} color="#D4AF37" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Bar Section */}
        <View style={styles.filterCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.filterLabel}>🔍 FILTER BY</Text>
            <View style={styles.pickerRow}>
              {/* Type Filter selector */}
              <TouchableOpacity style={styles.pickerTrigger} onPress={() => { setShowTypeDropdown(!showTypeDropdown); setShowStatusDropdown(false); }}>
                <Text style={styles.pickerText} numberOfLines={1}>{selectedType} Types</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>

              {/* Status Filter selector */}
              <TouchableOpacity style={styles.pickerTrigger} onPress={() => { setShowStatusDropdown(!showStatusDropdown); setShowTypeDropdown(false); }}>
                <Text style={styles.pickerText} numberOfLines={1}>{selectedStatus} Statuses</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Counters side */}
          <View style={styles.countersColumn}>
            <Text style={[styles.counterText, { color: '#38A169' }]}>{readyCount} READY</Text>
            <Text style={[styles.counterText, { color: '#E53E3E' }]}>{occupiedCount} OCCUPIED</Text>
            <Text style={[styles.counterText, { color: '#D97706' }]}>{dirtyCount} DIRTY</Text>
          </View>
        </View>

        {/* Dropdown Popovers */}
        {showTypeDropdown && (
          <View style={styles.dropdownPopover}>
            <TouchableOpacity style={styles.dropdownOption} onPress={() => { setSelectedType('All'); setShowTypeDropdown(false); }}>
              <Text style={styles.dropdownOptionText}>All Room Types</Text>
            </TouchableOpacity>
            {roomTypes.map(t => (
              <TouchableOpacity key={t.id} style={styles.dropdownOption} onPress={() => { setSelectedType(t.name); setShowTypeDropdown(false); }}>
                <Text style={styles.dropdownOptionText}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showStatusDropdown && (
          <View style={[styles.dropdownPopover, { left: '50%' }]}>
            {['All', 'Available', 'Occupied', 'Dirty', 'Cleaning', 'Maintenance', 'Reserved'].map(st => (
              <TouchableOpacity key={st} style={styles.dropdownOption} onPress={() => { setSelectedStatus(st); setShowStatusDropdown(false); }}>
                <Text style={styles.dropdownOptionText}>{st === 'All' ? 'All Statuses' : st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Rooms List Grid */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={styles.loadingText}>Fetching rooms list...</Text>
          </View>
        ) : filteredRooms.length > 0 ? (
          <View style={styles.roomsGrid}>
            {filteredRooms.map((room) => (
              <TouchableOpacity key={room.id} style={styles.roomCard} onPress={() => setEditingRoom(room)}>
                <View style={styles.roomCardHeader}>
                  <Text style={styles.roomNumber}>Room {room.number}</Text>
                  <Text style={styles.roomFloor}>{room.floor}</Text>
                </View>
                <View style={styles.roomCardBody}>
                  <Text style={styles.roomType}>{room.type}</Text>
                  <Text style={styles.roomPrice}>{room.rate} <Text style={{ fontSize: 8, color: '#718096' }}>/ night</Text></Text>
                </View>
                <View style={[styles.statusBadge, getStatusBadgeStyle(room.status)]}>
                  <Ionicons name={getStatusIcon(room.status)} size={12} color={getStatusTextStyle(room.status).color} style={{ marginRight: 4 }} />
                  <Text style={[styles.statusText, getStatusTextStyle(room.status)]}>{room.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rooms match the selected filters.</Text>
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: ADD ROOM */}
      <Modal visible={showAddRoomModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Add New Room</Text>

            <Text style={styles.modalLabel}>Room Number *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 101, 204"
              placeholderTextColor="#A0AEC0"
              value={newRoomNumber}
              onChangeText={setNewRoomNumber}
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Floor *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 1, 2"
              placeholderTextColor="#A0AEC0"
              value={newRoomFloor}
              onChangeText={setNewRoomFloor}
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Room Type *</Text>
            <TouchableOpacity style={styles.modalDropdownTrigger} onPress={() => setShowFormTypeDropdown(!showFormTypeDropdown)}>
              <Text style={styles.modalDropdownText}>
                {newRoomTypeId ? roomTypes.find(t => t.id === newRoomTypeId)?.name : 'Select Room Type'}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>

            {showFormTypeDropdown && (
              <View style={styles.formTypeDropdown}>
                {roomTypes.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.dropdownOption}
                    onPress={() => { setNewRoomTypeId(t.id); setShowFormTypeDropdown(false); }}
                  >
                    <Text style={styles.dropdownOptionText}>{t.name} (₹{t.basePrice})</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              placeholder="Room orientation, view, extra features..."
              placeholderTextColor="#A0AEC0"
              multiline
              value={newRoomDesc}
              onChangeText={setNewRoomDesc}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddRoomModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddRoom} disabled={submittingRoom}>
                {submittingRoom ? (
                  <ActivityIndicator size="small" color="#FEF9F1" />
                ) : (
                  <Text style={styles.confirmBtnText}>Save Room</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ADD ROOM TYPE */}
      <Modal visible={showAddTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Add Room Type</Text>

            <Text style={styles.modalLabel}>Type Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Deluxe Suite, Standard Double"
              placeholderTextColor="#A0AEC0"
              value={newTypeName}
              onChangeText={setNewTypeName}
            />

            <Text style={styles.modalLabel}>Nightly Rate (₹) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 4500"
              placeholderTextColor="#A0AEC0"
              value={newTypePrice}
              onChangeText={setNewTypePrice}
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Max Occupancy (Guests) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 2"
              placeholderTextColor="#A0AEC0"
              value={newTypeOccupancy}
              onChangeText={setNewTypeOccupancy}
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Amenities (Comma Separated)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. AC, Wifi, Balcony, Mini Bar"
              placeholderTextColor="#A0AEC0"
              value={newTypeAmenities}
              onChangeText={setNewTypeAmenities}
            />

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              placeholder="General description of room type layout..."
              placeholderTextColor="#A0AEC0"
              multiline
              value={newTypeDesc}
              onChangeText={setNewTypeDesc}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddTypeModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddRoomType} disabled={submittingType}>
                {submittingType ? (
                  <ActivityIndicator size="small" color="#FEF9F1" />
                ) : (
                  <Text style={styles.confirmBtnText}>Save Type</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: EDIT ROOM STATUS / DELETE ROOM */}
      <Modal visible={!!editingRoom} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <View>
                <Text style={styles.modalHeading}>Room {editingRoom?.number}</Text>
                <Text style={styles.modalSubheading}>{editingRoom?.type} • {editingRoom?.floor}</Text>
              </View>
              <TouchableOpacity style={styles.deleteIconBtn} onPress={() => handleDeleteRoom(editingRoom)}>
                <Ionicons name="trash-outline" size={16} color="#E53E3E" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Update Occupancy / Service Status</Text>
            <View style={styles.statusButtonsGrid}>
              {['Available', 'Occupied', 'Dirty', 'Cleaning', 'Maintenance', 'Reserved'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOptionBtn,
                    editingRoom?.status === status && styles.statusOptionBtnActive
                  ]}
                  onPress={() => handleStatusChange(editingRoom, status)}
                >
                  <Ionicons 
                    name={getStatusIcon(status)} 
                    size={14} 
                    color={editingRoom?.status === status ? "#0C2340" : "#718096"} 
                    style={{ marginRight: 6 }} 
                  />
                  <Text style={[
                    styles.statusOptionText,
                    editingRoom?.status === status && styles.statusOptionTextActive
                  ]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setEditingRoom(null)}>
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
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  actionBtnNavy: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginRight: 8,
  },
  actionBtnNavyText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionBtnWhite: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginRight: 8,
  },
  actionBtnWhiteText: {
    color: '#0C2340',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionBtnIcon: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 7,
    borderRadius: 10,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  filterLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#718096',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
    width: 105,
  },
  pickerText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0C2340',
    flex: 1,
  },
  pickerArrow: {
    fontSize: 7,
    color: '#718096',
    marginLeft: 4,
  },
  countersColumn: {
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderColor: '#FEF9F1',
    paddingLeft: 10,
  },
  counterText: {
    fontSize: 8.5,
    fontWeight: '900',
    marginBottom: 3,
  },
  dropdownPopover: {
    position: 'absolute',
    top: 155,
    left: 20,
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 99,
  },
  dropdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderColor: '#FEF9F1',
  },
  dropdownOptionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2D3748',
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
  roomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 12,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 2,
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: '#FEF9F1',
    paddingBottom: 6,
    marginBottom: 8,
  },
  roomNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  roomFloor: {
    fontSize: 8.5,
    color: '#718096',
    fontWeight: '600',
  },
  roomCardBody: {
    marginBottom: 8,
  },
  roomType: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  roomPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#0C2340',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 0.5,
    alignSelf: 'flex-start',
  },
  badgeAvailable: {
    backgroundColor: 'rgba(72, 187, 120, 0.1)',
    borderColor: 'rgba(72, 187, 120, 0.2)',
  },
  badgeOccupied: {
    backgroundColor: 'rgba(229, 62, 62, 0.1)',
    borderColor: 'rgba(229, 62, 62, 0.2)',
  },
  badgeDirty: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  badgeCleaning: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  badgeMaintenance: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  badgeReserved: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  badgeOOS: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  statusIcon: {
    fontSize: 9,
    marginRight: 4,
  },
  statusText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  textAvailable: { color: '#38A169' },
  textOccupied: { color: '#E53E3E' },
  textDirty: { color: '#D97706' },
  textCleaning: { color: '#2563EB' },
  textMaintenance: { color: '#4B5563' },
  textReserved: { color: '#7C3AED' },
  textOOS: { color: '#4B5563' },
  emptyContainer: {
    paddingVertical: 50,
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
  modalHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 15,
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
    marginBottom: 5,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#0C2340',
    fontWeight: '600',
    marginBottom: 10,
  },
  modalDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  modalDropdownText: {
    fontSize: 12,
    color: '#0C2340',
    fontWeight: '600',
  },
  formTypeDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginBottom: 10,
    maxHeight: 120,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
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
  deleteIconBtn: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
    borderWidth: 1,
    padding: 8,
    borderRadius: 10,
  },
  statusButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 15,
  },
  statusOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: '48%',
    marginBottom: 8,
  },
  statusOptionBtnActive: {
    backgroundColor: '#0C2340',
    borderColor: '#D4AF37',
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#718096',
  },
  statusOptionTextActive: {
    color: '#D4AF37',
  },
  closeSheetBtn: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  closeSheetBtnText: {
    color: '#718096',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

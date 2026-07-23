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
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { api } from '../api';
import { Ionicons } from '@expo/vector-icons';

export default function TablesScreen({ user, onLogout, onOpenDrawer, lastNotificationTime }) {
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [floors, setFloors] = useState([]);
  
  // Loading & Action States
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageFloorsOpen, setIsManageFloorsOpen] = useState(false);

  // Form Fields
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [newTableZone, setNewTableZone] = useState('Main Hall');
  const [newFloorName, setNewFloorName] = useState('');

  const loadTables = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.get('/tables');
      setTables(data || []);
      
      // Update selected table reference
      if (selectedTable) {
        const updated = (data || []).find(t => t.id === selectedTable.id);
        setSelectedTable(updated || null);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadFloors = async () => {
    try {
      const data = await api.get('/floors');
      setFloors(data || []);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    loadTables();
    loadFloors();

    const interval = setInterval(() => {
      loadTables(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastNotificationTime) {
      loadTables(true);
      loadFloors();
    }
  }, [lastNotificationTime]);

  const handleAddTable = async () => {
    if (!newTableName.trim()) {
      Alert.alert('Error', 'Please enter a table name.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/tables', {
        name: newTableName.trim(),
        capacity: parseInt(newTableCapacity) || 4,
        section: newTableZone
      });
      Alert.alert('Success', 'Table added successfully.');
      setIsAddModalOpen(false);
      setNewTableName('');
      loadTables();
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not add table.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFloor = async () => {
    if (!newFloorName.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/floors', { name: newFloorName.trim() });
      setNewFloorName('');
      loadFloors();
      Alert.alert('Success', 'Floor added successfully.');
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not add floor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFloor = async (floorId) => {
    Alert.alert(
      'Delete Floor',
      'Are you sure you want to delete this floor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/floors/${floorId}`);
              loadFloors();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete floor.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteTable = async (tableId) => {
    Alert.alert(
      'Delete Table',
      'Are you sure you want to delete this table?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/tables/${tableId}`);
              setSelectedTable(null);
              loadTables();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete table.');
            }
          }
        }
      ]
    );
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedTable) return;
    try {
      await api.patch(`/tables/${selectedTable.id}/status`, { status });
      loadTables();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update table status.');
    }
  };

  // Get dynamic zones list
  const getDynamicZones = () => {
    const list = ['All', 'Main Hall', 'Garden Terrace', 'VIP Lounge', 'Bar Area'];
    floors.forEach(f => {
      if (!list.includes(f.name)) {
        list.push(f.name);
      }
    });
    return list;
  };

  const zones = getDynamicZones();

  // Filtered tables list
  const filteredTables = tables.filter(t => {
    if (selectedZone === 'All') return true;
    return t.section === selectedZone;
  });

  // Analytics helper calculations
  const totalTablesCount = filteredTables.length;
  const freeTables = filteredTables.filter(t => t.status === 'AVAILABLE' || t.status === 'CLEANING');
  const seatedTables = filteredTables.filter(t => t.status === 'OCCUPIED');
  const bookedTables = filteredTables.filter(t => t.status === 'RESERVED');
  
  const occupancyPercent = totalTablesCount > 0 
    ? Math.round((seatedTables.length / totalTablesCount) * 100) 
    : 0;

  // Estimated dining value (Live Dine Sales)
  const estimatedValue = seatedTables.reduce((acc, t) => {
    if (t.currentOrder && typeof t.currentOrder.totalAmount === 'number') {
      return acc + t.currentOrder.totalAmount;
    }
    return acc;
  }, 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
      case 'CLEANING':
        return styles.statusFree;
      case 'OCCUPIED':
        return styles.statusSeated;
      default:
        return styles.statusBooked;
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
      case 'CLEANING':
        return styles.statusTextFree;
      case 'OCCUPIED':
        return styles.statusTextSeated;
      default:
        return styles.statusTextBooked;
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
            <Text style={styles.headerTitle}>Floor Plan</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Tables</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleHeading}>Interactive Floor Plan</Text>
          <Text style={styles.titleSubheading}>Real-time table status, customer capacities, and floor operations</Text>
          
          <View style={styles.headerActionsRow}>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => setIsManageFloorsOpen(true)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="business-outline" size={14} color="#D4AF37" style={{ marginRight: 6 }} />
                <Text style={styles.outlineBtnText}>Manage Floors</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.goldBtn} onPress={() => setIsAddModalOpen(true)}>
              <Text style={styles.goldBtnText}>＋ Add Table</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Zones scroll list tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
          {zones.map((zone) => (
            <TouchableOpacity
              key={zone}
              style={[styles.tabBtn, selectedZone === zone && styles.tabBtnActive]}
              onPress={() => setSelectedZone(zone)}
            >
              <Text style={[styles.tabBtnText, selectedZone === zone && styles.tabBtnTextActive]}>
                {zone}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status Legend Row */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#38A169' }]} />
            <Text style={styles.legendLabel}>Free</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E53E3E' }]} />
            <Text style={styles.legendLabel}>Seated</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
            <Text style={styles.legendLabel}>Booked</Text>
          </View>
        </View>

        {/* Tables Grid Layout */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>{selectedZone} Tables</Text>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={styles.loadingText}>Updating floor mapping...</Text>
            </View>
          ) : filteredTables.length === 0 ? (
            <View style={styles.emptyGridCard}>
              <Ionicons name="restaurant-outline" size={32} color="#D4AF37" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyGridText}>No tables found in this zone.</Text>
              <Text style={styles.emptyGridSubtext}>Click "Add Table" to create one!</Text>
            </View>
          ) : (
            <View style={styles.tablesGrid}>
              {filteredTables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                return (
                  <TouchableOpacity
                    key={table.id}
                    style={[styles.tableCard, getStatusColor(table.status), isSelected && styles.tableCardSelected]}
                    onPress={() => setSelectedTable(table)}
                  >
                    <Text style={styles.tableName}>{table.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="people-outline" size={12} color="#718096" style={{ marginRight: 4 }} />
                      <Text style={styles.tableCapacity}>{table.capacity} pax</Text>
                    </View>
                    
                    {/* Status indicator pill */}
                    <View style={[styles.statusPillBadge, getStatusColor(table.status)]}>
                      <Text style={[styles.statusPillBadgeText, getStatusTextColor(table.status)]}>
                        {table.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Floor Analytics and Dining Statistics */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Floor Analytics</Text>

          <View style={styles.analyticsRow}>
            {/* Occupancy circular mockup widget */}
            <View style={styles.occupancyWidget}>
              <View style={styles.circularMock}>
                <Text style={styles.circularText}>{occupancyPercent}%</Text>
                <Text style={styles.circularSubText}>OCCUPIED</Text>
              </View>
            </View>

            {/* Estimated sales details */}
            <View style={styles.salesWidget}>
              <Text style={styles.salesLabel}>ESTIMATED DINING VALUE</Text>
              <Text style={styles.salesVal}>₹{estimatedValue.toLocaleString()}</Text>
              <Text style={styles.salesSubtitle}>Live Dine Sales</Text>
            </View>
          </View>

          <View style={styles.analyticsDivider} />

          {/* Counts */}
          <View style={styles.countSummaryRow}>
            <View style={styles.countSummaryCol}>
              <Text style={[styles.countVal, { color: '#38A169' }]}>{freeTables.length}</Text>
              <Text style={styles.countLabel}>FREE</Text>
            </View>
            <View style={styles.countSummaryCol}>
              <Text style={[styles.countVal, { color: '#E53E3E' }]}>{seatedTables.length}</Text>
              <Text style={styles.countLabel}>SEATED</Text>
            </View>
            <View style={styles.countSummaryCol}>
              <Text style={[styles.countVal, { color: '#D97706' }]}>{bookedTables.length}</Text>
              <Text style={styles.countLabel}>BOOKED</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* MODAL 1: ADD TABLE */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Add New Table</Text>
            <Text style={styles.modalSubheading}>Configure customer capacities and floor sections</Text>

            <Text style={styles.modalLabel}>Table Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Table 12, Window booth"
              placeholderTextColor="#A0AEC0"
              value={newTableName}
              onChangeText={setNewTableName}
            />

            <Text style={styles.modalLabel}>Capacity (pax)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="4"
              placeholderTextColor="#A0AEC0"
              value={newTableCapacity}
              onChangeText={setNewTableCapacity}
            />

            <Text style={styles.modalLabel}>Floor Section / Zone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 35, marginBottom: 15 }}>
              {zones.filter(z => z !== 'All').map((z) => (
                <TouchableOpacity
                  key={z}
                  style={[styles.pickerBadge, newTableZone === z && styles.pickerBadgeActive]}
                  onPress={() => setNewTableZone(z)}
                >
                  <Text style={[styles.pickerBadgeText, newTableZone === z && styles.pickerBadgeTextActive]}>
                    {z}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddTable} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#D4AF37" />
                ) : (
                  <Text style={styles.confirmBtnText}>Add Table</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: MANAGE FLOORS */}
      <Modal visible={isManageFloorsOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Manage Floors</Text>
            <Text style={styles.modalSubheading}>Configure custom floor layout labels</Text>

            {/* Add floor */}
            <View style={{ flexDirection: 'row', marginBottom: 15 }}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                placeholder="Floor Name (e.g. Ground Floor)"
                placeholderTextColor="#A0AEC0"
                value={newFloorName}
                onChangeText={setNewFloorName}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddFloor} disabled={submitting}>
                <Text style={styles.addBtnText}>＋ Add</Text>
              </TouchableOpacity>
            </View>

            {/* List of custom floors */}
            <ScrollView style={{ maxHeight: 180, marginBottom: 15 }}>
              {floors.length === 0 ? (
                <Text style={styles.emptyListText}>No custom floors configured.</Text>
              ) : (
                floors.map((f) => (
                  <View key={f.id} style={styles.floorRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="business-outline" size={14} color="#D4AF37" style={{ marginRight: 6 }} />
                      <Text style={styles.floorRowName}>{f.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteFloor(f.id)}>
                      <Text style={styles.deleteLink}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsManageFloorsOpen(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: TABLE DETAIL SHEET */}
      <Modal visible={!!selectedTable} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.modalHeading}>{selectedTable?.name}</Text>
              <View style={[styles.statusPillBadge, selectedTable ? getStatusColor(selectedTable.status) : null]}>
                <Text style={[styles.statusPillBadgeText, selectedTable ? getStatusTextColor(selectedTable.status) : null]}>
                  {selectedTable?.status}
                </Text>
              </View>
            </View>
            <Text style={styles.modalSubheading}>Capacity: {selectedTable?.capacity} pax • Section: {selectedTable?.section}</Text>

            {/* Quick Status Adjustments */}
            <Text style={styles.modalLabel}>Update Status</Text>
            <View style={styles.quickStatusGrid}>
              <TouchableOpacity
                style={[styles.statusOptionBtn, { borderColor: '#38A169' }]}
                onPress={() => handleUpdateStatus('AVAILABLE')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark-circle-outline" size={12} color="#38A169" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#38A169' }}>Free Table</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusOptionBtn, { borderColor: '#E53E3E' }]}
                onPress={() => handleUpdateStatus('OCCUPIED')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="people-outline" size={12} color="#E53E3E" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#E53E3E' }}>Seat Guest</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusOptionBtn, { borderColor: '#D97706' }]}
                onPress={() => handleUpdateStatus('RESERVED')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="calendar-outline" size={12} color="#D97706" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#D97706' }}>Reserve Table</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Delete button */}
            <TouchableOpacity
              style={[styles.statusOptionBtn, { borderColor: '#E53E3E', backgroundColor: '#FFF5F5', marginTop: 10 }]}
              onPress={() => handleDeleteTable(selectedTable.id)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="trash-outline" size={12} color="#E53E3E" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#E53E3E' }}>Delete Table</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTable(null)}>
              <Text style={styles.closeBtnText}>Close Panel</Text>
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
  headerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 12,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#EBE5DA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  outlineBtnText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  goldBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  goldBtnText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  tabsContainer: {
    height: 35,
    marginBottom: 15,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginRight: 8,
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#0C2340',
    borderColor: '#0C2340',
  },
  tabBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#718096',
  },
  tabBtnTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  legendLabel: {
    fontSize: 11,
    color: '#718096',
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
  centerLoading: {
    paddingVertical: 35,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#718096',
    fontSize: 11,
  },
  emptyGridCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#EBE5DA',
    borderRadius: 14,
    paddingVertical: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGridText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  emptyGridSubtext: {
    fontSize: 10,
    color: '#718096',
    marginTop: 3,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tableCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCardSelected: {
    borderColor: '#D4AF37',
    borderWidth: 2,
  },
  tableName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  tableCapacity: {
    fontSize: 9.5,
    color: '#718096',
    marginTop: 2,
  },
  statusPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    marginTop: 6,
  },
  statusPillBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  statusFree: { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
  statusSeated: { borderColor: '#FEC5C5', backgroundColor: '#FFF5F5' },
  statusBooked: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  statusTextFree: { color: '#059669' },
  statusTextSeated: { color: '#C53030' },
  statusTextBooked: { color: '#D97706' },

  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  occupancyWidget: {
    flex: 1,
    alignItems: 'center',
  },
  circularMock: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: '#EBE5DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  circularSubText: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#718096',
    marginTop: 2,
  },
  salesWidget: {
    flex: 1.5,
    paddingLeft: 15,
  },
  salesLabel: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#718096',
    letterSpacing: 0.5,
  },
  salesVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0C2340',
    marginTop: 4,
  },
  salesSubtitle: {
    fontSize: 9.5,
    color: '#A0AEC0',
    marginTop: 2,
  },
  analyticsDivider: {
    height: 0.5,
    backgroundColor: '#FEF9F1',
    marginVertical: 12,
  },
  countSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  countSummaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  countVal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  countLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#A0AEC0',
    marginTop: 2,
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
  },
  modalSubheading: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0C2340',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  modalInput: {
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
  pickerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginRight: 6,
    justifyContent: 'center',
  },
  pickerBadgeActive: {
    backgroundColor: '#0C2340',
    borderColor: '#0C2340',
  },
  pickerBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#718096',
  },
  pickerBadgeTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
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
  addBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#D4AF37',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  emptyListText: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
    paddingVertical: 20,
  },
  floorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#EBE5DA',
  },
  floorRowName: {
    fontSize: 11.5,
    color: '#0C2340',
    fontWeight: '600',
  },
  deleteLink: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E53E3E',
  },
  closeBtn: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  closeBtnText: {
    color: '#718096',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickStatusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusOptionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
});

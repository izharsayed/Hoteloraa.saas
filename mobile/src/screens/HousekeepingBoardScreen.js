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
  Modal,
} from 'react-native';
import { api } from '../api';
import { Ionicons } from '@expo/vector-icons';

export default function HousekeepingBoardScreen({ user, onLogout, onOpenDrawer }) {
  const [housekeepingList, setHousekeepingList] = useState([]);
  const [staff, setStaff] = useState([
    { id: 'static-1', name: 'Sunita Devi' },
    { id: 'static-2', name: 'Amit Kumar' },
    { id: 'static-3', name: 'Ramesh Singh' }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dropdown Picker Modal
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null);

  const fetchHousekeepingTasks = async () => {
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
      console.warn(e);
      setError('Failed to load housekeeping board tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const users = await api.get('/users');
      const hkUsers = (users || []).filter(u => u.userRole === 'HOUSEKEEPING' || u.userRole === 'RECEPTIONIST' || u.userRole === 'MANAGER');
      if (hkUsers.length > 0) {
        setStaff(hkUsers.map(u => ({ id: u.id, name: u.name })));
      }
    } catch (e) {
      console.warn('Could not fetch staff list, using default roster');
    }
  };

  useEffect(() => {
    fetchHousekeepingTasks();
    fetchStaff();
  }, []);

  const handleAssignStaff = async (taskId, staffId) => {
    try {
      // 1. Assign staff member
      await api.put(`/housekeeping/${taskId}`, {
        assignedTo: staffId
      });
      
      // 2. Set status to IN_PROGRESS (Cleaning)
      await api.patch(`/housekeeping/${taskId}/status`, {
        status: 'IN_PROGRESS'
      });
      
      Alert.alert('Staff Assigned', 'Housekeeper successfully assigned to the room.');
      setPickerVisible(false);
      fetchHousekeepingTasks();
    } catch (err) {
      console.warn(err);
      Alert.alert('Assignment Failed', err.message || 'Failed to assign housekeeper.');
    }
  };

  const handleMarkClean = async (taskId) => {
    try {
      await api.patch(`/housekeeping/${taskId}/status`, {
        status: 'COMPLETED'
      });
      Alert.alert('Done', 'Room marked as cleaned.');
      fetchHousekeepingTasks();
    } catch (err) {
      console.warn(err);
      Alert.alert('Action Failed', err.message || 'Failed to complete cleaning task.');
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
            <Text style={styles.headerTitle}>Housekeeping Board</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Board</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleHeading}>Housekeeping Board</Text>
              <Text style={styles.titleSubheading}>Assign cleaning staff, track room cleaning statuses, and inspect rooms</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchHousekeepingTasks} disabled={loading}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="refresh" size={14} color="#D4AF37" style={{ marginRight: 4 }} />
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cleaning Queue Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Pending Cleaning Queue</Text>
          
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text style={styles.loadingText}>Loading queue...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="alert-circle-outline" size={16} color="#C53030" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </View>
          ) : housekeepingList.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="sparkles" size={40} color="#D4AF37" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTextBold}>All Rooms Cleaned</Text>
              <Text style={styles.emptyText}>Ready for new guest check-ins.</Text>
            </View>
          ) : (
            <View style={styles.listWrapper}>
              {housekeepingList.map((task) => {
                const isDirty = task.status === 'PENDING';
                const uiStatus = isDirty ? 'Dirty' : 'Cleaning';
                const assignedStaffName = staff.find(s => s.id === task.assignedTo)?.name || 'Assign Staff';
                
                return (
                  <View key={task.id} style={[styles.taskRow, isDirty ? styles.taskRowDirty : styles.taskRowCleaning]}>
                    <View style={styles.taskLeft}>
                      <View style={styles.roomNumBadge}>
                        <Text style={styles.roomNumBadgeText}>{task.room?.number}</Text>
                      </View>
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.roomType}>{task.room?.roomType?.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <Ionicons name="alert-circle-outline" size={12} color="#E53E3E" style={{ marginRight: 4 }} />
                          <Text style={styles.taskNotes}>{task.notes || 'Automated cleanup from checkout'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Staff dropdown trigger */}
                    <TouchableOpacity
                      style={styles.staffDropdownBtn}
                      onPress={() => {
                        setSelectedTaskForAssign(task);
                        setPickerVisible(true);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 110 }}>
                        <Ionicons name="person-outline" size={12} color="#718096" style={{ marginRight: 4 }} />
                        <Text style={styles.staffDropdownText} numberOfLines={1}>{assignedStaffName}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Status Pill */}
                    <View style={[styles.statusPill, isDirty ? styles.statusPillDirty : styles.statusPillCleaning]}>
                      <Text style={[styles.statusPillText, isDirty ? styles.statusPillTextDirty : styles.statusPillTextCleaning]}>
                        {uiStatus}
                      </Text>
                    </View>

                    {/* Done Action */}
                    <TouchableOpacity style={styles.doneBtn} onPress={() => handleMarkClean(task.id)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="checkmark-circle-outline" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                        <Text style={styles.doneBtnText}>Done</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Housekeeping Roster Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="sparkles" size={16} color="#D4AF37" style={{ marginRight: 6 }} />
            <Text style={[styles.cardHeading, { marginBottom: 0 }]}>Housekeeping Roster</Text>
          </View>
          <View style={styles.rosterWrapper}>
            {staff.map((u, idx) => (
              <View key={u.id || idx} style={styles.rosterRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.rosterAvatar}>
                    <Text style={styles.rosterAvatarText}>
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.rosterName}>{u.name}</Text>
                    <Text style={styles.rosterRole}>Housekeeper</Text>
                  </View>
                </View>
                <View style={styles.onlineIndicator}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Online</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* STAFF PICKER MODAL */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Assign Housekeeper</Text>
            <Text style={styles.modalSubheading}>Select staff member to assign to Room {selectedTaskForAssign?.room?.number}</Text>
            
            <ScrollView style={{ maxHeight: 220, marginVertical: 10 }}>
              {staff.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={styles.pickerOption}
                  onPress={() => handleAssignStaff(selectedTaskForAssign.id, u.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="person-outline" size={14} color="#718096" style={{ marginRight: 6 }} />
                    <Text style={styles.pickerOptionText}>{u.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setPickerVisible(false)}>
              <Text style={styles.closeBtnText}>Cancel</Text>
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
  centerLoading: {
    paddingVertical: 35,
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
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 28,
    color: '#38A169',
    marginBottom: 6,
  },
  emptyTextBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  emptyText: {
    fontSize: 10.5,
    color: '#718096',
    marginTop: 2,
  },
  listWrapper: {
    width: '100%',
  },
  taskRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  taskRowDirty: {
    borderColor: '#FCD34D',
    backgroundColor: 'rgba(252, 211, 77, 0.04)',
  },
  taskRowCleaning: {
    borderColor: '#93C5FD',
    backgroundColor: 'rgba(147, 197, 253, 0.04)',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  roomNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0C2340',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomNumBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  roomType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  taskNotes: {
    fontSize: 9.5,
    color: '#718096',
    marginTop: 2,
  },
  staffDropdownBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flex: 1,
    marginBottom: 8,
  },
  staffDropdownText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2D3748',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    marginBottom: 8,
  },
  statusPillDirty: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
  statusPillCleaning: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
  statusPillText: { fontSize: 8.5, fontWeight: 'bold' },
  statusPillTextDirty: { color: '#B45309' },
  statusPillTextCleaning: { color: '#1D4ED8' },
  doneBtn: {
    backgroundColor: '#38A169',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  rosterWrapper: {
    width: '100%',
  },
  rosterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#FEF9F1',
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
    borderRadius: 12,
    marginBottom: 8,
  },
  rosterAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0C2340',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosterAvatarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  rosterName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  rosterRole: {
    fontSize: 8.5,
    color: '#718096',
    marginTop: 1,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38A169',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#38A169',
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
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  modalSubheading: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
    marginBottom: 12,
  },
  pickerOption: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#EBE5DA',
  },
  pickerOptionText: {
    fontSize: 12,
    color: '#2D3748',
    fontWeight: '600',
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
});

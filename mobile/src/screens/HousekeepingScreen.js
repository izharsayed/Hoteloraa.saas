import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
  Platform,
} from 'react-native';
import { api } from '../api';
import { Ionicons } from '@expo/vector-icons';

const STATUS_FILTERS = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'INSPECTED'];

const STATUS_COLORS = {
  PENDING: { bg: '#FFF5F5', border: '#FEB2B2', text: '#C53030' },
  IN_PROGRESS: { bg: '#EBF8FF', border: '#90CDF4', text: '#2B6CB0' },
  COMPLETED: { bg: '#F0FFF4', border: '#9AE6B4', text: '#2F855A' },
  INSPECTED: { bg: '#FAF5FF', border: '#D6BCFA', text: '#6B46C1' },
};

const TASK_TYPE_LABELS = {
  CLEANING: 'Cleaning',
  INSPECTION: 'Inspection',
  MAINTENANCE: 'Maintenance',
  TURNDOWN: 'Turndown Service',
};

const getTaskIcon = (taskType) => {
  switch (taskType) {
    case 'CLEANING': return 'brush-outline';
    case 'INSPECTION': return 'search-outline';
    case 'MAINTENANCE': return 'construct-outline';
    case 'TURNDOWN': return 'bed-outline';
    default: return 'checkbox-outline';
  }
};

export default function HousekeepingScreen({ user, onLogout, onOpenDrawer }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const fetchTasks = async () => {
    try {
      // Fetch tasks assigned to the current housekeeper
      const data = await api.get('/housekeeping/my-tasks');
      setTasks(data || []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load housekeeping tasks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const updateTaskStatus = async (taskId, currentStatus) => {
    let nextStatus = '';
    let actionLabel = '';

    if (currentStatus === 'PENDING') {
      nextStatus = 'IN_PROGRESS';
      actionLabel = 'Start Task';
    } else if (currentStatus === 'IN_PROGRESS') {
      nextStatus = 'COMPLETED';
      actionLabel = 'Complete Task';
    } else {
      // Completed or Inspected - no quick action
      return;
    }

    Alert.alert(
      'Update Status',
      `Would you like to mark this task as ${nextStatus.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              await api.patch(`/housekeeping/${taskId}/status`, { status: nextStatus });
              Alert.alert('Success', `Task marked as ${nextStatus.replace('_', ' ')}.`);
              fetchTasks();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to update task status.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredTasks = tasks.filter(task => {
    if (selectedFilter === 'ALL') return true;
    return task.status === selectedFilter;
  });

  const renderTaskItem = ({ item }) => {
    const statusStyle = STATUS_COLORS[item.status] || { bg: '#EDF2F7', border: '#CBD5E0', text: '#4A5568' };
    const roomNumber = item.room ? item.room.number : 'N/A';
    const roomType = item.room && item.room.roomType ? item.room.roomType.name : '';
    const floorLabel = item.room ? `Floor ${item.room.floor}` : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.roomNumber}>Room {roomNumber}</Text>
            {roomType ? <Text style={styles.roomType}>{roomType} • {floorLabel}</Text> : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name={getTaskIcon(item.taskType)} size={16} color="#D4AF37" style={{ marginRight: 6 }} />
            <Text style={styles.taskType}>{TASK_TYPE_LABELS[item.taskType] || item.taskType}</Text>
          </View>
          {item.notes ? (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          ) : null}
          {item.scheduledAt ? (
            <Text style={styles.scheduledTime}>
              Scheduled: {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          ) : null}
        </View>

        {/* Quick Action Button */}
        {item.status === 'PENDING' || item.status === 'IN_PROGRESS' ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              item.status === 'PENDING' ? styles.btnStart : styles.btnComplete,
            ]}
            onPress={() => updateTaskStatus(item.id, item.status)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons 
                name={item.status === 'PENDING' ? "play" : "checkmark-circle-outline"} 
                size={14} 
                color={item.status === 'PENDING' ? "#0C2340" : "#FFFFFF"} 
                style={{ marginRight: 4 }} 
              />
              <Text style={styles.actionBtnText}>
                {item.status === 'PENDING' ? 'Start Task' : 'Mark Completed'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onOpenDrawer && (
            <TouchableOpacity onPress={onOpenDrawer} style={{ marginRight: 15, padding: 4 }}>
              <Ionicons name="menu" size={28} color="#D4AF37" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Housekeeping</Text>
            <Text style={styles.headerSubtitle}>Logged in as {user.name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Horizontal Tab bar */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                selectedFilter === item && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(item)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === item && styles.filterTabTextActive,
                ]}
              >
                {item.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterScroll}
        />
      </View>

      {/* Main List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Fetching tasks...</Text>
        </View>
      ) : filteredTasks.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="brush-outline" size={48} color="#D4AF37" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No tasks found in this category.</Text>
              <TouchableOpacity style={styles.refreshBtn} onPress={fetchTasks}>
                <Text style={styles.refreshBtnText}>Reload Tasks</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={item => item.id}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" />
          }
        />
      )}
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
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#D4AF37',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'sans-serif-medium',
  },
  headerSubtitle: {
    fontSize: 10.5,
    color: '#E2E8F0',
    marginTop: 2,
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
    fontWeight: 'bold',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EBE5DA',
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginRight: 6,
  },
  filterTabActive: {
    backgroundColor: '#0C2340',
    borderColor: '#0C2340',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  filterTabTextActive: {
    color: '#D4AF37',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0C2340',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderColor: '#FEF9F1',
    paddingBottom: 10,
    marginBottom: 10,
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  roomType: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardBody: {
    marginBottom: 12,
  },
  taskType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2933',
    marginBottom: 6,
  },
  notesContainer: {
    backgroundColor: '#FEF9F1',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#EBE5DA',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 12,
    color: '#1F2933',
    lineHeight: 16,
  },
  scheduledTime: {
    fontSize: 11,
    color: '#A0AEC0',
    marginTop: 8,
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  btnStart: {
    backgroundColor: '#0C2340',
  },
  btnComplete: {
    backgroundColor: '#D4AF37',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#718096',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshBtn: {
    backgroundColor: '#0C2340',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  refreshBtnText: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

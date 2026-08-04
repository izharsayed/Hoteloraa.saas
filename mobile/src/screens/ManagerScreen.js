import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { api } from '../api';
import { Ionicons } from '@expo/vector-icons';

export default function ManagerScreen({ user, onLogout, onOpenDrawer, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const businessType = user.businessType || 'HOTEL_RESTAURANT'; // Fallback to combined

  const fetchDashboardStats = async () => {
    try {
      const data = await api.get('/dashboard');
      setStats(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load manager dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const renderCard = (title, value, subtitle, iconName, targetView) => {
    const CardWrapper = targetView && onNavigate ? TouchableOpacity : View;
    return (
      <CardWrapper
        style={styles.statCard}
        onPress={() => {
          if (targetView && onNavigate) {
            onNavigate(targetView);
          }
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Ionicons name={iconName} size={18} color="#D4AF37" />
        </View>
        <Text style={styles.cardValue}>{value}</Text>
        {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      </CardWrapper>
    );
  };

  const renderRestaurantStats = (data) => {
    if (!data) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Restaurant Operations</Text>
        <View style={styles.grid}>
          {renderCard("Today's Revenue", `₹${data.todayRevenue || 0}`, "Paid orders today", "cash-outline", "pos")}
          {renderCard("Occupied Tables", `${data.occupiedTables || 0} / ${data.totalTables || 0}`, "Currently active tables", "restaurant-outline", "tables")}
          {renderCard("Pending KOTs", data.pendingKOTs || 0, "Orders in kitchen", "flame-outline", "kitchen")}
          {renderCard("Total Orders", data.totalOrders || 0, "Orders processed today", "receipt-outline", "orders")}
        </View>

        {/* Dine-in vs Takeaway split */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Sales Channel Breakdown</Text>
          <View style={styles.breakdownRow}>
            <View>
              <Text style={styles.breakdownLabel}>Dine-In Sales</Text>
              <Text style={styles.breakdownValue}>₹{data.dineInSales || 0}</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.breakdownLabel}>Takeaway Sales</Text>
              <Text style={styles.breakdownValue}>₹{data.takeawaySales || 0}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderLodgingStats = (data) => {
    if (!data) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Lodging / Hotel Operations</Text>
        <View style={styles.grid}>
          {renderCard("Lodging Revenue", `₹${data.todayRevenue || 0}`, "Room charges & services", "business-outline", "checkout")}
          {renderCard("Room Occupancy", `${data.occupiedRooms || 0} / ${data.totalRooms || 0}`, "Rooms currently occupied", "key-outline", "rooms")}
          {renderCard("Today's Check-ins", data.todayCheckIns || 0, "Expected arrivals today", "log-in-outline", "checkin")}
          {renderCard("Pending Cleanings", data.pendingHousekeeping || 0, "Housekeeping tasks remaining", "brush-outline", "housekeeping")}
        </View>

      {/* Room bookings vs room service */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Revenue Breakdown</Text>
        <View style={styles.breakdownRow}>
          <View>
            <Text style={styles.breakdownLabel}>Room Bookings</Text>
            <Text style={styles.breakdownValue}>₹{data.roomBookings || 0}</Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.breakdownLabel}>Room Service</Text>
            <Text style={styles.breakdownValue}>₹{data.roomService || 0}</Text>
          </View>
        </View>
      </View>
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
            <Text style={styles.headerTitle}>Manager Dashboard</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • {user.name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Fetching analytics...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" />
          }
        >
          {stats ? (
            <>
              {/* Combined Revenue Card (for HOTEL_RESTAURANT) */}
              {businessType === 'HOTEL_RESTAURANT' && (
                <View style={styles.combinedRevenueCard}>
                  <Text style={styles.combinedLabel}>TOTAL REVENUE TODAY</Text>
                  <Text style={styles.combinedValue}>₹{stats.combinedTodayRevenue || 0}</Text>
                  <Text style={styles.combinedSubtitle}>Combined lodging + restaurant sales</Text>
                </View>
              )}

              {/* Render Restaurant Stats if RESTAURANT or HOTEL_RESTAURANT */}
              {(businessType === 'RESTAURANT' || businessType === 'HOTEL_RESTAURANT') && (
                renderRestaurantStats(businessType === 'HOTEL_RESTAURANT' ? stats.restaurant : stats)
              )}

              {/* Render Lodging Stats if LODGING or HOTEL_RESTAURANT */}
              {(businessType === 'LODGING' || businessType === 'HOTEL_RESTAURANT') && (
                renderLodgingStats(businessType === 'HOTEL_RESTAURANT' ? stats.lodging : stats)
              )}
            </>
          ) : (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No dashboard data available.</Text>
            </View>
          )}
        </ScrollView>
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
    paddingBottom: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 16,
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
  scrollContent: {
    padding: 16,
  },
  combinedRevenueCard: {
    backgroundColor: '#0C2340',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    shadowColor: '#0C2340',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  combinedLabel: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  combinedValue: {
    color: '#D4AF37',
    fontSize: 34,
    fontWeight: 'bold',
    marginTop: 8,
  },
  combinedSubtitle: {
    color: '#A0AEC0',
    fontSize: 11,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 16,
    width: '48%', // Approx half screen width
    minHeight: 110,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#718096',
    textTransform: 'uppercase',
    maxWidth: '80%',
  },
  cardIcon: {
    fontSize: 14,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0C2340',
    marginTop: 10,
  },
  cardSubtitle: {
    fontSize: 10,
    color: '#A0AEC0',
    marginTop: 4,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 16,
    marginTop: 12,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#718096',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C2340',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#EBE5DA',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#718096',
  },
  emptyText: {
    color: '#718096',
  },
});

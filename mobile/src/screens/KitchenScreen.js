import React, { useState, useEffect, useMemo } from 'react';
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

export default function KitchenScreen({ user, onLogout, onOpenDrawer }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' | 'Preparing' | 'Ready' | 'Aggregated'

  const loadTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/kot');
      const activeKots = (response || []).filter(kot => 
        kot.status !== 'CANCELLED' && 
        kot.order?.status !== 'SERVED' && 
        kot.order?.status !== 'COMPLETED'
      );
      
      const mapped = activeKots.map(kot => {
        const orderType = kot.order?.table ? 'Dine-In' : 'Takeaway';
        return {
          id: kot.id,
          kotNumber: kot.kotNumber,
          orderId: kot.order?.id,
          table: kot.order?.table?.name || 'Quick POS',
          captain: kot.user?.name || 'POS System',
          orderType,
          status: kot.status === 'PENDING' ? 'Pending' : kot.status === 'IN_PROGRESS' ? 'InProgress' : 'Ready',
          createdAt: new Date(kot.createdAt),
          items: (kot.items || []).map(item => ({
            name: item.orderItem?.menuItem?.name || 'Unknown Item',
            qty: item.quantity,
            checked: kot.status === 'READY',
            notes: item.notes
          }))
        };
      });
      setTickets(mapped);
    } catch (err) {
      console.warn(err);
      setError(err.message || 'Failed to load kitchen tickets');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(() => {
      loadTickets(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedTime = (createdAt) => {
    if (!createdAt || isNaN(createdAt.getTime())) return 0;
    const diffMs = Date.now() - createdAt.getTime();
    return Math.floor(diffMs / 60000);
  };

  const isDelayed = (ticket) => {
    const elapsed = getElapsedTime(ticket.createdAt);
    if (ticket.status === 'Pending' && elapsed >= 10) return true;
    if (ticket.status === 'InProgress' && elapsed >= 15) return true;
    return false;
  };

  const handleStartPrep = async (id) => {
    try {
      await api.patch(`/kot/${id}/status`, { status: 'IN_PROGRESS' });
      loadTickets(true);
      Alert.alert('Status Updated', 'Preparation started.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to start preparation');
    }
  };

  const handleMarkReady = async (id) => {
    try {
      await api.patch(`/kot/${id}/status`, { status: 'READY' });
      loadTickets(true);
      Alert.alert('Status Updated', 'Order marked as Ready for Service.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to mark KOT ready');
    }
  };

  const handleMarkServed = async (id, orderId) => {
    try {
      if (orderId) {
        await api.patch(`/orders/${orderId}/status`, { status: 'SERVED' });
      } else {
        // If orderId is missing, fallback to just finalizing KOT
        await api.patch(`/kot/${id}/status`, { status: 'READY' });
      }
      loadTickets(true);
      Alert.alert('Status Updated', 'Order marked as Served.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to mark served');
    }
  };

  const toggleItemCheck = (ticketId, itemIdx) => {
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        const updatedItems = t.items.map((item, idx) => 
          idx === itemIdx ? { ...item, checked: !item.checked } : item
        );
        return { ...t, items: updatedItems };
      }
      return t;
    });
    setTickets(updated);
  };

  // Filter lists
  const pendingTickets = tickets.filter(t => t.status === 'Pending');
  const inProgressTickets = tickets.filter(t => t.status === 'InProgress');
  const readyTickets = tickets.filter(t => t.status === 'Ready');

  // Aggregated quantities
  const aggregatedItems = useMemo(() => {
    const summary = {};
    const activeTickets = tickets.filter(t => t.status === 'Pending' || t.status === 'InProgress');
    
    activeTickets.forEach(ticket => {
      ticket.items.forEach(item => {
        if (!item.checked) {
          if (!summary[item.name]) summary[item.name] = 0;
          summary[item.name] += item.qty;
        }
      });
    });

    return Object.entries(summary)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
  }, [tickets]);

  const activeTicketsCount = tickets.length;

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
            <Text style={styles.headerTitle}>Live Kitchen</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Monitor</Text>
          </View>
        </View>
        <View style={styles.activeBadge}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="restaurant-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.activeBadgeText}>Tickets: {activeTicketsCount}</Text>
          </View>
        </View>
      </View>

      {/* Tabs Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'Pending' && styles.tabBtnActive]}
          onPress={() => setActiveTab('Pending')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'Pending' && styles.tabBtnTextActive]}>
            Pending ({pendingTickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'Preparing' && styles.tabBtnActive]}
          onPress={() => setActiveTab('Preparing')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'Preparing' && styles.tabBtnTextActive]}>
            Preparing ({inProgressTickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'Ready' && styles.tabBtnActive]}
          onPress={() => setActiveTab('Ready')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'Ready' && styles.tabBtnTextActive]}>
            Ready ({readyTickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'Aggregated' && styles.tabBtnActive]}
          onPress={() => setActiveTab('Aggregated')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'Aggregated' && styles.tabBtnTextActive]}>
            Dishes ({aggregatedItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text style={styles.loadingText}>Updating KOT feeds...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="alert-circle-outline" size={16} color="#C53030" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        ) : activeTab === 'Aggregated' ? (
          /* AGGREGATED DISHES LIST */
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Aggregated Dishes Summary</Text>
            {aggregatedItems.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No pending items to cook.</Text>
              </View>
            ) : (
               aggregatedItems.map((item, idx) => (
                <View key={idx} style={styles.aggItemRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="restaurant-outline" size={14} color="#D4AF37" style={{ marginRight: 6 }} />
                    <Text style={styles.aggItemName}>{item.name}</Text>
                  </View>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>x{item.qty}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          /* TICKETS COLUMNS VIEW */
          <View>
            {activeTab === 'Pending' && pendingTickets.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No pending kitchen order tickets.</Text>
              </View>
            )}
            {activeTab === 'Preparing' && inProgressTickets.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No active tickets in preparation.</Text>
              </View>
            )}
            {activeTab === 'Ready' && readyTickets.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No tickets ready for service.</Text>
              </View>
            )}

            {(activeTab === 'Pending' ? pendingTickets : activeTab === 'Preparing' ? inProgressTickets : readyTickets).map((ticket) => {
              const elapsed = getElapsedTime(ticket.createdAt);
              const delayed = isDelayed(ticket);
              
              return (
                <View
                  key={ticket.id}
                  style={[
                    styles.ticketCard,
                    delayed ? styles.ticketCardDelayed : styles.ticketCardNormal
                  ]}
                >
                  {/* Delayed banner */}
                   {delayed && (
                    <View style={styles.delayedBanner}>
                      <Ionicons name="alert-circle-outline" size={12} color="#9B2C2C" style={{ marginRight: 6 }} />
                      <Text style={styles.delayedBannerText}>DELAYED • {elapsed} mins elapsed</Text>
                    </View>
                  )}

                  {/* Ticket details */}
                  <View style={styles.ticketHeader}>
                    <View>
                      <Text style={styles.kotNum}>{ticket.kotNumber}</Text>
                      <Text style={styles.captainText}>Cap: {ticket.captain} • {ticket.orderType}</Text>
                    </View>
                     <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Ionicons name="time-outline" size={12} color="#718096" style={{ marginRight: 3 }} />
                        <Text style={styles.timeElapsed}>{elapsed}m ago</Text>
                      </View>
                      <View style={styles.tableBadge}>
                        <Text style={styles.tableBadgeText}>Table {ticket.table}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Ordered Items list */}
                  <View style={styles.itemsList}>
                    {ticket.items.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.itemRow}
                        onPress={() => toggleItemCheck(ticket.id, idx)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Ionicons 
                            name={item.checked ? "checkbox" : "square-outline"} 
                            size={16} 
                            color={item.checked ? "#D4AF37" : "#718096"} 
                            style={{ marginRight: 8 }} 
                          />
                          <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                            {item.name}
                          </Text>
                        </View>
                        <Text style={styles.itemQty}>x{item.qty}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Action buttons */}
                   {ticket.status === 'Pending' ? (
                    <TouchableOpacity
                      style={styles.actionBtnStart}
                      onPress={() => handleStartPrep(ticket.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="restaurant-outline" size={14} color="#0C2340" style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnStartText}>Start Preparation</Text>
                      </View>
                    </TouchableOpacity>
                  ) : ticket.status === 'InProgress' ? (
                    <TouchableOpacity
                      style={styles.actionBtnReady}
                      onPress={() => handleMarkReady(ticket.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark-circle-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnReadyText}>Mark Ready</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.actionBtnServed}
                      onPress={() => handleMarkServed(ticket.id, ticket.orderId)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="restaurant-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnServedText}>Mark Served</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
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
  activeBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EBE5DA',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  tabBtnActive: {
    backgroundColor: '#0C2340',
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
  scrollContent: {
    padding: 15,
  },
  centerLoading: {
    paddingVertical: 50,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 15,
  },
  aggItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#FEF9F1',
  },
  aggItemName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#2D3748',
  },
  qtyBadge: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  qtyText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  ticketCardNormal: {
    borderColor: '#EBE5DA',
  },
  ticketCardDelayed: {
    borderColor: '#E53E3E',
    borderTopWidth: 4,
  },
  delayedBanner: {
    backgroundColor: '#FFF5F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderColor: '#FEB2B2',
  },
  delayedBannerText: {
    color: '#C53030',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  kotNum: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  captainText: {
    fontSize: 9.5,
    color: '#718096',
    marginTop: 2,
  },
  timeElapsed: {
    fontSize: 9.5,
    color: '#718096',
    fontWeight: '600',
  },
  tableBadge: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  tableBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#EBE5DA',
  },
  itemsList: {
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#FEF9F1',
  },
  checkIcon: {
    fontSize: 13,
    marginRight: 8,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3748',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#A0AEC0',
  },
  itemQty: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  actionBtnStart: {
    backgroundColor: '#0C2340',
    borderTopWidth: 1,
    borderColor: '#D4AF37',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnStartText: {
    color: '#D4AF37',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  actionBtnReady: {
    backgroundColor: '#38A169',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnReadyText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  actionBtnServed: {
    backgroundColor: '#4A5568',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnServedText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
});

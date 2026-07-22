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
  RefreshControl,
  Platform,
} from 'react-native';
import { api } from '../api';
import { Ionicons } from '@expo/vector-icons';

export default function ActiveOrdersHistoryScreen({ user, onLogout, onOpenDrawer }) {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit / Detail Modal States
  const [editingOrder, setEditingOrder] = useState(null);
  const [editNotes, setEditNotes] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [ordersData, itemsData] = await Promise.all([
        api.get('/orders'),
        api.get('/menu/items'),
      ]);
      setOrders(ordersData || []);
      setMenuItems(itemsData || []);

      // If we are editing an order, reload its details
      if (editingOrder) {
        const updated = (ordersData || []).find(o => o.id === editingOrder.id);
        if (updated) {
          const fullOrder = await api.get(`/orders/${updated.id}`);
          setEditingOrder(fullOrder);
        }
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleServeOrder = async (orderId) => {
    setSubmitting(true);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'SERVED' });
      Alert.alert('Success', 'Order marked as served successfully.');
      loadData(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update order status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This will void all items.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.delete(`/orders/${orderId}`);
              Alert.alert('Success', 'Order cancelled successfully.');
              loadData(true);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to cancel order.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleOpenEditOrder = async (order) => {
    setLoading(true);
    try {
      const fullOrder = await api.get(`/orders/${order.id}`);
      setEditingOrder(fullOrder);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleVoidItem = async (itemId) => {
    if (!editingOrder) return;
    Alert.alert(
      'Void Item',
      'Are you sure you want to void this item from the order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void Item',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.patch(`/orders/${editingOrder.id}/items/${itemId}/void`);
              Alert.alert('Success', 'Item voided successfully.');
              const fullOrder = await api.get(`/orders/${editingOrder.id}`);
              setEditingOrder(fullOrder);
              loadData(true);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to void item.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleAddNewItemToOrder = async (menuItem) => {
    if (!editingOrder) return;
    setSubmitting(true);
    try {
      const note = editNotes[menuItem.id] || '';
      await api.post(`/orders/${editingOrder.id}/items`, {
        items: [
          {
            menuItemId: menuItem.id,
            quantity: 1,
            notes: note
          }
        ]
      });
      setEditNotes((prev) => ({ ...prev, [menuItem.id]: '' }));
      const fullOrder = await api.get(`/orders/${editingOrder.id}`);
      setEditingOrder(fullOrder);
      loadData(true);
      Alert.alert('Success', 'Item added to order.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add item to order.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatOrderTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: '#EBF8FF', text: '#2B6CB0' }; // Blue
      case 'READY':
        return { bg: '#F0FDF4', text: '#16A34A' }; // Green
      case 'COMPLETED':
        return { bg: '#F3F4F6', text: '#4B5563' }; // Grey
      case 'CANCELLED':
        return { bg: '#FEF2F2', text: '#DC2626' }; // Red
      default:
        return { bg: '#FFFDF5', text: '#D97706' }; // Orange
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    return item.name?.toLowerCase().includes(searchQuery.toLowerCase()) && item.isAvailable;
  });

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
            <Text style={styles.headerTitle}>Order Logs</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Front Desk</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" />
        }
      >
        {/* Title Block */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titleHeading}>Active & Recent Orders</Text>
            <Text style={styles.titleSubheading}>Manage existing running tables, add extra items, void entries or change status</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => loadData(false)}>
            <Text style={styles.refreshBtnText}>Refresh Orders</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text style={styles.loadingText}>Fetching running orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active orders logged today.</Text>
          </View>
        ) : (
          orders.map((order) => {
            const statusStyle = getStatusColor(order.status);
            const isCompleted = ['COMPLETED', 'CANCELLED', 'SERVED'].includes(order.status);
            const orderItemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Left metadata */}
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text style={styles.orderNumber}>
                      INV-{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>🪑 {order.table?.name || 'Quick POS'}</Text>
                    <Text style={styles.metaSpacer}>•</Text>
                    <Text style={styles.metaText}>⏱️ {formatOrderTime(order.createdAt)}</Text>
                    <Text style={styles.metaSpacer}>•</Text>
                    <Text style={styles.metaText}>👤 {order.user?.name || 'Staff'}</Text>
                    <Text style={styles.metaSpacer}>•</Text>
                    <Text style={styles.metaText}>Items: {orderItemsCount}</Text>
                  </View>
                </View>

                {/* Right totals & actions */}
                <View style={styles.rightColumn}>
                  <Text style={styles.amountLabel}>AMOUNT</Text>
                  <Text style={styles.amountValue}>₹{order.totalAmount}</Text>

                  <View style={styles.actionsRow}>
                    {/* Edit Order trigger */}
                    <TouchableOpacity 
                      style={styles.actionIconButton}
                      onPress={() => handleOpenEditOrder(order)}
                    >
                      <Text style={styles.pencilText}>✏️</Text>
                    </TouchableOpacity>

                    {/* Serve button */}
                    {!isCompleted && (
                      <TouchableOpacity 
                        style={styles.serveBadgeButton}
                        onPress={() => handleServeOrder(order.id)}
                      >
                        <Text style={styles.serveBadgeButtonText}>✓ Serve</Text>
                      </TouchableOpacity>
                    )}

                    {/* Cancel button */}
                    {!isCompleted && (
                      <TouchableOpacity 
                        style={styles.cancelIconButton}
                        onPress={() => handleCancelOrder(order.id)}
                      >
                        <Text style={styles.cancelIconText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* EDIT MODAL: APPEND / VOID ITEMS */}
      <Modal visible={!!editingOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', flex: 1 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeading}>Edit Order Details</Text>
              <TouchableOpacity onPress={() => setEditingOrder(null)}>
                <Text style={styles.closeX}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, flexDirection: 'row', marginTop: 10 }}>
              {/* Left Column: Active Order Items */}
              <View style={{ flex: 1, borderRightWidth: 0.5, borderColor: '#EBE5DA', paddingRight: 10 }}>
                <Text style={styles.modalSectionHeading}>Active Items</Text>
                
                <ScrollView style={{ flex: 1, marginVertical: 8 }}>
                  {(editingOrder?.items || []).map((item) => (
                    <View key={item.id} style={styles.cartCardItem}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.cartItemName} numberOfLines={1}>{item.menuItem?.name}</Text>
                        {!item.isVoid ? (
                          <TouchableOpacity onPress={() => handleVoidItem(item.id)}>
                            <Text style={styles.voidLink}>Void</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.voidedText}>Voided</Text>
                        )}
                      </View>
                      <Text style={{ fontSize: 9.5, color: '#718096' }}>
                        Qty: {item.quantity} | ₹{item.unitPrice} each {item.isVoid && '(Voided)'}
                      </Text>
                      {item.notes ? (
                        <Text style={{ fontSize: 9, color: '#D4AF37', marginTop: 2 }}>Notes: {item.notes}</Text>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.cartSummaryFooter}>
                  <Text style={styles.subtotalText}>Grand Total: ₹{editingOrder?.totalAmount}</Text>
                </View>
              </View>

              {/* Right Column: Append new catalog items */}
              <View style={{ flex: 1, paddingLeft: 10 }}>
                <Text style={styles.modalSectionHeading}>Add Extra Items</Text>
                <TextInput
                  style={styles.modalSearch}
                  placeholder="🔍 Search dishes..."
                  placeholderTextColor="#A0AEC0"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                <ScrollView style={{ flex: 1 }}>
                  {filteredMenuItems.map((item) => (
                    <View key={item.id} style={styles.menuItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        <Text style={styles.menuItemPrice}>₹ {item.price}</Text>
                        <TextInput
                          style={styles.cartItemNoteInput}
                          placeholder="Instructions..."
                          placeholderTextColor="#A0AEC0"
                          value={editNotes[item.id] || ''}
                          onChangeText={(text) => setEditNotes(prev => ({ ...prev, [item.id]: text }))}
                        />
                      </View>
                      <TouchableOpacity 
                        style={styles.appendAddBtn} 
                        onPress={() => handleAddNewItemToOrder(item)}
                      >
                        <Text style={styles.appendAddText}>＋ Add</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
  },
  titleHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  titleSubheading: {
    fontSize: 10.5,
    color: '#718096',
    marginTop: 4,
    paddingRight: 10,
    lineHeight: 14,
  },
  refreshBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: 'bold',
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
    fontSize: 11.5,
    color: '#718096',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 2,
  },
  orderNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  metaText: {
    fontSize: 10.5,
    color: '#718096',
    fontWeight: '600',
  },
  metaSpacer: {
    fontSize: 10.5,
    color: '#CBD5E0',
    marginHorizontal: 5,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 100,
  },
  amountLabel: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#A0AEC0',
    letterSpacing: 0.3,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0C2340',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    backgroundColor: '#FFFFFF',
  },
  pencilText: {
    fontSize: 11,
  },
  serveBadgeButton: {
    backgroundColor: '#38A169',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serveBadgeButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cancelIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEB2B2',
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  cancelIconText: {
    fontSize: 11,
    color: '#E53E3E',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: '#EBE5DA',
    paddingBottom: 10,
  },
  modalHeading: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  closeX: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#718096',
    padding: 4,
  },
  modalSectionHeading: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#0C2340',
    borderBottomWidth: 1,
    borderColor: '#EBE5DA',
    paddingBottom: 4,
    marginBottom: 6,
  },
  cartCardItem: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  cartItemName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2D3748',
    flex: 1,
  },
  voidLink: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#E53E3E',
  },
  voidedText: {
    fontSize: 9.5,
    color: '#A0AEC0',
  },
  cartSummaryFooter: {
    borderTopWidth: 1,
    borderColor: '#EBE5DA',
    paddingTop: 8,
  },
  subtotalText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#0C2340',
    textAlign: 'right',
  },
  modalSearch: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 8,
    height: 32,
    paddingHorizontal: 8,
    fontSize: 11.5,
    color: '#0C2340',
    marginBottom: 8,
  },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#FEF9F1',
  },
  menuItemName: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  menuItemPrice: {
    fontSize: 9.5,
    color: '#718096',
    marginTop: 1,
  },
  cartItemNoteInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#EBE5DA',
    borderRadius: 6,
    height: 22,
    paddingHorizontal: 6,
    fontSize: 9,
    color: '#0C2340',
    marginTop: 4,
  },
  appendAddBtn: {
    backgroundColor: '#0C2340',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  appendAddText: {
    color: '#D4AF37',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
});

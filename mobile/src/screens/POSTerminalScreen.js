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

export default function POSTerminalScreen({ user, onLogout, onOpenDrawer }) {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'history'
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);

  // Selection & Search
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // POS Cart State
  const [cart, setCart] = useState([]);
  const [itemNotes, setItemNotes] = useState({});

  // Editing Order State
  const [editingOrder, setEditingOrder] = useState(null);
  const [editNotes, setEditNotes] = useState({});

  // Loading/Feedback
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadPOSData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.get('/pos/data');
      if (data) {
        setTables(data.tables || []);
        setCategories(data.menuCategories || []);
        setMenuItems(data.menuItems || []);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.get('/orders');
      setOrders(data || []);
    } catch (err) {
      console.warn(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadPOSData();
    loadOrders();

    const timer = setInterval(() => {
      loadPOSData(true);
      loadOrders(true);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setCart([]);
    setItemNotes({});
  };

  const handleAddToCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === item.id);
      if (existing) {
        return prevCart.map((ci) => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === item.id);
      if (existing && existing.quantity > 1) {
        return prevCart.map((ci) => ci.id === item.id ? { ...ci, quantity: ci.quantity - 1 } : ci);
      }
      return prevCart.filter((ci) => ci.id !== item.id);
    });
  };

  const updateItemNote = (itemId, note) => {
    setItemNotes((prev) => ({ ...prev, [itemId]: note }));
  };

  const getCartSubtotal = () => {
    return cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart.');
      return;
    }
    setSubmitting(true);
    try {
      const orderPayload = {
        tableId: selectedTable.id,
        items: cart.map((ci) => ({
          menuItemId: ci.id,
          quantity: ci.quantity,
          notes: itemNotes[ci.id] || ''
        }))
      };

      await api.post('/pos/quick-order', orderPayload);
      Alert.alert('Success', `KOT placed successfully for Table: ${selectedTable.name}!`);
      setCart([]);
      setItemNotes({});
      setSelectedTable(null);
      loadPOSData();
      loadOrders();
    } catch (err) {
      Alert.alert('Order Failed', err.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleServeOrder = async (orderId) => {
    setSubmitting(true);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'SERVED' });
      Alert.alert('Success', 'Order marked as served successfully.');
      loadOrders();
      loadPOSData(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update order status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
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
              loadOrders();
              loadPOSData(true);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to cancel order');
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
              loadOrders(true);
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
      // Reset note for item
      setEditNotes((prev) => ({ ...prev, [menuItem.id]: '' }));
      // Reload order details
      const fullOrder = await api.get(`/orders/${editingOrder.id}`);
      setEditingOrder(fullOrder);
      loadOrders(true);
      Alert.alert('Success', 'Item added to order.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add item to order.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helpers for table status colors
  const getTableStatusColor = (status) => {
    switch (status) {
      case 'FREE':
      case 'AVAILABLE':
        return styles.tableFree;
      case 'OCCUPIED':
        return styles.tableOccupied;
      default:
        return styles.tableBooked;
    }
  };

  const getTableStatusTextColor = (status) => {
    switch (status) {
      case 'FREE':
      case 'AVAILABLE':
        return styles.tableTextFree;
      case 'OCCUPIED':
        return styles.tableTextOccupied;
      default:
        return styles.tableTextBooked;
    }
  };

  // Filter items in cart/menu
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCat = selectedCategoryId === 'All' || item.menuCategoryId === selectedCategoryId;
    const matchesQuery = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery && item.isAvailable;
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
            <Text style={styles.headerTitle}>POS Terminal</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • Front Desk</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'pos' && styles.tabBtnActive]}
          onPress={() => setActiveTab('pos')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="restaurant-outline" size={14} color={activeTab === 'pos' ? "#0C2340" : "#718096"} style={{ marginRight: 6 }} />
            <Text style={[styles.tabBtnText, activeTab === 'pos' && styles.tabBtnTextActive]}>
              New Order (POS)
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          onPress={() => setActiveTab('history')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="receipt-outline" size={14} color={activeTab === 'history' ? "#0C2340" : "#718096"} style={{ marginRight: 6 }} />
            <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
              Active Orders & History
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text style={styles.loadingText}>Fetching POS data...</Text>
          </View>
        ) : activeTab === 'pos' ? (
          /* NEW ORDER: TABLE SELECTION FEED */
          <View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#38A169' }]} />
                <Text style={styles.legendLabel}>Free</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#E53E3E' }]} />
                <Text style={styles.legendLabel}>Occupied</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
                <Text style={styles.legendLabel}>Booked</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>Select Active Table</Text>
              <Text style={styles.cardSubheading}>Click a table to open menu and record customer orders</Text>
              
              <View style={styles.tablesGrid}>
                {tables.map((table) => (
                  <TouchableOpacity
                    key={table.id}
                    style={[styles.tableCard, getTableStatusColor(table.status)]}
                    onPress={() => handleTableSelect(table)}
                  >
                    <Text style={[styles.tableName, getTableStatusTextColor(table.status)]}>
                      {table.name}
                    </Text>
                    <Text style={styles.tableCapacity}>{table.capacity} Pax</Text>
                  </TouchableOpacity>
                ))}
                {tables.length === 0 && (
                  <Text style={styles.emptyText}>No tables configured in system.</Text>
                )}
              </View>
            </View>
          </View>
        ) : (
          /* ACTIVE ORDERS & HISTORY LIST */
          <View>
            {orders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No active orders logged.</Text>
              </View>
            ) : (
              orders.map((order) => {
                const isActive = !['COMPLETED', 'CANCELLED', 'SERVED'].includes(order.status);
                return (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View>
                        <Text style={styles.orderIdText}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
                        <Text style={styles.orderTable}>Table: {order.table?.name || 'Quick POS'}</Text>
                      </View>
                      <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusDone]}>
                        <Text style={[styles.statusBadgeText, isActive ? styles.textActive : styles.textDone]}>
                          {order.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.orderItems}>
                      {(order.items || []).map((oi, idx) => (
                        <Text key={idx} style={styles.orderItemRow}>
                          • {oi.menuItem?.name} <Text style={{ fontWeight: 'bold' }}>x{oi.quantity}</Text> {oi.notes ? `(${oi.notes})` : ''}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.orderFooter}>
                      <Text style={styles.totalText}>Total: ₹ {order.totalAmount}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isActive && (
                          <TouchableOpacity
                            style={styles.actionBtnServe}
                            onPress={() => handleServeOrder(order.id)}
                          >
                            <Text style={styles.actionBtnText}>Serve</Text>
                          </TouchableOpacity>
                        )}
                        {isActive && (
                          <TouchableOpacity
                            style={styles.actionBtnEdit}
                            onPress={() => handleOpenEditOrder(order)}
                          >
                            <Text style={styles.actionBtnText}>Edit</Text>
                          </TouchableOpacity>
                        )}
                        {isActive && (
                          <TouchableOpacity
                            style={styles.actionBtnCancel}
                            onPress={() => handleCancelOrder(order.id)}
                          >
                            <Text style={styles.actionBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: POS CART & MENU DIRECTORY */}
      <Modal visible={!!selectedTable} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', flex: 1 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeading}>Record Order - Table {selectedTable?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedTable(null)}>
                <Text style={styles.closeX}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Sub-Layout: Left side Menu selection, Right side Cart */}
            <View style={{ flex: 1, flexDirection: 'row', marginTop: 10 }}>
              {/* Menu items selection panel */}
              <View style={{ flex: 1.2, borderRightWidth: 0.5, borderColor: '#EBE5DA', paddingRight: 10 }}>
                <TextInput
                  style={styles.modalSearch}
                  placeholder="🔍 Search dishes..."
                  placeholderTextColor="#A0AEC0"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                
                {/* Categories Bar */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 35, marginBottom: 8 }}>
                  <TouchableOpacity
                    style={[styles.pickerBadge, selectedCategoryId === 'All' && styles.pickerBadgeActive]}
                    onPress={() => setSelectedCategoryId('All')}
                  >
                    <Text style={[styles.pickerBadgeText, selectedCategoryId === 'All' && styles.pickerBadgeTextActive]}>All</Text>
                  </TouchableOpacity>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.pickerBadge, selectedCategoryId === c.id && styles.pickerBadgeActive]}
                      onPress={() => setSelectedCategoryId(c.id)}
                    >
                      <Text style={[styles.pickerBadgeText, selectedCategoryId === c.id && styles.pickerBadgeTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Items scroll */}
                <ScrollView style={{ flex: 1 }}>
                  {filteredMenuItems.map((item) => {
                    const cartItem = cart.find(ci => ci.id === item.id);
                    return (
                      <View key={item.id} style={styles.menuItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.menuItemName}>{item.name}</Text>
                          <Text style={styles.menuItemPrice}>₹ {item.price}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {cartItem && (
                            <TouchableOpacity style={styles.cartMathBtn} onPress={() => handleRemoveFromCart(item)}>
                              <Text style={styles.cartMathText}>－</Text>
                            </TouchableOpacity>
                          )}
                          {cartItem && (
                            <Text style={styles.cartQtyText}>{cartItem.quantity}</Text>
                          )}
                          <TouchableOpacity style={styles.cartMathBtn} onPress={() => handleAddToCart(item)}>
                            <Text style={styles.cartMathText}>＋</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Cart Summary & Notes side panel */}
              <View style={{ flex: 1, paddingLeft: 10 }}>
                <Text style={styles.cartHeading}>Order Cart</Text>
                
                <ScrollView style={{ flex: 1, marginVertical: 8 }}>
                  {cart.length === 0 ? (
                    <Text style={styles.emptyCartText}>Cart is empty.</Text>
                  ) : (
                    cart.map((ci) => (
                      <View key={ci.id} style={styles.cartCardItem}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={styles.cartItemName} numberOfLines={1}>{ci.name}</Text>
                          <Text style={styles.cartItemTotal}>₹ {ci.price * ci.quantity}</Text>
                        </View>
                        <Text style={{ fontSize: 9, color: '#718096' }}>Qty: {ci.quantity} x ₹{ci.price}</Text>
                        <TextInput
                          style={styles.cartItemNoteInput}
                          placeholder="Add instructions..."
                          placeholderTextColor="#A0AEC0"
                          value={itemNotes[ci.id] || ''}
                          onChangeText={(text) => updateItemNote(ci.id, text)}
                        />
                      </View>
                    ))
                  )}
                </ScrollView>

                {/* Subtotal & place */}
                <View style={styles.cartSummaryFooter}>
                  <Text style={styles.subtotalText}>Subtotal: ₹ {getCartSubtotal()}</Text>
                  <TouchableOpacity
                    style={styles.placeBtn}
                    onPress={handleSubmitOrder}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#D4AF37" />
                    ) : (
                      <Text style={styles.placeBtnText}>Place KOT</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: EDIT ORDER / ADD NEW ITEMS DETAIL SHEET */}
      <Modal visible={!!editingOrder} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', flex: 1 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeading}>Edit Order #{editingOrder?.id.slice(0, 6).toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setEditingOrder(null)}>
                <Text style={styles.closeX}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, flexDirection: 'row', marginTop: 10 }}>
              {/* Left Side: Active items & voiding option */}
              <View style={{ flex: 1, borderRightWidth: 0.5, borderColor: '#EBE5DA', paddingRight: 10 }}>
                <Text style={styles.cartHeading}>Active Items</Text>
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
                      <Text style={{ fontSize: 9, color: '#718096' }}>
                        Qty: {item.quantity} | ₹{item.unitPrice} each {item.isVoid && '(Cancelled)'}
                      </Text>
                      {item.notes ? (
                        <Text style={{ fontSize: 9, color: '#D4AF37', marginTop: 2 }}>Notes: {item.notes}</Text>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
                <Text style={styles.subtotalText}>Total: ₹ {editingOrder?.totalAmount}</Text>
              </View>

              {/* Right Side: Append new items list */}
              <View style={{ flex: 1, paddingLeft: 10 }}>
                <Text style={styles.cartHeading}>Add More Items</Text>
                <TextInput
                  style={styles.modalSearch}
                  placeholder="🔍 Search..."
                  placeholderTextColor="#A0AEC0"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                
                <ScrollView style={{ flex: 1, marginVertical: 8 }}>
                  {filteredMenuItems.map((item) => (
                    <View key={item.id} style={styles.menuItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        <Text style={styles.menuItemPrice}>₹ {item.price}</Text>
                        <TextInput
                          style={styles.cartItemNoteInput}
                          placeholder="Note..."
                          placeholderTextColor="#A0AEC0"
                          value={editNotes[item.id] || ''}
                          onChangeText={(text) => setEditNotes(prev => ({ ...prev, [item.id]: text }))}
                        />
                      </View>
                      <TouchableOpacity style={styles.appendAddBtn} onPress={() => handleAddNewItemToOrder(item)}>
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
    fontSize: 11,
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
    fontSize: 11.5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
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
  },
  cardSubheading: {
    fontSize: 10.5,
    color: '#718096',
    marginTop: 4,
    marginBottom: 15,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tableCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tableFree: { borderColor: '#81E6D9', backgroundColor: '#E6FFFA' },
  tableOccupied: { borderColor: '#FEB2B2', backgroundColor: '#FFF5F5' },
  tableBooked: { borderColor: '#FBD38D', backgroundColor: '#FEFCBF' },
  tableName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableTextFree: { color: '#319795' },
  tableTextOccupied: { color: '#E53E3E' },
  tableTextBooked: { color: '#D69E2E' },
  tableCapacity: {
    fontSize: 9.5,
    color: '#718096',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 11.5,
    color: '#718096',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 20,
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
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderIdText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  orderTable: {
    fontSize: 10.5,
    color: '#718096',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  statusActive: { backgroundColor: '#FFF5F5', borderColor: '#FEB2B2' },
  statusDone: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  statusBadgeText: { fontSize: 8.5, fontWeight: 'bold' },
  textActive: { color: '#E53E3E' },
  textDone: { color: '#059669' },
  divider: {
    height: 0.5,
    backgroundColor: '#EBE5DA',
    marginVertical: 10,
  },
  orderItems: {
    marginVertical: 4,
  },
  orderItemRow: {
    fontSize: 11.5,
    color: '#2D3748',
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  actionBtnServe: {
    backgroundColor: '#38A169',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 6,
  },
  actionBtnEdit: {
    backgroundColor: '#0C2340',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 6,
  },
  actionBtnCancel: {
    backgroundColor: '#E53E3E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
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
  pickerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginRight: 4,
    justifyContent: 'center',
  },
  pickerBadgeActive: {
    backgroundColor: '#0C2340',
    borderColor: '#0C2340',
  },
  pickerBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#718096',
  },
  pickerBadgeTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
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
  cartMathBtn: {
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    width: 25,
    height: 25,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartMathText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  cartQtyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
    marginHorizontal: 8,
  },
  cartHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
    borderBottomWidth: 1,
    borderColor: '#EBE5DA',
    paddingBottom: 4,
  },
  emptyCartText: {
    fontSize: 11,
    color: '#A0AEC0',
    textAlign: 'center',
    paddingVertical: 30,
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
  cartItemTotal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0C2340',
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
  cartSummaryFooter: {
    borderTopWidth: 1,
    borderColor: '#EBE5DA',
    paddingTop: 8,
  },
  subtotalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0C2340',
    textAlign: 'right',
  },
  placeBtn: {
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  placeBtnText: {
    color: '#D4AF37',
    fontSize: 11.5,
    fontWeight: 'bold',
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

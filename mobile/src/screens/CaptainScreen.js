import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { api } from '../api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const TABLE_STATUS_COLORS = {
  AVAILABLE: { bg: '#E6FFFA', border: '#81E6D9', text: '#1D4ED8', dot: '#319795' },
  OCCUPIED: { bg: '#FFF5F5', border: '#FEB2B2', text: '#E53E3E', dot: '#E53E3E' },
  BILLED: { bg: '#FEFCBF', border: '#FBD38D', text: '#D69E2E', dot: '#D69E2E' },
};

export default function CaptainScreen({ user, onLogout, onOpenDrawer }) {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected state
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  // Modals
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);

  // Menu / Cart state
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isAppending, setIsAppending] = useState(false); // true if adding to existing order

  const fetchData = async () => {
    try {
      const [tablesData, ordersData, categoriesData, itemsData] = await Promise.all([
        api.get('/tables'),
        api.get('/orders'),
        api.get('/menu/categories'),
        api.get('/menu/items'),
      ]);

      setTables(tablesData || []);
      setOrders(ordersData || []);
      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);

      // If a table was selected, update its active order
      if (selectedTable) {
        const updatedTable = (tablesData || []).find(t => t.id === selectedTable.id);
        setSelectedTable(updatedTable || null);
        findActiveOrder(selectedTable.id, ordersData || []);
      }
    } catch (err) {
      console.warn('Error loading Captain data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const findActiveOrder = (tableId, allOrders = orders) => {
    // Find active order for this table (not completed or cancelled)
    const active = allOrders.find(
      o => o.tableId === tableId && !['COMPLETED', 'CANCELLED'].includes(o.status)
    );
    setActiveOrder(active || null);
  };

  const handleTablePress = (table) => {
    setSelectedTable(table);
    // Find active order for this table
    const active = orders.find(
      o => o.tableId === table.id && !['COMPLETED', 'CANCELLED'].includes(o.status)
    );
    setActiveOrder(active || null);
    
    if (!active) {
      // Table is available, start order flow immediately
      setIsAppending(false);
      setCart([]);
      setMenuModalVisible(true);
    } else {
      // Table is occupied, show details options modal
      setOrderModalVisible(true);
    }
  };

  const startNewOrder = () => {
    setIsAppending(false);
    setCart([]);
    setOrderModalVisible(false);
    setMenuModalVisible(true);
  };

  const startAddItems = () => {
    setIsAppending(true);
    setCart([]);
    setOrderModalVisible(false);
    setMenuModalVisible(true);
  };

  const handleServeOrder = async () => {
    if (!activeOrder) return;
    setLoading(true);
    try {
      await api.patch(`/orders/${activeOrder.id}/status`, { status: 'SERVED' });
      Alert.alert('Success', 'Order marked as SERVED.');
      setOrderModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to serve order.');
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    if (!activeOrder) return;
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This will void all items.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api.delete(`/orders/${activeOrder.id}`);
              Alert.alert('Cancelled', 'Order cancelled successfully.');
              setOrderModalVisible(false);
              fetchData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to cancel order.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Cart operations
  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(c => c.id === itemId);
    if (existing.quantity === 1) {
      setCart(cart.filter(c => c.id !== itemId));
    } else {
      setCart(cart.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c));
    }
  };

  const submitCartOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add some items first.');
      return;
    }

    setLoading(true);
    try {
      const orderItems = cart.map(c => ({
        menuItemId: c.id,
        quantity: c.quantity,
        notes: '',
      }));

      if (isAppending && activeOrder) {
        // Append items to existing order
        await api.post(`/orders/${activeOrder.id}/items`, { items: orderItems });
        Alert.alert('Success', 'Items added to order.');
      } else {
        // Place new order
        await api.post('/pos/quick-order', {
          tableId: selectedTable.id,
          items: orderItems,
        });
        Alert.alert('Success', 'New order placed successfully.');
      }

      setMenuModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit order.');
      setLoading(false);
    }
  };

  // Filter menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isAvailable;
  });

  const cartTotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onOpenDrawer && (
            <TouchableOpacity onPress={onOpenDrawer} style={{ marginRight: 15, padding: 4 }}>
              <Ionicons name="menu" size={28} color="#D4AF37" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Order Captain</Text>
            <Text style={styles.headerSubtitle}>Waiter: {user.name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Grid of Tables */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Loading tables...</Text>
        </View>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4AF37" />
          }
          renderItem={({ item }) => {
            const statusStyle = TABLE_STATUS_COLORS[item.status] || TABLE_STATUS_COLORS.AVAILABLE;
            const tableOrder = orders.find(
              o => o.tableId === item.id && !['COMPLETED', 'CANCELLED'].includes(o.status)
            );

            return (
              <TouchableOpacity
                style={[styles.tableCard, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}
                onPress={() => handleTablePress(item)}
              >
                <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
                <Text style={styles.tableName}>{item.name}</Text>
                <Text style={styles.tableCapacity}>Cap: {item.capacity}</Text>
                {tableOrder ? (
                  <View style={styles.orderLabelBadge}>
                    <Text style={styles.orderLabelText}>{tableOrder.status}</Text>
                  </View>
                ) : (
                  <Text style={styles.availableLabel}>Available</Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Table details modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={orderModalVisible}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTable && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedTable.name}</Text>
                  <Text style={styles.modalSubtitle}>Section: {selectedTable.section || 'General'} • Capacity: {selectedTable.capacity}</Text>
                </View>

                {activeOrder ? (
                  <View style={styles.activeOrderSection}>
                    <View style={styles.orderMetaRow}>
                      <Text style={styles.orderIdLabel}>Order Status: {activeOrder.status}</Text>
                      <Text style={styles.orderPriceLabel}>Total: ₹{activeOrder.totalAmount}</Text>
                    </View>

                    <Text style={styles.orderItemsTitle}>Ordered Items:</Text>
                    <ScrollView style={styles.orderItemsScroll}>
                      {activeOrder.items && activeOrder.items.map((item, idx) => (
                        <View key={idx} style={styles.orderItemRow}>
                          <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                          <Text style={styles.orderItemName}>{item.menuItem ? item.menuItem.name : 'Unknown'}</Text>
                          <Text style={styles.orderItemPrice}>₹{item.totalPrice}</Text>
                        </View>
                      ))}
                    </ScrollView>

                    <View style={styles.actionsBtnRow}>
                      <TouchableOpacity style={[styles.actionBtn, styles.btnAppend]} onPress={startAddItems}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="add-circle-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.actionBtnText}>Add Items</Text>
                        </View>
                      </TouchableOpacity>

                      {activeOrder.status !== 'SERVED' && (
                        <TouchableOpacity style={[styles.actionBtn, styles.btnServe]} onPress={handleServeOrder}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="restaurant-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.actionBtnText}>Serve Order</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    <TouchableOpacity style={styles.cancelOrderTrigger} onPress={handleCancelOrder}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="close-circle-outline" size={14} color="#E53E3E" style={{ marginRight: 6 }} />
                        <Text style={styles.cancelOrderTriggerText}>Cancel / Void Order</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.emptyOrderSection}>
                    <Text style={styles.emptyOrderText}>No active orders on this table.</Text>
                    <TouchableOpacity style={[styles.actionBtn, styles.btnCreate]} onPress={startNewOrder}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="create-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnText}>Create New Order</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.modalCloseLink} 
                  onPress={() => setOrderModalVisible(false)}
                >
                  <Text style={styles.modalCloseLinkText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Menu / Cart order creation modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={menuModalVisible}
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <SafeAreaView style={styles.menuContainer}>
          {/* Menu Header */}
          <View style={styles.menuHeaderRow}>
            <View>
              <Text style={styles.menuTitle}>{isAppending ? 'Add Items' : 'New Order'}</Text>
              <Text style={styles.menuSubtitle}>{selectedTable ? selectedTable.name : ''}</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeMenuBtn} 
              onPress={() => {
                setMenuModalVisible(false);
                setOrderModalVisible(true);
              }}
            >
              <Text style={styles.closeMenuBtnText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <TextInput
            style={styles.searchBar}
            placeholder="Search menu items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Category Selector */}
          <View style={styles.categoriesBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.categoryTab, selectedCategory === 'ALL' && styles.categoryTabActive]}
                onPress={() => setSelectedCategory('ALL')}
              >
                <Text style={[styles.categoryTabText, selectedCategory === 'ALL' && styles.categoryTabTextActive]}>
                  ALL
                </Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryTab, selectedCategory === cat.id && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.categoryTabText, selectedCategory === cat.id && styles.categoryTabTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Menu & Cart Split View */}
          <View style={styles.menuBodyRow}>
            {/* Items List */}
            <FlatList
              data={filteredMenuItems}
              keyExtractor={item => item.id}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View style={styles.menuItemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                  </View>
                  <TouchableOpacity style={styles.addItemBtn} onPress={() => addToCart(item)}>
                    <Text style={styles.addItemBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* Cart Panel (collapsible or side sidebar depending on layout) */}
            {cart.length > 0 && (
              <View style={styles.cartPanel}>
                <Text style={styles.cartTitle}>Cart ({cart.reduce((a,c)=>a+c.quantity, 0)})</Text>
                <ScrollView style={styles.cartItemsScroll}>
                  {cart.map(c => (
                    <View key={c.id} style={styles.cartItemRow}>
                      <Text style={styles.cartItemName} numberOfLines={1}>{c.name}</Text>
                      <View style={styles.qtyControlRow}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(c.id)}>
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.cartQtyText}>{c.quantity}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(c)}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.cartSummaryRow}>
                  <Text style={styles.cartTotalLabel}>Total:</Text>
                  <Text style={styles.cartTotalVal}>₹{cartTotal}</Text>
                </View>

                <TouchableOpacity style={styles.submitOrderBtn} onPress={submitCartOrder}>
                  <Text style={styles.submitOrderBtnText}>Submit Order</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
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
    fontWeight: 'bold',
  },
  gridContent: {
    padding: 16,
  },
  tableCard: {
    width: (width - 48) / 3 - 8,
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    margin: 4,
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#0C2340',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  tableName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0C2340',
    marginTop: 15,
  },
  tableCapacity: {
    fontSize: 10,
    color: '#718096',
  },
  orderLabelBadge: {
    backgroundColor: '#0C2340',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 8,
  },
  orderLabelText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  availableLabel: {
    fontSize: 10,
    color: '#2B6CB0',
    fontWeight: '600',
    marginTop: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 35, 64, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#EBE5DA',
  },
  modalHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#FEF9F1',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  activeOrderSection: {
    flexGrow: 1,
  },
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FEF9F1',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginBottom: 16,
  },
  orderIdLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  orderPriceLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  orderItemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0C2340',
    marginBottom: 8,
  },
  orderItemsScroll: {
    maxHeight: 180,
    marginBottom: 16,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#FEF9F1',
  },
  orderItemQty: {
    width: 35,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  orderItemName: {
    flex: 1,
    fontSize: 13,
    color: '#1F2933',
  },
  orderItemPrice: {
    fontSize: 13,
    color: '#718096',
  },
  emptyOrderSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyOrderText: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
  },
  actionsBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  btnCreate: {
    backgroundColor: '#D4AF37',
    width: '100%',
  },
  btnAppend: {
    backgroundColor: '#0C2340',
  },
  btnServe: {
    backgroundColor: '#319795',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cancelOrderTrigger: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 15,
  },
  cancelOrderTriggerText: {
    color: '#E53E3E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalCloseLink: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 15,
  },
  modalCloseLinkText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontWeight: '500',
  },
  menuContainer: {
    flex: 1,
    backgroundColor: '#FEF9F1',
  },
  menuHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0C2340',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#FFFFFF',
  },
  closeMenuBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeMenuBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 12,
    fontSize: 14,
    color: '#1F2933',
  },
  categoriesBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#EBE5DA',
    paddingVertical: 8,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    marginLeft: 12,
  },
  categoryTabActive: {
    backgroundColor: '#0C2340',
    borderColor: '#0C2340',
  },
  categoryTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718096',
  },
  categoryTabTextActive: {
    color: '#D4AF37',
  },
  menuBodyRow: {
    flex: 1,
    flexDirection: 'row',
  },
  menuItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#EBE5DA',
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2933',
  },
  menuItemPrice: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  addItemBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addItemBtnText: {
    color: '#0C2340',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartPanel: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderColor: '#EBE5DA',
    padding: 10,
    justifyContent: 'space-between',
  },
  cartTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
    borderBottomWidth: 1,
    borderColor: '#EBE5DA',
    paddingBottom: 6,
    marginBottom: 8,
  },
  cartItemsScroll: {
    flex: 1,
  },
  cartItemRow: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#FEF9F1',
    paddingBottom: 6,
  },
  cartItemName: {
    fontSize: 11,
    color: '#1F2933',
    fontWeight: '500',
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  qtyBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEF9F1',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 11,
    color: '#0C2340',
    fontWeight: 'bold',
  },
  cartQtyText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  cartSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#EBE5DA',
    marginBottom: 10,
  },
  cartTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#718096',
  },
  cartTotalVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  submitOrderBtn: {
    backgroundColor: '#0C2340',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitOrderBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

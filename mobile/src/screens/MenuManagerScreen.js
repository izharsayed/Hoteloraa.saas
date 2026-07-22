import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, getAbsoluteAssetUrl } from '../api';
import { Ionicons } from '@expo/vector-icons';

export default function MenuManagerScreen({ user, onLogout, onOpenDrawer }) {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Item Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCostPrice, setNewItemCostPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newItemIsAvailable, setNewItemIsAvailable] = useState(true);
  const [newItemPrepTime, setNewItemPrepTime] = useState('');
  const [newItemImageUrl, setNewItemImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Add Category Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Price Edit State
  const [editingPriceItem, setEditingPriceItem] = useState(null);
  const [editingPriceVal, setEditingPriceVal] = useState('');

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const fetchedCats = await api.get('/menu/categories');
      const fetchedItems = await api.get('/menu/items');
      setCategories(fetchedCats || []);
      setMenuItems(fetchedItems || []);
      
      // Default category if none set
      if (fetchedCats && fetchedCats.length > 0 && !newItemCategory) {
        setNewItemCategory(fetchedCats[0].id);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePriceChange = async (id, newPrice) => {
    const parsed = parseFloat(newPrice);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Error', 'Please enter a valid price.');
      return;
    }
    try {
      await api.put(`/menu/items/${id}`, { price: parsed });
      setMenuItems(prev => prev.map(item => item.id === id ? { ...item, price: parsed } : item));
      setEditingPriceItem(null);
      Alert.alert('Success', 'Price updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update price');
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      await api.put(`/menu/items/${id}`, { isAvailable: !currentStatus });
      setMenuItems(prev => prev.map(item => item.id === id ? { ...item, isAvailable: !currentStatus } : item));
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
  };

  const handleDeleteItem = async (id) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this menu item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/menu/items/${id}`);
              setMenuItems(prev => prev.filter(item => item.id !== id));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const handleUploadImage = async (useCamera = false) => {
    const options = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    let result;
    if (useCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera permissions are required.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Library access is required.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    const localUri = result.assets[0].uri;
    const filename = localUri.split('/').pop() || 'dish.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    const formData = new FormData();
    formData.append('image', {
      uri: localUri,
      name: filename,
      type,
    });

    try {
      setUploading(true);
      const res = await api.upload('/menu/items/upload', formData);
      setNewItemImageUrl(res.imageUrl);
      Alert.alert('Success', 'Image uploaded successfully.');
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateMenuItem = async () => {
    if (!newItemName || !newItemPrice) {
      Alert.alert('Error', 'Please fill in Name and Price.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: newItemName,
        price: parseFloat(newItemPrice),
        isVeg: newItemIsVeg,
        isAvailable: newItemIsAvailable,
        description: newItemDescription || undefined,
        menuCategoryId: newItemCategory || undefined,
        costPrice: newItemCostPrice ? parseFloat(newItemCostPrice) : undefined,
        preparationTime: newItemPrepTime ? parseInt(newItemPrepTime) : undefined,
        imageUrl: newItemImageUrl || undefined,
      };

      const newItem = await api.post('/menu/items', payload);
      setMenuItems(prev => [...prev, newItem]);
      setShowAddModal(false);
      resetForm();
      Alert.alert('Success', 'Menu item added successfully.');
    } catch (err) {
      Alert.alert('Failed', err.message || 'Failed to create menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setCreatingCategory(true);
      const newCat = await api.post('/menu/categories', { name: newCategoryName.trim() });
      setCategories(prev => [...prev, newCat]);
      setNewCategoryName('');
      Alert.alert('Success', 'Category created successfully.');
    } catch (err) {
      Alert.alert('Failed', err.message || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/menu/categories/${id}`);
              setCategories(prev => prev.filter(c => c.id !== id));
              if (selectedCategory === id) setSelectedCategory('All');
            } catch (err) {
              Alert.alert('Failed', err.message || 'Failed to delete category (verify that no items are linked to it).');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setNewItemName('');
    setNewItemPrice('');
    setNewItemCostPrice('');
    setNewItemCategory(categories[0]?.id || '');
    setNewItemDescription('');
    setNewItemIsVeg(true);
    setNewItemIsAvailable(true);
    setNewItemPrepTime('');
    setNewItemImageUrl('');
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.menuCategoryId === selectedCategory;
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id?.includes(searchQuery);
    return matchesCategory && matchesSearch;
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
            <Text style={styles.headerTitle}>Menu Catalog</Text>
            <Text style={styles.headerSubtitle}>{user.tenantName} • POS</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleHeading}>POS Menu Catalog</Text>
          <Text style={styles.titleSubheading}>Manage kitchen recipes, pricing structures, and active catalog dishes</Text>
          
          <View style={styles.headerActionsRow}>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowCategoryModal(true)}>
              <Text style={styles.outlineBtnText}>📁 Manage Categories</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.goldBtn} onPress={() => { resetForm(); setShowAddModal(true); }}>
              <Text style={styles.goldBtnText}>＋ Add Menu Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input */}
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search by Dish name, desc, or ID..."
          placeholderTextColor="#A0AEC0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Categories Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, selectedCategory === 'All' && styles.tabBtnActive]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[styles.tabBtnText, selectedCategory === 'All' && styles.tabBtnTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.tabBtn, selectedCategory === cat.id && styles.tabBtnActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.tabBtnText, selectedCategory === cat.id && styles.tabBtnTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Menu Items List */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text style={styles.loadingText}>Fetching menu catalog...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTextBold}>No Dishes Found</Text>
            <Text style={styles.emptyText}>Add some items or change filters.</Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const absoluteImageUrl = item.imageUrl 
              ? getAbsoluteAssetUrl(item.imageUrl)
              : null;
            
            return (
              <View key={item.id} style={styles.itemCard}>
                {/* Left side: Image */}
                <View style={styles.imageContainer}>
                  {absoluteImageUrl ? (
                    <Image source={{ uri: absoluteImageUrl }} style={styles.dishImage} />
                  ) : (
                    <View style={[styles.dishImage, styles.placeholderImage]}>
                      <Text style={{ fontSize: 24 }}>🍲</Text>
                    </View>
                  )}
                  {/* Status Dot indicator */}
                  <View style={[styles.statusDot, { backgroundColor: item.isAvailable ? '#48BB78' : '#F56565' }]} />
                </View>

                {/* Right side: Details */}
                <View style={styles.itemDetails}>
                  <View style={styles.detailsHeader}>
                    <Text style={styles.itemId}>ID: {item.id.slice(0, 8)}...</Text>
                    <View style={[styles.activeBadge, item.isAvailable ? styles.badgeActive : styles.badgePaused]}>
                      <Text style={[styles.activeBadgeText, item.isAvailable ? styles.textActive : styles.textPaused]}>
                        {item.isAvailable ? 'ACTIVE' : 'PAUSED'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.itemName}>{item.name}</Text>
                  
                  <View style={styles.tagRow}>
                    <View style={[styles.vegBadge, item.isVeg ? styles.vegBadgeGreen : styles.vegBadgeYellow]}>
                      <Text style={[styles.vegBadgeText, item.isVeg ? styles.vegTextGreen : styles.vegTextYellow]}>
                        {item.isVeg ? 'VEG' : 'NON VEG'}
                      </Text>
                    </View>
                    {item.preparationTime ? (
                      <Text style={styles.prepTime}>⏱️ {item.preparationTime} mins</Text>
                    ) : null}
                  </View>

                  {item.description ? (
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                  ) : null}

                  {/* Pricing and Action row */}
                  <View style={styles.actionRow}>
                    {/* Price edit block */}
                    {editingPriceItem === item.id ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                          keyboardType="numeric"
                          style={styles.priceInput}
                          value={editingPriceVal}
                          onChangeText={setEditingPriceVal}
                          autoFocus
                        />
                        <TouchableOpacity style={styles.savePriceBtn} onPress={() => handlePriceChange(item.id, editingPriceVal)}>
                          <Text style={styles.savePriceBtnText}>✓</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.priceContainer}
                        onPress={() => {
                          setEditingPriceItem(item.id);
                          setEditingPriceVal(item.price.toString());
                        }}
                      >
                        <Text style={styles.priceText}>₹ {item.price}</Text>
                        <Text style={styles.editPricePencil}>✏️</Text>
                      </TouchableOpacity>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity
                        style={styles.actionBtnPause}
                        onPress={() => handleStatusToggle(item.id, item.isAvailable)}
                      >
                        <Text style={styles.actionBtnPauseText}>
                          {item.isAvailable ? 'Pause' : 'Resume'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtnDelete}
                        onPress={() => handleDeleteItem(item.id)}
                      >
                        <Text style={styles.actionBtnDeleteText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL 1: ADD MENU ITEM */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalContent, { maxHeight: '90%' }]}>
            <Text style={styles.modalHeading}>Add Menu Item</Text>
            <Text style={styles.modalSubheading}>Configure kitchen recipes, pricing structures, and active catalog dishes</Text>

            <Text style={styles.modalLabel}>Item Name *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Chicken Tikka Masala"
              placeholderTextColor="#A0AEC0"
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <Text style={styles.modalLabel}>Selling Price (₹) *</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="250"
              placeholderTextColor="#A0AEC0"
              value={newItemPrice}
              onChangeText={setNewItemPrice}
            />

            <Text style={styles.modalLabel}>Cost Price (₹)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="120"
              placeholderTextColor="#A0AEC0"
              value={newItemCostPrice}
              onChangeText={setNewItemCostPrice}
            />

            <Text style={styles.modalLabel}>Prep Time (mins)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="15"
              placeholderTextColor="#A0AEC0"
              value={newItemPrepTime}
              onChangeText={setNewItemPrepTime}
            />

            <Text style={styles.modalLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 35, marginBottom: 15 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.pickerBadge, newItemCategory === cat.id && styles.pickerBadgeActive]}
                  onPress={() => setNewItemCategory(cat.id)}
                >
                  <Text style={[styles.pickerBadgeText, newItemCategory === cat.id && styles.pickerBadgeTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              multiline
              placeholder="Dish ingredients, portion sizes, notes..."
              placeholderTextColor="#A0AEC0"
              value={newItemDescription}
              onChangeText={setNewItemDescription}
            />

            {/* Toggle Switches */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Vegetarian (Veg) Dish</Text>
              <Switch value={newItemIsVeg} onValueChange={setNewItemIsVeg} trackColor={{ true: '#48BB78' }} />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Make Available Immediately</Text>
              <Switch value={newItemIsAvailable} onValueChange={setNewItemIsAvailable} trackColor={{ true: '#48BB78' }} />
            </View>

            {/* Image upload */}
            <Text style={styles.modalLabel}>Upload Photo</Text>
            <View style={styles.imageSelectorRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadImage(false)} disabled={uploading}>
                <Text style={styles.uploadBtnText}>🖼️ Choose Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadImage(true)} disabled={uploading}>
                <Text style={styles.uploadBtnText}>📸 Take Photo</Text>
              </TouchableOpacity>
            </View>

            {uploading ? (
              <ActivityIndicator size="small" color="#D4AF37" style={{ marginVertical: 10 }} />
            ) : newItemImageUrl ? (
              <Image source={{ uri: getAbsoluteAssetUrl(newItemImageUrl) }} style={styles.previewImage} />
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateMenuItem}>
                <Text style={styles.confirmBtnText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 2: MANAGE CATEGORIES */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Manage Categories</Text>
            <Text style={styles.modalSubheading}>Configure custom POS category filters</Text>

            {/* Add Category input */}
            <View style={{ flexDirection: 'row', marginBottom: 15 }}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                placeholder="Category Name (e.g. Desserts)"
                placeholderTextColor="#A0AEC0"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleCreateCategory} disabled={creatingCategory}>
                <Text style={styles.addBtnText}>＋ Add</Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView style={{ maxHeight: 180, marginBottom: 15 }}>
              {categories.length === 0 ? (
                <Text style={styles.emptyListText}>No custom categories configured.</Text>
              ) : (
                categories.map((c) => (
                  <View key={c.id} style={styles.categoryRow}>
                    <Text style={styles.categoryRowName}>📁 {c.name}</Text>
                    <TouchableOpacity onPress={() => handleDeleteCategory(c.id)}>
                      <Text style={styles.deleteLink}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.closeBtnText}>Close</Text>
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
    marginBottom: 15,
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
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 12.5,
    color: '#0C2340',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
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
  centerLoading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#718096',
    fontSize: 11.5,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    paddingVertical: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTextBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  emptyText: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBE5DA',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#FEF9F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemId: {
    fontSize: 8.5,
    color: '#A0AEC0',
    fontFamily: 'monospace',
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  badgeActive: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  badgePaused: { backgroundColor: '#FFF5F5', borderColor: '#FEC5C5' },
  activeBadgeText: { fontSize: 8, fontWeight: 'bold' },
  textActive: { color: '#059669' },
  textPaused: { color: '#C53030' },
  itemName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0C2340',
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  vegBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    marginRight: 6,
  },
  vegBadgeGreen: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  vegBadgeYellow: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  vegBadgeText: { fontSize: 7.5, fontWeight: 'bold' },
  vegTextGreen: { color: '#059669' },
  vegTextYellow: { color: '#D97706' },
  prepTime: {
    fontSize: 9.5,
    color: '#718096',
    fontWeight: '600',
  },
  description: {
    fontSize: 10.5,
    color: '#718096',
    marginTop: 4,
    lineHeight: 14,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderColor: '#FEF9F1',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  editPricePencil: {
    fontSize: 9,
    marginLeft: 4,
    opacity: 0.7,
  },
  priceInput: {
    backgroundColor: '#FEF9F1',
    borderWidth: 0.5,
    borderColor: '#D4AF37',
    borderRadius: 6,
    width: 60,
    height: 25,
    paddingHorizontal: 4,
    fontSize: 11,
    color: '#0C2340',
    fontWeight: 'bold',
  },
  savePriceBtn: {
    backgroundColor: '#0C2340',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  savePriceBtnText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionBtnPause: {
    borderWidth: 1,
    borderColor: '#EBE5DA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  actionBtnPauseText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E53E3E',
  },
  actionBtnDelete: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEC5C5',
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDeleteText: {
    fontSize: 10.5,
    color: '#E53E3E',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#FEF9F1',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 11.5,
    color: '#2D3748',
    fontWeight: '600',
  },
  imageSelectorRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: '#EBE5DA',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  uploadBtnText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0C2340',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 10,
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
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: '#EBE5DA',
  },
  categoryRowName: {
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
});

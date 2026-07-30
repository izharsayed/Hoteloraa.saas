import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Search, Utensils, X, Info, BookOpen, Save, Loader2, Package } from 'lucide-react';
import api, { assetUrl } from '../utils/api.js';

const dishImages = import.meta.glob('../assets/images/dishes/*.png', { eager: true, as: 'url' });

function Menu() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Recipe Modal states
  const [recipeItem, setRecipeItem] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

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
  const [newIngredients, setNewIngredients] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Add Category Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const fetchedCats = await api.get('/menu/categories');
      const fetchedItems = await api.get('/menu/items');
      setCategories(fetchedCats || []);
      setMenuItems(fetchedItems || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch menu catalog data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRecipeModal = async (item) => {
    setRecipeItem(item);
    setLoadingRecipe(true);
    try {
      const [ingRes, invRes] = await Promise.all([
        api.get(`/inventory/recipe/${item.id}`),
        api.get('/inventory'),
      ]);
      setRecipeIngredients((ingRes || []).map(i => ({
        inventoryItemId: i.inventoryItemId,
        quantityRequired: i.quantityRequired,
        unit: i.unit || 'PIECE'
      })));
      setInventoryList(invRes || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load recipe ingredients');
    } finally {
      setLoadingRecipe(false);
    }
  };

  const addIngredientRow = () => {
    if (inventoryList.length === 0) return;
    const firstInv = inventoryList[0];
    setRecipeIngredients(prev => [
      ...prev,
      { inventoryItemId: firstInv.id, quantityRequired: 1, unit: firstInv.unit || 'PIECE' }
    ]);
  };

  const removeIngredientRow = (index) => {
    setRecipeIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const updateIngredientRow = (index, field, value) => {
    setRecipeIngredients(prev => prev.map((ing, i) => {
      if (i === index) {
        const updated = { ...ing, [field]: value };
        if (field === 'inventoryItemId') {
          const invItem = inventoryList.find(x => x.id === value);
          if (invItem) updated.unit = invItem.unit;
        }
        return updated;
      }
      return ing;
    }));
  };

  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    if (!recipeItem) return;
    try {
      setSavingRecipe(true);
      await api.post(`/inventory/recipe/${recipeItem.id}`, { ingredients: recipeIngredients });
      setSuccess(`Recipe for "${recipeItem.name}" updated successfully!`);
      setRecipeItem(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save recipe');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSavingRecipe(false);
    }
  };

  const handlePriceChange = async (id, newPrice) => {
    if (isNaN(newPrice) || newPrice <= 0) return;
    try {
      await api.put(`/menu/items/${id}`, { price: newPrice });
      setMenuItems(prev => prev.map(item => item.id === id ? { ...item, price: newPrice } : item));
      setSuccess('Price updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update price');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      await api.put(`/menu/items/${id}`, { isAvailable: !currentStatus });
      setMenuItems(prev => prev.map(item => item.id === id ? { ...item, isAvailable: !currentStatus } : item));
      setSuccess('Availability status updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/menu/items/${id}`);
      setMenuItems(prev => prev.filter(item => item.id !== id));
      setSuccess('Menu item deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to delete item');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      setError('');
      const result = await api.upload('/menu/items/upload', formData);
      setNewItemImageUrl(result.imageUrl);
      setSuccess('Image uploaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to upload image');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    setNewIngredients([]);
    try {
      const invRes = await api.get('/inventory');
      setInventoryList(invRes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const addNewIngredientRow = () => {
    if (inventoryList.length === 0) return;
    const firstInv = inventoryList[0];
    setNewIngredients(prev => [
      ...prev,
      { inventoryItemId: firstInv.id, quantityRequired: 1, unit: firstInv.unit || 'PIECE' }
    ]);
  };

  const removeNewIngredientRow = (index) => {
    setNewIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const updateNewIngredientRow = (index, field, value) => {
    setNewIngredients(prev => prev.map((ing, i) => {
      if (i === index) {
        const updated = { ...ing, [field]: value };
        if (field === 'inventoryItemId') {
          const invItem = inventoryList.find(x => x.id === value);
          if (invItem) updated.unit = invItem.unit;
        }
        return updated;
      }
      return ing;
    }));
  };

  const handleCreateMenuItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) {
      setError('Please fill in Name and Price');
      return;
    }

    try {
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

      if (newIngredients.length > 0) {
        await api.post(`/inventory/recipe/${newItem.id}`, { ingredients: newIngredients });
      }

      setMenuItems(prev => [...prev, newItem]);
      setSuccess('Menu item added successfully');
      setShowAddModal(false);
      resetForm();
      setNewIngredients([]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create menu item');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      setCreatingCategory(true);
      const newCat = await api.post('/menu/categories', { name: newCategoryName });
      setCategories(prev => [...prev, newCat]);
      setNewCategoryName('');
      setSuccess('Category created successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create category');
      setTimeout(() => setError(''), 3000);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? (It will fail if menu items are linked to it)')) return;
    try {
      await api.delete(`/menu/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      if (selectedCategory === id) setSelectedCategory('All');
      setSuccess('Category deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete category');
      setTimeout(() => setError(''), 3000);
    }
  };

  const resetForm = () => {
    setNewItemName('');
    setNewItemPrice('');
    setNewItemCostPrice('');
    setNewItemCategory('');
    setNewItemDescription('');
    setNewItemIsVeg(true);
    setNewItemIsAvailable(true);
    setNewItemPrepTime('');
    setNewItemImageUrl('');
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.menuCategoryId === selectedCategory;
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('/images/dishes/')) {
      const fileName = path.split('/').pop();
      return dishImages[`../assets/images/dishes/${fileName}`] || assetUrl(path);
    }
    return assetUrl(path);
  };

  return (
    <div className="space-y-8 animate-fadeIn flex flex-col h-full">
      {/* Messages */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-sm fixed top-4 right-4 z-50 animate-slideIn">
          <Info className="w-4 h-4 text-emerald-600" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-sm fixed top-4 right-4 z-50 animate-slideIn">
          <Info className="w-4 h-4 text-red-600" /> {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-display font-bold text-3xl text-navy">POS Menu Catalog</h1>
          <p className="text-slate text-sm font-medium mt-1">Manage kitchen recipes, pricing structures, and active catalog dishes</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2 bg-white border border-border-cream text-navy font-bold text-xs rounded-xl hover:border-gold hover:bg-gold-pale/10 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Manage Categories
          </button>
          <button 
            onClick={() => { resetForm(); handleOpenAddModal(); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-gold" /> Add Menu Item
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="soft-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shrink-0">
        <div className="flex items-center gap-2 bg-cream/20 border border-border-cream rounded-xl px-3 py-1.5 w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate" />
          <input 
            type="text" 
            placeholder="Search by Dish name, desc, or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent focus:outline-none text-xs w-full text-charcoal font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`
              px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap
              ${selectedCategory === 'All' 
                ? 'bg-navy border-navy text-white shadow-sm' 
                : 'bg-white border-border-cream text-slate hover:bg-gold-pale/10'
              }
            `}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap
                ${selectedCategory === cat.id 
                  ? 'bg-navy border-navy text-white shadow-sm' 
                  : 'bg-white border-border-cream text-slate hover:bg-gold-pale/10'
                }
              `}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Dishes */}
      {loading ? (
        <div className="text-center py-20 text-slate font-semibold text-xs animate-pulse">Loading menu catalog...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white border border-border-cream rounded-2xl text-slate text-xs font-semibold">
          No menu items found. Click 'Add Menu Item' to start building your catalog.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="soft-card p-4 bg-white flex gap-4 h-48 border border-border-cream/60 hover:border-gold/40 hover:shadow-md transition-all rounded-2xl"
              >
                {/* Left side: Image */}
                <div className="w-28 h-full shrink-0 relative rounded-xl overflow-hidden border border-border-cream/40 bg-cream/35 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={getImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Utensils className="w-10 h-10 text-slate/30" />
                  )}
                  <span className={`absolute top-2 left-2 w-3.5 h-3.5 rounded-full border-2 border-white ${item.isVeg ? 'bg-success' : 'bg-danger'}`} />
                </div>

                {/* Right side: details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <div className="min-w-0 flex-1">
                        <span className="text-[8px] text-slate font-bold uppercase tracking-wider font-mono block">ID: {item.id.slice(0, 8)}</span>
                        <h3 className="font-display font-bold text-sm text-navy truncate mt-0.5">{item.name}</h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                        item.isAvailable ? 'bg-success-pale text-success' : 'bg-danger-pale text-danger'
                      }`}>
                        {item.isAvailable ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <span className="text-[10px] text-gold font-bold uppercase tracking-wide bg-navy/5 px-2 py-0.5 rounded-md mt-1.5 inline-block">
                      {item.menuCategory?.name || 'Unassigned'}
                    </span>
                    <p className="text-slate text-[10px] mt-2 leading-normal line-clamp-2 font-medium">{item.description || 'No description provided.'}</p>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-border-cream/50 pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-cream/10 border border-border-cream/60 rounded-lg px-2 py-1">
                      <span className="text-navy text-[11px] font-bold font-mono">₹</span>
                      <input 
                        type="number"
                        defaultValue={item.price}
                        onBlur={(e) => handlePriceChange(item.id, parseFloat(e.target.value))}
                        className="w-12 bg-transparent focus:outline-none text-[11px] font-mono font-bold text-navy"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => openRecipeModal(item)}
                        className="px-2 py-1 text-[10px] font-bold rounded-lg border border-gold/40 text-navy bg-gold-pale/30 hover:bg-gold-pale flex items-center gap-1 transition-all"
                        title="Configure Recipe Ingredients"
                      >
                        <BookOpen className="w-3 h-3 text-gold" /> Recipe
                      </button>
                      <button 
                        onClick={() => handleStatusToggle(item.id, item.isAvailable)}
                        className={`
                          px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all
                          ${item.isAvailable 
                            ? 'bg-white border-danger/30 text-danger hover:bg-danger-pale' 
                            : 'bg-white border-success/30 text-success hover:bg-success-pale'
                          }
                        `}
                      >
                        {item.isAvailable ? 'Pause' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 hover:border-red-200 transition-all"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Menu Item Modal (Horizontal Compact Landscape) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-border-cream flex justify-between items-center bg-cream/20">
              <h3 className="font-display font-bold text-lg text-navy">Add New Menu Item</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate hover:text-navy hover:bg-cream/40 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateMenuItem} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left Column (Image Upload & Options) — 4 Cols */}
                <div className="md:col-span-4 space-y-3 bg-cream/15 p-4 rounded-2xl border border-border-cream/60">
                  {/* Image Preview Box */}
                  <div className="w-full h-48 rounded-xl border border-border-cream bg-cream/40 flex flex-col items-center justify-center overflow-hidden relative group">
                    {newItemImageUrl ? (
                      <>
                        <img 
                          src={getImageUrl(newItemImageUrl)} 
                          alt="Dish Preview" 
                          className="w-full h-full object-cover" 
                        />
                        <button 
                          type="button" 
                          onClick={() => setNewItemImageUrl('')}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md text-xs font-bold"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                        <Utensils className="w-7 h-7 text-slate/30" />
                        <span className="text-[10px] font-semibold text-slate/60">No image uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Control */}
                  <div className="space-y-1">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full bg-navy hover:bg-navy/90 text-gold text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploading ? 'Uploading...' : 'Upload Image File'}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*"
                      disabled={uploading}
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                    <p className="text-[9px] text-slate/60 text-center font-medium">Supports JPG, PNG, WEBP, GIF (Max 5MB)</p>
                  </div>

                  {/* Status Options */}
                  <div className="pt-2 border-t border-border-cream/60 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none p-1.5 rounded-xl hover:bg-white/60 transition-all">
                      <input 
                        type="checkbox"
                        checked={newItemIsVeg}
                        onChange={(e) => setNewItemIsVeg(e.target.checked)}
                        className="w-4 h-4 accent-success rounded border-border-cream"
                      />
                      <span className="text-xs font-semibold text-charcoal">Is Vegetarian</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none p-1.5 rounded-xl hover:bg-white/60 transition-all">
                      <input 
                        type="checkbox"
                        checked={newItemIsAvailable}
                        onChange={(e) => setNewItemIsAvailable(e.target.checked)}
                        className="w-4 h-4 accent-navy rounded border-border-cream"
                      />
                      <span className="text-xs font-semibold text-charcoal">Available for Sale</span>
                    </label>
                  </div>
                </div>

                {/* Right Column (Dish Attributes & Details) — 8 Cols */}
                <div className="md:col-span-8 space-y-4">
                  {/* Dish Name */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">Dish Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Butter Chicken / Garlic Naan"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                    />
                  </div>

                  {/* 4-Grid Parameters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">Category</label>
                      <select 
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        className="w-full px-3 py-2.5 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold bg-white"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">Sell Price (₹) *</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        placeholder="e.g. 150"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        className="w-full px-3 py-2.5 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">Cost Price (₹)</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="e.g. 50"
                        value={newItemCostPrice}
                        onChange={(e) => setNewItemCostPrice(e.target.value)}
                        className="w-full px-3 py-2.5 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">Prep Time (mins)</label>
                      <input 
                        type="number" 
                        min="1"
                        placeholder="e.g. 15"
                        value={newItemPrepTime}
                        onChange={(e) => setNewItemPrepTime(e.target.value)}
                        className="w-full px-3 py-2.5 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold font-mono"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">Description & Plating Notes</label>
                    <textarea 
                      rows="2"
                      placeholder="Enter description or plating instructions..."
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold resize-none"
                    />
                  </div>

                  {/* Recipe & Ingredients Auto-Deduction Section */}
                  <div className="pt-4 border-t border-border-cream space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-navy block flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-gold" /> Recipe Ingredients (Bill of Materials)
                        </label>
                        <p className="text-[10px] text-slate font-medium">
                          Auto-deduct raw inventory balances whenever this dish is ordered.
                        </p>
                      </div>
                      <button 
                        type="button"
                        onClick={addNewIngredientRow}
                        className="px-3 py-1.5 bg-gold-pale/30 border border-gold/40 hover:bg-gold-pale text-navy rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-gold" /> Add Ingredient
                      </button>
                    </div>

                    {newIngredients.length === 0 ? (
                      <div className="p-3 border border-dashed border-border-cream/80 rounded-xl text-center text-slate text-[11px] font-medium bg-cream/10">
                        No recipe ingredients added yet. Click <strong>"+ Add Ingredient"</strong> to configure auto-deduction.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                        {newIngredients.map((ing, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-cream/20 border border-border-cream/70 p-2.5 rounded-xl">
                            <div className="flex-1 min-w-0">
                              <select 
                                value={ing.inventoryItemId}
                                onChange={(e) => updateNewIngredientRow(idx, 'inventoryItemId', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-border-cream rounded-lg text-xs font-semibold text-navy focus:outline-none focus:border-gold"
                              >
                                {inventoryList.map(inv => (
                                  <option key={inv.id} value={inv.id}>
                                    {inv.name} (Stock: {inv.quantity} {inv.unit})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="w-24">
                              <input 
                                type="number" 
                                step="any"
                                min="0.001"
                                required
                                placeholder="Qty"
                                value={ing.quantityRequired}
                                onChange={(e) => updateNewIngredientRow(idx, 'quantityRequired', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-border-cream rounded-lg text-xs font-mono font-bold text-navy focus:outline-none focus:border-gold"
                              />
                            </div>

                            <div className="w-24">
                              <select 
                                value={ing.unit || 'KG'}
                                onChange={(e) => updateNewIngredientRow(idx, 'unit', e.target.value)}
                                className="w-full px-2 py-1.5 bg-white border border-border-cream rounded-lg text-xs font-mono font-bold text-navy focus:outline-none focus:border-gold"
                              >
                                <option value="KG">KG</option>
                                <option value="GRAM">GRAM</option>
                                <option value="LITRE">LITRE</option>
                                <option value="ML">ML</option>
                                <option value="PIECE">PIECE</option>
                                <option value="PACKET">PACKET</option>
                                <option value="BOX">BOX</option>
                                <option value="DOZEN">DOZEN</option>
                                <option value="BOTTLE">BOTTLE</option>
                              </select>
                            </div>

                            <button 
                              type="button" 
                              onClick={() => removeNewIngredientRow(idx)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Remove Ingredient"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-border-cream pt-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 border border-border-cream rounded-xl hover:bg-cream/20 text-xs font-bold text-slate transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary px-8 py-2.5"
                >
                  Save Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border-cream flex justify-between items-center bg-cream/20">
              <h3 className="font-display font-bold text-lg text-navy">Manage Categories</h3>
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="p-1 text-slate hover:text-navy hover:bg-cream/40 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input 
                  type="text" 
                  required
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                />
                <button 
                  type="submit"
                  disabled={creatingCategory}
                  className="bg-navy hover:bg-navy/90 text-gold text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {creatingCategory ? 'Adding...' : 'Add'}
                </button>
              </form>

              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate mb-2">Existing Categories</h4>
                {categories.length === 0 ? (
                  <p className="text-xs text-slate font-medium text-center py-4 bg-cream/20 rounded-xl">No categories found.</p>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-3 border border-border-cream/60 rounded-xl hover:bg-cream/10 transition-all">
                      <span className="text-xs font-bold text-navy">{cat.name}</span>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {recipeItem && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border-cream flex justify-between items-center bg-cream/20">
              <div>
                <span className="text-[9px] font-bold text-gold uppercase tracking-wider block">Bill of Materials / Ingredients</span>
                <h3 className="font-display font-bold text-lg text-navy">{recipeItem.name}</h3>
              </div>
              <button 
                onClick={() => setRecipeItem(null)}
                className="p-1 text-slate hover:text-navy hover:bg-cream/40 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="p-6 flex-1 overflow-y-auto space-y-4">
              <p className="text-slate text-xs font-medium">
                Map raw inventory items used per 1 serving of <strong>{recipeItem.name}</strong>. Stock will auto-deduct when orders are placed.
              </p>

              {loadingRecipe ? (
                <div className="py-12 flex items-center justify-center gap-2 text-slate text-xs font-semibold">
                  <Loader2 className="w-5 h-5 animate-spin text-gold" /> Loading recipe...
                </div>
              ) : (
                <div className="space-y-3">
                  {recipeIngredients.length === 0 ? (
                    <div className="p-4 border border-dashed border-border-cream rounded-2xl text-center text-slate text-xs font-semibold">
                      No ingredients configured yet. Click "+ Add Ingredient" below.
                    </div>
                  ) : (
                    recipeIngredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-cream/15 border border-border-cream/70 p-3 rounded-2xl">
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] font-bold text-slate uppercase block mb-1">Inventory Ingredient</label>
                          <select 
                            value={ing.inventoryItemId}
                            onChange={(e) => updateIngredientRow(idx, 'inventoryItemId', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-border-cream rounded-xl text-xs font-semibold text-navy focus:outline-none focus:border-gold"
                          >
                            {inventoryList.map(inv => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name} (Stock: {inv.quantity} {inv.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-24">
                          <label className="text-[9px] font-bold text-slate uppercase block mb-1">Qty / Serving</label>
                          <input 
                            type="number" 
                            step="any"
                            min="0.001"
                            required
                            value={ing.quantityRequired}
                            onChange={(e) => updateIngredientRow(idx, 'quantityRequired', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-border-cream rounded-xl text-xs font-mono font-bold text-navy focus:outline-none focus:border-gold"
                          />
                        </div>

                        <div className="w-24">
                          <label className="text-[9px] font-bold text-slate uppercase block mb-1">Unit</label>
                          <select 
                            value={ing.unit || 'KG'}
                            onChange={(e) => updateIngredientRow(idx, 'unit', e.target.value)}
                            className="w-full px-2 py-2 bg-white border border-border-cream rounded-xl text-xs font-mono font-bold text-navy focus:outline-none focus:border-gold"
                          >
                            <option value="KG">KG</option>
                            <option value="GRAM">GRAM</option>
                            <option value="LITRE">LITRE</option>
                            <option value="ML">ML</option>
                            <option value="PIECE">PIECE</option>
                            <option value="PACKET">PACKET</option>
                            <option value="BOX">BOX</option>
                            <option value="DOZEN">DOZEN</option>
                            <option value="BOTTLE">BOTTLE</option>
                          </select>
                        </div>

                        <button 
                          type="button" 
                          onClick={() => removeIngredientRow(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all self-end mb-0.5"
                          title="Remove Ingredient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}

                  <button 
                    type="button"
                    onClick={addIngredientRow}
                    disabled={inventoryList.length === 0}
                    className="w-full py-2.5 border border-dashed border-gold/60 text-navy bg-gold-pale/20 hover:bg-gold-pale/50 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 text-gold" /> Add Ingredient
                  </button>
                </div>
              )}

              <div className="flex gap-3 border-t border-border-cream pt-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setRecipeItem(null)}
                  className="flex-1 px-4 py-2.5 border border-border-cream rounded-xl hover:bg-cream/20 text-xs font-bold text-slate transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={savingRecipe || loadingRecipe}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {savingRecipe ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingRecipe ? 'Saving...' : 'Save Recipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;

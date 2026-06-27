import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Search, Utensils, X, Info } from 'lucide-react';
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
      setMenuItems(prev => [...prev, newItem]);
      setSuccess('Menu item added successfully');
      setShowAddModal(false);
      resetForm();
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
    if (path.startsWith('/uploads')) {
      return `http://localhost:5000${path}`;
    }
    if (path.startsWith('/images/dishes/')) {
      const fileName = path.split('/').pop();
      return dishImages[`../assets/images/dishes/${fileName}`] || path;
    }
    return path;
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
            onClick={() => { resetForm(); setShowAddModal(true); }}
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
                ? 'bg-navy border-navy text-gold shadow-sm' 
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
                  ? 'bg-navy border-navy text-gold shadow-sm' 
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

      {/* Add Menu Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-border-cream flex justify-between items-center bg-cream/20">
              <h3 className="font-display font-bold text-lg text-navy">Add New Menu Item</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate hover:text-navy hover:bg-cream/40 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateMenuItem} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">Dish Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Garlic Naan"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-3 py-2 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                  />
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
                    className="w-full px-3 py-2 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
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
                    className="w-full px-3 py-2 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">Category</label>
                  <select 
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">Prep Time (mins)</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="e.g. 15"
                    value={newItemPrepTime}
                    onChange={(e) => setNewItemPrepTime(e.target.value)}
                    className="w-full px-3 py-2 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold"
                  />
                </div>

                {/* File Upload for Dish Image */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">Dish Image</label>
                  <div className="flex gap-4 items-center">
                    {/* Image Preview */}
                    <div className="w-20 h-20 rounded-xl border border-border-cream bg-cream/20 flex items-center justify-center overflow-hidden shrink-0">
                      {newItemImageUrl ? (
                        <img 
                          src={getImageUrl(newItemImageUrl)} 
                          alt="Dish Preview" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Utensils className="w-8 h-8 text-slate/30" />
                      )}
                    </div>
                    {/* Upload Controls */}
                    <div className="flex-1 space-y-1.5">
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-block bg-navy hover:bg-navy/90 text-gold text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50"
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
                      {newItemImageUrl && (
                        <button 
                          type="button" 
                          onClick={() => setNewItemImageUrl('')}
                          className="text-[10px] text-red-500 font-bold ml-3 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                      <p className="text-[9px] text-slate/50">Supports JPG, PNG, WEBP, GIF. Max 5MB.</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate mb-1">Description</label>
                  <textarea 
                    rows="3"
                    placeholder="Enter ingredients or plating instructions..."
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-border-cream rounded-xl focus:outline-none focus:border-gold text-xs font-semibold resize-none"
                  />
                </div>

                <div className="flex items-center gap-6 py-2 col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={newItemIsVeg}
                      onChange={(e) => setNewItemIsVeg(e.target.checked)}
                      className="w-4 h-4 accent-success rounded border-border-cream"
                    />
                    <span className="text-xs font-semibold text-charcoal">Is Vegetarian</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
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

              {/* Form Buttons */}
              <div className="flex gap-3 border-t border-border-cream pt-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-border-cream rounded-xl hover:bg-cream/20 text-xs font-bold text-slate transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-primary"
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
    </div>
  );
}

export default Menu;

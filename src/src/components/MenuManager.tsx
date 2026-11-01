import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus,
  Edit2,
  Trash2,
  Flame,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { FoodItem } from '../types';

export const MenuManager: React.FC = () => {
  const {
    ownerBusiness,
    foods,
    addFood,
    updateFood,
    deleteFood,
    toggleFoodAvailable,
    toggleFoodPopular
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Kotas');
  const [imageUrl, setImageUrl] = useState('');
  const [popular, setPopular] = useState(false);
  const [available, setAvailable] = useState(true);

  const businessFoods = foods.filter((f) => f.businessId === ownerBusiness.id);

  const openAddModal = () => {
    setEditingFood(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategory('Kotas');
    setImageUrl('https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80');
    setPopular(false);
    setAvailable(true);
    setIsModalOpen(true);
  };

  const openEditModal = (food: FoodItem) => {
    setEditingFood(food);
    setName(food.name);
    setDescription(food.description);
    setPrice(food.price.toString());
    setCategory(food.category);
    setImageUrl(food.imageUrl || '');
    setPopular(food.popular);
    setAvailable(food.available);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) return;

    if (editingFood) {
      updateFood({
        ...editingFood,
        name,
        description,
        price: Math.round(numPrice * 100) / 100,
        category,
        imageUrl,
        popular,
        available
      });
    } else {
      addFood({
        businessId: ownerBusiness.id,
        name,
        description,
        price: Math.round(numPrice * 100) / 100,
        category,
        imageUrl,
        popular,
        available
      });
    }

    setIsModalOpen(false);
  };

  const photoPresets = [
    {
      name: 'Kota / Sandwich',
      url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Flame Braai & Steak',
      url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Burger & Chips',
      url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Chicken Wings',
      url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Bunny Chow & Curry',
      url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Chakalaka / Relish',
      url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
    }
  ];

  return (
    <div className="container--wide py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#17201A]/10">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#17201A] tracking-tight">
            Menu Management
          </h1>
          <p className="text-xs text-[#647067] mt-1">
            Manage your digital menu dishes, high-res photos, availability and popular tags for{' '}
            <strong className="text-[#17201A]">{ownerBusiness.businessName}</strong>.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn btn-primary btn-sm font-bold shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Dishes Table / Grid */}
      {businessFoods.length === 0 ? (
        <div className="card empty-state">
          <ShoppingBag className="w-12 h-12 mx-auto text-[#647067]/40 mb-3" />
          <strong>Your menu is empty</strong>
          <p className="text-sm">Add your signature dishes so customers can start ordering.</p>
          <button
            onClick={openAddModal}
            className="btn btn-primary btn-sm mt-4 font-bold"
          >
            Add Your First Dish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {businessFoods.map((food) => (
            <div
              key={food.id}
              className={`card flex flex-col justify-between overflow-hidden relative ${
                food.popular ? 'card--accent' : ''
              } ${!food.available ? 'opacity-65 bg-gray-50' : ''}`}
            >
              <div>
                {/* Photo */}
                <div className="relative h-40 -mx-[22px] -mt-[22px] mb-3 bg-[#F7FAF7] overflow-hidden">
                  {food.imageUrl ? (
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#647067]">
                      <ImageIcon className="w-8 h-8 opacity-30" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2 flex gap-1">
                    {food.popular && (
                      <span className="badge bg-[#15803D] text-white border-0 text-[11px] font-black shadow-xs">
                        Popular
                      </span>
                    )}
                    {!food.available && (
                      <span className="badge badge-cancelled text-[11px] font-bold">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2 right-2 bg-[#17201A]/80 backdrop-blur-xs text-white px-2.5 py-0.5 rounded text-sm font-black">
                    R{food.price.toFixed(2)}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-base text-[#17201A]">{food.name}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#F7FAF7] text-[#647067] font-semibold shrink-0">
                      {food.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#647067] line-clamp-2 leading-relaxed">
                    {food.description}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-4 pt-3 border-t border-[#17201A]/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  {/* Availability Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleFoodAvailable(food.id)}
                    className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                      food.available
                        ? 'bg-[#E4F9EC] text-[#166534]'
                        : 'bg-[#FBE6E4] text-[#EF4444]'
                    }`}
                  >
                    {food.available ? '● Available in Store' : '○ Out of Stock'}
                  </button>

                  {/* Popular Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleFoodPopular(food.id)}
                    className={`p-1.5 rounded-md hover:bg-[#F7FAF7] cursor-pointer ${
                      food.popular ? 'text-[#15803D]' : 'text-[#647067]'
                    }`}
                    title="Toggle popular badge"
                  >
                    <Flame className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#17201A]/5">
                  <button
                    type="button"
                    onClick={() => openEditModal(food)}
                    className="btn btn-outline btn-sm text-xs font-bold py-1 px-3"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete ${food.name} from menu?`)) {
                        deleteFood(food.id);
                      }
                    }}
                    className="btn btn-danger btn-sm text-xs font-bold py-1 px-3"
                    title="Delete dish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-[#17201A]/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#17201A]/10 mb-4">
              <h2 className="text-xl font-bold">
                {editingFood ? `Edit ${editingFood.name}` : 'Add Menu Item'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F7FAF7] hover:bg-black/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="stack">
              <div className="field">
                <label htmlFor="dish-name">Dish Name *</label>
                <input
                  id="dish-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Soweto Quarter Loaf Kota"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="field">
                  <label htmlFor="dish-price">Price (ZAR R) *</label>
                  <input
                    id="dish-price"
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="65.00"
                  />
                </div>

                <div className="field">
                  <label htmlFor="dish-category">Category *</label>
                  <select
                    id="dish-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Kotas">Kotas</option>
                    <option value="Platters">Platters & Braai</option>
                    <option value="Burgers">Burgers & Grills</option>
                    <option value="Chicken">Chicken</option>
                    <option value="Bunny Chow">Bunny Chow</option>
                    <option value="Sides">Sides & Relishes</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="dish-desc">Description</label>
                <textarea
                  id="dish-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="List ingredients, sides, sauces, and flavour profile..."
                />
              </div>

              {/* Photo Presets & URL */}
              <div className="field">
                <label>Dish Photo</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL (https://...)"
                  className="mb-2"
                />

                <div className="text-xs text-[#647067] mb-1 font-semibold">Or pick a photo preset:</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {photoPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`text-[11px] p-1.5 rounded border text-left truncate cursor-pointer transition-colors ${
                        imageUrl === preset.url
                          ? 'border-[#22C55E] bg-[#E4F9EC] font-bold text-[#166534]'
                          : 'border-[#17201A]/10 hover:bg-[#F7FAF7]'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-4 py-2 border-t border-[#17201A]/10">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={popular}
                    onChange={(e) => setPopular(e.target.checked)}
                    className="w-4 h-4 rounded text-[#15803D]"
                  />
                  <span>Mark as Popular Dish</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-[#22C55E]"
                  />
                  <span>Available for Orders</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline flex-1 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 text-sm font-bold"
                >
                  {editingFood ? 'Save Changes' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

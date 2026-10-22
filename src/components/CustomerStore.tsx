import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Star,
  Clock,
  Truck,
  MapPin,
  Phone,
  MessageCircle,
  Plus,
  Minus,
  Check,
  Search,
  Sparkles,
  ShoppingBag,
  Info,
  Flame,
  ArrowRight
} from 'lucide-react';

export const CustomerStore: React.FC = () => {
  const {
    businesses,
    selectedStoreBusiness,
    setSelectedStoreBusiness,
    foods,
    addToCart,
    cart,
    updateCartQuantity,
    setIsCartOpen,
    cartTotal
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentBusiness = selectedStoreBusiness || businesses[0];

  const FALLBACK_FOOD_IMG =
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';

  const businessFoods = foods.filter((f) => f.businessId === currentBusiness.id);

  // Featured popular dishes for top carousel
  const featuredFoods = businessFoods.filter((f) => f.popular && f.available);

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(businessFoods.map((f) => f.category)))];

  // Filter foods by category and search
  const filteredFoods = businessFoods.filter((food) => {
    const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
    const matchesSearch =
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getItemQuantityInCart = (foodId: number) => {
    const found = cart.find((item) => item.food.id === foodId);
    return found ? found.quantity : 0;
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="pb-28">
      {/* Restaurant Switcher Carousel / Badges */}
      <div className="bg-[#1B1815] text-[#F3EEE4] py-4 border-b border-white/10">
        <div className="container--wide">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-[#EDA430]">Select Food Spot</span>
              <span className="text-xs text-white/50">({businesses.length} active in area)</span>
            </div>

            <div className="text-xs text-white/70">
              Deliver to: <strong className="text-white underline cursor-pointer">Soweto & JHB Central</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {businesses.map((biz) => {
              const isSelected = biz.id === currentBusiness.id;
              return (
                <button
                  key={biz.id}
                  onClick={() => {
                    setSelectedStoreBusiness(biz);
                    setSelectedCategory('All');
                  }}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-white text-[#1B1815] border-[#25D366] shadow-lg ring-2 ring-[#25D366]/40'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/25 shadow-xs'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate flex items-center gap-1.5">
                      <span>{biz.businessName}</span>
                      {biz.isOpen ? (
                        <span className="w-2 h-2 rounded-full bg-[#25D366]" title="Open" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#9E2B25]" title="Closed" />
                      )}
                    </div>
                    <div className="text-xs opacity-75 truncate">{biz.category}</div>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="font-semibold">★ {biz.rating || 4.8}</span>
                      <span>·</span>
                      <span>Delivery R{biz.deliveryFee}</span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 ${
                      biz.isOpen
                        ? 'bg-[#E4F9EC] text-[#176B35]'
                        : 'bg-[#FBE6E4] text-[#9E2B25]'
                    }`}
                  >
                    {biz.isOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Restaurant Hero Banner */}
      <div className="relative bg-gradient-to-r from-[#1B1815] to-[#35302B] text-white">
        <div
          className="absolute inset-0 opacity-25 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: `url(${currentBusiness.bannerImage})` }}
        />
        <div className="relative container--wide py-8">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="badge badge-confirmed bg-[#DD5330] text-white font-bold border-0">
                {currentBusiness.category}
              </span>

              {currentBusiness.verificationStatus === 'verified' && (
                <span className="badge bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 font-bold">
                  ✓ Verified Vendor
                </span>
              )}

              <span
                className={`badge ${
                  currentBusiness.isOpen
                    ? 'badge-delivery'
                    : 'badge-cancelled'
                }`}
              >
                {currentBusiness.isOpen ? 'Kitchen Open · Accepting Orders' : 'Currently Closed'}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
              {currentBusiness.businessName}
            </h1>

            <p className="text-sm md:text-base text-white/80 mb-4 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#EDA430] shrink-0" />
              <span>{currentBusiness.address}</span>
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-white/90 pt-1">
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Star className="w-4 h-4 text-[#EDA430] fill-current" />
                <span className="font-bold">{currentBusiness.rating || 4.9}</span>
                <span className="text-white/60">({currentBusiness.reviewCount || 120} reviews)</span>
              </div>

              <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Truck className="w-4 h-4 text-[#25D366]" />
                <span>Delivery: R{currentBusiness.deliveryFee.toFixed(2)} (within {currentBusiness.deliveryRadiusKm}km)</span>
              </div>

              <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Clock className="w-4 h-4 text-[#EDA430]" />
                <span>Avg 25-35 mins</span>
              </div>

              <a
                href={`https://wa.me/${currentBusiness.whatsappNumber}?text=Hi%20${encodeURIComponent(currentBusiness.businessName)},%20I%20would%20like%20to%20order`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm text-xs font-bold ml-auto"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Menu Section */}
      <main className="container--wide mt-6">
        {/* Featured Items Carousel (Highlighting Bestsellers like Soweto Supreme Kota) */}
        {!searchQuery && selectedCategory === 'All' && featuredFoods.length > 0 && (
          <section className="mb-8" aria-label="Featured Bestsellers">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#DD5330] flex items-center justify-center text-white">
                  <Flame className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-lg md:text-xl font-black text-[#1B1815] tracking-tight">
                  Featured Bestsellers
                </h2>
              </div>
              <span className="text-xs text-[#8C857A] font-medium hidden sm:inline">
                Most ordered this week
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x">
              {featuredFoods.map((food) => {
                const qtyInCart = getItemQuantityInCart(food.id);
                const isDisabled = !food.available || !currentBusiness.isOpen;

                return (
                  <div
                    key={`featured-${food.id}`}
                    className="snap-start shrink-0 w-[260px] sm:w-[280px] bg-white rounded-2xl border-2 border-[#EDA430]/30 shadow-md p-3 flex flex-col justify-between hover:border-[#EDA430] transition-all group"
                  >
                    <div>
                      <div className="relative h-36 rounded-xl overflow-hidden bg-[#F3EEE4] mb-2.5">
                        <img
                          src={food.imageUrl || FALLBACK_FOOD_IMG}
                          alt={food.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = FALLBACK_FOOD_IMG;
                          }}
                        />
                        <span className="absolute top-2 left-2 badge bg-[#DD5330] text-white border-0 text-[11px] font-black shadow-xs flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          Bestseller
                        </span>
                        <div className="absolute bottom-2 right-2 bg-[#1B1815]/85 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-xs font-black">
                          R{food.price.toFixed(2)}
                        </div>
                      </div>

                      <h3 className="font-extrabold text-sm text-[#1B1815] line-clamp-1 group-hover:text-[#DD5330] transition-colors">
                        {food.name}
                      </h3>
                      <p className="text-xs text-[#5A544C] line-clamp-2 mt-0.5 leading-snug">
                        {food.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#1B1815]/10 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#1B1815]">
                        R{food.price.toFixed(2)}
                      </span>

                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-1.5 bg-[#E4F9EC] border border-[#25D366]/40 rounded-lg p-0.5">
                          <button
                            onClick={() => updateCartQuantity(food.id, qtyInCart - 1)}
                            className="w-6 h-6 rounded bg-white text-[#1B1815] flex items-center justify-center shadow-xs text-xs cursor-pointer hover:bg-[#F3EEE4]"
                            aria-label="Decrease"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-xs text-[#176B35]">
                            {qtyInCart}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(food.id, qtyInCart + 1)}
                            className="w-6 h-6 rounded bg-white text-[#1B1815] flex items-center justify-center shadow-xs text-xs cursor-pointer hover:bg-[#F3EEE4]"
                            aria-label="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(food, 1)}
                          disabled={isDisabled}
                          className={`btn btn-sm text-xs !py-1 !px-2.5 ${
                            isDisabled
                              ? 'btn-outline opacity-50 cursor-not-allowed'
                              : 'btn-primary font-bold shadow-xs'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Search & Category Pills */}
        <div className="card p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C857A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, kotas, braai plates, curries..."
                className="pl-10 !py-2.5 text-sm"
              />
            </div>

            <div className="text-xs text-[#5A544C] flex items-center gap-1.5 font-medium">
              <Sparkles className="w-4 h-4 text-[#EDA430]" />
              <span>Use promo code <strong>KASI10</strong> for 10% off</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1B1815] text-white shadow-sm'
                    : 'bg-[#F3EEE4] text-[#5A544C] hover:bg-[#1B1815]/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredFoods.length === 0 ? (
          <div className="empty-state card">
            <ShoppingBag className="w-12 h-12 mx-auto text-[#8C857A]/40 mb-3" />
            <strong>No items found</strong>
            <p className="text-sm">Try choosing another category or clearing your search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFoods.map((food) => {
              const qtyInCart = getItemQuantityInCart(food.id);
              const isDisabled = !food.available || !currentBusiness.isOpen;

              return (
                <div
                  key={food.id}
                  className={`card flex flex-col justify-between overflow-hidden transition-all duration-200 hover:shadow-md ${
                    food.popular ? 'card--accent' : ''
                  } ${!food.available ? 'opacity-60' : ''}`}
                >
                  <div>
                    {/* Food Photo */}
                    <div className="relative h-44 -mx-[22px] -mt-[22px] mb-4 bg-[#F3EEE4] overflow-hidden">
                      {food.imageUrl ? (
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = FALLBACK_FOOD_IMG;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8C857A]">
                          <ShoppingBag className="w-10 h-10 opacity-30" />
                        </div>
                      )}

                      {/* Badges on image */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        {food.popular && (
                          <span className="badge bg-[#DD5330] text-white border-0 text-xs font-black shadow-sm flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" />
                            Popular
                          </span>
                        )}
                        {!food.available && (
                          <span className="badge badge-cancelled font-bold">
                            Sold Out
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2 right-2 bg-[#1B1815]/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-sm font-black">
                        R{food.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Food Content */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-extrabold text-[#1B1815] leading-snug">
                          {food.name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-[#F3EEE4] text-[#5A544C] font-semibold">
                          {food.category}
                        </span>
                      </div>

                      <p className="text-xs text-[#5A544C] line-clamp-2 leading-relaxed">
                        {food.description}
                      </p>
                    </div>
                  </div>

                  {/* Add to Cart Actions */}
                  <div className="mt-4 pt-3 border-t border-[#1B1815]/10 flex items-center justify-between">
                    <div className="text-xs font-semibold text-[#8C857A]">
                      {food.available ? 'In stock' : 'Unavailable'}
                    </div>

                    {qtyInCart > 0 ? (
                      <div className="flex items-center gap-2 bg-[#E4F9EC] border border-[#25D366]/40 rounded-lg p-1">
                        <button
                          onClick={() => updateCartQuantity(food.id, qtyInCart - 1)}
                          className="w-8 h-8 rounded bg-white text-[#1B1815] flex items-center justify-center shadow-sm hover:bg-[#F3EEE4] cursor-pointer"
                          aria-label="Decrease"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-[#176B35]">
                          {qtyInCart}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(food.id, qtyInCart + 1)}
                          className="w-8 h-8 rounded bg-white text-[#1B1815] flex items-center justify-center shadow-sm hover:bg-[#F3EEE4] cursor-pointer"
                          aria-label="Increase"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(food, 1)}
                        disabled={isDisabled}
                        className={`btn btn-sm ${
                          isDisabled
                            ? 'btn-outline opacity-50 cursor-not-allowed'
                            : 'btn-primary font-bold shadow-sm'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add to Order</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar (Sticky when cart has items) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
          <div className="container max-w-xl mx-auto">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-[#1B1815] hover:bg-[#25D366] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between transition-all duration-200 border-2 border-[#25D366] cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366] group-hover:bg-[#1B1815] flex items-center justify-center text-white font-black text-base shadow-sm">
                  {totalCartCount}
                </div>
                <div className="text-left">
                  <div className="text-xs text-white/70 uppercase tracking-wider font-bold">
                    View Cart · {currentBusiness.businessName}
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    {totalCartCount} item{totalCartCount > 1 ? 's' : ''} in your order
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-[#EDA430] group-hover:text-white">
                  R{cartTotal.toFixed(2)}
                </span>
                <ArrowRight className="w-5 h-5 text-[#25D366] group-hover:text-white" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

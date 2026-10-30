import React, { useState } from 'react';
import {
  Star,
  Clock,
  Truck,
  MapPin,
  MessageCircle,
  Plus,
  Minus,
  Search,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

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
    cartTotal,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  /*
   * ------------------------------------------------------------
   * CURRENT BUSINESS
   * ------------------------------------------------------------
   */

  const currentBusiness =
    selectedStoreBusiness || businesses[0] || null;

  /*
   * ------------------------------------------------------------
   * LOADING / EMPTY STATE
   * ------------------------------------------------------------
   */

  if (!currentBusiness) {
    return (
      <div className="min-h-screen bg-[#F7FAF7] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#D7E2DA] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#22C55E] border-t-transparent" />

          <h2 className="text-lg font-black text-[#17201A]">
            Loading restaurants...
          </h2>

          <p className="mt-1 text-sm text-[#647067]">
            Please wait while Chowza loads the available restaurants.
          </p>
        </div>
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * BUSINESS FOODS
   * ------------------------------------------------------------
   */

  const businessFoods = foods.filter(
    (food) => food.businessId === currentBusiness.id
  );

  /*
   * ------------------------------------------------------------
   * FEATURED FOODS
   * ------------------------------------------------------------
   */

  const featuredFoods = businessFoods.filter(
    (food) => food.popular && food.available
  );

  /*
   * ------------------------------------------------------------
   * CATEGORIES
   * ------------------------------------------------------------
   */

  const categories = [
    'All',
    ...Array.from(
      new Set(
        businessFoods
          .map((food) => food.category)
          .filter(Boolean)
      )
    ),
  ];

  /*
   * ------------------------------------------------------------
   * FILTERED FOODS
   * ------------------------------------------------------------
   */

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredFoods = businessFoods.filter((food) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      food.category === selectedCategory;

    const matchesSearch =
      normalizedSearch.length === 0 ||
      food.name.toLowerCase().includes(normalizedSearch) ||
      food.description.toLowerCase().includes(normalizedSearch) ||
      food.category.toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });

  /*
   * ------------------------------------------------------------
   * CART HELPERS
   * ------------------------------------------------------------
   */

  const getItemQuantityInCart = (foodId: number) => {
    const cartItem = cart.find(
      (item) => item.food.id === foodId
    );

    return cartItem?.quantity ?? 0;
  };

  const totalCartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-[#F7FAF7] pb-28">

      {/* ======================================================
          RESTAURANT SWITCHER
          ====================================================== */}

      <section className="bg-[#17201A] text-white border-b border-white/10">
        <div className="container--wide py-4">

          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#22C55E]">
                Select Food Spot
              </span>

              <span className="ml-2 text-xs text-white/50">
                {businesses.length} restaurant
                {businesses.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="hidden text-xs text-white/60 sm:block">
              Delivering around Johannesburg
            </div>
          </div>

          {businesses.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => {
                const isSelected =
                  business.id === currentBusiness.id;

                return (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => {
                      setSelectedStoreBusiness(business);
                      setSelectedCategory('All');
                      setSearchQuery('');
                    }}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-[#22C55E] bg-white text-[#17201A] shadow-lg ring-2 ring-[#22C55E]/30'
                        : 'border-white/15 bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-black">
                          {business.businessName}
                        </span>

                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            business.isOpen
                              ? 'bg-[#22C55E]'
                              : 'bg-[#EF4444]'
                          }`}
                        />
                      </div>

                      <div
                        className={`mt-1 truncate text-xs ${
                          isSelected
                            ? 'text-[#647067]'
                            : 'text-white/60'
                        }`}
                      >
                        {business.category}
                      </div>

                      <div
                        className={`mt-1 text-xs ${
                          isSelected
                            ? 'text-[#647067]'
                            : 'text-white/60'
                        }`}
                      >
                        ★ {business.rating || 4.8}
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-black ${
                        business.isOpen
                          ? 'bg-[#E4F9EC] text-[#166534]'
                          : 'bg-[#FBE6E4] text-[#B42318]'
                      }`}
                    >
                      {business.isOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================
          RESTAURANT HERO
          ====================================================== */}

      <section className="relative overflow-hidden bg-[#17201A] text-white">
        {currentBusiness.bannerImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{
              backgroundImage: `url(${currentBusiness.bannerImage})`,
            }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-[#17201A] via-[#17201A]/90 to-[#17201A]/70" />

        <div className="container--wide relative py-8 md:py-10">

          <div className="max-w-4xl">

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#22C55E] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#17201A]">
                {currentBusiness.category}
              </span>

              {currentBusiness.verificationStatus ===
                'verified' && (
                <span className="rounded-full border border-[#22C55E]/40 bg-[#22C55E]/15 px-3 py-1 text-[10px] font-black text-[#86EFAC]">
                  ✓ Verified Vendor
                </span>
              )}

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                  currentBusiness.isOpen
                    ? 'bg-[#22C55E]/15 text-[#86EFAC]'
                    : 'bg-red-500/15 text-red-300'
                }`}
              >
                {currentBusiness.isOpen
                  ? 'Open · Accepting Orders'
                  : 'Currently Closed'}
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              {currentBusiness.businessName}
            </h1>

            {currentBusiness.address && (
              <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
                <MapPin className="h-4 w-4 shrink-0 text-[#22C55E]" />
                <span>{currentBusiness.address}</span>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">

              <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs">
                <Star className="h-4 w-4 fill-current text-[#22C55E]" />

                <strong>
                  {currentBusiness.rating || 4.8}
                </strong>

                <span className="text-white/50">
                  ({currentBusiness.reviewCount || 0})
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs">
                <Truck className="h-4 w-4 text-[#22C55E]" />

                <span>
                  Delivery R
                  {Number(
                    currentBusiness.deliveryFee || 0
                  ).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs">
                <Clock className="h-4 w-4 text-[#22C55E]" />

                <span>25–35 mins</span>
              </div>

              {currentBusiness.whatsappNumber && (
                <a
                  href={`https://wa.me/${currentBusiness.whatsappNumber}?text=${encodeURIComponent(
                    `Hi ${currentBusiness.businessName}, I would like to order.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-0 flex items-center gap-2 rounded-lg bg-[#22C55E] px-3 py-2 text-xs font-black text-[#17201A] transition hover:bg-[#16A34A] sm:ml-auto"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}

      <main className="container--wide mt-6">

        {/* ====================================================
            FEATURED
            ==================================================== */}

        {featuredFoods.length > 0 && (
          <section className="mb-7">

            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#22C55E]" />

                  <h2 className="text-xl font-black text-[#17201A]">
                    Popular right now
                  </h2>
                </div>

                <p className="mt-1 text-sm text-[#647067]">
                  Customer favourites from this restaurant
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {featuredFoods.map((food) => {
                const quantity =
                  getItemQuantityInCart(food.id);

                return (
                  <article
                    key={food.id}
                    className="group overflow-hidden rounded-2xl border border-[#D7E2DA] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#EEF3EF]">

                      {food.imageUrl ? (
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : null}

                      <span className="absolute left-2 top-2 rounded-full bg-[#17201A] px-2 py-1 text-[10px] font-black text-white">
                        ★ Popular
                      </span>
                    </div>

                    <div className="p-3">
                      <h3 className="truncate text-sm font-black text-[#17201A]">
                        {food.name}
                      </h3>

                      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs text-[#647067]">
                        {food.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">

                        <span className="text-sm font-black text-[#17201A]">
                          R{food.price.toFixed(2)}
                        </span>

                        {quantity > 0 ? (
                          <div className="flex items-center gap-1 rounded-lg bg-[#F1F5F2] p-1">

                            <button
                              type="button"
                              onClick={() =>
                                updateCartQuantity(
                                  food.id,
                                  quantity - 1
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-[#17201A] shadow-sm"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            <span className="min-w-[20px] text-center text-xs font-black">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateCartQuantity(
                                  food.id,
                                  quantity + 1
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-[#22C55E] text-white"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>

                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              !food.available ||
                              !currentBusiness.isOpen
                            }
                            onClick={() =>
                              addToCart(food, 1)
                            }
                            className="flex items-center gap-1.5 rounded-lg bg-[#17201A] px-3 py-2 text-xs font-black text-white transition hover:bg-[#22C55E] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </button>
                        )}

                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ====================================================
            SEARCH + CATEGORIES
            ==================================================== */}

        <section className="mb-6 rounded-2xl border border-[#D7E2DA] bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 md:flex-row md:items-center">

            <div className="flex min-w-0 flex-1 items-center rounded-xl border border-[#D7E2DA] bg-white transition focus-within:border-[#22C55E] focus-within:ring-2 focus-within:ring-[#22C55E]/20">

              <div className="flex shrink-0 items-center justify-center pl-4 pr-2">
                <Search className="h-4 w-4 text-[#647067]" />
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search dishes, kotas, braai plates, curries..."
                className="m-0 w-full min-w-0 border-0 bg-transparent px-2 py-3 text-sm text-[#17201A] outline-none ring-0 placeholder:text-[#9AA59D]"
              />
            </div>

            {currentBusiness.promotion?.active && (
              <div className="flex items-center gap-2 rounded-xl bg-[#F1FAF3] px-3 py-2 text-xs font-bold text-[#166534]">
                <Sparkles className="h-4 w-4 shrink-0 text-[#22C55E]" />

                <span>
                  {currentBusiness.promotion.description ||
                    `Use ${currentBusiness.promotion.code}`}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => {
              const selected =
                selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(category)
                  }
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
                    selected
                      ? 'bg-[#17201A] text-white'
                      : 'bg-[#F1F5F2] text-[#647067] hover:bg-[#E5EBE6]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        {/* ====================================================
            MENU
            ==================================================== */}

        <section>

          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-black text-[#17201A]">
                Menu
              </h2>

              <p className="mt-1 text-sm text-[#647067]">
                {filteredFoods.length}{' '}
                {filteredFoods.length === 1
                  ? 'item'
                  : 'items'}{' '}
                available
              </p>
            </div>
          </div>

          {filteredFoods.length === 0 ? (
            <div className="rounded-2xl border border-[#D7E2DA] bg-white px-6 py-14 text-center shadow-sm">

              <Search className="mx-auto mb-3 h-8 w-8 text-[#AAB5AE]" />

              <h3 className="text-base font-black text-[#17201A]">
                No dishes found
              </h3>

              <p className="mt-1 text-sm text-[#647067]">
                Try another search or choose a different
                category.
              </p>

              {(searchQuery ||
                selectedCategory !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="mt-4 rounded-lg bg-[#17201A] px-4 py-2 text-xs font-black text-white hover:bg-[#22C55E]"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">

              {filteredFoods.map((food) => {
                const quantity =
                  getItemQuantityInCart(food.id);

                return (
                  <article
                    key={food.id}
                    className="group overflow-hidden rounded-2xl border border-[#D7E2DA] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >

                    {/* FOOD IMAGE */}

                    <div className="relative aspect-[4/3] overflow-hidden bg-[#EEF3EF]">

                      {food.imageUrl ? (
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : null}

                      {food.popular && (
                        <span className="absolute left-2 top-2 rounded-full bg-[#17201A] px-2 py-1 text-[10px] font-black text-white">
                          ★ Popular
                        </span>
                      )}

                      {!food.available && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase text-[#17201A]">
                            Unavailable
                          </span>
                        </div>
                      )}
                    </div>

                    {/* FOOD INFORMATION */}

                    <div className="p-3">

                      <div className="flex items-start justify-between gap-2">

                        <h3 className="line-clamp-1 text-sm font-black text-[#17201A]">
                          {food.name}
                        </h3>

                        {food.category && (
                          <span className="shrink-0 rounded-full bg-[#F1F5F2] px-2 py-1 text-[9px] font-bold text-[#647067]">
                            {food.category}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-[#647067]">
                        {food.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">

                        <span className="text-sm font-black text-[#17201A]">
                          R{food.price.toFixed(2)}
                        </span>

                        {quantity > 0 ? (
                          <div className="flex items-center gap-1 rounded-lg bg-[#F1F5F2] p-1">

                            <button
                              type="button"
                              aria-label={`Remove one ${food.name}`}
                              onClick={() =>
                                updateCartQuantity(
                                  food.id,
                                  quantity - 1
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-[#17201A] shadow-sm transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            <span className="min-w-[22px] text-center text-xs font-black">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              aria-label={`Add another ${food.name}`}
                              disabled={
                                !food.available ||
                                !currentBusiness.isOpen
                              }
                              onClick={() =>
                                updateCartQuantity(
                                  food.id,
                                  quantity + 1
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-[#22C55E] text-white shadow-sm transition hover:bg-[#16A34A] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>

                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              !food.available ||
                              !currentBusiness.isOpen
                            }
                            onClick={() =>
                              addToCart(food, 1)
                            }
                            className="flex items-center gap-1.5 rounded-lg bg-[#17201A] px-3 py-2 text-xs font-black text-white transition hover:bg-[#22C55E] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </button>
                        )}

                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ======================================================
          FLOATING CART
          ====================================================== */}

      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4">

          <div className="mx-auto max-w-xl">

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 border-[#22C55E] bg-[#17201A] p-4 text-white shadow-2xl transition hover:bg-[#22C55E]"
            >

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22C55E] text-sm font-black text-[#17201A] group-hover:bg-[#17201A] group-hover:text-white">
                  {totalCartCount}
                </div>

                <div className="min-w-0 text-left">

                  <div className="truncate text-[10px] font-black uppercase tracking-wider text-white/50">
                    View Cart
                  </div>

                  <div className="truncate text-sm font-black text-white">
                    {totalCartCount}{' '}
                    {totalCartCount === 1
                      ? 'item'
                      : 'items'}{' '}
                    in your order
                  </div>

                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">

                <span className="text-lg font-black text-[#22C55E] group-hover:text-white">
                  R{cartTotal.toFixed(2)}
                </span>

                <ArrowRight className="h-5 w-5 text-[#22C55E] group-hover:text-white" />

              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerStore;
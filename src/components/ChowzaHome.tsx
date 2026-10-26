import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Clock,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Store,
  Truck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  public_address: string | null;
  is_published: boolean;
};

type MenuItem = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
};

type FoodWithBusiness = MenuItem & {
  businessName: string;
  businessSlug: string;
  businessLogo: string | null;
};

function money(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function getCategory(name: string) {
  const value = name.toLowerCase();

  if (
    value.includes('kota') ||
    value.includes('skopas') ||
    value.includes('gatsby')
  ) {
    return 'Kotas';
  }

  if (
    value.includes('burger') ||
    value.includes('cheese burger') ||
    value.includes('cheeseburger')
  ) {
    return 'Burgers';
  }

  if (
    value.includes('chicken') ||
    value.includes('wings') ||
    value.includes('drumstick')
  ) {
    return 'Chicken';
  }

  if (
    value.includes('platter') ||
    value.includes('braai') ||
    value.includes('meat')
  ) {
    return 'Platters';
  }

  if (
    value.includes('chips') ||
    value.includes('fries') ||
    value.includes('salad') ||
    value.includes('side')
  ) {
    return 'Sides';
  }

  if (
    value.includes('drink') ||
    value.includes('juice') ||
    value.includes('cool') ||
    value.includes('water')
  ) {
    return 'Drinks';
  }

  return 'Other';
}

export const ChowzaHome: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [foods, setFoods] = useState<FoodWithBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    let cancelled = false;

    async function loadHome() {
      setLoading(true);
      setError('');

      const { data: businessData, error: businessError } =
        await supabase
          .from('businesses')
          .select(
            'id, name, slug, description, logo_url, public_address, is_published'
          )
          .eq('is_published', true)
          .order('created_at', { ascending: false });

      if (cancelled) return;

      if (businessError) {
        setError('We could not load Chowza right now.');
        setLoading(false);
        return;
      }

      const publishedBusinesses = (businessData ?? []) as Business[];

      setBusinesses(publishedBusinesses);

      if (publishedBusinesses.length === 0) {
        setFoods([]);
        setLoading(false);
        return;
      }

      const businessMap = new Map(
        publishedBusinesses.map((business) => [business.id, business])
      );

      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select(
          'id, business_id, name, description, price, image_url, is_available, sort_order'
        )
        .eq('is_available', true)
        .order('sort_order', { ascending: true });

      if (cancelled) return;

      if (menuError) {
        setError('Restaurants loaded, but food could not be loaded.');
        setFoods([]);
        setLoading(false);
        return;
      }

      const availableFoods = ((menuData ?? []) as MenuItem[])
        .filter((item) => businessMap.has(item.business_id))
        .map((item) => {
          const business = businessMap.get(item.business_id)!;

          return {
            ...item,
            businessName: business.name,
            businessSlug: business.slug,
            businessLogo: business.logo_url,
          };
        });

      setFoods(availableFoods);
      setLoading(false);
    }

    void loadHome();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const availableCategories = Array.from(
      new Set(foods.map((food) => getCategory(food.name)))
    ).filter((category) => category !== 'Other');

    return ['All', ...availableCategories];
  }, [foods]);

  const filteredFoods = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return foods.filter((food) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        getCategory(food.name) === selectedCategory;

      const matchesSearch =
        !query ||
        food.name.toLowerCase().includes(query) ||
        (food.description ?? '').toLowerCase().includes(query) ||
        food.businessName.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [foods, searchQuery, selectedCategory]);

  const featuredFoods = filteredFoods.slice(0, 6);

  const openBusiness = (slug: string) => {
    window.location.assign(`/business/${encodeURIComponent(slug)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3EEE4] text-[#1B1815]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white">
              <LoaderCircle className="animate-spin" size={24} />
            </div>

            <p className="font-semibold">
              Loading Chowza...
            </p>

            <p className="mt-1 text-sm text-black/50">
              Finding food near you
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F3EEE4] px-5 py-16 text-[#1B1815]">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
          <Store className="mx-auto mb-4" size={36} />

          <h1 className="text-2xl font-black">
            Chowza is having a moment
          </h1>

          <p className="mt-3 text-sm text-black/60">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-[#1B1815] px-5 py-3 text-sm font-bold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3EEE4] text-[#1B1815]">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#1B1815] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]">
              <ShoppingBag size={18} />
            </div>

            <span className="text-xl font-black tracking-tight">
              Chowza
            </span>
          </button>

          <div className="hidden items-center gap-5 text-sm font-semibold sm:flex">
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="text-white/80 hover:text-white"
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => window.location.assign('/?track=true')}
              className="flex items-center gap-1 text-white/80 hover:text-white"
            >
              <Search size={15} />
              Track Order
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              window.alert(
                'Your cart is connected to the restaurant you order from. Open a restaurant to start ordering.'
              );
            }}
            className="flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-sm font-black text-white hover:bg-[#20bd5b]"
          >
            <ShoppingBag size={17} />
            <span>Cart</span>
          </button>

        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-black/10 bg-[#1B1815] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">

          <div className="max-w-3xl">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
              <span className="h-2 w-2 rounded-full bg-[#25D366]" />
              Local food. Local businesses.
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Your next meal
              <br />
              is on Chowza.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
              Discover food from local restaurants and food businesses,
              order what you love, and track your order from your phone.
            </p>

          </div>

          {/* Search */}
          <div className="mt-7 flex max-w-3xl items-center rounded-2xl bg-white p-2 shadow-xl">
            <Search
              className="ml-3 shrink-0 text-black/40"
              size={20}
            />

            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search food, restaurants, burgers, kotas..."
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-medium text-black outline-none placeholder:text-black/40"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mr-2 rounded-lg px-3 py-2 text-xs font-bold text-black/50 hover:bg-black/5"
              >
                Clear
              </button>
            )}
          </div>

          {/* Delivery */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-[#EDA430]" />
              Delivering around Johannesburg
            </span>

            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-[#25D366]" />
              Local delivery
            </span>
          </div>

        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">

        {/* Categories */}
        {categories.length > 1 && (
          <section className="mb-8">

            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black">
                Browse by category
              </h2>

              <span className="text-xs font-semibold text-black/40">
                {foods.length} items
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => {
                const selected = selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-black transition ${
                      selected
                        ? 'bg-[#1B1815] text-white'
                        : 'bg-white text-black/60 hover:bg-black/5'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

          </section>
        )}

        {/* Restaurants */}
        <section className="mb-10">

          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EDA430]">
                Food spots
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Restaurants & businesses
              </h2>
            </div>

            <span className="text-xs font-semibold text-black/40">
              {businesses.length} live
            </span>
          </div>

          {businesses.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <Store
                className="mx-auto mb-3 text-black/30"
                size={35}
              />

              <h3 className="font-black">
                No restaurants are live yet
              </h3>

              <p className="mt-1 text-sm text-black/50">
                Check back soon as local businesses join Chowza.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {businesses.map((business) => {
                const businessFoodCount = foods.filter(
                  (food) => food.business_id === business.id
                ).length;

                return (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => openBusiness(business.slug)}
                    className="group overflow-hidden rounded-2xl border border-black/10 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >

                    <div className="flex items-center gap-4 p-4">

                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F3EEE4]">

                        {business.logo_url ? (
                          <img
                            src={business.logo_url}
                            alt={business.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Store
                            size={27}
                            className="text-black/40"
                          />
                        )}

                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-black">
                            {business.name}
                          </h3>

                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#25D366]" />
                        </div>

                        <p className="mt-1 truncate text-xs text-black/50">
                          {business.description ||
                            business.public_address ||
                            'Local food business'}
                        </p>

                        <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-black/50">

                          <span className="flex items-center gap-1">
                            <Star
                              size={12}
                              className="fill-[#EDA430] text-[#EDA430]"
                            />
                            New
                          </span>

                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            25–40 min
                          </span>

                          <span>
                            {businessFoodCount} items
                          </span>

                        </div>

                      </div>

                      <ChevronRight
                        className="shrink-0 text-black/25 transition group-hover:translate-x-1"
                        size={20}
                      />

                    </div>

                  </button>
                );
              })}

            </div>
          )}

        </section>

        {/* Featured Food */}
        <section>

          <div className="mb-4 flex items-end justify-between gap-4">

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EDA430]">
                Hungry?
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Popular on Chowza
              </h2>
            </div>

            {filteredFoods.length > 0 && (
              <span className="text-xs font-semibold text-black/40">
                {filteredFoods.length} available
              </span>
            )}

          </div>

          {featuredFoods.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

              <Search
                className="mx-auto mb-3 text-black/25"
                size={35}
              />

              <h3 className="font-black">
                No food found
              </h3>

              <p className="mt-1 text-sm text-black/50">
                Try another search or category.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-5 rounded-xl bg-[#1B1815] px-5 py-3 text-xs font-black text-white"
              >
                Show Everything
              </button>

            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

              {featuredFoods.map((food) => (
                <article
                  key={food.id}
                  className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >

                  <button
                    type="button"
                    onClick={() => openBusiness(food.businessSlug)}
                    className="block w-full text-left"
                  >

                    <div className="relative aspect-[1.15/1] overflow-hidden bg-[#27231F]">

                      {food.image_url ? (
                        <img
                          src={food.image_url}
                          alt={food.name}
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag
                            className="text-white/25"
                            size={42}
                          />
                        </div>
                      )}

                      <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[9px] font-black uppercase shadow-sm">
                        {getCategory(food.name)}
                      </div>

                    </div>

                    <div className="p-3">

                      <p className="truncate text-[10px] font-bold uppercase tracking-wide text-black/40">
                        {food.businessName}
                      </p>

                      <h3 className="mt-1 line-clamp-1 text-sm font-black">
                        {food.name}
                      </h3>

                      {food.description && (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-black/50">
                          {food.description}
                        </p>
                      )}

                    </div>

                  </button>

                  <div className="flex items-center justify-between border-t border-black/5 px-3 py-3">

                    <span className="text-sm font-black">
                      {money(Number(food.price))}
                    </span>

                    <button
                      type="button"
                      onClick={() => openBusiness(food.businessSlug)}
                      className="flex items-center gap-1 rounded-lg bg-[#25D366] px-3 py-2 text-[10px] font-black text-white hover:bg-[#20bd5b]"
                    >
                      <Plus size={13} />
                      Order
                    </button>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

        {/* Business CTA */}
        <section className="mt-12 overflow-hidden rounded-3xl bg-[#1B1815] text-white">

          <div className="flex flex-col gap-6 p-7 sm:p-10 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EDA430]">
                Own a food business?
              </p>

              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                Put your food on Chowza.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                Add your menu, manage your orders and let customers
                discover your business online.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.location.assign('/business')}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-black text-white"
            >
              Restaurant Portal
              <ArrowRight size={17} />
            </button>

          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-black/10 bg-[#1B1815] px-4 py-8 text-white sm:px-6">

        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366]">
              <ShoppingBag size={14} />
            </div>

            <span className="font-black">
              Chowza
            </span>

            <span className="text-white/40">
              · Digital Food Ordering
            </span>
          </div>

          <div className="text-white/40">
            Built for local food businesses.
          </div>

        </div>

      </footer>

    </div>
  );
};
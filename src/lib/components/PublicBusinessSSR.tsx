import React from 'react';
import { MapPin, MessageCircle, Store } from 'lucide-react';

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  public_phone: string | null;
  whatsapp_number: string | null;
  public_address: string | null;
  is_published: boolean;
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
};

type Props = {
  business: Business;
  items: MenuItem[];
};

export default function PublicBusinessSSR({ business, items }: Props) {
  const money = (amount: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);

  const whatsappNumber = (business.whatsapp_number || '').replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#17201A]">
      <header className="border-b border-[#E1EAE3] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
          <a
            href="/"
            className="rounded-xl border border-[#D7E2DA] p-2"
            aria-label="Back to Chowza"
          >
            <span className="text-xl font-bold text-[#166534]">←</span>
          </a>

          <div className="flex items-center gap-3">
            <Store size={23} className="text-[#166534]" />

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#166534]">
                Chowza
              </p>
              <p className="font-black">
                Local food, made easy
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-[#15803D] text-white">
        <div className="mx-auto max-w-6xl px-5 py-12">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={`${business.name} logo`}
              className="mb-5 h-20 w-20 rounded-2xl bg-white object-contain p-2"
            />
          ) : (
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
              <Store size={34} />
            </div>
          )}

          <h1 className="text-3xl font-black sm:text-5xl">
            {business.name}
          </h1>

          {business.description && (
            <p className="mt-3 max-w-2xl text-white/80">
              {business.description}
            </p>
          )}

          {business.public_address && (
            <p className="mt-4 flex items-center gap-2 text-sm text-white/80">
              <MapPin size={17} />
              {business.public_address}
            </p>
          )}

          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-5 py-3 font-bold text-white"
            >
              <MessageCircle size={18} />
              Contact on WhatsApp
            </a>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-black">
            Our menu
          </h2>

          <p className="mt-1 text-sm text-[#647067]">
            Browse the items currently available from this store.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-[#E1EAE3] bg-white p-8 text-center">
            <p className="font-bold">
              No available menu items yet.
            </p>

            <p className="mt-2 text-sm text-[#647067]">
              Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-[#E1EAE3] bg-white shadow-sm"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-48 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-[#F0FDF4]">
                    <Store
                      size={32}
                      className="text-[#166534]"
                    />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-black">
                      {item.name}
                    </h3>

                    <span className="shrink-0 font-black text-[#166534]">
                      {money(Number(item.price))}
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-2 text-sm text-[#647067]">
                      {item.description}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled
                    className="mt-5 w-full rounded-xl bg-[#15803D] px-4 py-3 font-bold text-white opacity-80"
                  >
                    Add to cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#E1EAE3] bg-white px-5 py-6 text-center text-sm text-[#647067]">
        Powered by Chowza
      </footer>
    </div>
  );
}

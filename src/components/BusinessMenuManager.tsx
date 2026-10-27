
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ImagePlus, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

type BusinessMenuManagerProps = {
  businessId: string;
  businessName: string;
  onBack: () => void;
};

type MenuForm = {
  name: string;
  description: string;
  price: string;
  image_url: string;
  is_available: boolean;
};

const emptyForm: MenuForm = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  is_available: true,
};

const inputClass =
  'w-full rounded-xl border border-[#D7E2DA] bg-white px-4 py-3 text-sm text-[#166534] outline-none focus:border-[#22C55E]';

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#166534] px-4 py-3 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

export function BusinessMenuManager({
  businessId,
  businessName,
  onBack,
}: BusinessMenuManagerProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data: testKitchenItems, error: testKitchenItemsError } =
      await supabase
        .from('menu_items')
        .select('id, business_id, name')
        .neq('business_id', businessId)
        .limit(1);

    
    const { data, error: loadError } = await supabase
      .from('menu_items')
      .select(
        'id, business_id, name, description, price, image_url, is_available, sort_order'
      )
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (loadError) {
      setError(loadError.message);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as MenuItem[]);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  function openNewItem() {
    setEditingId(null);
    setForm(emptyForm);
    setNotice('');
    setError('');
    setFormOpen(true);
  }

  function openEditItem(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      image_url: item.image_url ?? '',
      is_available: item.is_available,
    });
    setNotice('');
    setError('');
    setFormOpen(true);
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    const price = Number(form.price);

    if (!form.name.trim()) {
      setError('Please enter a product name.');
      setSaving(false);
      return;
    }

    if (!form.price.trim() || !Number.isFinite(price) || price < 0) {
      setError('Enter a valid price in rand.');
      setSaving(false);
      return;
    }

    const payload = {
      business_id: businessId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price,
      image_url: form.image_url.trim() || null,
      is_available: form.is_available,
    };

    const result = editingId
      ? await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', editingId)
          .eq('business_id', businessId)
      : await supabase.from('menu_items').insert(payload);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setFormOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    setNotice(editingId ? 'Menu item updated.' : 'Menu item added.');
    setSaving(false);
    await loadItems();
  }

  async function deleteItem(item: MenuItem) {
    const confirmed = window.confirm(
      `Delete "${item.name}" from your menu? This cannot be undone.`
    );

    if (!confirmed) return;

    setError('');
    setNotice('');

    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', item.id)
      .eq('business_id', businessId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((current) => current.filter((entry) => entry.id !== item.id));
    setNotice(`"${item.name}" was deleted.`);
  }

  async function toggleAvailability(item: MenuItem) {
    setError('');
    setNotice('');

    const { error: updateError } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)
      .eq('business_id', businessId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, is_available: !entry.is_available }
          : entry
      )
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#166534]">
      <header className="border-b border-[#E1EAE3] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[#D7E2DA] p-2 hover:bg-[#F7FAF7]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={19} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#166534]">
              Chowza for Business
            </p>
            <h1 className="text-xl font-black">Menu Management</h1>
            <p className="text-sm text-[#166534]">{businessName}</p>
          </div>
          <button type="button" onClick={openNewItem} className={primaryButton}>
            <Plus size={17} />
            Add item
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Your menu</h2>
            <p className="mt-1 text-sm text-[#166534]">
              Add products, set prices and control availability.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {notice && (
          <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {notice}
          </div>
        )}

        {formOpen && (
          <form
            onSubmit={saveItem}
            className="mb-7 rounded-2xl border border-[#D7E2DA] bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-xl font-black">
                {editingId ? 'Edit menu item' : 'New menu item'}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-2 hover:bg-[#F7FAF7]"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Product name *
                <input
                  className={`${inputClass} mt-2`}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Kota special"
                  required
                  maxLength={120}
                />
              </label>

              <label className="text-sm font-semibold">
                Price (R) *
                <input
                  className={`${inputClass} mt-2`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm({ ...form, price: event.target.value })
                  }
                  placeholder="e.g. 45.00"
                  required
                />
              </label>

              <label className="text-sm font-semibold sm:col-span-2">
                Description
                <textarea
                  className={`${inputClass} mt-2`}
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="Describe the product"
                  maxLength={1000}
                />
              </label>

              <label className="text-sm font-semibold sm:col-span-2">
                Image URL (optional)
                <div className="relative mt-2">
                  <ImagePlus
                    size={18}
                    className="absolute left-3 top-3 text-[#166534]"
                  />
                  <input
                    className={`${inputClass} pl-10`}
                    type="url"
                    value={form.image_url}
                    onChange={(event) =>
                      setForm({ ...form, image_url: event.target.value })
                    }
                    placeholder="https://example.com/product.jpg"
                  />
                </div>
              </label>

              {form.image_url && (
                <div className="sm:col-span-2">
                  <p className="mb-2 text-xs font-semibold text-[#166534]">
                    Image preview
                  </p>
                  <img
                    src={form.image_url}
                    alt="Menu item preview"
                    className="h-36 w-36 rounded-xl border border-[#D7E2DA] object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(event) =>
                    setForm({ ...form, is_available: event.target.checked })
                  }
                  className="h-4 w-4 accent-[#166534]"
                />
                Available for customers to order
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className={primaryButton}>
                {saving && <LoaderCircle size={17} className="animate-spin" />}
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add to menu'}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-[#D7E2DA] px-4 py-3 text-sm font-bold hover:bg-[#F7FAF7]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white p-12 text-sm text-[#166534]">
            <LoaderCircle size={20} className="animate-spin" />
            Loading your menu...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbb8a5] bg-white p-10 text-center">
            <ImagePlus size={32} className="mx-auto mb-3 text-[#166534]" />
            <h3 className="text-lg font-black">Your menu is empty</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#166534]">
              Add your first product to start building your online menu.
            </p>
            <button type="button" onClick={openNewItem} className={`${primaryButton} mt-5`}>
              <Plus size={17} />
              Add your first item
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-[#D7E2DA] bg-white shadow-sm"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-[#f0c27c]/20 text-[#166534]">
                    <ImagePlus size={32} />
                  </div>
                )}

                <div className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="font-black">{item.name}</h3>
                    <span className="shrink-0 font-black">
                      {new Intl.NumberFormat('en-ZA', {
                        style: 'currency',
                        currency: 'ZAR',
                      }).format(Number(item.price))}
                    </span>
                  </div>

                  <p className="min-h-10 text-sm leading-5 text-[#166534]">
                    {item.description || 'No description added.'}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleAvailability(item)}
                      className={`rounded-full px-3 py-2 text-xs font-bold ${
                        item.is_available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEditItem(item)}
                        className="rounded-lg p-2 hover:bg-[#F7FAF7]"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteItem(item)}
                        className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

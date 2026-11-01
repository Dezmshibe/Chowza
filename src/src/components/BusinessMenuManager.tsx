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

const IMAGE_BUCKET = 'menu-images';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function BusinessMenuManager({
  businessId,
  businessName,
  onBack,
}: BusinessMenuManagerProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');

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

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function resetImageSelection() {
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview('');
  }

  function openNewItem() {
    setEditingId(null);
    setForm(emptyForm);
    resetImageSelection();
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
    resetImageSelection();
    setNotice('');
    setError('');
    setFormOpen(true);
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setError('');
    setNotice('');

    if (!file) {
      resetImageSelection();
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG, WEBP or GIF image.');
      event.target.value = '';
      resetImageSelection();
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be 5 MB or smaller.');
      event.target.value = '';
      resetImageSelection();
      return;
    }

    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File): Promise<string | null> {
    setUploadingImage(true);

    try {
      const extension =
        file.name.split('.').pop()?.toLowerCase() ||
        (file.type === 'image/png'
          ? 'png'
          : file.type === 'image/webp'
            ? 'webp'
            : file.type === 'image/gif'
              ? 'gif'
              : 'jpg');

      const filePath = `${businessId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        setError(
          `Photo upload failed: ${uploadError.message}. Make sure the "${IMAGE_BUCKET}" Supabase Storage bucket exists and its upload policy allows this business to upload images.`
        );
        return null;
      }

      const { data } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        setError('The photo uploaded, but Chowza could not create its public URL.');
        return null;
      }

      return data.publicUrl;
    } finally {
      setUploadingImage(false);
    }
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

    let imageUrl = form.image_url.trim() || null;

    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);

      if (!uploadedUrl) {
        setSaving(false);
        return;
      }

      imageUrl = uploadedUrl;
    }

    const payload = {
      business_id: businessId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price,
      image_url: imageUrl,
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
    resetImageSelection();
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
          ? { ...entry, is_available: !item.is_available }
          : entry
      )
    );
  }

  const currentImage = imagePreview || form.image_url;

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#166534]">
      <header className="border-b border-[#D7E2DA] bg-white">
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

          <button
            type="button"
            onClick={openNewItem}
            className={primaryButton}
          >
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
              Add products, set prices, upload photos and control availability.
            </p>
          </div>

          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
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
                onClick={() => {
                  setFormOpen(false);
                  resetImageSelection();
                }}
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

              <div className="sm:col-span-2">
                <p className="text-sm font-semibold">Product photo</p>

                <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#B8C9BC] bg-[#F7FAF7] p-4 hover:bg-[#F7FAF7]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#22C55E]/30 text-[#166534]">
                    <ImagePlus size={21} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      {imageFile ? imageFile.name : 'Choose a photo'}
                    </p>
                    <p className="mt-1 text-xs text-[#166534]">
                      JPG, PNG, WEBP or GIF · maximum 5 MB
                    </p>
                  </div>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>

                {currentImage && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-[#166534]">
                      Image preview
                    </p>

                    <div className="relative h-44 w-44 overflow-hidden rounded-xl border border-[#D7E2DA] bg-[#F7FAF7]">
                      <img
                        src={currentImage}
                        alt="Menu item preview"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

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
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className={primaryButton}
              >
                {(saving || uploadingImage) && (
                  <LoaderCircle size={17} className="animate-spin" />
                )}

                {uploadingImage
                  ? 'Uploading photo...'
                  : saving
                    ? 'Saving...'
                    : editingId
                      ? 'Save changes'
                      : 'Add to menu'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  resetImageSelection();
                }}
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
          <div className="rounded-2xl border border-dashed border-[#B8C9BC] bg-white p-10 text-center">
            <ImagePlus size={32} className="mx-auto mb-3 text-[#166534]" />
            <h3 className="text-lg font-black">Your menu is empty</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#166534]">
              Add your first product, price, description and photo to start
              building your online menu.
            </p>

            <button
              type="button"
              onClick={openNewItem}
              className={`${primaryButton} mt-5`}
            >
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
                  <div className="flex h-44 items-center justify-center bg-[#22C55E]/20 text-[#166534]">
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

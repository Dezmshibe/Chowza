
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  EyeOff,
  LoaderCircle,
  Save,
  Store,
} from 'lucide-react';
import { supabase } from '../lib/supabase';


type StorefrontBusiness = {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
};

type BusinessStorefrontManagerProps = {
  businessId: string;
  onBack: () => void;
};

export function BusinessStorefrontManager({
  businessId,
  onBack,
}: BusinessStorefrontManagerProps) {
  const [business, setBusiness] =
    useState<StorefrontBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadStorefront() {
      setLoading(true);
      setError('');

      const { data, error: loadError } = await supabase
        .from('businesses')
        .select('id, name, slug, is_published')
        .eq('id', businessId)
        .maybeSingle();

      if (!mounted) return;

      if (loadError) {
        setError(loadError.message);
      } else if (!data) {
        setError('Your storefront could not be found.');
      } else {
        setBusiness(data as StorefrontBusiness);
      }

      setLoading(false);
    }

    void loadStorefront();

    return () => {
      mounted = false;
    };
  }, [businessId]);

  async function updatePublishingStatus() {
    if (!business || saving) return;

    const nextStatus = !business.is_published;

    setSaving(true);
    setError('');
    setMessage('');

    const { data, error: updateError } = await supabase
      .from('businesses')
      .update({
        is_published: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', business.id)
      .select('id, name, slug, is_published')
      .maybeSingle();

    if (updateError) {
      setError(updateError.message);
    } else if (!data) {
      setError(
        'No changes were saved. Please check that you are logged in as the business owner.'
      );
    } else {
      setBusiness(data as StorefrontBusiness);
      setMessage(
        nextStatus
          ? 'Your store is now marked as published.'
          : 'Your store is now marked as unpublished.'
      );
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7efe5] p-6">
        <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
          <LoaderCircle className="animate-spin text-[#70452e]" size={32} />
          <span className="ml-3 text-sm text-[#70452e]">
            Loading storefront settings...
          </span>
        </div>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="min-h-screen bg-[#f7efe5] p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#d9c9b8] bg-white p-6">
          <p className="mb-4 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-[#d9c9b8] px-4 py-3 font-semibold"
          >
            <ArrowLeft size={17} />
            Back to business tools
          </button>
        </div>
      </div>
    );
  }

  if (!business) return null;

  return (
    <div className="min-h-screen bg-[#f7efe5] px-5 py-7 text-[#2f160d]">
      <main className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 rounded-xl border border-[#d9c9b8] bg-white px-4 py-3 text-sm font-semibold hover:bg-[#f0c27c]/20"
        >
          <ArrowLeft size={17} />
          Back to business tools
        </button>

        <section className="rounded-2xl border border-[#d9c9b8] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0c27c]/30 text-[#70452e]">
              <Store size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#70452e]">
                Storefront settings
              </p>
              <h1 className="text-2xl font-black">{business.name}</h1>
            </div>
          </div>

          <div className="rounded-xl border border-[#d9c9b8] bg-[#f7efe5] p-5">
            <div className="flex items-center gap-3">
              {business.is_published ? (
                <Eye size={22} className="text-green-700" />
              ) : (
                <EyeOff size={22} className="text-[#70452e]" />
              )}

              <div>
                <h2 className="font-bold">
                  {business.is_published
                    ? 'Store marked as published'
                    : 'Store is unpublished'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#70452e]">
                  {business.is_published
                    ? 'Your business is marked as visible to customers. The public store page must also be correctly connected.'
                    : 'Your business is marked as hidden from public store listings that respect this setting.'}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800"
            >
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={() => void updatePublishingStatus()}
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f160d] px-5 py-4 font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving
              ? 'Saving...'
              : business.is_published
                ? 'Unpublish store'
                : 'Publish store'}
          </button>

          <a
            href={`/business/${business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-[#d9c9b8] px-5 py-4 font-semibold hover:bg-[#f7efe5]"
          >
            <ExternalLink size={18} />
            Open public store
          </a>

          <p className="mt-5 text-xs leading-5 text-[#70452e]">
            Publishing changes the is_published setting in your business
            record. Your public store page must be connected correctly for
            customers to see the intended store.
          </p>
        </section>
      </main>
    </div>
  );
}

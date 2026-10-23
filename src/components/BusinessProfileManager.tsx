import { useEffect, useState } from 'react';
import { ArrowLeft, LoaderCircle, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

type BusinessProfile = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  public_phone: string | null;
  whatsapp_number: string | null;
  public_address: string | null;
};

type BusinessProfileManagerProps = {
  businessId: string;
  onBack: () => void;
};

export function BusinessProfileManager({
  businessId,
  onBack,
}: BusinessProfileManagerProps) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError('');

      const { data, error: loadError } = await supabase
        .from('businesses')
        .select(
          'id, name, slug, description, public_phone, whatsapp_number, public_address'
        )
        .eq('id', businessId)
        .maybeSingle();

      if (!mounted) return;

      if (loadError) {
        setError(loadError.message);
      } else if (!data) {
        setError('Business profile could not be found.');
      } else {
        setProfile(data as BusinessProfile);
      }

      setLoading(false);
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [businessId]);

  function updateField(
    field: keyof Omit<BusinessProfile, 'id' | 'slug'>,
    value: string
  ) {
    setProfile((current) =>
      current ? { ...current, [field]: value } : current
    );
    setSuccess('');
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    if (!profile.name.trim()) {
      setError('Please enter your business name.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const { data, error: saveError } = await supabase
      .from('businesses')
      .update({
        name: profile.name.trim(),
        description: profile.description?.trim() || null,
        public_phone: profile.public_phone?.trim() || null,
        whatsapp_number: profile.whatsapp_number?.trim() || null,
        public_address: profile.public_address?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select(
        'id, name, slug, description, public_phone, whatsapp_number, public_address'
      )
      .maybeSingle();

    if (saveError) {
      setError(saveError.message);
    } else if (!data) {
      setError(
        'The profile was not updated. Check that you are logged in as its owner.'
      );
    } else {
      setProfile(data as BusinessProfile);
      setSuccess('Your business profile has been saved.');
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7efe5] p-6">
        <LoaderCircle className="animate-spin text-[#70452e]" size={30} />
        <span className="ml-3 text-sm text-[#70452e]">
          Loading business profile...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7efe5] px-5 py-8 text-[#2f160d]">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-[#d9c9b8] bg-white px-4 py-3 text-sm font-semibold hover:bg-[#f0e4d7]"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>

        <div className="rounded-2xl border border-[#d9c9b8] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#70452e]">
            Chowza for Business
          </p>

          <h1 className="mt-2 text-3xl font-black">Business profile</h1>

          <p className="mt-2 text-sm leading-6 text-[#70452e]">
            Keep your business details up to date for your customers.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              {success}
            </div>
          )}

          {profile && (
            <form onSubmit={handleSave} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="business-name"
                  className="mb-2 block text-sm font-semibold"
                >
                  Business name *
                </label>
                <input
                  id="business-name"
                  required
                  maxLength={100}
                  value={profile.name}
                  onChange={(event) =>
                    updateField('name', event.target.value)
                  }
                  className="w-full rounded-xl border border-[#d9c9b8] px-4 py-3 outline-none focus:border-[#d99a4b]"
                />
              </div>

              <div>
                <label
                  htmlFor="business-description"
                  className="mb-2 block text-sm font-semibold"
                >
                  Business description
                </label>
                <textarea
                  id="business-description"
                  rows={4}
                  maxLength={1000}
                  value={profile.description ?? ''}
                  onChange={(event) =>
                    updateField('description', event.target.value)
                  }
                  placeholder="Tell customers what your business offers"
                  className="w-full rounded-xl border border-[#d9c9b8] px-4 py-3 outline-none focus:border-[#d99a4b]"
                />
              </div>

              <div>
                <label
                  htmlFor="public-phone"
                  className="mb-2 block text-sm font-semibold"
                >
                  Public phone number
                </label>
                <input
                  id="public-phone"
                  type="tel"
                  maxLength={30}
                  value={profile.public_phone ?? ''}
                  onChange={(event) =>
                    updateField('public_phone', event.target.value)
                  }
                  placeholder="e.g. 071 234 5678"
                  className="w-full rounded-xl border border-[#d9c9b8] px-4 py-3 outline-none focus:border-[#d99a4b]"
                />
              </div>

              <div>
                <label
                  htmlFor="whatsapp-number"
                  className="mb-2 block text-sm font-semibold"
                >
                  WhatsApp number
                </label>
                <input
                  id="whatsapp-number"
                  type="tel"
                  maxLength={30}
                  value={profile.whatsapp_number ?? ''}
                  onChange={(event) =>
                    updateField('whatsapp_number', event.target.value)
                  }
                  placeholder="Number customers can use on WhatsApp"
                  className="w-full rounded-xl border border-[#d9c9b8] px-4 py-3 outline-none focus:border-[#d99a4b]"
                />
              </div>

              <div>
                <label
                  htmlFor="public-address"
                  className="mb-2 block text-sm font-semibold"
                >
                  Business address
                </label>
                <textarea
                  id="public-address"
                  rows={3}
                  maxLength={500}
                  value={profile.public_address ?? ''}
                  onChange={(event) =>
                    updateField('public_address', event.target.value)
                  }
                  placeholder="Your shop or collection address"
                  className="w-full rounded-xl border border-[#d9c9b8] px-4 py-3 outline-none focus:border-[#d99a4b]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f160d] px-5 py-3 font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
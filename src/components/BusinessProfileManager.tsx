import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Phone,
  Save,
  Trash2,
  Upload,
  UserRound,
  XCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type BusinessProfile = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  public_phone: string | null;
  whatsapp_number: string | null;
  public_address: string | null;
};

type BusinessProfileManagerProps = {
  businessId: string;
  onBack: () => void;
};

const MAX_LOGO_SIZE = 5 * 1024 * 1024;

const ALLOWED_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export function BusinessProfileManager({
  businessId,
  onBack,
}: BusinessProfileManagerProps) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      setError('');

      const { data, error: loadError } = await supabase
        .from('businesses')
        .select(
          'id, name, slug, description, logo_url, public_phone, whatsapp_number, public_address'
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
    field: keyof Omit<BusinessProfile, 'id' | 'slug' | 'logo_url'>,
    value: string
  ) {
    setProfile((current) =>
      current ? { ...current, [field]: value } : current
    );

    setSuccess('');
    setError('');
  }

  async function handleLogoUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file || !profile) {
      return;
    }

    setError('');
    setSuccess('');

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setError('Logo must be smaller than 5 MB.');
      return;
    }

    setUploadingLogo(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const extension =
        file.type === 'image/png'
          ? 'png'
          : file.type === 'image/webp'
            ? 'webp'
            : 'jpg';

      const filePath = `${user.id}/${businessId}/logo.${extension}`;

      const existingFiles = await supabase.storage
        .from('business-logos')
        .list(`${user.id}/${businessId}`);

      if (existingFiles.error) {
        throw existingFiles.error;
      }

      const filesToRemove =
        existingFiles.data
          ?.filter((item) => item.name.startsWith('logo.'))
          .map((item) => `${user.id}/${businessId}/${item.name}`) ?? [];

      if (filesToRemove.length > 0) {
        const { error: removeError } = await supabase.storage
          .from('business-logos')
          .remove(filesToRemove);

        if (removeError) {
          throw removeError;
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from('business-logos')
        .getPublicUrl(filePath);

      const logoUrl = `${publicUrl}?v=${Date.now()}`;

      const { data: updatedBusiness, error: updateError } =
        await supabase
          .from('businesses')
          .update({
            logo_url: logoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', businessId)
          .select(
            'id, name, slug, description, logo_url, public_phone, whatsapp_number, public_address'
          )
          .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!updatedBusiness) {
        throw new Error(
          'The logo uploaded, but the business profile could not be updated.'
        );
      }

      setProfile(updatedBusiness as BusinessProfile);
      setSuccess('Your business logo has been updated.');
    } catch (err) {
      console.error('[Chowza] Logo upload error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Could not upload your logo. Please try again.'
      );
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    if (!profile) return;

    setError('');
    setSuccess('');
    setRemovingLogo(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const existingFiles = await supabase.storage
        .from('business-logos')
        .list(`${user.id}/${businessId}`);

      if (existingFiles.error) {
        throw existingFiles.error;
      }

      const filesToRemove =
        existingFiles.data
          ?.filter((item) => item.name.startsWith('logo.'))
          .map((item) => `${user.id}/${businessId}/${item.name}`) ?? [];

      if (filesToRemove.length > 0) {
        const { error: removeError } = await supabase.storage
          .from('business-logos')
          .remove(filesToRemove);

        if (removeError) {
          throw removeError;
        }
      }

      const { data: updatedBusiness, error: updateError } =
        await supabase
          .from('businesses')
          .update({
            logo_url: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', businessId)
          .select(
            'id, name, slug, description, logo_url, public_phone, whatsapp_number, public_address'
          )
          .maybeSingle();

      if (updateError) {
        throw updateError;
      }

      if (!updatedBusiness) {
        throw new Error(
          'The logo was removed from storage, but the business profile could not be updated.'
        );
      }

      setProfile(updatedBusiness as BusinessProfile);
      setSuccess('Your business logo has been removed.');
    } catch (err) {
      console.error('[Chowza] Logo removal error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Could not remove your logo. Please try again.'
      );
    } finally {
      setRemovingLogo(false);
    }
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
        'id, name, slug, description, logo_url, public_phone, whatsapp_number, public_address'
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
      <div className="flex min-h-screen items-center justify-center bg-[#f6f1eb] p-6">
        <div className="flex flex-col items-center rounded-3xl border border-[#e2d6c8] bg-white px-10 py-9 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7efe5]">
            <LoaderCircle
              className="animate-spin text-[#70452e]"
              size={24}
            />
          </div>

          <p className="text-sm font-bold text-[#2f160d]">
            Loading business profile
          </p>

          <p className="mt-1 text-xs text-[#8a7b6c]">
            Please wait a moment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f1eb] px-4 py-6 text-[#2f160d] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-[#ddd0c1] bg-white px-3.5 py-2.5 text-sm font-bold text-[#70452e] shadow-sm transition hover:bg-[#f8f2eb]"
            >
              <ArrowLeft size={17} />
              Back to dashboard
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2f160d] text-white shadow-sm">
                <Building2 size={21} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a16a3b]">
                  Chowza for Business
                </p>

                <h1 className="mt-0.5 text-2xl font-black tracking-tight sm:text-3xl">
                  Business profile
                </h1>
              </div>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#78695d]">
              Manage the information customers see when they discover your
              business on Chowza.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-[#e2d6c8] bg-white px-4 py-3 shadow-sm sm:block">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-bold text-[#66574c]">
                Profile settings
              </span>
            </div>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <XCircle className="mt-0.5 shrink-0" size={19} />
            <div>
              <p className="font-black">Something went wrong</p>
              <p className="mt-1 leading-5">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
            <div>
              <p className="font-black">Changes saved</p>
              <p className="mt-1 leading-5">{success}</p>
            </div>
          </div>
        )}

        {profile && (
          <form onSubmit={handleSave}>
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              {/* LEFT COLUMN */}
              <div className="space-y-6">
                {/* BRAND CARD */}
                <section className="overflow-hidden rounded-3xl border border-[#e2d6c8] bg-white shadow-sm">
                  <div className="border-b border-[#eee5dc] px-6 py-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#a16a3b]">
                      Brand identity
                    </p>

                    <h2 className="mt-1 text-lg font-black">
                      Business logo
                    </h2>

                    <p className="mt-1 text-sm leading-5 text-[#837469]">
                      Your logo helps customers recognise your business.
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-center">
                      <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border border-[#ded2c5] bg-[#faf7f2] shadow-inner">
                        {profile.logo_url ? (
                          <img
                            src={profile.logo_url}
                            alt={`${profile.name} logo`}
                            className="h-full w-full object-contain p-3"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                              <ImageIcon
                                size={27}
                                className="text-[#b6a797]"
                              />
                            </div>

                            <span className="mt-3 text-xs font-bold text-[#9a897a]">
                              No logo yet
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <h3 className="font-black text-[#2f160d]">
                        {profile.logo_url
                          ? 'Your business logo'
                          : 'Add your business logo'}
                      </h3>

                      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#8a7b6c]">
                        Use a clear image that represents your business well.
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />

                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={uploadingLogo || removingLogo}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f160d] px-4 py-3 text-sm font-black text-white transition hover:bg-[#43261b] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploadingLogo ? (
                          <LoaderCircle
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Upload size={17} />
                        )}

                        {uploadingLogo
                          ? 'Uploading...'
                          : profile.logo_url
                            ? 'Change logo'
                            : 'Upload logo'}
                      </button>

                      {profile.logo_url && (
                        <button
                          type="button"
                          disabled={uploadingLogo || removingLogo}
                          onClick={handleRemoveLogo}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {removingLogo ? (
                            <LoaderCircle
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={17} />
                          )}

                          {removingLogo ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl bg-[#faf7f2] px-4 py-3 text-center">
                      <p className="text-[11px] font-bold text-[#8a7b6c]">
                        JPG, PNG or WebP · Maximum 5 MB
                      </p>
                    </div>
                  </div>
                </section>

                {/* PROFILE TIP */}
                <div className="rounded-3xl border border-[#e2d6c8] bg-[#2f160d] p-6 text-white shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <UserRound size={19} />
                  </div>

                  <h3 className="mt-4 font-black">
                    Keep your profile fresh
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#e5d7ca]">
                    Accurate contact details and a clear description make it
                    easier for customers to trust and contact your business.
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                {/* BUSINESS INFORMATION */}
                <section className="rounded-3xl border border-[#e2d6c8] bg-white shadow-sm">
                  <div className="border-b border-[#eee5dc] px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7efe5] text-[#70452e]">
                        <Building2 size={19} />
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#a16a3b]">
                          Business information
                        </p>

                        <h2 className="mt-0.5 text-lg font-black">
                          Tell customers about you
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <div>
                      <label
                        htmlFor="business-name"
                        className="mb-2 block text-sm font-black"
                      >
                        Business name
                        <span className="ml-1 text-[#c26b45]">*</span>
                      </label>

                      <input
                        id="business-name"
                        required
                        maxLength={100}
                        value={profile.name}
                        onChange={(event) =>
                          updateField('name', event.target.value)
                        }
                        placeholder="e.g. Sbuda Kitchen"
                        className="w-full rounded-xl border border-[#d9c9b8] bg-[#fffdfb] px-4 py-3.5 text-sm font-medium outline-none transition placeholder:text-[#b3a69b] focus:border-[#c98b4a] focus:ring-4 focus:ring-[#c98b4a]/10"
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label
                          htmlFor="business-description"
                          className="block text-sm font-black"
                        >
                          Business description
                        </label>

                        <span className="text-[11px] font-semibold text-[#a09287]">
                          {profile.description?.length ?? 0}/1000
                        </span>
                      </div>

                      <textarea
                        id="business-description"
                        rows={5}
                        maxLength={1000}
                        value={profile.description ?? ''}
                        onChange={(event) =>
                          updateField(
                            'description',
                            event.target.value
                          )
                        }
                        placeholder="Tell customers what your business offers, what makes you special, or what type of food you serve."
                        className="w-full resize-none rounded-xl border border-[#d9c9b8] bg-[#fffdfb] px-4 py-3.5 text-sm font-medium leading-6 outline-none transition placeholder:text-[#b3a69b] focus:border-[#c98b4a] focus:ring-4 focus:ring-[#c98b4a]/10"
                      />
                    </div>
                  </div>
                </section>

                {/* CONTACT */}
                <section className="rounded-3xl border border-[#e2d6c8] bg-white shadow-sm">
                  <div className="border-b border-[#eee5dc] px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7efe5] text-[#70452e]">
                        <Phone size={19} />
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#a16a3b]">
                          Contact details
                        </p>

                        <h2 className="mt-0.5 text-lg font-black">
                          How customers reach you
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 p-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="public-phone"
                        className="mb-2 block text-sm font-black"
                      >
                        Public phone number
                      </label>

                      <input
                        id="public-phone"
                        type="tel"
                        maxLength={30}
                        value={profile.public_phone ?? ''}
                        onChange={(event) =>
                          updateField(
                            'public_phone',
                            event.target.value
                          )
                        }
                        placeholder="071 234 5678"
                        className="w-full rounded-xl border border-[#d9c9b8] bg-[#fffdfb] px-4 py-3.5 text-sm font-medium outline-none transition placeholder:text-[#b3a69b] focus:border-[#c98b4a] focus:ring-4 focus:ring-[#c98b4a]/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="whatsapp-number"
                        className="mb-2 block text-sm font-black"
                      >
                        WhatsApp number
                      </label>

                      <input
                        id="whatsapp-number"
                        type="tel"
                        maxLength={30}
                        value={profile.whatsapp_number ?? ''}
                        onChange={(event) =>
                          updateField(
                            'whatsapp_number',
                            event.target.value
                          )
                        }
                        placeholder="Number customers can use"
                        className="w-full rounded-xl border border-[#d9c9b8] bg-[#fffdfb] px-4 py-3.5 text-sm font-medium outline-none transition placeholder:text-[#b3a69b] focus:border-[#c98b4a] focus:ring-4 focus:ring-[#c98b4a]/10"
                      />
                    </div>
                  </div>
                </section>

                {/* LOCATION */}
                <section className="rounded-3xl border border-[#e2d6c8] bg-white shadow-sm">
                  <div className="border-b border-[#eee5dc] px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7efe5] text-[#70452e]">
                        <MapPin size={19} />
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#a16a3b]">
                          Location
                        </p>

                        <h2 className="mt-0.5 text-lg font-black">
                          Where customers can find you
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <label
                      htmlFor="public-address"
                      className="mb-2 block text-sm font-black"
                    >
                      Business address
                    </label>

                    <textarea
                      id="public-address"
                      rows={3}
                      maxLength={500}
                      value={profile.public_address ?? ''}
                      onChange={(event) =>
                        updateField(
                          'public_address',
                          event.target.value
                        )
                      }
                      placeholder="e.g. 123 Main Street, Johannesburg"
                      className="w-full resize-none rounded-xl border border-[#d9c9b8] bg-[#fffdfb] px-4 py-3.5 text-sm font-medium leading-6 outline-none transition placeholder:text-[#b3a69b] focus:border-[#c98b4a] focus:ring-4 focus:ring-[#c98b4a]/10"
                    />

                    <p className="mt-2 text-xs leading-5 text-[#8a7b6c]">
                      This address may be shown to customers on your public
                      business page.
                    </p>
                  </div>
                </section>

                {/* SAVE */}
                <div className="sticky bottom-4 z-10 rounded-2xl border border-[#ded2c5] bg-white/95 p-3 shadow-xl backdrop-blur">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="px-2">
                      <p className="text-sm font-black text-[#2f160d]">
                        Ready to save?
                      </p>

                      <p className="text-xs text-[#8a7b6c]">
                        Your changes will update your Chowza storefront.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f160d] px-6 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-[#43261b] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <LoaderCircle
                          className="animate-spin"
                          size={18}
                        />
                      ) : (
                        <Save size={18} />
                      )}

                      {saving ? 'Saving changes...' : 'Save changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
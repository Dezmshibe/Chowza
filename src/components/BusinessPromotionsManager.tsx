import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Edit3,
  Percent,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Promotion = {
  id: string;
  business_id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_amount: number;
  max_discount_amount: number | null;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

type BusinessPromotionsManagerProps = {
  businessId: string;
  businessName: string;
  onBack: () => void;
};

type FormState = {
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minimumOrderAmount: string;
  maxDiscountAmount: string;
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  code: '',
  name: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minimumOrderAmount: '0',
  maxDiscountAmount: '',
  startsAt: '',
  expiresAt: '',
  usageLimit: '',
  isActive: true,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return 'No expiry';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function toLocalDateTimeValue(value: string | null) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (number: number) => String(number).padStart(2, '0');

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join('T');
}

function toIsoOrNull(value: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export function BusinessPromotionsManager({
  businessId,
  businessName,
  onBack,
}: BusinessPromotionsManagerProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);

  async function loadPromotions() {
    setLoading(true);
    setError('');

    const { data, error: queryError } = await supabase
      .from('promotions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setPromotions([]);
      setLoading(false);
      return;
    }

    setPromotions((data ?? []) as Promotion[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadPromotions();
  }, [businessId]);

  function updateForm<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function startCreate() {
    setSuccess('');
    setError('');
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(promotion: Promotion) {
    setSuccess('');
    setError('');
    setEditingId(promotion.id);

    setForm({
      code: promotion.code,
      name: promotion.name,
      description: promotion.description ?? '',
      discountType: promotion.discount_type,
      discountValue: String(promotion.discount_value),
      minimumOrderAmount: String(promotion.minimum_order_amount),
      maxDiscountAmount:
        promotion.max_discount_amount === null
          ? ''
          : String(promotion.max_discount_amount),
      startsAt: toLocalDateTimeValue(promotion.starts_at),
      expiresAt: toLocalDateTimeValue(promotion.expires_at),
      usageLimit:
        promotion.usage_limit === null
          ? ''
          : String(promotion.usage_limit),
      isActive: promotion.is_active,
    });

    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');

    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    const discountValue = Number(form.discountValue);
    const minimumOrderAmount = Number(form.minimumOrderAmount || 0);
    const maxDiscountAmount =
      form.maxDiscountAmount.trim() === ''
        ? null
        : Number(form.maxDiscountAmount);
    const usageLimit =
      form.usageLimit.trim() === ''
        ? null
        : Number(form.usageLimit);

    if (!code) {
      setError('Enter a promo code.');
      setSaving(false);
      return;
    }

    if (!name) {
      setError('Enter a promotion name.');
      setSaving(false);
      return;
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setError('Discount value must be greater than 0.');
      setSaving(false);
      return;
    }

    if (
      form.discountType === 'percentage' &&
      discountValue > 100
    ) {
      setError('Percentage discounts cannot exceed 100%.');
      setSaving(false);
      return;
    }

    if (
      !Number.isFinite(minimumOrderAmount) ||
      minimumOrderAmount < 0
    ) {
      setError('Minimum order amount cannot be negative.');
      setSaving(false);
      return;
    }

    if (
      maxDiscountAmount !== null &&
      (!Number.isFinite(maxDiscountAmount) ||
        maxDiscountAmount <= 0)
    ) {
      setError('Maximum discount must be greater than 0.');
      setSaving(false);
      return;
    }

    if (
      usageLimit !== null &&
      (!Number.isInteger(usageLimit) || usageLimit <= 0)
    ) {
      setError('Usage limit must be a whole number greater than 0.');
      setSaving(false);
      return;
    }

    const startsAt = toIsoOrNull(form.startsAt);
    const expiresAt = toIsoOrNull(form.expiresAt);

    if (form.startsAt && !startsAt) {
      setError('The start date is invalid.');
      setSaving(false);
      return;
    }

    if (form.expiresAt && !expiresAt) {
      setError('The expiry date is invalid.');
      setSaving(false);
      return;
    }

    if (
      startsAt &&
      expiresAt &&
      new Date(expiresAt) <= new Date(startsAt)
    ) {
      setError('Expiry date must be after the start date.');
      setSaving(false);
      return;
    }

    const payload = {
      business_id: businessId,
      code,
      name,
      description: form.description.trim() || null,
      discount_type: form.discountType,
      discount_value: discountValue,
      minimum_order_amount: minimumOrderAmount,
      max_discount_amount: maxDiscountAmount,
      is_active: form.isActive,
      starts_at: startsAt,
      expires_at: expiresAt,
      usage_limit: usageLimit,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from('promotions')
        .update(payload)
        .eq('id', editingId)
        .eq('business_id', businessId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setSuccess('Promotion updated successfully.');
    } else {
      const { error: insertError } = await supabase
        .from('promotions')
        .insert({
          ...payload,
          usage_count: 0,
        });

      if (insertError) {
        if (
          insertError.message
            .toLowerCase()
            .includes('promotions_business_code_unique')
        ) {
          setError(
            'That promo code already exists for this business.',
          );
        } else {
          setError(insertError.message);
        }

        setSaving(false);
        return;
      }

      setSuccess('Promotion created successfully.');
    }

    resetForm();
    await loadPromotions();
    setSaving(false);
  }

  async function togglePromotion(promotion: Promotion) {
    setError('');
    setSuccess('');

    const { error: updateError } = await supabase
      .from('promotions')
      .update({
        is_active: !promotion.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promotion.id)
      .eq('business_id', businessId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(
      promotion.is_active
        ? 'Promotion deactivated.'
        : 'Promotion activated.',
    );

    await loadPromotions();
  }

  async function deletePromotion(promotion: Promotion) {
    const confirmed = window.confirm(
      `Delete "${promotion.name}" (${promotion.code})? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(promotion.id);
    setError('');
    setSuccess('');

    const { error: deleteError } = await supabase
      .from('promotions')
      .delete()
      .eq('id', promotion.id)
      .eq('business_id', businessId);

    if (deleteError) {
      setError(deleteError.message);
      setDeletingId(null);
      return;
    }

    setSuccess('Promotion deleted.');
    setDeletingId(null);

    await loadPromotions();
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#17201A]">
      <header className="border-b border-[#E1EAE3] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border border-[#D7E2DA] p-2 text-[#17201A] transition hover:bg-[#F7FAF7]"
              aria-label="Back"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#166534]">
                Chowza for Business
              </p>

              <h1 className="text-xl font-black tracking-tight">
                Promotions
              </h1>

              <p className="text-xs text-[#647067]">
                {businessName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadPromotions()}
              disabled={loading}
              className="rounded-xl border border-[#D7E2DA] bg-white p-2.5 text-[#17201A] transition hover:bg-[#F7FAF7] disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={17}
                className={loading ? 'animate-spin' : ''}
              />
            </button>

            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-[#15803D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#14532D]"
            >
              <Plus size={17} />
              New promotion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
        <section className="mb-7 rounded-2xl bg-[#15803D] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#BBF7D0]">
                Customer offers
              </p>

              <h2 className="text-2xl font-black tracking-tight">
                Turn promotions into orders.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                Create discount codes your customers can use when
                ordering from your Chowza store.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#22C55E] text-[#166534]">
              <Tag size={25} />
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            <Check size={17} />
            {success}
          </div>
        )}

        {showForm && (
          <section className="mb-7 rounded-2xl border border-[#D7E2DA] bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#166534]">
                  {editingId ? 'Edit promotion' : 'Create promotion'}
                </p>

                <h2 className="mt-1 text-xl font-black">
                  {editingId
                    ? 'Update your offer'
                    : 'Create a new offer'}
                </h2>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-2 text-[#647067] hover:bg-[#F7FAF7]"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Promo code"
                  hint="Customers enter this code at checkout."
                >
                  <input
                    value={form.code}
                    onChange={(event) =>
                      updateForm(
                        'code',
                        event.target.value.toUpperCase(),
                      )
                    }
                    placeholder="WELCOME10"
                    maxLength={40}
                    className={inputClass}
                  />
                </Field>

                <Field label="Promotion name">
                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateForm('name', event.target.value)
                    }
                    placeholder="10% Welcome Discount"
                    maxLength={100}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Description" optional>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm('description', event.target.value)
                  }
                  placeholder="A short description customers will understand."
                  rows={3}
                  maxLength={500}
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Discount type">
                  <select
                    value={form.discountType}
                    onChange={(event) =>
                      updateForm(
                        'discountType',
                        event.target.value as
                          | 'percentage'
                          | 'fixed',
                      )
                    }
                    className={inputClass}
                  >
                    <option value="percentage">
                      Percentage
                    </option>
                    <option value="fixed">
                      Fixed amount
                    </option>
                  </select>
                </Field>

                <Field
                  label={
                    form.discountType === 'percentage'
                      ? 'Discount percentage'
                      : 'Discount amount'
                  }
                >
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.discountValue}
                      onChange={(event) =>
                        updateForm(
                          'discountValue',
                          event.target.value,
                        )
                      }
                      placeholder={
                        form.discountType === 'percentage'
                          ? '10'
                          : '50'
                      }
                      className={`${inputClass} pr-10`}
                    />

                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#647067]">
                      {form.discountType === 'percentage'
                        ? '%'
                        : 'R'}
                    </span>
                  </div>
                </Field>

                <Field label="Minimum order" optional>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#647067]">
                      R
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.minimumOrderAmount}
                      onChange={(event) =>
                        updateForm(
                          'minimumOrderAmount',
                          event.target.value,
                        )
                      }
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <Field
                  label="Maximum discount"
                  optional
                  hint="Useful for percentage promotions."
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#647067]">
                      R
                    </span>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.maxDiscountAmount}
                      onChange={(event) =>
                        updateForm(
                          'maxDiscountAmount',
                          event.target.value,
                        )
                      }
                      placeholder="100"
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </Field>

                <Field
                  label="Usage limit"
                  optional
                  hint="Leave empty for unlimited uses."
                >
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.usageLimit}
                    onChange={(event) =>
                      updateForm(
                        'usageLimit',
                        event.target.value,
                      )
                    }
                    placeholder="100"
                    className={inputClass}
                  />
                </Field>

                <Field label="Status">
                  <label className="flex h-[46px] cursor-pointer items-center gap-3 rounded-xl border border-[#D7E2DA] px-4">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        updateForm(
                          'isActive',
                          event.target.checked,
                        )
                      }
                      className="h-4 w-4 accent-[#22C55E]"
                    />

                    <span className="text-sm font-semibold">
                      Promotion is active
                    </span>
                  </label>
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Starts" optional>
                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#647067]"
                    />

                    <input
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(event) =>
                        updateForm(
                          'startsAt',
                          event.target.value,
                        )
                      }
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </Field>

                <Field label="Expires" optional>
                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#647067]"
                    />

                    <input
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={(event) =>
                        updateForm(
                          'expiresAt',
                          event.target.value,
                        )
                      }
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </Field>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-[#E1EAE3] pt-5">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-[#D7E2DA] px-5 py-2.5 text-sm font-bold text-[#17201A] hover:bg-[#F7FAF7]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#15803D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#14532D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editingId ? 'Save changes' : 'Create promotion'}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#D7E2DA] bg-white p-12 text-center shadow-sm">
            <RefreshCw
              size={25}
              className="mx-auto mb-3 animate-spin text-[#22C55E]"
            />

            <p className="text-sm font-semibold text-[#647067]">
              Loading promotions...
            </p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#C9D7CE] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#166534]">
              <Percent size={25} />
            </div>

            <h2 className="text-xl font-black">
              No promotions yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#647067]">
              Create your first promotion to give customers a
              reason to order from your store.
            </p>

            <button
              type="button"
              onClick={startCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#15803D] px-5 py-3 text-sm font-bold text-white hover:bg-[#14532D]"
            >
              <Plus size={17} />
              Create your first promotion
            </button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {promotions.map((promotion) => (
              <article
                key={promotion.id}
                className="rounded-2xl border border-[#D7E2DA] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#166534]">
                      <Tag size={20} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">
                          {promotion.name}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
                            promotion.is_active
                              ? 'bg-[#DCFCE7] text-[#166534]'
                              : 'bg-[#F1F5F2] text-[#647067]'
                          }`}
                        >
                          {promotion.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </div>

                      <p className="mt-1 font-mono text-sm font-bold text-[#166534]">
                        {promotion.code}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(promotion)}
                      className="rounded-lg p-2 text-[#647067] hover:bg-[#F7FAF7] hover:text-[#166534]"
                      title="Edit"
                    >
                      <Edit3 size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void deletePromotion(promotion)
                      }
                      disabled={deletingId === promotion.id}
                      className="rounded-lg p-2 text-[#647067] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === promotion.id ? (
                        <RefreshCw
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  </div>
                </div>

                {promotion.description && (
                  <p className="mt-4 text-sm leading-6 text-[#647067]">
                    {promotion.description}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <InfoBox
                    label="Discount"
                    value={
                      promotion.discount_type === 'percentage'
                        ? `${promotion.discount_value}% off`
                        : `${formatCurrency(
                            promotion.discount_value,
                          )} off`
                    }
                  />

                  <InfoBox
                    label="Minimum order"
                    value={
                      promotion.minimum_order_amount > 0
                        ? formatCurrency(
                            promotion.minimum_order_amount,
                          )
                        : 'No minimum'
                    }
                  />

                  <InfoBox
                    label="Usage"
                    value={
                      promotion.usage_limit === null
                        ? `${promotion.usage_count} used`
                        : `${promotion.usage_count} / ${promotion.usage_limit}`
                    }
                  />

                  <InfoBox
                    label="Expiry"
                    value={formatDate(promotion.expires_at)}
                  />
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#E1EAE3] pt-4">
                  <div className="text-xs text-[#647067]">
                    {promotion.starts_at
                      ? `Starts ${formatDate(
                          promotion.starts_at,
                        )}`
                      : 'Available immediately'}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void togglePromotion(promotion)
                    }
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                      promotion.is_active
                        ? 'bg-[#F1F5F2] text-[#647067] hover:bg-[#E8EEE9]'
                        : 'bg-[#DCFCE7] text-[#166534] hover:bg-[#BBF7D0]'
                    }`}
                  >
                    {promotion.is_active ? (
                      <>
                        <X size={14} />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        Activate
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  hint,
  optional = false,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-[#17201A]">
          {label}
          {optional && (
            <span className="ml-1 font-normal text-[#9CA89F]">
              (optional)
            </span>
          )}
        </span>

        {hint && (
          <span className="text-right text-[11px] text-[#9CA89F]">
            {hint}
          </span>
        )}
      </div>

      {children}
    </label>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#F7FAF7] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA89F]">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-[#17201A]">
        {value}
      </p>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-[#D7E2DA] bg-white px-3.5 py-3 text-sm text-[#17201A] outline-none transition placeholder:text-[#A3ADA6] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/15';
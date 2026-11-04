import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Truck,
  Building2,
  CreditCard,
  CheckCircle2,
  Power,
  ShieldCheck,
  AlertCircle,
  Tag,
  Percent
} from 'lucide-react';
import { Business, Promotion } from '../types';

export const BusinessSettings: React.FC = () => {
  const { ownerBusiness, updateBusiness, toggleBusinessOpen, addFlash } = useApp();

  const [formData, setFormData] = useState<Business>({ ...ownerBusiness });
  const [isSaved, setIsSaved] = useState(false);
  const [promotionForm, setPromotionForm] = useState<Promotion>(() => ({
    id: ownerBusiness.promotion?.id || Date.now(),
    businessId: ownerBusiness.id,
    code: ownerBusiness.promotion?.code || '',
    discountPercent: ownerBusiness.promotion?.discountPercent,
    discountAmount: ownerBusiness.promotion?.discountAmount,
    minOrderAmount: ownerBusiness.promotion?.minOrderAmount,
    description: ownerBusiness.promotion?.description || '',
    active: ownerBusiness.promotion?.active ?? false
  }));

  useEffect(() => {
    setFormData({ ...ownerBusiness });
    setPromotionForm({
      id: ownerBusiness.promotion?.id || Date.now(),
      businessId: ownerBusiness.id,
      code: ownerBusiness.promotion?.code || '',
      discountPercent: ownerBusiness.promotion?.discountPercent,
      discountAmount: ownerBusiness.promotion?.discountAmount,
      minOrderAmount: ownerBusiness.promotion?.minOrderAmount,
      description: ownerBusiness.promotion?.description || '',
      active: ownerBusiness.promotion?.active ?? false
    });
  }, [ownerBusiness.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'deliveryFee' || name === 'deliveryRadiusKm') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const code = promotionForm.code.trim().toUpperCase();
    const hasPromotionDetails = Boolean(code) || Boolean(promotionForm.description.trim());

    if (promotionForm.active && (!code || ((!promotionForm.discountPercent || promotionForm.discountPercent <= 0) && (!promotionForm.discountAmount || promotionForm.discountAmount <= 0)))) {
      addFlash('error', 'Enable a promo only after entering a code and a discount value.');
      return;
    }

    if (promotionForm.discountPercent && (promotionForm.discountPercent < 0 || promotionForm.discountPercent > 100)) {
      addFlash('error', 'Percentage discount must be between 0% and 100%.');
      return;
    }

    const promotion: Promotion | undefined = hasPromotionDetails
      ? {
          ...promotionForm,
          id: promotionForm.id || Date.now(),
          businessId: ownerBusiness.id,
          code,
          discountPercent: promotionForm.discountPercent && promotionForm.discountPercent > 0 ? promotionForm.discountPercent : undefined,
          discountAmount: promotionForm.discountAmount && promotionForm.discountAmount > 0 ? promotionForm.discountAmount : undefined,
          minOrderAmount: promotionForm.minOrderAmount && promotionForm.minOrderAmount > 0 ? promotionForm.minOrderAmount : undefined,
          description: promotionForm.description.trim() || `Use promo code ${code}`,
        }
      : undefined;

    updateBusiness({ ...formData, promotion });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#17201A]/10">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#17201A] tracking-tight">
            Store Settings
          </h1>
          <p className="text-xs text-[#647067] mt-1">
            Configure contact information, delivery fees, banking details and Yoco payment credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            toggleBusinessOpen(ownerBusiness.id);
            setFormData((prev) => ({ ...prev, isOpen: !prev.isOpen }));
          }}
          className={`btn btn-sm font-bold shadow-xs flex items-center gap-2 ${
            formData.isOpen
              ? 'bg-[#E4F9EC] text-[#166534] border border-[#22C55E]/40'
              : 'bg-[#FBE6E4] text-[#EF4444] border border-[#EF4444]/40'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>Status: {formData.isOpen ? 'OPEN' : 'CLOSED'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="stack">
        {/* Basic Business Details */}
        <div className="card space-y-4">
          <h2 className="text-base font-bold text-[#17201A] flex items-center gap-2">
            <Store className="w-5 h-5 text-[#15803D]" />
            <span>Store Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="biz-name">Business Name *</label>
              <input
                id="biz-name"
                name="businessName"
                type="text"
                required
                value={formData.businessName}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="biz-cat">Category *</label>
              <input
                id="biz-cat"
                name="category"
                type="text"
                required
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Township Cuisine & Kotas"
              />
            </div>

            <div className="field">
              <label htmlFor="owner-name">Owner / Manager Name *</label>
              <input
                id="owner-name"
                name="ownerName"
                type="text"
                required
                value={formData.ownerName}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="biz-whatsapp">WhatsApp Number (with country code 27...) *</label>
              <input
                id="biz-whatsapp"
                name="whatsappNumber"
                type="tel"
                required
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="27821234567"
              />
            </div>

            <div className="field">
              <label htmlFor="biz-email">Contact Email</label>
              <input
                id="biz-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="biz-slug">Web Link Slug</label>
              <input
                id="biz-slug"
                name="slug"
                type="text"
                required
                value={formData.slug}
                onChange={handleChange}
              />
              <p className="help">Link: /business/{formData.slug}</p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="biz-address">Physical Street Address *</label>
            <input
              id="biz-address"
              name="address"
              type="text"
              required
              value={formData.address}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="card space-y-4">
          <h2 className="text-base font-bold text-[#17201A] flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#22C55E]" />
            <span>Delivery Radius & Fees</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="field">
              <label htmlFor="del-fee">Delivery Fee (ZAR R)</label>
              <input
                id="del-fee"
                name="deliveryFee"
                type="number"
                step="1"
                min="0"
                value={formData.deliveryFee}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="del-rad">Delivery Radius (km)</label>
              <input
                id="del-rad"
                name="deliveryRadiusKm"
                type="number"
                step="0.5"
                min="1"
                value={formData.deliveryRadiusKm}
                onChange={handleChange}
              />
            </div>

            <div className="field flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                <input
                  type="checkbox"
                  name="deliveryAvailable"
                  checked={formData.deliveryAvailable}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-[#22C55E]"
                />
                <span>Offer Delivery Service</span>
              </label>
            </div>
          </div>
        </div>

        {/* Banking Details (EFT) */}
        <div className="card space-y-4">
          <h2 className="text-base font-bold text-[#17201A] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#22C55E]" />
            <span>Bank Account for Instant EFT</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="bank-name">Bank Name</label>
              <input
                id="bank-name"
                name="bankName"
                type="text"
                value={formData.bankName || ''}
                onChange={handleChange}
                placeholder="e.g. FNB, Standard Bank, Capitec"
              />
            </div>

            <div className="field">
              <label htmlFor="bank-holder">Account Holder</label>
              <input
                id="bank-holder"
                name="accountHolder"
                type="text"
                value={formData.accountHolder || ''}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="bank-num">Account Number</label>
              <input
                id="bank-num"
                name="accountNumber"
                type="text"
                value={formData.accountNumber || ''}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="bank-branch">Branch Code</label>
              <input
                id="bank-branch"
                name="branchCode"
                type="text"
                value={formData.branchCode || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="bank-instruct">Payment Instructions for Customer</label>
            <input
              id="bank-instruct"
              name="paymentInstructions"
              type="text"
              value={formData.paymentInstructions || ''}
              onChange={handleChange}
              placeholder="e.g. Use Order Number as payment reference and send proof via WhatsApp"
            />
          </div>
        </div>

        {/* Yoco Payment Gateway */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#17201A] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#0284C7]" />
              <span>Yoco Online Card Payments</span>
            </h2>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
              <input
                type="checkbox"
                name="yocoEnabled"
                checked={formData.yocoEnabled}
                onChange={handleChange}
                className="w-4 h-4 rounded text-[#0284C7]"
              />
              <span>Enable Yoco Checkout</span>
            </label>
          </div>

          {formData.yocoEnabled && (
            <div className="space-y-3 pt-2">
              <div className="field">
                <label htmlFor="yoco-pub">Yoco Live Public Key</label>
                <input
                  id="yoco-pub"
                  name="yocoPublicKey"
                  type="text"
                  value={formData.yocoPublicKey || ''}
                  onChange={handleChange}
                  placeholder="pk_live_..."
                />
              </div>

              <div className="field">
                <label htmlFor="yoco-sec">Yoco Secret Key (Encrypted on Server)</label>
                <input
                  id="yoco-sec"
                  name="yocoSecretKey"
                  type="password"
                  value={formData.yocoSecretKey || ''}
                  onChange={handleChange}
                  placeholder="sk_live_... (never shared with customer)"
                />
              </div>
            </div>
          )}
        </div>

        {/* Optional Promotions */}
        <div className="card space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#17201A] flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#15803D]" />
                <span>Promotion / Promo Code</span>
              </h2>
              <p className="text-xs text-[#647067] mt-1">Create an optional promotion for this business. Nothing is shown to customers when it is switched off.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold whitespace-nowrap">
              <input
                type="checkbox"
                checked={promotionForm.active}
                onChange={(e) => setPromotionForm((prev) => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4 rounded text-[#22C55E]"
              />
              <span>{promotionForm.active ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="promo-code">Promo Code</label>
              <input
                id="promo-code"
                type="text"
                value={promotionForm.code}
                onChange={(e) => setPromotionForm((prev) => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                placeholder="e.g. KASI10"
                maxLength={30}
                className="uppercase"
              />
            </div>

            <div className="field">
              <label htmlFor="promo-description">Customer-facing message</label>
              <input
                id="promo-description"
                type="text"
                value={promotionForm.description}
                onChange={(e) => setPromotionForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Use promo code KASI10 for 10% off"
              />
            </div>

            <div className="field">
              <label htmlFor="promo-percent">Percentage discount (%)</label>
              <div className="relative">
                <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#647067]" />
                <input
                  id="promo-percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={promotionForm.discountPercent ?? ''}
                  onChange={(e) => setPromotionForm((prev) => ({ ...prev, discountPercent: e.target.value ? Number(e.target.value) : undefined, discountAmount: undefined }))}
                  placeholder="10"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="promo-amount">Fixed discount (R)</label>
              <input
                id="promo-amount"
                type="number"
                min="0"
                step="0.01"
                value={promotionForm.discountAmount ?? ''}
                onChange={(e) => setPromotionForm((prev) => ({ ...prev, discountAmount: e.target.value ? Number(e.target.value) : undefined, discountPercent: undefined }))}
                placeholder="20"
              />
            </div>

            <div className="field">
              <label htmlFor="promo-min-order">Minimum order (R) — optional</label>
              <input
                id="promo-min-order"
                type="number"
                min="0"
                step="0.01"
                value={promotionForm.minOrderAmount ?? ''}
                onChange={(e) => setPromotionForm((prev) => ({ ...prev, minOrderAmount: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="80"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#22C55E]/20 text-xs text-[#166534]">
            <strong>Example:</strong> Code <strong>KASI10</strong> + percentage <strong>10%</strong> will give a R150 cart a R15 discount. Each business can have its own code, value, and rules.
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <span className="text-sm font-bold text-[#166534] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Changes saved successfully!</span>
            </span>
          ) : (
            <span className="text-xs text-[#647067]">Ensure phone numbers include country code (27).</span>
          )}

          <button type="submit" className="btn btn-primary font-bold shadow-md">
            Save Store Settings
          </button>
        </div>
      </form>
    </div>
  );
};

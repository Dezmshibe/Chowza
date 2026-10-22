import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { INITIAL_PLANS } from '../data/mockData';
import {
  CreditCard,
  Check,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SubscriptionPlanKey } from '../types';

export const SubscriptionView: React.FC = () => {
  const { ownerBusiness, changeBusinessPlan, addFlash } = useApp();
  const [showPayFastModal, setShowPayFastModal] = useState<SubscriptionPlanKey | null>(null);

  const currentPlanKey = ownerBusiness.plan;

  // Calculate days remaining on 14-day trial
  const trialEnd = new Date(ownerBusiness.trialEndsAt).getTime();
  const daysLeft = Math.max(0, Math.ceil((trialEnd - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleSelectPlan = (planKey: SubscriptionPlanKey) => {
    if (planKey === currentPlanKey && ownerBusiness.subscriptionStatus === 'active') {
      addFlash('notice', `You are already on the ${INITIAL_PLANS[planKey].name} plan.`);
      return;
    }
    setShowPayFastModal(planKey);
  };

  const handleConfirmPayFast = () => {
    if (!showPayFastModal) return;
    changeBusinessPlan(ownerBusiness.id, showPayFastModal);
    setShowPayFastModal(null);
  };

  return (
    <div className="container--wide py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="eyebrow text-[#EDA430]">Subscription & Software Billing</span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1B1815] tracking-tight">
          Simple, Affordable Plans for Food Businesses
        </h1>
        <p className="text-sm text-[#5A544C]">
          No hidden transaction cuts on cash or orders. Just a flat monthly software subscription billed via PayFast.
        </p>
      </div>

      {/* Trial Status Card */}
      <div className="card p-4 bg-[#FCF0DC] border-2 border-[#EDA430] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EDA430] text-white flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-[#B87A1D] text-sm">
              Current Plan: <span className="uppercase text-[#1B1815]">{ownerBusiness.plan}</span> ({ownerBusiness.subscriptionStatus})
            </div>
            <div className="text-xs text-[#5A544C] mt-0.5">
              14-Day Free Trial: <strong>{daysLeft} days remaining</strong> (expires {new Date(ownerBusiness.trialEndsAt).toLocaleDateString()}).
            </div>
          </div>
        </div>

        <span className="badge badge-pending font-bold text-xs">
          3-Day Grace Period Protected
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(INITIAL_PLANS) as SubscriptionPlanKey[]).map((key) => {
          const plan = INITIAL_PLANS[key];
          const isCurrent = key === currentPlanKey;

          return (
            <div
              key={key}
              className={`card flex flex-col justify-between p-6 relative transition-all duration-200 ${
                plan.featured
                  ? 'border-2 border-[#25D366] shadow-xl bg-white scale-[1.02]'
                  : 'bg-white border-[#1B1815]/15 hover:shadow-md'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#25D366] text-white text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Most Popular for Takeaways
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black text-[#1B1815]">{plan.name}</h3>
                  {isCurrent && (
                    <span className="badge badge-delivery text-[11px] font-bold">
                      Current Plan
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#5A544C] min-h-[36px]">{plan.tagline}</p>

                <div className="my-5 pb-5 border-b border-[#1B1815]/10 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#1B1815]">R{plan.price}</span>
                  <span className="text-xs text-[#8C857A] font-bold">/ month (ZAR)</span>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 text-xs text-[#1B1815]">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-[#1B1815]/10">
                <button
                  type="button"
                  onClick={() => handleSelectPlan(key)}
                  className={`btn btn-block btn-sm font-bold ${
                    isCurrent
                      ? 'btn-outline bg-[#F3EEE4]'
                      : plan.featured
                      ? 'btn-primary shadow-md'
                      : 'btn-dark'
                  }`}
                >
                  {isCurrent ? 'Active Plan' : `Switch to ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PayFast Security Banner */}
      <div className="p-4 bg-white rounded-2xl border border-[#1B1815]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5A544C]">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-[#25D366] shrink-0" />
          <div>
            <strong className="block text-[#1B1815] text-sm">
              Official South African PayFast Integration
            </strong>
            <span>
              Secure recurring subscription billing via Instant EFT, debit card or credit card. Cancel anytime with no penalties.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-[#8C857A]">
          <span>PayFast ITN Webhook v1</span>
          <span>·</span>
          <span>ZAR Currency</span>
        </div>
      </div>

      {/* PayFast Checkout Simulator Modal */}
      {showPayFastModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-[#1B1815]/10 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#1B1815]/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#B33F22] text-white flex items-center justify-center font-bold text-xs">
                  PF
                </div>
                <h3 className="font-bold text-base text-[#1B1815]">PayFast Recurring Checkout</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPayFastModal(null)}
                className="text-xs font-bold text-[#8C857A] hover:text-[#1B1815]"
              >
                Close
              </button>
            </div>

            <div className="p-3 bg-[#FCF0DC] rounded-xl text-xs space-y-1 text-[#B87A1D]">
              <p className="font-bold">Subscription Order Summary:</p>
              <p>Plan: <strong>{INITIAL_PLANS[showPayFastModal].name}</strong></p>
              <p>Monthly recurring fee: <strong>R{INITIAL_PLANS[showPayFastModal].price}.00 / month</strong></p>
              <p>Merchant: WhatsApp Food / Chowza South Africa</p>
            </div>

            <p className="text-xs text-[#5A544C] leading-relaxed">
              In production, this automatically posts your merchant signature to PayFast ITN{' '}
              <code className="text-[#B33F22]">https://www.payfast.co.za/eng/process</code> and activates your account upon verification.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPayFastModal(null)}
                className="btn btn-outline flex-1 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayFast}
                className="btn btn-primary flex-1 text-sm font-bold bg-[#DD5330] hover:bg-[#B33F22] text-white"
              >
                Authorize R{INITIAL_PLANS[showPayFastModal].price}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

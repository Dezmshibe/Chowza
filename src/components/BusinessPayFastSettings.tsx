import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, CreditCard, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Props = { businessId: string; businessName: string; onBack: () => void };
type Status = { is_enabled: boolean; payfast_mode: 'test' | 'live'; merchant_id_configured: boolean };

export function BusinessPayFastSettings({ businessId, businessName, onBack }: Props) {
  const [merchantId, setMerchantId] = useState('');
  const [merchantKey, setMerchantKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [mode, setMode] = useState<'test' | 'live'>('test');
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadStatus() {
    setLoading(true); setError('');
    const { data, error: rpcError } = await supabase.rpc('get_business_payfast_connection_status', { p_business_id: businessId });
    if (rpcError) {
      setError('Payment settings are not ready yet. The required Supabase database migration must be applied.');
      setLoading(false); return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      const next = row as Status;
      setStatus(next); setMode(next.payfast_mode === 'live' ? 'live' : 'test'); setEnabled(Boolean(next.is_enabled));
    } else { setStatus(null); setEnabled(false); setMode('test'); }
    setLoading(false);
  }

  useEffect(() => { void loadStatus(); }, [businessId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    if (!/^\d+$/.test(merchantId.trim())) { setError('Enter the restaurant PayFast Merchant ID using digits only.'); return; }
    if (!merchantKey.trim() || !passphrase.trim()) { setError('Enter the Merchant Key and Passphrase from this restaurant’s PayFast account.'); return; }
    setSaving(true);
    const { error: saveError } = await supabase.rpc('save_business_payfast_config', {
      p_business_id: businessId,
      p_merchant_id: merchantId.trim(),
      p_merchant_key: merchantKey.trim(),
      p_passphrase: passphrase,
      p_mode: mode,
      p_enabled: enabled,
    });
    setSaving(false);
    if (saveError) {
      console.error('[Chowza] PayFast settings save failed:', saveError);
      setError('Could not save PayFast settings. Check that the Supabase migration has been applied and try again.');
      return;
    }
    setMerchantId(''); setMerchantKey(''); setPassphrase('');
    setMessage('PayFast settings saved securely. Secret values are not displayed again.');
    await loadStatus();
  }

  return <div className="min-h-screen bg-[#F7FAF7] p-5 text-[#166534]">
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center gap-3 border-b border-[#D7E2DA] pb-5">
        <button type="button" onClick={onBack} className="rounded-xl border border-[#D7E2DA] bg-white p-2" aria-label="Back"><ArrowLeft size={19}/></button>
        <div><p className="text-xs font-bold uppercase tracking-widest">Business payments</p><h1 className="text-2xl font-black">PayFast connection</h1><p className="text-sm">{businessName}</p></div>
      </header>
      <section className="rounded-2xl border border-[#D7E2DA] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3"><CreditCard className="mt-1"/><div><h2 className="font-bold">Connect your restaurant's PayFast account</h2><p className="mt-1 text-sm text-[#647067]">Use the Merchant ID, Merchant Key and passphrase from this business's own PayFast account. Do not enter Chowza's merchant credentials here.</p></div></div>
        <div className="mt-4 rounded-xl bg-[#F7FAF7] p-3 text-sm"><div className="flex items-center gap-2 font-semibold"><ShieldCheck size={17}/> Secure credential storage</div><p className="mt-1 text-[#647067]">Credentials are sent to a database function and stored in Supabase Vault. They are not saved in browser storage or returned to the page.</p></div>
      </section>
      {loading ? <p className="rounded-xl bg-white p-4">Loading payment connection…</p> : <section className="rounded-2xl border border-[#D7E2DA] bg-white p-5 shadow-sm">
        <h2 className="font-bold">Connection status</h2>
        <p className="mt-2 text-sm">{status?.merchant_id_configured ? 'A restaurant Merchant ID is saved.' : 'No restaurant PayFast account has been connected yet.'}</p>
        <p className="mt-1 text-sm">Mode: <strong>{status?.payfast_mode === 'live' ? 'Live' : 'Sandbox / Test'}</strong></p>
        <p className="mt-1 text-sm">Online payments: <strong>{status?.is_enabled ? 'Enabled' : 'Disabled'}</strong></p>
      </section>}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#D7E2DA] bg-white p-5 shadow-sm">
        <h2 className="font-bold">{status?.merchant_id_configured ? 'Update PayFast credentials' : 'Add PayFast credentials'}</h2>
        <p className="text-sm text-[#647067]">For initial setup, select Sandbox / Test. Live mode should only be enabled after the merchant accounts and PayFast split-payment arrangement have been verified.</p>
        <label className="block text-sm font-semibold">Restaurant Merchant ID<input required inputMode="numeric" autoComplete="off" value={merchantId} onChange={e=>setMerchantId(e.target.value)} className="mt-1 w-full rounded-xl border border-[#D7E2DA] p-3" placeholder="Digits only"/></label>
        <label className="block text-sm font-semibold">Restaurant Merchant Key<input required type="password" autoComplete="new-password" value={merchantKey} onChange={e=>setMerchantKey(e.target.value)} className="mt-1 w-full rounded-xl border border-[#D7E2DA] p-3" placeholder="PayFast Merchant Key"/></label>
        <label className="block text-sm font-semibold">Restaurant Passphrase<input required type="password" autoComplete="new-password" value={passphrase} onChange={e=>setPassphrase(e.target.value)} className="mt-1 w-full rounded-xl border border-[#D7E2DA] p-3" placeholder="PayFast passphrase"/></label>
        <label className="block text-sm font-semibold">Payment mode<select value={mode} onChange={e=>setMode(e.target.value as 'test'|'live')} className="mt-1 w-full rounded-xl border border-[#D7E2DA] bg-white p-3"><option value="test">Sandbox / Test</option><option value="live">Live</option></select></label>
        <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} className="h-4 w-4"/> Enable PayFast online payments for this business</label>
        {error && <p role="alert" className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18}/>{error}</p>}
        {message && <p role="status" className="flex gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 size={18}/>{message}</p>}
        <button disabled={saving} className="w-full rounded-xl bg-[#15803D] px-5 py-3 font-bold text-white disabled:opacity-60">{saving ? 'Saving securely…' : 'Save PayFast connection'}</button>
      </form>
    </div>
  </div>;
}

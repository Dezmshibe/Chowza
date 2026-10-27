import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

type BusinessPasswordResetProps = {
  onBack: () => void;
};

export function BusinessPasswordReset({
  onBack,
}: BusinessPasswordResetProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage(
      'Password updated successfully. You can now log in with your new password.'
    );

    setPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#DDD5C8] p-8">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[#7A3E24] hover:underline mb-8"
        >
          ← Back to Chowza
        </button>

        <div className="mb-7">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#7A3E24] uppercase">
            Chowza for Business
          </p>

          <h1 className="text-3xl font-bold text-[#111111] mt-2">
            Reset your password
          </h1>

          <p className="text-sm text-[#6F665E] mt-2">
            Enter a new password for your business account.
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              New password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="w-full rounded-xl border border-[#D8D0C5] px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#222222] mb-2">
              Confirm new password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Enter the password again"
              required
              minLength={8}
              className="w-full rounded-xl border border-[#D8D0C5] px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#35170D] text-white py-3 font-semibold disabled:opacity-60"
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
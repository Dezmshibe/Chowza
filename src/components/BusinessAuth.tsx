import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

type BusinessAuthProps = {
  onBack: () => void;
  onAuthenticated: () => void;
};

export function BusinessAuth({ onBack }: BusinessAuthProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage('Your account is ready. You can continue to your business setup.');
        } else {
          setMessage(
            'Registration received! Check your email and click the verification link before logging in.'
          );
        }
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        setMessage('Login successful. Loading your account…');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/`,
          }
        );

        if (error) throw error;

        setMessage('If the email is registered, a password-reset link will be sent.');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F3EEE4] px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-[#DED5C7] bg-white p-6 shadow-sm sm:p-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm font-semibold text-[#70452E] hover:underline"
        >
          ← Back to Chowza
        </button>

        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-widest text-[#70452E]">
            Chowza for Business
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#1B1815]">
            {mode === 'signup'
              ? 'Create your account'
              : mode === 'reset'
                ? 'Reset your password'
                : 'Welcome back'}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#6B6258]">
            {mode === 'signup'
              ? 'Create an account to start setting up your business.'
              : mode === 'reset'
                ? 'Enter your email to request a password-reset link.'
                : 'Log in to access your business account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="business-email"
              className="mb-1.5 block text-sm font-semibold text-[#1B1815]"
            >
              Email address
            </label>

            <input
              id="business-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#D9D0C3] px-4 py-3 text-sm outline-none focus:border-[#70452E] focus:ring-2 focus:ring-[#70452E]/15"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label
                htmlFor="business-password"
                className="mb-1.5 block text-sm font-semibold text-[#1B1815]"
              >
                Password
              </label>

              <input
                id="business-password"
                type="password"
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  mode === 'signup'
                    ? 'At least 6 characters'
                    : 'Enter your password'
                }
                className="w-full rounded-xl border border-[#D9D0C3] px-4 py-3 text-sm outline-none focus:border-[#70452E] focus:ring-2 focus:ring-[#70452E]/15"
              />
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="rounded-lg bg-green-50 p-3 text-sm text-green-800"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#2F160D] px-4 py-3 font-bold text-white transition hover:bg-[#4B2919] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Please wait…'
              : mode === 'signup'
                ? 'Create account'
                : mode === 'reset'
                  ? 'Send reset link'
                  : 'Log in'}
          </button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-3 text-sm">
          {mode === 'login' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setMessage('');
                  setError('');
                }}
                className="font-semibold text-[#70452E] hover:underline"
              >
                Forgot password?
              </button>

              <p className="text-[#6B6258]">
                New to Chowza?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setMessage('');
                    setError('');
                  }}
                  className="font-bold text-[#70452E] hover:underline"
                >
                  Create an account
                </button>
              </p>
            </>
          )}

          {mode !== 'login' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setMessage('');
                setError('');
              }}
              className="font-semibold text-[#70452E] hover:underline"
            >
              Back to login
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-[#8A8177]">
          Your account is separate from the Chowza demo businesses. Never share
          your password with anyone.
        </p>
      </section>
    </main>
  );
}

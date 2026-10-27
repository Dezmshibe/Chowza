
import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

type BusinessAuthProps = {
  onBack: () => void;
  onAuthenticated: () => void;
};

export function BusinessAuth({
  onBack,
  onAuthenticated,
}: BusinessAuthProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Prevent accidental double submission.
    if (loading) {
      return;
    }

    setMessage('');
    setError('');
    setLoading(true);

    try {
      const cleanEmail = email.trim();

      if (!cleanEmail) {
        throw new Error('Please enter your email address.');
      }

      if (mode === 'signup') {
        console.log('[Chowza] Starting business signup...');

        const { data, error: signupError } =
          await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });

        console.log('[Chowza] Supabase signup response:', {
          hasUser: Boolean(data.user),
          hasSession: Boolean(data.session),
          error: signupError,
        });

        if (signupError) {
          throw signupError;
        }

        if (data.session && data.user) {
          setMessage(
            'Your account is ready. Loading your business account...'
          );

          console.log('[Chowza] Signup session created.');
          console.log('[Chowza] Opening business portal...');

          window.setTimeout(() => {
            onAuthenticated();
          }, 100);
        } else {
          setMessage(
            'Registration received! Check your email and click the verification link before logging in.'
          );
        }

        return;
      }

      if (mode === 'login') {
        console.log('[Chowza] Starting business login...', {
          email: cleanEmail,
        });

        const {
          data,
          error: loginError,
        } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        console.log('[Chowza] Supabase login response:', {
          hasUser: Boolean(data.user),
          hasSession: Boolean(data.session),
          userId: data.user?.id ?? null,
          error: loginError,
        });

        if (loginError) {
          throw loginError;
        }

        if (!data.user || !data.session) {
          throw new Error(
            'Supabase accepted the login but did not return an active session.'
          );
        }

        console.log('[Chowza] Login session received:', {
          userId: data.user.id,
          email: data.user.email,
        });

        // Confirm that the browser can read the authenticated session.
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            '[Chowza] Could not verify authenticated user:',
            userError
          );
          throw userError;
        }

        if (!user) {
          throw new Error(
            'Login succeeded, but Chowza could not verify the active user session.'
          );
        }

        console.log('[Chowza] Verified authenticated user:', {
          userId: user.id,
          email: user.email,
        });

        setMessage('Login successful. Loading your account...');

        // Give React a moment to update the auth/session state,
        // then tell App.tsx to open BusinessPortalGate.
        window.setTimeout(() => {
          console.log('[Chowza] Opening business portal...');
          onAuthenticated();
        }, 100);

        return;
      }

      // Password reset
      console.log('[Chowza] Requesting password reset...', {
        email: cleanEmail,
      });

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) {
        throw resetError;
      }

      setMessage(
        'If the email is registered, a password-reset link will be sent.'
      );
    } catch (err) {
      console.error('[Chowza] Business authentication error:', err);

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
    <main className="min-h-screen bg-[#F7FAF7] px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-[#E1EAE3] bg-white p-6 shadow-sm sm:p-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm font-semibold text-[#166534] hover:underline"
        >
          ← Back to Chowza
        </button>

        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-widest text-[#166534]">
            Chowza for Business
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#17201A]">
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
              className="mb-1.5 block text-sm font-semibold text-[#17201A]"
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
              className="w-full rounded-xl border border-[#D7E2DA] px-4 py-3 text-sm outline-none focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/15"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label
                htmlFor="business-password"
                className="mb-1.5 block text-sm font-semibold text-[#17201A]"
              >
                Password
              </label>

              <input
                id="business-password"
                type="password"
                autoComplete={
                  mode === 'signup'
                    ? 'new-password'
                    : 'current-password'
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
                className="w-full rounded-xl border border-[#D7E2DA] px-4 py-3 text-sm outline-none focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/15"
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
            className="w-full rounded-xl bg-[#166534] px-4 py-3 font-bold text-white transition hover:bg-[#4B2919] disabled:cursor-not-allowed disabled:opacity-60"
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
                className="font-semibold text-[#166534] hover:underline"
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
                  className="font-bold text-[#166534] hover:underline"
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
              className="font-semibold text-[#166534] hover:underline"
            >
              Back to login
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-[#8A8177]">
          Your account is separate from the Chowza demo businesses. Never
          share your password with anyone.
        </p>
      </section>
    </main>
  );
}
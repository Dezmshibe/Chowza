import { useEffect, useState } from 'react';
import { BusinessAuth } from './BusinessAuth';
import { BusinessPortalGate } from './BusinessPortalGate';
import { supabase } from '../lib/supabase';
import { useInactivityLogout } from '../hooks/useInactivityLogout';

export function BusinessApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // This is ONLY true immediately after a successful new
  // business signup.
  const [isNewBusinessSignup, setIsNewBusinessSignup] =
    useState(false);

  useInactivityLogout(() => {
    setAuthenticated(false);
    setIsNewBusinessSignup(false);
    window.location.href = '/';
  });

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        setAuthenticated(false);
        setIsNewBusinessSignup(false);
        setCheckingSession(false);
        return;
      }

      /*
       * Business app only.
       *
       * Admin users are handled by the separate AdminApp.
       */
      const userRole = session.user.app_metadata?.role;

      if (userRole === 'admin') {
        setAuthenticated(false);
        setIsNewBusinessSignup(false);
        setCheckingSession(false);
        window.location.href = '/admin';
        return;
      }

      setAuthenticated(true);

      /*
       * Check whether this session came from a brand-new
       * business signup.
       *
       * BusinessAuth sets this flag ONLY after signup succeeds.
       */
      const newSignup =
        sessionStorage.getItem(
          'chowza_new_business_signup'
        ) === 'true';

      if (newSignup) {
        setIsNewBusinessSignup(true);

        /*
         * Remove it immediately so refreshing the page or
         * logging in later does not show the banner again.
         */
        sessionStorage.removeItem(
          'chowza_new_business_signup'
        );
      } else {
        setIsNewBusinessSignup(false);
      }

      setCheckingSession(false);
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setAuthenticated(false);
          setIsNewBusinessSignup(false);
          return;
        }

        const userRole = session.user.app_metadata?.role;

        if (userRole === 'admin') {
          setAuthenticated(false);
          setIsNewBusinessSignup(false);
          window.location.href = '/admin';
          return;
        }

        setAuthenticated(true);

        /*
         * IMPORTANT:
         *
         * Do NOT automatically mark normal logins as new
         * business signups.
         *
         * The signup flag is created by BusinessAuth only.
         */
        const newSignup =
          sessionStorage.getItem(
            'chowza_new_business_signup'
          ) === 'true';

        if (newSignup) {
          setIsNewBusinessSignup(true);

          sessionStorage.removeItem(
            'chowza_new_business_signup'
          );
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#F7FAF7] flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white border border-[#D7E2DA] p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#22C55E] border-t-transparent" />

          <p className="text-sm font-semibold text-[#166534]">
            Checking your business account...
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <BusinessAuth
        onBack={() => {
          window.location.href = '/';
        }}
        onAuthenticated={() => {
          /*
           * BusinessAuth has already marked this as a
           * new-business signup when appropriate.
           */
          setAuthenticated(true);
        }}
      />
    );
  }

  return (
    <BusinessPortalGate
  onBack={() => {
    setAuthenticated(false);
    window.location.href = '/';
  }}
/>
  );
}
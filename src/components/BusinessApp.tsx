import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { BusinessAuth } from './BusinessAuth';
import { BusinessPortalGate } from './BusinessPortalGate';
import { AdminApp } from './AdminApp';
import { supabase } from '../lib/supabase';

type AppUserRole = 'admin' | 'business' | 'customer';

export function BusinessApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<AppUserRole>('customer');
  const [checkingSession, setCheckingSession] = useState(true);

  const isAdminPath = window.location.pathname === '/admin';

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        setAuthenticated(false);
        setRole('customer');
        setCheckingSession(false);
        return;
      }

      const userRole =
        session.user.app_metadata?.role === 'admin'
          ? 'admin'
          : 'business';

      setAuthenticated(true);
      setRole(userRole);
      setCheckingSession(false);
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthenticated(false);
        setRole('customer');
        return;
      }

      const userRole =
        session.user.app_metadata?.role === 'admin'
          ? 'admin'
          : 'business';

      setAuthenticated(true);
      setRole(userRole);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#f7efe5] flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white border border-[#d9c9b8] p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#d99a4b] border-t-transparent" />

          <p className="text-sm font-semibold text-[#70452e]">
            Checking your account...
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
          setAuthenticated(true);
        }}
      />
    );
  }

  /*
   * ADMIN
   *
   * Only users with app_metadata.role === "admin"
   * can access the admin area.
   */
  if (isAdminPath && role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#f4f0eb] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-[#ddd3ca] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <ShieldCheck size={26} />
          </div>

          <h1 className="text-2xl font-black text-[#2d211c]">
            Admin access required
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#75645a]">
            This area is restricted to Chowza platform administrators.
            Your account does not have administrator permissions.
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href = '/';
            }}
            className="mt-6 w-full rounded-xl bg-[#2d211c] px-4 py-3 text-sm font-black text-white hover:bg-[#3d2c24]"
          >
            Return to Chowza
          </button>
        </div>
      </div>
    );
  }

  /*
   * ADMIN
   *
   * Admin users do NOT need to own a business.
   * They go directly to the platform administration area.
   */
  if (role === 'admin') {
    return (
      <AdminApp
        onBack={() => {
          setAuthenticated(false);
          window.location.href = '/';
        }}
      />
    );
  }

  /*
   * BUSINESS OWNER
   *
   * Normal authenticated users continue to the
   * business dashboard, where BusinessPortalGate
   * restricts them to their own business.
   */
  return (
    <BusinessPortalGate
      onBack={() => {
        setAuthenticated(false);
        window.location.href = '/';
      }}
    />
  );
}
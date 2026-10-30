import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function useInactivityLogout(onLogout: () => void) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const resetTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(async () => {
        await supabase.auth.signOut();
        onLogout();
      }, INACTIVITY_TIMEOUT);
    };

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }

      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [onLogout]);
}

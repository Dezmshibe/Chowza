
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './supabase';

let registrationStarted = false;

export async function registerBusinessPushNotifications(
  userId: string,
  businessId: string
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Chowza Push] Skipping registration on web.');
    return;
  }

  if (registrationStarted) return;
  registrationStarted = true;

  try {
    await PushNotifications.createChannel({
      id: 'orders',
      name: 'Order notifications',
      description: 'New Chowza business orders',
      importance: 5,
      sound: 'default',
      vibration: true,
    });

    let permission = await PushNotifications.checkPermissions();

    if (permission.receive !== 'granted') {
      permission = await PushNotifications.requestPermissions();
    }

    if (permission.receive !== 'granted') {
      console.warn('[Chowza Push] Notification permission denied.');
      return;
    }

    await PushNotifications.addListener('registration', async (token) => {
      const { error } = await supabase
        .from('business_push_tokens')
        .upsert(
          {
            user_id: userId,
            business_id: businessId,
            token: token.value,
            platform: Capacitor.getPlatform(),
            app_target: 'business',
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'token' }
        );

      if (error) {
        console.error('[Chowza Push] Token save failed:', error.message);
      } else {
        console.log('[Chowza Push] Business device registered.');
      }
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[Chowza Push] Registration failed:', error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Chowza Push] Notification received:', notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Chowza Push] Notification opened:', action);
    });

    await PushNotifications.register();
  } catch (error) {
    registrationStarted = false;
    console.error('[Chowza Push] Setup failed:', error);
  }
}

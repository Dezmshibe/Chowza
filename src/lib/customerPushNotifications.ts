
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './supabase';

let registrationStarted = false;

export let customerFcmToken: string | null = null;

export async function registerCustomerPushNotifications(): Promise<void> {
  console.log('[Chowza Customer] Push setup function called.');
  console.log('[Chowza Customer] Platform:', Capacitor.getPlatform());
  console.log('[Chowza Customer] Native platform:', Capacitor.isNativePlatform());

  if (!Capacitor.isNativePlatform()) {
    console.warn('[Chowza Customer] Not running as a native app.');
    return;
  }

  if (registrationStarted) {
    console.log('[Chowza Customer] Registration already started.');
    return;
  }

  registrationStarted = true;

  try {
    // Attach listeners before performing any asynchronous setup.
    await PushNotifications.addListener('registration', (token) => {
      customerFcmToken = token.value;

      console.log('[Chowza Customer] FCM registration successful.');
      console.log('[Chowza Customer] Token captured successfully.');
      
    });

    await PushNotifications.addListener('registrationError', (error) => {
      registrationStarted = false;
      console.error('[Chowza Customer] Registration failed:', error);
    });

    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('[Chowza Customer] Notification received:', notification);
      },
    );

    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        console.log('[Chowza Customer] Notification opened:', action);
      },
    );

    await PushNotifications.createChannel({
      id: 'orders',
      name: 'Order updates',
      description: 'Notifications about Chowza orders',
      importance: 5,
      sound: 'default',
      vibration: true,
    });

    let permission = await PushNotifications.checkPermissions();

    if (permission.receive !== 'granted') {
      permission = await PushNotifications.requestPermissions();
    }

    if (permission.receive !== 'granted') {
      registrationStarted = false;
      console.warn('[Chowza Customer] Notification permission not granted.');
      return;
    }

    console.log('[Chowza Customer] Starting FCM registration...');

    await PushNotifications.register();

  } catch (error) {
    registrationStarted = false;
    console.error('[Chowza Customer] Setup failed:', error);
  }
}
export async function subscribeCustomerToOrder(
  orderNumber: string | number,
  customerPhone: string,
): Promise<boolean> {
  if (!customerFcmToken) {
    console.warn('[Chowza Customer] No FCM token available.');
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke(
      'register-customer-order-push',
      {
        body: {
          orderNumber,
          customerPhone,
          token: customerFcmToken,
          platform: Capacitor.getPlatform(),
        },
      },
    );

    if (error) {
      console.error('[Chowza Customer] Subscription failed:', error);
      return false;
    }

    console.log('[Chowza Customer] Order notification subscription:', data);
    return data?.success === true;
  } catch (error) {
    console.error('[Chowza Customer] Subscription error:', error);
    return false;
  }
}

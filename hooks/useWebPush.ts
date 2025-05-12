import { useEffect } from 'react';
import { askUserPermission, subscribeUser } from '@/utils/webPushUtil';
import { supabase } from '@/lib/supabase';

/**
 * Hook: otomatis mendaftar Web‑Push setelah user login.
 *
 * @param enabled - true bila user telah ter‑autentikasi.
 */
export function useWebPush(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    (async () => {
      try {
        /* 1. minta izin */
        const perm = await askUserPermission();
        if (perm !== 'granted') return;

        /* 2. subscribe di browser */
        const sub = await subscribeUser(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!);

        /* 3. simpan ke tabel device_tokens */
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) return;

        await supabase.from('device_tokens').upsert({
          user_id: user.id,
          token: JSON.stringify(sub),
          type: 'web',
        });
      } catch (err) {
        console.error('Error register Web‑Push:', err);
      }
    })();
    console.log('[push] permission before:', Notification.permission);


  }, [enabled]);
}

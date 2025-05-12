import { supabase } from '@/lib/supabase'
import { askUserPermission, subscribeUser } from './webPushUtil'

export async function registerWebPush() {
  if (await askUserPermission() !== 'granted') return
  const sub = await subscribeUser(process.env.NEXT_PUBLIC_VAPID || '')
  await supabase.from('device_tokens')
    .upsert({ user_id: auth.user.id, token: JSON.stringify(sub), type: 'web' })
    /*  Service Worker untuk Web‑Push
    --------------------------------
    Build/compile tidak diperlukan:
    - Ditaruh di /public    => served di root "/sw.js"
    - Browser akan mendaftar via navigator.serviceWorker.register('/sw.js')
*/

/* — tampilkan notifikasi saat push tiba — */
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Pesan baru';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',      // ganti sesuai aset Anda
    data: data.data || {},            // { consultationId: '123' }  ➜  akan dipakai saat klik
    badge: '/icons/icon-72.png',      // opsional
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

/* — klik notifikasi ⇒ buka / fokus tab konsul — */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const cId = event.notification?.data?.consultationId;
  const url = cId ? `/dashboard/konsultasi?c=${cId}` : '/dashboard/konsultasi';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cl) => {
      for (const client of cl) {
        if (client.url.includes('/dashboard')) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});

}

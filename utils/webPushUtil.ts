
export async function askUserPermission(): Promise<NotificationPermission> {
  if (Notification.permission !== 'granted') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

export async function subscribeUser(vapidPublicKey: string): Promise<PushSubscription> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker tidak didukung di browser ini');
  }

  /* pastikan SW ter‑daftar */
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

  /* jika user sudah memiliki subscription, pakai yang lama */
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  /* daftar baru */
  const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey,
  });
}

/* helper — konversi base64 ke Uint8Array */
function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

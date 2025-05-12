import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_CONTACT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.NEXT_PRIVATE_VAPID_PRIVATE_KEY!,
);

export { webpush };

// app/api/push/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { headers } from 'next/headers';               // utk auth header (optional)

export const runtime = 'nodejs';                      // or 'edge' jika mau

/* ---------- init once ---------- */
webpush.setVapidDetails(
  process.env.VAPID_CONTACT || 'mailto:doscomkonsultan@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.NEXT_PRIVATE_VAPID_PRIVATE_KEY!,
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,          // SERVICE ROLE KEY – JANGAN leak ke client
);

/* ---------- POST handler ---------- */
export async function POST(req: NextRequest) {
  /* (opsional) verifikasi secret header */
  const secret = (await headers()).get('authorization');
  if (secret !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  /* payload = { record: { … } } */
  const { record } = await req.json();

  if (record.sender === 'user') {
    return NextResponse.json({ skip: true });
  }

  const { data: rows } = await supabase
    .from('device_tokens')
    .select('token,type')
    .eq('user_id', record.user_id);

  const payload = JSON.stringify({
    title: 'Pesan baru',
    body: record.content.slice(0, 80),
    data: { consultationId: record.consultation_id.toString() },
  });

  /* — kirim Web‑Push — */
  const webTokens = rows?.filter((t) => t.type === 'web') ?? [];
  for (const r of webTokens) {
    try {
      await webpush.sendNotification(JSON.parse(r.token), payload);
    } catch (e) {
      console.error('web‑push error', e);
    }
  }

  return NextResponse.json({ sent: webTokens.length });
}

/* ---------- dummy export supaya “file is module” selalu true ---------- */
export {};

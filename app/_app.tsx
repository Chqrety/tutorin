// pages/_app.tsx

import { useState } from 'react'
import type { AppProps } from 'next/app'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useSupabase } from '@/lib/supabaseClient'

export default function MyApp({ Component, pageProps }: AppProps) {
  const supabase = useSupabase()

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <Component {...pageProps} />
    </SessionContextProvider>
  )
}

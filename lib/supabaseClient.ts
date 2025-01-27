// lib/supabaseClient.ts

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'

export const useSupabase = (): SupabaseClient => {
  const [supabase] = useState(() => createBrowserSupabaseClient())
  return supabase
}

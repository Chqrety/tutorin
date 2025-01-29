// lib/auth.ts

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inisialisasi Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

/**
 * Fungsi untuk mendapatkan pengguna dari permintaan HTTP
 * @param req - Permintaan HTTP
 * @returns Objek pengguna dan kesalahan (jika ada)
 */
export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'No token provided.' }
  }

  const token = authHeader.split(' ')[1]

  // Gunakan Supabase untuk mendapatkan pengguna dari token
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return { user: null, error: error?.message || 'Invalid token.' }
  }

  return { user: data.user, error: null }
}

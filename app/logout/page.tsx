"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const logout = async () => {
      try {
        // Hapus sesi dari Supabase
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error("Error saat logout:", error.message)
        }

        // Hapus sesi dari sessionStorage
        sessionStorage.removeItem("userSession")

        // Redirect ke halaman login
        router.push("/login")
      } catch (err) {
        console.error("Error saat logout:", err)
      }
    }

    logout()
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Sedang keluar... Harap tunggu.</p>
    </div>
  )
}

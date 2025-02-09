"use client"

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
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

  return (
    <Button onClick={handleLogout}>
      <LogOut className="mr-2" />
      Logout
    </Button>
  )
}



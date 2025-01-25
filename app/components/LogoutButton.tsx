// components/LogoutButton.tsx
"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function LogoutButton() {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Logout Error:", error)
      toast({
        variant: "destructive",
        title: "Gagal Logout",
        description: error.message,
      })
    } else {
      toast({
        title: "Berhasil Logout",
        description: "Anda telah berhasil keluar.",
      })
      router.push("/login")
    }
  }

  return <Button onClick={handleLogout}>Logout</Button>
}

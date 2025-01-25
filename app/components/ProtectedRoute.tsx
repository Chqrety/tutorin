// app/components/ProtectedRoute.tsx
"use client"

import { useEffect, ReactNode, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Error getting session:", error)
        toast({
          variant: "destructive",
          title: "Kesalahan",
          description: "Terjadi kesalahan saat memeriksa sesi Anda.",
        })
        router.push("/login")
      } else if (!data.session) {
        toast({
          variant: "destructive",
          title: "Akses Ditolak",
          description: "Anda harus masuk untuk mengakses halaman ini.",
        })
        router.push("/login")
      } else {
        setAuthenticated(true)
      }
      setLoading(false)
    }

    checkSession()

    // Menangani perubahan status autentikasi
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        toast({
          variant: "destructive",
          title: "Akses Ditolak",
          description: "Anda harus masuk untuk mengakses halaman ini.",
        })
        router.push("/login")
      } else {
        setAuthenticated(true)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Anda bisa mengganti ini dengan komponen loader */}
        <p>Loading...</p>
      </div>
    )
  }

  return authenticated ? <>{children}</> : null
}

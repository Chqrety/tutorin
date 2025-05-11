"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

type ProfileData = {
  full_name: string
  avatar_url: string | null
  email?: string
}

export default function SidebarProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true)
      const session = sessionStorage.getItem("userSession")

      if (!session) {
        setIsLoading(false)
        return
      }

      try {
        const parsed = JSON.parse(session)
        if (!parsed?.userId) {
          setIsLoading(false)
          return
        }

        // Create Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Fetch profile data
        const { data, error } = await supabase
          .from("users")
          .select("full_name, email, profiles(avatar_url)")
          .eq("id", parsed.userId)
          .single()

        if (error) {
          console.error("Error fetching profile data:", error)
          setIsLoading(false)
          return
        }

        if (data) {
          setProfile({
            full_name: data.full_name,
            avatar_url: data.profiles?.[0]?.avatar_url || "/placeholder-user.jpg",
            email: data.email,
          })
        }
      } catch (err) {
        console.error("Error parsing user session:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Clear session storage
      sessionStorage.removeItem("userSession")

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-blue-50/50 rounded-xl">
        <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
        <p className="text-sm text-blue-700">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-lg font-medium">G</span>
          </div>
          <div>
            <p className="font-medium">Guest</p>
            <p className="text-xs text-gray-500">Not signed in</p>
          </div>
        </div>
        <Link href="/login">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-white shadow-md">
          <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} alt={profile.full_name} />
          <AvatarFallback className="bg-blue-600 text-white text-lg">
            {profile.full_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-gray-900 truncate">{profile.full_name}</h3>
          {profile.email && <p className="text-sm text-gray-500 truncate">{profile.email}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <Button
          variant="outline"
          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center justify-center gap-2"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Logout
        </Button>

        <Link href="/profile">
          <Button variant="outline" size="icon" className="h-10 w-10 border-gray-200 bg-white hover:bg-gray-50">
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

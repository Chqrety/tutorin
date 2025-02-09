import Link from "next/link"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Home, Search, Bell, MessageSquare, Tag } from "lucide-react"

export const dynamic = "force-dynamic"

type UserProfile = {
  full_name: string
  profiles: {
    avatar_url: string | null
  } | null
}

export default async function DashboardSidebar() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: UserProfile | null = null
  if (user) {
    const { data: profileData } = await supabase
      .from("users")
      .select(`
        full_name,
        profiles (
          avatar_url
        )
      `)
      .eq("id", user.id)
      .maybeSingle()
    if (profileData) {
      profile = profileData as UserProfile
    }
  }

  return (
    <aside className="w-16 bg-white h-screen fixed left-0 top-0 flex flex-col items-center py-4 border-r border-gray-200">
      {/* Logo */}
      <div className="mb-8">
        <Avatar className="h-10 w-10">
          <AvatarImage src="/logo.png" alt="Logo" />
          <AvatarFallback>Logo</AvatarFallback>
        </Avatar>
      </div>

      {/* Navigation Icons */}
      <nav className="flex flex-col items-center space-y-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Home className="h-6 w-6" />
          </Button>
        </Link>
        <Link href="/search">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Search className="h-6 w-6" />
          </Button>
        </Link>
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-6 w-6" />
          </Button>
        </Link>
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="rounded-full">
            <MessageSquare className="h-6 w-6" />
          </Button>
        </Link>
        <Link href="/tags">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Tag className="h-6 w-6" />
          </Button>
        </Link>
      </nav>

      {/* Profile */}
      <div className="mt-auto">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={profile?.profiles?.avatar_url || "/placeholder-user.jpg"}
            alt={profile?.full_name || "User"}
          />
          <AvatarFallback>{profile?.full_name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
      </div>
    </aside>
  )
}


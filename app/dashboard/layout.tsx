"use client"


import { useRouter } from "next/navigation"
import { useEffect } from "react"
import DashboardSidebar from "../components/desktop-sidebar"
import DashboardHeader from "../components/DashboardHeader"
import { metadata } from "./dashboardMetadata"
import DesktopSidebar from "../components/desktop-sidebar"
import { useWebPush } from '@/hooks/useWebPush';
import { useSessionContext } from '@supabase/auth-helpers-react';
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Periksa sesi login
    const userSession = sessionStorage.getItem("userSession")
    if (!userSession) {
      router.push("/login") // Redirect ke halaman login jika tidak ada sesi
    }
  }, [router])
   const { session } = useSessionContext();
  useWebPush(!!session);

  return (
    <div className="flex h-screen bg-gray-100 fixed w-full" >
      <DesktopSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
    
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="">{children}</div>
        </main>
      </div>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminSidebar from "../../components/admin/AdminSidebar"
import AdminHeader from "../../components/admin/AdminHeader"
import { useWebPush } from '@/hooks/useWebPush';
import { useSessionContext } from '@supabase/auth-helpers-react';
export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Periksa sesi login admin
    const adminSession = sessionStorage.getItem("adminSession")
    if (!adminSession) {
      // Redirect ke halaman login jika sesi tidak ditemukan
      router.push("/admin/login")
    }
  }, [router])
const { session } = useSessionContext();
  useWebPush(!!session);
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

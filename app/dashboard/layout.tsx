"use client"


import { useRouter } from "next/navigation"
import { useEffect } from "react"
import DashboardSidebar from "../components/DashboardSidebar"
import DashboardHeader from "../components/DashboardHeader"
import { metadata } from "./dashboardMetadata"

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

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

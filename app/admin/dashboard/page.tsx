"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, MessageSquare, CheckCircle } from "lucide-react"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Periksa apakah sesi admin ada
    const adminSession = sessionStorage.getItem("adminSession")
    if (adminSession) {
      setIsLoggedIn(true)
    } else {
      // Redirect ke halaman login jika sesi tidak ditemukan
      router.push("/admin/login")
    }
  }, [router])

  if (!isLoggedIn) {
    // Jangan render apa pun sebelum login diverifikasi
    return null
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Welcome, Admin!</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Konsultasi</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">250</div>
            <p className="text-xs text-muted-foreground">+20% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengguna Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,200</div>
            <p className="text-xs text-muted-foreground">+15% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesan Baru</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30</div>
            <p className="text-xs text-muted-foreground">Dalam 24 jam terakhir</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konsultasi Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">180</div>
            <p className="text-xs text-muted-foreground">90% tingkat penyelesaian</p>
          </CardContent>
        </Card>
      </div>

      {/* Anda dapat menambahkan bagian lain seperti aktivitas terkini, grafik, dll. */}
    </div>
  )
}

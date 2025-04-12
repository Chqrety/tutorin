"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, isToday, isTomorrow, isAfter } from "date-fns"
import { id } from "date-fns/locale"
import {
  Clock,
  Edit,
  CalendarIcon,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Search,
  Clock3,
  CheckCircle2,
  CircleXIcon as XCircle2,
  RotateCcw,
  Trash2,
  Info,
  CalendarDays,
} from "lucide-react"

// Types
type Schedule = {
  id: number
  date: Date
  time: string
  title: string
  description: string
  address: string
  counselor_id: string
  status: string
}

type Counselor = {
  id: string
  admin_id: string
  user_id: string
  specialization: string
  years_of_experience: number
  created_at: string
  updated_at: string
  user: {
    email: string
    full_name: string
    profiles: {
      avatar_url: string | null
    }
  }
}

export default function JadwalAdminPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [counselors, setCounselors] = useState<Counselor[]>([])
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [rescheduleData, setRescheduleData] = useState<{
    id: number
    date: Date
    time: string
    address: string
  } | null>(null)
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  // Fetch admin data and counselors
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true)
        const adminSession = sessionStorage.getItem("adminSession")

        if (!adminSession) {
          console.error("Admin session not found")
          return
        }

        const { adminId } = JSON.parse(adminSession)

        // Fetch admin data
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("id, name, email")
          .eq("id", adminId)
          .single()

        if (adminError) {
          console.error("Failed to fetch admin data:", adminError)
          return
        }

        // Fetch counselors related to this admin
        const { data: counselorsData, error: counselorsError } = await supabase
          .from("counselors")
          .select(`
            id,
            admin_id,
            user_id,
            specialization,
            years_of_experience,
            user:users(email, full_name, profiles(avatar_url))
          `)
          .eq("admin_id", adminData.id)

        if (counselorsError) {
          console.error("Failed to fetch counselors data:", counselorsError)
          return
        }

        if (counselorsData.length > 0) {
          setCounselors(counselorsData as Counselor[])
        }
      } catch (err) {
        console.error("Error fetching admin data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdminData()
  }, [])

  // Fetch schedules after counselors are available
  useEffect(() => {
    const fetchSchedules = async () => {
      if (counselors.length === 0) return

      try {
        setIsLoading(true)
        // Get all counselor IDs
        const counselorIds = counselors.map((c) => c.id)

        const { data, error } = await supabase.from("schedules").select("*").in("counselor_id", counselorIds)

        if (error) {
          console.error("Failed to fetch schedules:", error)
          return
        }

        // Transform data to match our Schedule type
        const transformedData = data.map((item: any) => ({
          id: item.id,
          date: new Date(item.date),
          time: item.time,
          title: item.title,
          description: item.description,
          address: item.address,
          counselor_id: item.counselor_id,
          status: item.status,
        }))

        setSchedules(transformedData)
      } catch (err) {
        console.error("Error fetching schedules:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchedules()
  }, [counselors])

  // Send email notification
  const sendEmailNotification = async (
    email: string,
    scheduleId: number,
    subject: string,
    body: string,
    senderRole: "admin" | "user",
  ) => {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          email,
          scheduleId,
          subject,
          body,
          senderRole,
        }),
      })

      if (response.ok) {
        console.log("Email notification sent successfully")
        return true
      } else {
        const data = await response.json()
        console.error("Failed to send email:", data.message)
        return false
      }
    } catch (err) {
      console.error("Error sending email:", err)
      return false
    }
  }

  // Reschedule function
  const handleReschedule = async (
    scheduleId: number,
    newDate: Date,
    newTime: string,
    newAddress: string,
    userEmail: string,
  ) => {
    try {
      const { error } = await supabase
        .from("schedules")
        .update({
          date: newDate.toISOString().split("T")[0],
          time: newTime,
          address: newAddress,
          status: "Pending",
        })
        .eq("id", scheduleId)

      if (error) {
        console.error("Failed to reschedule:", error)
        alert("Failed to reschedule appointment.")
        return
      }

      // Update local state
      setSchedules(
        schedules.map((schedule) =>
          schedule.id === scheduleId
            ? { ...schedule, date: newDate, time: newTime, address: newAddress, status: "Pending" }
            : schedule,
        ),
      )

      // Find the schedule and counselor
      const schedule = schedules.find((s) => s.id === scheduleId)
      if (!schedule) {
        console.error("Schedule not found for reschedule.")
        return
      }

      const counselor = counselors.find((c) => c.id === schedule.counselor_id)
      if (!counselor) {
        console.error("Related counselor not found.")
        return
      }

      // Send email notification
      const subject = `Jadwal Konsultasi Di-reschedule: ${schedule.title || "Jadwal Konsultasi"}`
      const bodyContent = `
Hai ${counselor.user.full_name || "Pengguna"},

Jadwal konsultasi Anda dengan ID ${scheduleId} telah di-reschedule oleh admin.

Detail Jadwal Baru:
Tanggal: ${format(newDate, "dd MMMM yyyy")}
Waktu: ${newTime}
Alamat: ${newAddress}

Silakan lakukan tindakan selanjutnya.

Terima kasih telah menggunakan layanan kami.

Salam,
Tim Doscom Konsultan
      `

      const emailSent = await sendEmailNotification(userEmail, scheduleId, subject, bodyContent, "admin")

      if (emailSent) {
        alert("Jadwal berhasil di-reschedule dan notifikasi email telah dikirim!")
      } else {
        alert("Jadwal berhasil di-reschedule, tetapi gagal mengirim notifikasi email.")
      }
    } catch (err) {
      console.error("Error rescheduling appointment:", err)
      alert("An error occurred while rescheduling the appointment.")
    }
  }

  // Accept schedule function
  const handleAccept = async (scheduleId: number, userEmail: string, scheduleTitle: string) => {
    try {
      // Update status to 'Accepted'
      const { error } = await supabase.from("schedules").update({ status: "Accepted" }).eq("id", scheduleId)

      if (error) {
        console.error("Failed to accept schedule:", error)
        alert("Failed to accept appointment.")
        return
      }

      // Update local state
      const updatedSchedules = schedules.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, status: "Accepted" } : schedule,
      )
      setSchedules(updatedSchedules)

      // Find updated schedule and counselor
      const updatedSchedule = updatedSchedules.find((s) => s.id === scheduleId)
      if (!updatedSchedule) {
        console.error("Schedule not found after update.")
        return
      }

      const counselor = counselors.find((c) => c.id === updatedSchedule.counselor_id)
      if (!counselor) {
        console.error("Related counselor not found.")
        return
      }

      // Send email notification
      const subject = `Jadwal Konsultasi Diterima: ${scheduleTitle}`
      const bodyContent = `
Hai ${counselor.user.full_name || "Pengguna"},

Jadwal konsultasi Anda dengan ID ${scheduleId} telah diterima oleh admin.

Detail Jadwal:
Tanggal: ${format(updatedSchedule.date, "dd MMMM yyyy")}
Waktu: ${updatedSchedule.time}
Alamat: ${updatedSchedule.address}

Terima kasih telah menggunakan layanan kami.

Salam,
Tim Doscom Konsultan
      `

      const emailSent = await sendEmailNotification(userEmail, scheduleId, subject, bodyContent, "admin")

      if (emailSent) {
        alert("Jadwal berhasil diterima dan notifikasi email telah dikirim!")
      } else {
        alert("Jadwal berhasil diterima, tetapi gagal mengirim notifikasi email.")
      }
    } catch (err) {
      console.error("Error accepting schedule:", err)
      alert("An error occurred while accepting the appointment.")
    }
  }

  // Reject schedule function
  const handleReject = async (scheduleId: number, userEmail: string, scheduleTitle: string) => {
    try {
      // Update status to 'Rejected'
      const { error } = await supabase.from("schedules").update({ status: "Rejected" }).eq("id", scheduleId)

      if (error) {
        console.error("Failed to reject schedule:", error)
        alert("Failed to reject appointment.")
        return
      }

      // Update local state
      const updatedSchedules = schedules.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, status: "Rejected" } : schedule,
      )
      setSchedules(updatedSchedules)

      // Find rejected schedule and counselor
      const rejectedSchedule = updatedSchedules.find((s) => s.id === scheduleId)
      if (!rejectedSchedule) {
        console.error("Schedule not found after update.")
        return
      }

      const counselor = counselors.find((c) => c.id === rejectedSchedule.counselor_id)
      if (!counselor) {
        console.error("Related counselor not found.")
        return
      }

      // Send email notification
      const subject = `Jadwal Konsultasi Ditolak: ${scheduleTitle}`
      const bodyContent = `
Hai ${counselor.user.full_name || "Pengguna"},

Jadwal konsultasi Anda dengan ID ${scheduleId} telah ditolak oleh admin.

Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi kami.

Terima kasih telah menggunakan layanan kami.

Salam,
Tim Doscom Konsultan
      `

      const emailSent = await sendEmailNotification(userEmail, scheduleId, subject, bodyContent, "admin")

      if (emailSent) {
        alert("Jadwal berhasil ditolak dan notifikasi email telah dikirim!")
      } else {
        alert("Jadwal berhasil ditolak, tetapi gagal mengirim notifikasi email.")
      }
    } catch (err) {
      console.error("Error rejecting schedule:", err)
      alert("An error occurred while rejecting the appointment.")
    }
  }

  // Mark schedule as finished
  const handleFinish = async (scheduleId: number, userEmail: string, scheduleTitle: string) => {
    try {
      // Update status to 'Finished'
      const { error } = await supabase.from("schedules").update({ status: "Finished" }).eq("id", scheduleId)

      if (error) {
        console.error("Failed to mark schedule as finished:", error)
        alert("Failed to mark appointment as finished.")
        return
      }

      // Update local state
      const updatedSchedules = schedules.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, status: "Finished" } : schedule,
      )
      setSchedules(updatedSchedules)

      // Find finished schedule and counselor
      const finishedSchedule = updatedSchedules.find((s) => s.id === scheduleId)
      if (!finishedSchedule) {
        console.error("Schedule not found after update.")
        return
      }

      const counselor = counselors.find((c) => c.id === finishedSchedule.counselor_id)
      if (!counselor) {
        console.error("Related counselor not found.")
        return
      }

      // Send email notification
      const subject = `Jadwal Konsultasi Selesai: ${scheduleTitle}`
      const bodyContent = `
Hai ${counselor.user.full_name || "Pengguna"},

Jadwal konsultasi Anda dengan ID ${scheduleId} telah ditandai sebagai selesai oleh admin.

Kami berharap Anda mendapatkan manfaat dari konsultasi ini. Jika Anda memiliki feedback atau pertanyaan lebih lanjut, jangan ragu untuk menghubungi kami.

Terima kasih telah menggunakan layanan kami.

Salam,
Tim Doscom Konsultan
      `

      const emailSent = await sendEmailNotification(userEmail, scheduleId, subject, bodyContent, "admin")

      if (emailSent) {
        alert("Jadwal berhasil ditandai sebagai selesai dan notifikasi email telah dikirim!")
      } else {
        alert("Jadwal berhasil ditandai sebagai selesai, tetapi gagal mengirim notifikasi email.")
      }
    } catch (err) {
      console.error("Error marking schedule as finished:", err)
      alert("An error occurred while marking the appointment as finished.")
    }
  }

  // Delete schedule function
  const handleDeleteSchedule = async (scheduleId: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      try {
        const { error } = await supabase.from("schedules").delete().eq("id", scheduleId)

        if (error) {
          console.error("Failed to delete schedule:", error)
          alert("Failed to delete appointment.")
          return
        }

        // Update local state
        setSchedules(schedules.filter((schedule) => schedule.id !== scheduleId))
        alert("Jadwal berhasil dihapus!")
      } catch (err) {
        console.error("Error deleting schedule:", err)
        alert("An error occurred while deleting the appointment.")
      }
    }
  }

  // Filter schedules based on search query, status filter, and selected counselor
  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      // Filter by search query
      const matchesSearch =
        schedule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.address.toLowerCase().includes(searchQuery.toLowerCase())

      // Filter by status
      const matchesStatus = statusFilter === "all" || schedule.status.toLowerCase() === statusFilter.toLowerCase()

      // Filter by selected counselor
      const matchesCounselor = !selectedCounselor || schedule.counselor_id === selectedCounselor.id

      // Filter by tab
      let matchesTab = true
      if (activeTab === "today") {
        matchesTab = isToday(schedule.date)
      } else if (activeTab === "tomorrow") {
        matchesTab = isTomorrow(schedule.date)
      } else if (activeTab === "upcoming") {
        matchesTab = isAfter(schedule.date, new Date()) && !isToday(schedule.date) && !isTomorrow(schedule.date)
      }

      return matchesSearch && matchesStatus && matchesCounselor && matchesTab
    })
  }, [schedules, searchQuery, statusFilter, selectedCounselor, activeTab])

  // Sort schedules by priority and date
  const sortedSchedules = useMemo(() => {
    const priority = {
      Pending: 1,
      Accepted: 2,
      Rejected: 3,
      Finished: 4,
    }

    return [...filteredSchedules].sort((a, b) => {
      const priorityA = priority[a.status] || 5
      const priorityB = priority[b.status] || 5

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      // If status is the same, sort by date and time
      if (a.date.getTime() !== b.date.getTime()) {
        return a.date.getTime() - b.date.getTime()
      }

      return a.time.localeCompare(b.time)
    })
  }, [filteredSchedules])

  // Get status counts
  const statusCounts = useMemo(() => {
    return {
      pending: schedules.filter((s) => s.status === "Pending").length,
      accepted: schedules.filter((s) => s.status === "Accepted").length,
      rejected: schedules.filter((s) => s.status === "Rejected").length,
      finished: schedules.filter((s) => s.status === "Finished").length,
      total: schedules.length,
      today: schedules.filter((s) => isToday(s.date)).length,
      tomorrow: schedules.filter((s) => isTomorrow(s.date)).length,
      upcoming: schedules.filter((s) => isAfter(s.date, new Date()) && !isToday(s.date) && !isTomorrow(s.date)).length,
    }
  }, [schedules])

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Pending
          </Badge>
        )
      case "Accepted":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Accepted
          </Badge>
        )
      case "Rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            Rejected
          </Badge>
        )
      case "Finished":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Finished
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Admin - Jadwal Konsultasi</h1>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari jadwal..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="finished">Finished</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Stats Cards */}
          <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                  Total Jadwal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts.total}</div>
                <p className="text-xs text-muted-foreground">
                  {statusCounts.pending} pending, {statusCounts.accepted} accepted
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-yellow-500" />
                  Jadwal Hari Ini
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts.today}</div>
                <p className="text-xs text-muted-foreground">{statusCounts.tomorrow} besok</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Jadwal Diterima
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts.accepted}</div>
                <p className="text-xs text-muted-foreground">{statusCounts.finished} selesai</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle2 className="h-4 w-4 text-red-500" />
                  Jadwal Ditolak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts.rejected}</div>
                <p className="text-xs text-muted-foreground">{statusCounts.pending} menunggu</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-4">
            <Card className="h-full">
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-500" /> Kalender
                </CardTitle>
                <CardDescription>Pilih tanggal untuk melihat jadwal</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border w-full" />

                {/* Counselor Selection */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" /> Daftar Konselor
                  </h3>
                  <ScrollArea className="h-[250px] rounded-md border">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : counselors.length > 0 ? (
                      <div className="p-2">
                        {selectedCounselor && (
                          <Button
                            variant="outline"
                            onClick={() => setSelectedCounselor(null)}
                            className="w-full mb-2 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100"
                          >
                            <RotateCcw className="h-4 w-4" /> Tampilkan Semua
                          </Button>
                        )}
                        {counselors.map((counselor) => (
                          <div
                            key={counselor.id}
                            className={`mb-2 p-3 border rounded-lg flex items-center cursor-pointer transition-all ${
                              selectedCounselor?.id === counselor.id
                                ? "bg-blue-100 border-blue-300"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => setSelectedCounselor(counselor)}
                          >
                            <Avatar className="h-10 w-10 mr-3 border">
                              <AvatarImage src={counselor.user.profiles.avatar_url || ""} />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {counselor.user.full_name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{counselor.user.full_name || "Belum diisi"}</p>
                              <p className="text-xs text-gray-500">{counselor.user.email || "Belum diisi"}</p>
                              {counselor.specialization && (
                                <p className="text-xs text-blue-600 mt-1">{counselor.specialization}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-4">
                        <User className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-center text-gray-500">Belum ada konselor.</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-8">
            <Card className="h-full">
              <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  Jadwal Konsultasi {selectedCounselor ? `- ${selectedCounselor.user.full_name}` : ""}
                </CardTitle>
                <CardDescription>Kelola semua jadwal konsultasi</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="all" className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" /> Semua
                    </TabsTrigger>
                    <TabsTrigger value="today" className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Hari Ini
                    </TabsTrigger>
                    <TabsTrigger value="tomorrow" className="flex items-center gap-1">
                      <Clock3 className="h-4 w-4" /> Besok
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" /> Mendatang
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-0">
                    <ScrollArea className="h-[600px]">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : sortedSchedules.length > 0 ? (
                        <div className="space-y-4">
                          {sortedSchedules.map((schedule) => {
                            const counselor = counselors.find((c) => c.id === schedule.counselor_id)
                            return (
                              <Card key={schedule.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-transparent">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                      <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-2 min-w-[60px]">
                                        <span className="text-sm font-bold text-blue-700">
                                          {format(schedule.date, "dd")}
                                        </span>
                                        <span className="text-xs text-blue-600">
                                          {format(schedule.date, "MMM", { locale: id })}
                                        </span>
                                      </div>
                                      <div>
                                        <CardTitle className="text-lg">{schedule.title}</CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                          {getStatusBadge(schedule.status)}
                                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {schedule.time}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      {counselor && (
                                        <Avatar className="h-8 w-8 border">
                                          <AvatarImage src={counselor.user.profiles.avatar_url || ""} />
                                          <AvatarFallback className="bg-blue-100 text-blue-600">
                                            {counselor.user.full_name?.charAt(0) || "U"}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pb-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <div className="flex items-start gap-2 mb-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span className="text-sm">{schedule.address}</span>
                                      </div>
                                      {counselor && (
                                        <div className="flex items-start gap-2 mb-2">
                                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                          <div>
                                            <span className="text-sm font-medium">{counselor.user.full_name}</span>
                                            <p className="text-xs text-muted-foreground">{counselor.user.email}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-start gap-2">
                                        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span className="text-sm">{schedule.description}</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="flex flex-wrap gap-2 pt-0 border-t mt-2 bg-gray-50">
                                  {schedule.status === "Pending" && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setRescheduleData({
                                            id: schedule.id,
                                            date: schedule.date,
                                            time: schedule.time,
                                            address: schedule.address,
                                          })
                                          setIsRescheduleOpen(true)
                                        }}
                                        className="flex items-center"
                                      >
                                        <Edit className="h-4 w-4 mr-1" /> Reschedule
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
                                        onClick={() => {
                                          if (counselor && counselor.user.email && schedule.title) {
                                            handleAccept(schedule.id, counselor.user.email, schedule.title)
                                          } else {
                                            alert("Email pengguna atau judul jadwal tidak ditemukan.")
                                          }
                                        }}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" /> Terima
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                                        onClick={() => {
                                          if (counselor && counselor.user.email && schedule.title) {
                                            handleReject(schedule.id, counselor.user.email, schedule.title)
                                          } else {
                                            alert("Email pengguna atau judul jadwal tidak ditemukan.")
                                          }
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" /> Tolak
                                      </Button>
                                    </>
                                  )}
                                  {schedule.status === "Accepted" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200"
                                      onClick={() => {
                                        if (counselor && counselor.user.email && schedule.title) {
                                          handleFinish(schedule.id, counselor.user.email, schedule.title)
                                        } else {
                                          alert("Email pengguna atau judul jadwal tidak ditemukan.")
                                        }
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" /> Selesai
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="ml-auto bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" /> Hapus
                                  </Button>
                                </CardFooter>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 p-4">
                          <CalendarIcon className="h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-center text-gray-500">Tidak ada jadwal yang ditemukan.</p>
                          <p className="text-center text-gray-400 text-sm mt-1">
                            {searchQuery || statusFilter !== "all" || selectedCounselor
                              ? "Coba ubah filter pencarian Anda."
                              : "Belum ada jadwal konsultasi yang tersedia."}
                          </p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="today" className="mt-0">
                    <ScrollArea className="h-[600px]">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : sortedSchedules.length > 0 ? (
                        <div className="space-y-4">
                          {sortedSchedules.map((schedule) => {
                            const counselor = counselors.find((c) => c.id === schedule.counselor_id)
                            return (
                              <Card key={schedule.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                {/* Same card content as "all" tab */}
                                <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-transparent">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                      <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-2 min-w-[60px]">
                                        <span className="text-sm font-bold text-blue-700">
                                          {format(schedule.date, "dd")}
                                        </span>
                                        <span className="text-xs text-blue-600">
                                          {format(schedule.date, "MMM", { locale: id })}
                                        </span>
                                      </div>
                                      <div>
                                        <CardTitle className="text-lg">{schedule.title}</CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                          {getStatusBadge(schedule.status)}
                                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {schedule.time}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      {counselor && (
                                        <Avatar className="h-8 w-8 border">
                                          <AvatarImage src={counselor.user.profiles.avatar_url || ""} />
                                          <AvatarFallback className="bg-blue-100 text-blue-600">
                                            {counselor.user.full_name?.charAt(0) || "U"}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pb-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <div className="flex items-start gap-2 mb-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span className="text-sm">{schedule.address}</span>
                                      </div>
                                      {counselor && (
                                        <div className="flex items-start gap-2 mb-2">
                                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                          <div>
                                            <span className="text-sm font-medium">{counselor.user.full_name}</span>
                                            <p className="text-xs text-muted-foreground">{counselor.user.email}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-start gap-2">
                                        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span className="text-sm">{schedule.description}</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="flex flex-wrap gap-2 pt-0 border-t mt-2 bg-gray-50">
                                  {/* Same action buttons as "all" tab */}
                                  {schedule.status === "Pending" && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setRescheduleData({
                                            id: schedule.id,
                                            date: schedule.date,
                                            time: schedule.time,
                                            address: schedule.address,
                                          })
                                          setIsRescheduleOpen(true)
                                        }}
                                        className="flex items-center"
                                      >
                                        <Edit className="h-4 w-4 mr-1" /> Reschedule
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
                                        onClick={() => {
                                          if (counselor && counselor.user.email && schedule.title) {
                                            handleAccept(schedule.id, counselor.user.email, schedule.title)
                                          } else {
                                            alert("Email pengguna atau judul jadwal tidak ditemukan.")
                                          }
                                        }}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" /> Terima
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                                        onClick={() => {
                                          if (counselor && counselor.user.email && schedule.title) {
                                            handleReject(schedule.id, counselor.user.email, schedule.title)
                                          } else {
                                            alert("Email pengguna atau judul jadwal tidak ditemukan.")
                                          }
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" /> Tolak
                                      </Button>
                                    </>
                                  )}
                                  {schedule.status === "Accepted" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200"
                                      onClick={() => {
                                        if (counselor && counselor.user.email && schedule.title) {
                                          handleFinish(schedule.id, counselor.user.email, schedule.title)
                                        } else {
                                          alert("Email pengguna atau judul jadwal tidak ditemukan.")
                                        }
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" /> Selesai
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="ml-auto bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" /> Hapus
                                  </Button>
                                </CardFooter>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 p-4">
                          <Clock className="h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-center text-gray-500">Tidak ada jadwal untuk hari ini.</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="tomorrow" className="mt-0">
                    <ScrollArea className="h-[600px]">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : sortedSchedules.length > 0 ? (
                        <div className="space-y-4">
                          {/* Same card rendering as other tabs */}
                          {sortedSchedules.map((schedule) => {
                            const counselor = counselors.find((c) => c.id === schedule.counselor_id)
                            return (
                              <Card key={schedule.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                {/* Same card content structure as other tabs */}
                                <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-transparent">
                                  {/* Same header content */}
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                      <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-2 min-w-[60px]">
                                        <span className="text-sm font-bold text-blue-700">
                                          {format(schedule.date, "dd")}
                                        </span>
                                        <span className="text-xs text-blue-600">
                                          {format(schedule.date, "MMM", { locale: id })}
                                        </span>
                                      </div>
                                      <div>
                                        <CardTitle className="text-lg">{schedule.title}</CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                          {getStatusBadge(schedule.status)}
                                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {schedule.time}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      {counselor && (
                                        <Avatar className="h-8 w-8 border">
                                          <AvatarImage src={counselor.user.profiles.avatar_url || ""} />
                                          <AvatarFallback className="bg-blue-100 text-blue-600">
                                            {counselor.user.full_name?.charAt(0) || "U"}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pb-2">
                                  {/* Same content structure */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <div className="flex items-start gap-2 mb-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span className="text-sm">{schedule.address}</span>
                                      </div>
                                      {counselor && (
                                        <div className="flex items-start gap-2 mb-2">
                                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                          <div>
                                            <span className="text-sm font-medium">{counselor.user.full_name}</span>
                                            <p className="text-xs text-muted-foreground">{counselor.user.email}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-start gap-2">
                                        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span className="text-sm">{schedule.description}</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="flex flex-wrap gap-2 pt-0 border-t mt-2 bg-gray-50">
                                  {/* Same action buttons */}
                                  {schedule.status === "Pending" && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setRescheduleData({
                                            id: schedule.id,
                                            date: schedule.date,
                                            time: schedule.time,
                                            address: schedule.address,
                                          })
                                          setIsRescheduleOpen(true)
                                        }}
                                        className="flex items-center"
                                      >
                                        <Edit className="h-4 w-4 mr-1" /> Reschedule
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
                                        onClick={() => {
                                          if (counselor && counselor.user.email && schedule.title) {
                                            handleAccept(schedule.id, counselor.user.email, schedule.title)
                                          } else {
                                            alert("Email pengguna atau judul jadwal tidak ditemukan.")
                                          }
                                        }}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" /> Terima
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                                        onClick={() => {
                                          if (counselor && counselor.user.email && schedule.title) {
                                            handleReject(schedule.id, counselor.user.email, schedule.title)
                                          } else {
                                            alert("Email pengguna atau judul jadwal tidak ditemukan.")
                                          }
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" /> Tolak
                                      </Button>
                                    </>
                                  )}
                                  {schedule.status === "Accepted" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200"
                                      onClick={() => {
                                        if (counselor && counselor.user.email && schedule.title) {
                                          handleFinish(schedule.id, counselor.user.email, schedule.title)
                                        } else {
                                          alert("Email pengguna atau judul jadwal tidak ditemukan.")
                                        }
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" /> Selesai
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="ml-auto bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" /> Hapus
                                  </Button>
                                </CardFooter>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 p-4">
                          <Clock3 className="h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-center text-gray-500">Tidak ada jadwal untuk besok.</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="upcoming" className="mt-0">
                    <ScrollArea className="h-[600px]">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : sortedSchedules.length > 0 ? (
                        <div className="space-y-4">
                          {/* Same card rendering as other tabs */}
                          {sortedSchedules.map((schedule) => {
                            const counselor = counselors.find((c) => c.id === schedule.counselor_id)
                            return (
                              <Card key={schedule.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                {/* Same card structure as other tabs */}
                                <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-transparent">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                      <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-2 min-w-[60px]">
                                        <span className="text-sm font-bold text-blue-700">
                                          {format(schedule.date, "dd")}
                                        </span>
                                        <span className="text-xs text-blue-600">
                                          {format(schedule.date, "MMM", { locale: id })}
                                        </span>
                                      </div>
                                      <div>
                                        <CardTitle className="text-lg">{schedule.title}</CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                          {getStatusBadge(schedule.status)}
                                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {schedule.time}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      {counselor && (
                                        <Avatar className="h-8 w-8 border">
                                          <AvatarImage src={counselor.user.profiles.avatar_url || ""} />
                                          <AvatarFallback className="bg-blue-100 text-blue-600">
                                            {counselor.user.full_name?.charAt(0) || "U"}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pb-2">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <div className="flex items-start gap-2 mb-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span className="text-sm">{schedule.address}</span>
                                      </div>
                                      {counselor && (
                                        <div className="flex items-start gap-2 mb-2">
                                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                          <div>
                                            <span className="text-sm font-medium">{counselor.user.full_name}</span>
                                            <p className="text-xs text-muted-foreground">{counselor.user.email}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-start gap-2">
                                        <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span className="text-sm">{schedule.description}</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="flex flex-wrap gap-2 pt-0 border-t mt-2 bg-gray-50">
                                  {schedule.status === "Pending" && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setRescheduleData({
                                            id: schedule.id,
                                            date: schedule.date,
                                            time: schedule.time,
                                            address: schedule.address,
                                          })
                                          setIsRescheduleOpen(true)
                                        }}
                                        className="flex items-center"
                                      >
                                        <Edit className="h-4 w-4 mr-1" /> Reschedule
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
                                        onClick={() => {
                                          if (counselor && counselor.user.email && schedule.title) {
                                            handleAccept(schedule.id, counselor.user.email, schedule.title)
                                          } else {
                                            alert("Email pengguna atau judul jadwal tidak ditemukan.")
                                          }
                                        }}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" /> Terima
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                                        onClick={() => {
                                          if (counselor && counselor.user.email && schedule.title) {
                                            handleReject(schedule.id, counselor.user.email, schedule.title)
                                          } else {
                                            alert("Email pengguna atau judul jadwal tidak ditemukan.")
                                          }
                                        }}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" /> Tolak
                                      </Button>
                                    </>
                                  )}
                                  {schedule.status === "Accepted" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200"
                                      onClick={() => {
                                        if (counselor && counselor.user.email && schedule.title) {
                                          handleFinish(schedule.id, counselor.user.email, schedule.title)
                                        } else {
                                          alert("Email pengguna atau judul jadwal tidak ditemukan.")
                                        }
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" /> Selesai
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="ml-auto bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" /> Hapus
                                  </Button>
                                </CardFooter>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 p-4">
                          <CalendarDays className="h-12 w-12 text-gray-400 mb-2" />
                          <p className="text-center text-gray-500">Tidak ada jadwal mendatang.</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        {rescheduleData && (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Reschedule Jadwal</DialogTitle>
              <DialogDescription>Masukkan tanggal, waktu, dan alamat baru untuk jadwal ini.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newDate" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-500" /> Tanggal Baru
                </Label>
                <Input
                  id="newDate"
                  type="date"
                  value={format(rescheduleData.date, "yyyy-MM-dd")}
                  onChange={(e) =>
                    setRescheduleData({
                      ...rescheduleData,
                      date: new Date(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" /> Waktu Baru
                </Label>
                <Input
                  id="newTime"
                  type="time"
                  value={rescheduleData.time}
                  onChange={(e) =>
                    setRescheduleData({
                      ...rescheduleData,
                      time: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newAddress" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" /> Alamat Baru
                </Label>
                <Input
                  id="newAddress"
                  value={rescheduleData.address || ""}
                  onChange={(e) =>
                    setRescheduleData({
                      ...rescheduleData,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsRescheduleOpen(false)
                    setRescheduleData(null)
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (rescheduleData) {
                      // Get user email from the schedule
                      const schedule = schedules.find((s) => s.id === rescheduleData.id)
                      if (schedule) {
                        const counselor = counselors.find((c) => c.id === schedule.counselor_id)
                        if (counselor) {
                          const userEmail = counselor.user.email
                          handleReschedule(
                            rescheduleData.id,
                            rescheduleData.date,
                            rescheduleData.time,
                            rescheduleData.address,
                            userEmail,
                          )
                        } else {
                          alert("Konselor terkait tidak ditemukan.")
                        }
                      }
                      setIsRescheduleOpen(false)
                      setRescheduleData(null)
                    }
                  }}
                >
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

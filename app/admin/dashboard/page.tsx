"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, MessageSquare, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { id } from "date-fns/locale"
import { Line, Bar, Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

// Define types
type DashboardStats = {
  totalConsultations: number
  activeUsers: number
  newMessages: number
  completedConsultations: number
  pendingSchedules: number
  acceptedSchedules: number
  consultationGrowth: number
  userGrowth: number
}

type ChartData = {
  consultationsByDay: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      fill: boolean
      tension: number
    }[]
  }
  schedulesByStatus: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor: string[]
      borderColor: string[]
      borderWidth: number
    }[]
  }
  consultationsByStatus: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor: string[]
      borderColor: string[]
      borderWidth: number
    }[]
  }
  messagesByDay: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor: string
      borderColor: string
      borderWidth: number
    }[]
  }
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalConsultations: 0,
    activeUsers: 0,
    newMessages: 0,
    completedConsultations: 0,
    pendingSchedules: 0,
    acceptedSchedules: 0,
    consultationGrowth: 0,
    userGrowth: 0,
  })
  const [chartData, setChartData] = useState<ChartData>({
    consultationsByDay: {
      labels: [],
      datasets: [
        {
          label: "Konsultasi",
          data: [],
          borderColor: "rgb(99, 102, 241)",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    schedulesByStatus: {
      labels: ["Pending", "Accepted", "Finished", "Canceled"],
      datasets: [
        {
          label: "Jadwal",
          data: [0, 0, 0, 0],
          backgroundColor: [
            "rgba(255, 206, 86, 0.7)",
            "rgba(75, 192, 192, 0.7)",
            "rgba(153, 102, 255, 0.7)",
            "rgba(255, 99, 132, 0.7)",
          ],
          borderColor: [
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 99, 132, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    consultationsByStatus: {
      labels: ["Active", "Closed"],
      datasets: [
        {
          label: "Konsultasi",
          data: [0, 0],
          backgroundColor: ["rgba(54, 162, 235, 0.7)", "rgba(255, 159, 64, 0.7)"],
          borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 159, 64, 1)"],
          borderWidth: 1,
        },
      ],
    },
    messagesByDay: {
      labels: [],
      datasets: [
        {
          label: "Pesan",
          data: [],
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgb(75, 192, 192)",
          borderWidth: 1,
        },
      ],
    },
  })

  useEffect(() => {
    // Check admin session
    const adminSession = sessionStorage.getItem("adminSession")
    if (adminSession) {
      setIsLoggedIn(true)
      fetchDashboardData()
    } else {
      router.push("/admin/login")
    }
  }, [router])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Get date ranges
      const today = new Date()
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(today, 29 - i)
        return format(date, "yyyy-MM-dd")
      })

      const lastMonth = startOfMonth(subDays(today, 30))
      const thisMonth = startOfMonth(today)
      const endOfThisMonth = endOfMonth(today)

      // Fetch consultations
      const { data: consultations, error: consultationsError } = await supabase
        .from("consultations")
        .select("id, status, created_at")

      if (consultationsError) throw consultationsError

      // Fetch schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from("schedules")
        .select("id, status, date, created_at")

      if (schedulesError) throw schedulesError

      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("id, timestamp")
        .gte("timestamp", subDays(today, 30).toISOString())

      if (messagesError) throw messagesError

      // Fetch users
      const { data: users, error: usersError } = await supabase.from("users").select("id, created_at")

      if (usersError) throw usersError

      // Calculate stats
      const totalConsultations = consultations.length
      const activeUsers = users.length
      const newMessages = messages.filter((m) => new Date(m.timestamp) >= subDays(today, 1)).length
      const completedConsultations = consultations.filter((c) => c.status === "closed").length

      const pendingSchedules = schedules.filter((s) => s.status === "Pending").length
      const acceptedSchedules = schedules.filter((s) => s.status === "Accepted").length

      // Calculate growth rates
      const consultationsLastMonth = consultations.filter(
        (c) => new Date(c.created_at) >= lastMonth && new Date(c.created_at) < thisMonth,
      ).length

      const consultationsThisMonth = consultations.filter(
        (c) => new Date(c.created_at) >= thisMonth && new Date(c.created_at) <= endOfThisMonth,
      ).length

      const usersLastMonth = users.filter(
        (u) => new Date(u.created_at) >= lastMonth && new Date(u.created_at) < thisMonth,
      ).length

      const usersThisMonth = users.filter(
        (u) => new Date(u.created_at) >= thisMonth && new Date(u.created_at) <= endOfThisMonth,
      ).length

      const consultationGrowth =
        consultationsLastMonth > 0
          ? ((consultationsThisMonth - consultationsLastMonth) / consultationsLastMonth) * 100
          : 100

      const userGrowth = usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 : 100

      // Prepare chart data
      // Consultations by day
      const consultationsByDay = last30Days.map((date) => {
        return consultations.filter((c) => c.created_at.startsWith(date)).length
      })

      // Messages by day
      const messagesByDay = last30Days.map((date) => {
        return messages.filter((m) => m.timestamp.startsWith(date)).length
      })

      // Schedules by status
      const schedulesByStatus = [
        schedules.filter((s) => s.status === "Pending").length,
        schedules.filter((s) => s.status === "Accepted").length,
        schedules.filter((s) => s.status === "Finished").length,
        schedules.filter((s) => s.status === "Canceled").length,
      ]

      // Consultations by status
      const consultationsByStatus = [
        consultations.filter((c) => c.status === "active").length,
        consultations.filter((c) => c.status === "closed").length,
      ]

      // Update state
      setStats({
        totalConsultations,
        activeUsers,
        newMessages,
        completedConsultations,
        pendingSchedules,
        acceptedSchedules,
        consultationGrowth,
        userGrowth,
      })

      setChartData({
        consultationsByDay: {
          labels: last30Days.map((date) => format(new Date(date), "dd MMM", { locale: id })),
          datasets: [
            {
              label: "Konsultasi",
              data: consultationsByDay,
              borderColor: "rgb(99, 102, 241)",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              fill: true,
              tension: 0.4,
            },
          ],
        },
        schedulesByStatus: {
          labels: ["Pending", "Accepted", "Finished", "Canceled"],
          datasets: [
            {
              label: "Jadwal",
              data: schedulesByStatus,
              backgroundColor: [
                "rgba(255, 206, 86, 0.7)",
                "rgba(75, 192, 192, 0.7)",
                "rgba(153, 102, 255, 0.7)",
                "rgba(255, 99, 132, 0.7)",
              ],
              borderColor: [
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 99, 132, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        consultationsByStatus: {
          labels: ["Active", "Closed"],
          datasets: [
            {
              label: "Konsultasi",
              data: consultationsByStatus,
              backgroundColor: ["rgba(54, 162, 235, 0.7)", "rgba(255, 159, 64, 0.7)"],
              borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 159, 64, 1)"],
              borderWidth: 1,
            },
          ],
        },
        messagesByDay: {
          labels: last30Days.map((date) => format(new Date(date), "dd MMM", { locale: id })),
          datasets: [
            {
              label: "Pesan",
              data: messagesByDay,
              backgroundColor: "rgba(75, 192, 192, 0.5)",
              borderColor: "rgb(75, 192, 192)",
              borderWidth: 1,
            },
          ],
        },
      })

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setIsLoading(false)
    }
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h2 className="text-3xl font-bold tracking-tight mb-6">Dashboard Admin</h2>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Konsultasi</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalConsultations}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp
                    className={`h-3 w-3 mr-1 ${stats.consultationGrowth >= 0 ? "text-green-500" : "text-red-500"}`}
                  />
                  {stats.consultationGrowth >= 0 ? "+" : ""}
                  {stats.consultationGrowth.toFixed(1)}% dari bulan lalu
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pengguna Aktif</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className={`h-3 w-3 mr-1 ${stats.userGrowth >= 0 ? "text-green-500" : "text-red-500"}`} />
                  {stats.userGrowth >= 0 ? "+" : ""}
                  {stats.userGrowth.toFixed(1)}% dari bulan lalu
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pesan Baru</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.newMessages}</div>
                <p className="text-xs text-muted-foreground">Dalam 24 jam terakhir</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jadwal Pertemuan</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingSchedules + stats.acceptedSchedules}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingSchedules} pending, {stats.acceptedSchedules} accepted
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="consultations">Konsultasi</TabsTrigger>
              <TabsTrigger value="schedules">Jadwal</TabsTrigger>
              <TabsTrigger value="messages">Pesan</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tren Konsultasi (30 Hari Terakhir)</CardTitle>
                    <CardDescription>Jumlah konsultasi baru per hari</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <Line
                      data={chartData.consultationsByDay}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              precision: 0,
                            },
                          },
                        },
                        plugins: {
                          legend: {
                            position: "top",
                          },
                        },
                      }}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Status Jadwal</CardTitle>
                    <CardDescription>Distribusi jadwal berdasarkan status</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80 flex justify-center items-center">
                    <div className="w-64 h-64">
                      <Doughnut
                        data={chartData.schedulesByStatus}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="consultations" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tren Konsultasi (30 Hari Terakhir)</CardTitle>
                    <CardDescription>Jumlah konsultasi baru per hari</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <Line
                      data={chartData.consultationsByDay}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              precision: 0,
                            },
                          },
                        },
                      }}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Status Konsultasi</CardTitle>
                    <CardDescription>Distribusi konsultasi berdasarkan status</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80 flex justify-center items-center">
                    <div className="w-64 h-64">
                      <Doughnut
                        data={chartData.consultationsByStatus}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Statistik Konsultasi</CardTitle>
                    <CardDescription>Ringkasan data konsultasi</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Total</h3>
                        <p className="text-2xl font-bold">{stats.totalConsultations}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Aktif</h3>
                        <p className="text-2xl font-bold">{chartData.consultationsByStatus.datasets[0].data[0]}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Selesai</h3>
                        <p className="text-2xl font-bold">{chartData.consultationsByStatus.datasets[0].data[1]}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Tingkat Penyelesaian</h3>
                        <p className="text-2xl font-bold">
                          {stats.totalConsultations > 0
                            ? ((stats.completedConsultations / stats.totalConsultations) * 100).toFixed(1)
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="schedules" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Status Jadwal</CardTitle>
                    <CardDescription>Distribusi jadwal berdasarkan status</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80 flex justify-center items-center">
                    <div className="w-64 h-64">
                      <Doughnut
                        data={chartData.schedulesByStatus}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "bottom",
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Statistik Jadwal</CardTitle>
                    <CardDescription>Ringkasan data jadwal pertemuan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Pending</h3>
                        <p className="text-2xl font-bold">{chartData.schedulesByStatus.datasets[0].data[0]}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Accepted</h3>
                        <p className="text-2xl font-bold">{chartData.schedulesByStatus.datasets[0].data[1]}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Finished</h3>
                        <p className="text-2xl font-bold">{chartData.schedulesByStatus.datasets[0].data[2]}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Canceled</h3>
                        <p className="text-2xl font-bold">{chartData.schedulesByStatus.datasets[0].data[3]}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Aktivitas Pesan (30 Hari Terakhir)</CardTitle>
                  <CardDescription>Jumlah pesan per hari</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <Bar
                    data={chartData.messagesByDay}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0,
                          },
                        },
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

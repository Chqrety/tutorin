"use client"

import { useState, useEffect } from "react"
import { useMediaQuery } from "react-responsive"
import { supabase } from "@/lib/supabase"
import { format, isToday, isFuture, isPast, addDays, isThisWeek, isThisMonth } from "date-fns"
import { BarChart, Calendar, Clock, Home, Settings, Bell, CalendarDays, User, CheckCircle, AlertCircle, Clock3, Star, ArrowUpRight, CalendarPlus2Icon as CalendarIcon2, PieChart, Activity, Users, Plus, ChevronRight, RefreshCw, Search,MessageCircle } from 'lucide-react'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

type Schedule = {
  id: number
  date: Date
  time: string
  title: string
  description: string
  address: string
  status: string
  confirmed: boolean
  counselor?: {
    id: string
    name: string
    adminEmail: string
    avatarUrl?: string
  }
  rating?: {
    stars: number
    description: string
  }
}

export default function DashboardPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeBottomTab, setActiveBottomTab] = useState("dashboard")
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    finished: 0,
    canceled: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    online: 0,
    offline: 0,
    averageRating: 0
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Jadwal Dikonfirmasi",
      message: "Jadwal konsultasi JavaScript telah dikonfirmasi oleh admin",
      time: "10 menit yang lalu",
      read: false,
    },
    {
      id: 2,
      title: "Pengingat Jadwal",
      message: "Konsultasi PHP akan dimulai dalam 1 jam",
      time: "30 menit yang lalu",
      read: true,
    },
  ])
  const router = useRouter()
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" })

  // Get user ID from session
  useEffect(() => {
    const userSession = sessionStorage.getItem("userSession")
    if (userSession) {
      const { userId } = JSON.parse(userSession)
      setUserId(userId)
    } else {
      console.error("User session tidak ditemukan!")
    }
  }, [])

  // Fetch schedules
  useEffect(() => {
    if (!userId) return
    
    const fetchSchedules = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("schedules")
          .select(`
            *,
            counselor: counselors(id, admin: admins(name, email)),
            rating: ratings(stars, description)
          `)
          .eq("user_id", userId)
          .order("date", { ascending: false })
        
        if (error) {
          console.error("Error fetching schedules:", error)
          return
        }
        
        const transformedData = data.map((item: any) => ({
          id: item.id,
          date: new Date(item.date),
          time: item.time,
          title: item.title,
          description: item.description,
          address: item.address,
          status: item.status,
          confirmed: item.confirmed,
          counselor: item.counselor
            ? {
                id: item.counselor.id,
                name: item.counselor.admin.name,
                adminEmail: item.counselor.admin.email,
                avatarUrl: null, // This would come from profiles if available
              }
            : null,
          rating: item.rating
            ? {
                stars: item.rating.stars,
                description: item.rating.description,
              }
            : null,
        }))
        
        setSchedules(transformedData)
        calculateStats(transformedData)
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSchedules()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel("schedules-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "schedules",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchSchedules()
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(subscription)
    }
  }, [userId])

  // Calculate statistics
  const calculateStats = (scheduleData: Schedule[]) => {
    const pending = scheduleData.filter(s => s.status === "Pending").length
    const accepted = scheduleData.filter(s => s.status === "Accepted").length
    const finished = scheduleData.filter(s => s.status === "Finished").length
    const canceled = scheduleData.filter(s => s.status === "Canceled").length
    const today = scheduleData.filter(s => isToday(s.date)).length
    const thisWeek = scheduleData.filter(s => isThisWeek(s.date)).length
    const thisMonth = scheduleData.filter(s => isThisMonth(s.date)).length
    const online = scheduleData.filter(s => s.address.toLowerCase().includes("online")).length
    const offline = scheduleData.length - online
    
    // Calculate average rating
    const ratingsData = scheduleData
      .filter(s => s.rating?.stars)
      .map(s => s.rating?.stars || 0)
    
    const averageRating = ratingsData.length 
      ? ratingsData.reduce((sum, rating) => sum + rating, 0) / ratingsData.length 
      : 0
    
    setStats({
      total: scheduleData.length,
      pending,
      accepted,
      finished,
      canceled,
      today,
      thisWeek,
      thisMonth,
      online,
      offline,
      averageRating: parseFloat(averageRating.toFixed(1))
    })
  }

  // Refresh data
  const refreshData = async () => {
    if (!userId) return
    
    setIsRefreshing(true)
    try {
      const { data, error } = await supabase
        .from("schedules")
        .select(`
          *,
          counselor: counselors(id, admin: admins(name, email)),
          rating: ratings(stars, description)
        `)
        .eq("user_id", userId)
        .order("date", { ascending: false })
      
      if (error) {
        console.error("Error refreshing data:", error)
        return
      }
      
      const transformedData = data.map((item: any) => ({
        id: item.id,
        date: new Date(item.date),
        time: item.time,
        title: item.title,
        description: item.description,
        address: item.address,
        status: item.status,
        confirmed: item.confirmed,
        counselor: item.counselor
          ? {
              id: item.counselor.id,
              name: item.counselor.admin.name,
              adminEmail: item.counselor.admin.email,
              avatarUrl: null,
            }
          : null,
        rating: item.rating
          ? {
              stars: item.rating.stars,
              description: item.rating.description,
            }
          : null,
      }))
      
      setSchedules(transformedData)
      calculateStats(transformedData)
    } catch (err) {
      console.error("Error refreshing data:", err)
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 800)
    }
  }

  // Get upcoming schedules
  const upcomingSchedules = schedules
    .filter(s => {
      const scheduleDate = new Date(`${format(s.date, 'yyyy-MM-dd')}T${s.time}`)
      return scheduleDate > new Date() && (s.status === "Pending" || s.status === "Accepted")
    })
    .sort((a, b) => {
      const dateA = new Date(`${format(a.date, 'yyyy-MM-dd')}T${a.time}`)
      const dateB = new Date(`${format(b.date, 'yyyy-MM-dd')}T${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })
    .slice(0, 5)

  // Get recent schedules
  const recentSchedules = schedules
    .sort((a, b) => {
      const dateA = new Date(`${format(a.date, 'yyyy-MM-dd')}T${a.time}`)
      const dateB = new Date(`${format(b.date, 'yyyy-MM-dd')}T${b.time}`)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 5)

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-100 border-yellow-400/30">
            <Clock3 className="h-3 w-3 mr-1" /> Pending
          </Badge>
        )
      case "Accepted":
        return (
          <Badge className="bg-blue-500/20 text-blue-100 border-blue-400/30">
            <CheckCircle className="h-3 w-3 mr-1" /> Accepted
          </Badge>
        )
      case "Finished":
        return (
          <Badge className="bg-green-500/20 text-green-100 border-green-400/30">
            <CheckCircle className="h-3 w-3 mr-1" /> Finished
          </Badge>
        )
      case "Canceled":
        return (
          <Badge className="bg-red-500/20 text-red-100 border-red-400/30">
            <AlertCircle className="h-3 w-3 mr-1" /> Canceled
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }
   useEffect(() => {
    setIsClient(true)
  }, [])

  const handleTabClick = (tab: string) => {
    setActiveBottomTab(tab)
    if (isClient) { // Cek bahwa ini hanya jalan di client
      switch (tab) {
        case "home":
          router.push("/dashboard") // Ganti dengan rute halaman yang sesuai
          break
        case "konsultasi":
          router.push("/dashboard/konsultasi") // Ganti dengan rute halaman yang sesuai
          break
        case "schedule":
          router.push("/dashboard/jadwal") // Ganti dengan rute halaman yang sesuai
          break
        case "settings":
          router.push("/dashboard/profile") // Ganti dengan rute halaman yang sesuai
          break
        default:
          break
      }
    }
  }
  
  // Render schedule card
  const renderScheduleCard = (schedule: Schedule) => {
    return (
      <motion.div
        key={schedule.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer mb-3"
      >
        <div className="flex items-start gap-3">
          <div className="bg-blue-500/20 rounded-lg p-2 flex-shrink-0">
            <CalendarDays className="h-6 w-6 text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{schedule.title}</h3>
            <div className="flex items-center gap-1 text-sm text-blue-200 mt-1">
              <Clock className="h-3 w-3" />
              <span>{format(schedule.date, "dd MMM")} • {schedule.time}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-blue-200 mt-1">
              <User className="h-3 w-3" />
              <span className="truncate">{schedule.counselor?.name || "Konselor"}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            {getStatusBadge(schedule.status)}
          </div>
        </div>
      </motion.div>
    )
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white">
        {/* Mobile status bar */}
        <div className="sticky top-0 z-50 backdrop-blur-md bg-blue-900/80 border-b border-white/10 px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white relative"
                onClick={() => {}}
              >
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={refreshData}
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="px-4 pb-24 pt-4">
          {/* Welcome section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">Selamat Datang!</h2>
            <p className="text-blue-200">Berikut ringkasan jadwal konsultasi Anda</p>
          </div>

          {/* Stats overview */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="backdrop-blur-md bg-white/10 border border-white/20">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-blue-200 text-sm">Total Jadwal</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-bold text-white">{isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.total}</span>
                    <Calendar className="h-5 w-5 text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-md bg-white/10 border border-white/20">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-blue-200 text-sm">Jadwal Hari Ini</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-bold text-white">{isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.today}</span>
                    <Clock className="h-5 w-5 text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-md bg-white/10 border border-white/20">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-blue-200 text-sm">Pending</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-bold text-white">{isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.pending}</span>
                    <Clock3 className="h-5 w-5 text-yellow-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-md bg-white/10 border border-white/20">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-blue-200 text-sm">Accepted</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-bold text-white">{isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.accepted}</span>
                    <CheckCircle className="h-5 w-5 text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress overview */}
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Status Jadwal</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full bg-white/10" />
                  <Skeleton className="h-4 w-full bg-white/10" />
                  <Skeleton className="h-4 w-full bg-white/10" />
                  <Skeleton className="h-4 w-full bg-white/10" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">Pending</span>
                      <span className="text-blue-200">{stats.pending} dari {stats.total}</span>
                    </div>
                    <Progress value={(stats.pending / stats.total) * 100} className="h-2 bg-white/10 [&>div]:bg-yellow-400" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">Accepted</span>
                      <span className="text-blue-200">{stats.accepted} dari {stats.total}</span>
                    </div>
                    <Progress value={(stats.accepted / stats.total) * 100} className="h-2 bg-white/10 [&>div]:bg-blue-400" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">Finished</span>
                      <span className="text-blue-200">{stats.finished} dari {stats.total}</span>
                    </div>
                    <Progress value={(stats.finished / stats.total) * 100} className="h-2 bg-white/10 [&>div]:bg-green-400" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">Canceled</span>
                      <span className="text-blue-200">{stats.canceled} dari {stats.total}</span>
                    </div>
                    <Progress value={(stats.canceled / stats.total) * 100} className="h-2 bg-white/10 [&>div]:bg-red-400" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming schedules */}
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 mb-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white text-lg">Jadwal Mendatang</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-200 hover:text-white">
                  Lihat Semua
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-3/4 bg-white/10 mb-2" />
                          <Skeleton className="h-4 w-1/2 bg-white/10 mb-2" />
                          <Skeleton className="h-4 w-2/3 bg-white/10" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingSchedules.length > 0 ? (
                <div>
                  {upcomingSchedules.map(renderScheduleCard)}
                </div>
              ) : (
                <div className="text-center py-6 text-blue-200 bg-white/5 rounded-lg border border-white/10">
                  <CalendarDays className="h-10 w-10 mx-auto text-blue-300/50 mb-2" />
                  <p>Tidak ada jadwal mendatang</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Card className="backdrop-blur-md bg-white/10 border border-white/20">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-blue-200 text-sm">Online</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-bold text-white">{isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.online}</span>
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-200">{stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-md bg-white/10 border border-white/20">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-blue-200 text-sm">Offline</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-bold text-white">{isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.offline}</span>
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-200">{stats.total > 0 ? Math.round((stats.offline / stats.total) * 100) : 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rating overview */}
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Rating Rata-rata</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center justify-center py-4">
                {isLoading ? (
                  <Skeleton className="h-16 w-16 rounded-full bg-white/10" />
                ) : (
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">{stats.averageRating}</span>
                    </div>
                    <div className="absolute -top-1 -right-1 bg-yellow-400/90 text-yellow-950 text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center">
                      <Star className="h-5 w-5 fill-yellow-950" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-5 w-5 ${star <= Math.round(stats.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-blue-300/30'}`} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-center text-blue-200 text-sm mt-2">
                Berdasarkan {schedules.filter(s => s.rating).length} rating
              </p>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Aktivitas Terbaru</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 bg-white/10 mb-2" />
                        <Skeleton className="h-3 w-1/2 bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentSchedules.length > 0 ? (
                <div className="space-y-4">
                  {recentSchedules.map(schedule => (
                    <div key={schedule.id} className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center 
                        ${schedule.status === 'Pending' ? 'bg-yellow-500/20' : 
                          schedule.status === 'Accepted' ? 'bg-blue-500/20' : 
                          schedule.status === 'Finished' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {schedule.status === 'Pending' ? <Clock3 className="h-4 w-4 text-yellow-300" /> :
                         schedule.status === 'Accepted' ? <CheckCircle className="h-4 w-4 text-blue-300" /> :
                         schedule.status === 'Finished' ? <Star className="h-4 w-4 text-green-300" /> :
                         <AlertCircle className="h-4 w-4 text-red-300" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{schedule.title}</p>
                        <p className="text-blue-200 text-xs">{format(schedule.date, "dd MMM yyyy")} • {schedule.time}</p>
                      </div>
                      {getStatusBadge(schedule.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-blue-200">
                  <Activity className="h-10 w-10 mx-auto text-blue-300/50 mb-2" />
                  <p>Belum ada aktivitas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-blue-900/90 backdrop-blur-md border-t border-white/10 z-50">
      <div className="flex justify-around items-center py-2">
        <Button
          variant="ghost"
          className={`flex flex-col items-center gap-1 h-auto py-2 ${
            activeBottomTab === "home" ? "text-white" : "text-blue-200"
          }`}
          onClick={() => handleTabClick("home")}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </Button>
        <Button
          variant="ghost"
          className={`flex flex-col items-center gap-1 h-auto py-2 ${
            activeBottomTab === "konsultasi" ? "text-white" : "text-blue-200"
          }`}
          onClick={() => handleTabClick("konsultasi")}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">Konsultasi</span>
        </Button>
        <div className="-mt-5">
          <Button
            className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30 shadow-lg"
            size="icon"
            onClick={() => {}}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
        <Button
          variant="ghost"
          className={`flex flex-col items-center gap-1 h-auto py-2 ${
            activeBottomTab === "schedule" ? "text-white" : "text-blue-200"
          }`}
          onClick={() => handleTabClick("schedule")}
        >
          <CalendarIcon2 className="h-5 w-5" />
          <span className="text-xs">Jadwal</span>
        </Button>
        <Button
          variant="ghost"
          className={`flex flex-col items-center gap-1 h-auto py-2 ${
            activeBottomTab === "settings" ? "text-white" : "text-blue-200"
          }`}
          onClick={() => handleTabClick("settings")}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs">Settings</span>
        </Button>
      </div>
    </div>
      </div>
    )
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white py-6">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-950/50 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Header with title and actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center">
                  <BarChart className="h-7 w-7 mr-3 text-blue-300" />
                  Dashboard
                </h1>
                <p className="text-blue-200 mt-1">Ringkasan dan statistik jadwal konsultasi Anda</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 relative"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
                  onClick={refreshData}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Cari Jadwal
                </Button>

                <Button
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Jadwal
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Total Jadwal</CardTitle>
                <CardDescription className="text-blue-200">Semua jadwal konsultasi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {isLoading ? <Skeleton className="h-10 w-16 bg-white/10" /> : stats.total}
                    </div>
                    <div className="text-sm text-blue-200 mt-1">Jadwal</div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-300" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" className="text-blue-200 hover:text-white p-0">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>Lihat Semua</span>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Jadwal Pending</CardTitle>
                <CardDescription className="text-blue-200">Menunggu konfirmasi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {isLoading ? <Skeleton className="h-10 w-16 bg-white/10" /> : stats.pending}
                    </div>
                    <div className="text-sm text-blue-200 mt-1">Jadwal</div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock3 className="h-6 w-6 text-yellow-300" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" className="text-blue-200 hover:text-white p-0">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>Lihat Pending</span>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Jadwal Accepted</CardTitle>
                <CardDescription className="text-blue-200">Telah dikonfirmasi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {isLoading ? <Skeleton className="h-10 w-16 bg-white/10" /> : stats.accepted}
                    </div>
                    <div className="text-sm text-blue-200 mt-1">Jadwal</div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-blue-300" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" className="text-blue-200 hover:text-white p-0">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>Lihat Accepted</span>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Jadwal Finished</CardTitle>
                <CardDescription className="text-blue-200">Telah selesai</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {isLoading ? <Skeleton className="h-10 w-16 bg-white/10" /> : stats.finished}
                    </div>
                    <div className="text-sm text-blue-200 mt-1">Jadwal</div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Star className="h-6 w-6 text-green-300" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" size="sm" className="text-blue-200 hover:text-white p-0">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>Lihat Finished</span>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            {/* Status distribution */}
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Distribusi Status Jadwal</CardTitle>
                <CardDescription className="text-blue-200">
                  Persentase jadwal berdasarkan status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Skeleton className="h-48 w-full rounded-lg bg-white/10" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2">
                          <Clock3 className="h-8 w-8 text-yellow-300" />
                        </div>
                        <div className="text-lg font-bold text-white">{stats.pending}</div>
                        <div className="text-sm text-blue-200">Pending</div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                          <CheckCircle className="h-8 w-8 text-blue-300" />
                        </div>
                        <div className="text-lg font-bold text-white">{stats.accepted}</div>
                        <div className="text-sm text-blue-200">Accepted</div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                          <Star className="h-8 w-8 text-green-300" />
                        </div>
                        <div className="text-lg font-bold text-white">{stats.finished}</div>
                        <div className="text-sm text-blue-200">Finished</div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                          <AlertCircle className="h-8 w-8 text-red-300" />
                        </div>
                        <div className="text-lg font-bold text-white">{stats.canceled}</div>
                        <div className="text-sm text-blue-200">Canceled</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-200">Pending</span>
                          <span className="text-blue-200">{stats.pending} dari {stats.total}</span>
                        </div>
                        <Progress value={(stats.pending / stats.total) * 100} className="h-2 bg-white/10 [&>div]:bg-yellow-400" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-200">Accepted</span>
                          <span className="text-blue-200">{stats.accepted} dari {stats.total}</span>
                        </div>
                        <Progress value={(stats.accepted / stats.total) * 100} className="h-2 bg-white/10 [&>div]:bg-blue-400" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-200">Finished</span>
                          <span className="text-blue-200">{stats.finished} dari {stats.total}</span>
                        </div>
                        <Progress value={(stats.finished / stats.total) * 100} className="h-2 bg-white/10 [&>div]:bg-green-400" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-200">Canceled</span>
                          <span className="text-blue-200">{stats.canceled} dari {stats.total}</span>
                        </div>
                        <Progress value={(stats.canceled / stats.total) * 100} className="h-2 bg-white/10 [&>div]:bg-red-400" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming schedules */}
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Jadwal Mendatang</CardTitle>
                    <CardDescription className="text-blue-200">
                      Jadwal konsultasi yang akan datang
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20">
                    Lihat Semua
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-10 w-10 rounded-lg bg-white/10" />
                          <div className="flex-1">
                            <Skeleton className="h-5 w-3/4 bg-white/10 mb-2" />
                            <Skeleton className="h-4 w-1/2 bg-white/10 mb-2" />
                            <Skeleton className="h-4 w-2/3 bg-white/10" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : upcomingSchedules.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingSchedules.map(renderScheduleCard)}
                  </div>
                ) : (
                  <div className="text-center py-8 text-blue-200 bg-white/5 rounded-lg border border-white/10">
                    <CalendarDays className="h-12 w-12 mx-auto text-blue-300/50 mb-3" />
                    <p className="mb-4">Tidak ada jadwal mendatang</p>
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Tambah Jadwal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent activity */}
            <Card className="backdrop-blur-md bg-white/10 border border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Aktivitas Terbaru</CardTitle>
                <CardDescription className="text-blue-200">
                  Aktivitas jadwal konsultasi terbaru
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-start gap-3">
                        <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/4 bg-white/10 mb-2" />
                          <Skeleton className="h-3 w-1/2 bg-white/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentSchedules.length > 0 ? (
                  <div className="space-y-4">
                    {recentSchedules.map(schedule => (
                      <div key={schedule.id} className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center 
                          ${schedule.status === 'Pending' ? 'bg-yellow-500/20' : 
                            schedule.status === 'Accepted' ? 'bg-blue-500/20' : 
                            schedule.status === 'Finished' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {schedule.status === 'Pending' ? <Clock3 className="h-4 w-4 text-yellow-300" /> :
                           schedule.status === 'Accepted' ? <CheckCircle className="h-4 w-4 text-blue-300" /> :
                           schedule.status === 'Finished' ? <Star className="h-4 w-4 text-green-300" /> :
                           <AlertCircle className="h-4 w-4 text-red-300" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{schedule.title}</p>
                          <p className="text-blue-200 text-xs">{format(schedule.date, "dd MMM yyyy")} • {schedule.time}</p>
                        </div>
                        {getStatusBadge(schedule.status)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-blue-200">
                    <Activity className="h-12 w-12 mx-auto text-blue-300/50 mb-3" />
                    <p>Belum ada aktivitas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            {/* Time distribution */}
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Distribusi Waktu</CardTitle>
                <CardDescription className="text-blue-200">
                  Jadwal berdasarkan periode waktu
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full bg-white/10" />
                    <Skeleton className="h-4 w-full bg-white/10" />
                    <Skeleton className="h-4 w-full bg-white/10" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-blue-400"></div>
                        <span className="text-blue-200">Hari Ini</span>
                      </div>
                      <span className="text-white font-medium">{stats.today}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-green-400"></div>
                        <span className="text-blue-200">Minggu Ini</span>
                      </div>
                      <span className="text-white font-medium">{stats.thisWeek}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-yellow-400"></div>
                        <span className="text-blue-200">Bulan Ini</span>
                      </div>
                      <span className="text-white font-medium">{stats.thisMonth}</span>
                    </div>
                    
                    <div className="h-[1px] bg-white/10 my-2"></div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-purple-400"></div>
                        <span className="text-blue-200">Online</span>
                      </div>
                      <span className="text-white font-medium">{stats.online}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-pink-400"></div>
                        <span className="text-blue-200">Offline</span>
                      </div>
                      <span className="text-white font-medium">{stats.offline}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rating overview */}
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Rating Rata-rata</CardTitle>
                <CardDescription className="text-blue-200">
                  Berdasarkan {schedules.filter(s => s.rating).length} rating
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  {isLoading ? (
                    <Skeleton className="h-24 w-24 rounded-full bg-white/10" />
                  ) : (
                    <div className="relative">
                      <div className="h-32 w-32 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">{stats.averageRating}</span>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-yellow-400/90 text-yellow-950 text-xs font-bold rounded-full h-10 w-10 flex items-center justify-center">
                        <Star className="h-6 w-6 fill-yellow-950" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-center mt-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-6 w-6 ${star <= Math.round(stats.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-blue-300/30'}`} 
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="backdrop-blur-md bg-white/10 border border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Aksi Cepat</CardTitle>
                <CardDescription className="text-blue-200">
                  Akses cepat ke fitur utama
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30 justify-between">
                  <div className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Tambah Jadwal Baru</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button variant="outline" className="w-full bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 justify-between">
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    <span>Lihat Semua Jadwal</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button variant="outline" className="w-full bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Kelola Konselor</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button variant="outline" className="w-full bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 justify-between">
                  <div className="flex items-center">
                    <PieChart className="h-4 w-4 mr-2" />
                    <span>Lihat Statistik Lanjutan</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom navigation for desktop (fixed at bottom) */}
        <div className="fixed bottom-0 left-0 right-0 bg-blue-900/90 backdrop-blur-md border-t border-white/10 z-50 lg:hidden">
          <div className="flex justify-around items-center py-2 container mx-auto">
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 h-auto py-2 ${
                activeBottomTab === "home" ? "text-white" : "text-blue-200"
              }`}
              onClick={() => setActiveBottomTab("home")}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 h-auto py-2 ${
                activeBottomTab === "dashboard" ? "text-white" : "text-blue-200"
              }`}
              onClick={() => setActiveBottomTab("dashboard")}
            >
            <MessageCircle className="h-5 w-5" />
              <span className="text-xs">Konsultasi</span>
            </Button>
            <div className="-mt-5">
              <Button
                className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30 shadow-lg"
                size="icon"
                onClick={() => {}}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 h-auto py-2 ${
                activeBottomTab === "schedule" ? "text-white" : "text-blue-200"
              }`}
              onClick={() => setActiveBottomTab("schedule")}
            >
              <CalendarIcon2 className="h-5 w-5" />
              <span className="text-xs">Jadwal</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 h-auto py-2 ${
                activeBottomTab === "settings" ? "text-white" : "text-blue-200"
              }`}
              onClick={() => setActiveBottomTab("settings")}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

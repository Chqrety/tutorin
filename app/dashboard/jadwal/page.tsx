"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import useSWRInfinite from "swr/infinite"
import { supabase } from "@/lib/supabase"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, isToday, isFuture, isPast, addDays, isThisWeek } from "date-fns"
import { Clock, Trash, Edit, CalendarIcon, MapPin, User, Star, Plus, CheckCircle, AlertCircle, Clock3, Search, Filter, CalendarDays, ChevronLeft, ChevronRight, X, Info, ArrowRight, Video, MessageSquare, Home, CalendarPlus2Icon as CalendarIcon2, Settings, Bell, MoreVertical, RefreshCw, Check, Loader2 } from 'lucide-react'
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { toast } from "react-toastify"
import InfiniteScroll from "react-infinite-scroll-component"
import ReactStars from "react-stars"
import { useMediaQuery } from "@/hooks/use-media-query"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type SenderRole = "admin" | "user"

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

type Counselor = {
  id: string
  name: string
  adminEmail: string
  avatarUrl?: string
}

type RatingData = {
  stars: number
  description: string
}

const schema = yup.object().shape({
  title: yup.string().required("Judul wajib diisi"),
  description: yup.string().required("Deskripsi wajib diisi"),
  time: yup.string().required("Waktu wajib diisi"),
  address: yup.string().required("Alamat wajib diisi"),
  counselor_id: yup.string().required("Konselor wajib dipilih"),
})

const ratingSchema = yup.object().shape({
  stars: yup
    .number()
    .required("Rating bintang wajib diisi")
    .min(0.5, "Minimal 0.5 bintang")
    .max(5, "Maksimal 5 bintang"),
  description: yup.string().required("Deskripsi wajib diisi"),
})

const fetcher = async (userId: string, status: string, page: number, pageSize: number) => {
  console.log(`Fetching schedules for userId: ${userId}, status: ${status}, page: ${page}, pageSize: ${pageSize}`)

  const { data, error, count } = await supabase
    .from("schedules")
    .select(
      `
      *,
      counselor: counselors(id, admin: admins(name, email)),
      rating: ratings(stars, description)
    `,
      { count: "exact" },
    )
    .eq("user_id", userId)
    .eq("status", status)
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order("date", { ascending: true })
    .order("time", { ascending: true })

  if (error) {
    console.error("Error in fetcher:", error)
    throw error
  }

  return {
    schedules: data.map((item: any) => ({
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
    })),
    total: count,
  }
}

export default function JadwalPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [counselors, setCounselors] = useState<Counselor[]>([])
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [rescheduleData, setRescheduleData] = useState<{ id: number; date: Date; time: string } | null>(null)
  const [ratingData, setRatingData] = useState<{ scheduleId: number; open: boolean }>({ scheduleId: 0, open: false })
  const [activeTab, setActiveTab] = useState<"Pending" | "Accepted" | "Finished">("Pending")
  const [userId, setUserId] = useState<string | null>(null)
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    location: "all",
    counselor: "all",
    dateRange: "all",
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSwipeEnabled, setIsSwipeEnabled] = useState(true)
  const [swipeDirection, setSwipeDirection] = useState<null | "left" | "right">(null)
  const [touchStartX, setTouchStartX] = useState(0)
  const [activeBottomTab, setActiveBottomTab] = useState("schedule")
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
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

  const containerRef = useRef(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0.6, 1, 1, 0.6])

  const isMobile = useMediaQuery("(max-width: 768px)")
  const pageSize = 10

  // Pull to refresh functionality
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (scrollRef.current && scrollRef.current.scrollTop === 0) {
        setTouchStartX(e.touches[0].clientY)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX && scrollRef.current && scrollRef.current.scrollTop === 0) {
        const touchY = e.touches[0].clientY
        const diff = touchY - touchStartX
        
        if (diff > 70 && !isRefreshing) {
          setIsRefreshing(true)
          refreshData()
        }
      }
    }

    const handleTouchEnd = () => {
      setTouchStartX(0)
    }

    const scrollElement = scrollRef.current
    if (scrollElement && isMobile) {
      scrollElement.addEventListener('touchstart', handleTouchStart)
      scrollElement.addEventListener('touchmove', handleTouchMove)
      scrollElement.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      if (scrollElement && isMobile) {
        scrollElement.removeEventListener('touchstart', handleTouchStart)
        scrollElement.removeEventListener('touchmove', handleTouchMove)
        scrollElement.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [touchStartX, isRefreshing, isMobile])

  const refreshData = async () => {
    try {
      await Promise.all([
        mutatePending(),
        mutateAccepted(),
        mutateFinished()
      ])
      toast.success("Data berhasil diperbarui")
    } catch (error) {
      toast.error("Gagal memperbarui data")
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
  }

  // Swipe to action functionality
  const handleTouchStartSwipe = (e: React.TouchEvent, scheduleId: number) => {
    if (!isSwipeEnabled) return
    setTouchStartX(e.touches[0].clientX)
    setSelectedSchedule(allSchedules.find(s => s.id === scheduleId) || null)
  }

  const handleTouchMoveSwipe = (e: React.TouchEvent) => {
    if (!isSwipeEnabled || !touchStartX) return
    
    const touchX = e.touches[0].clientX
    const diff = touchX - touchStartX
    
    if (Math.abs(diff) > 50) {
      setSwipeDirection(diff > 0 ? "right" : "left")
    } else {
      setSwipeDirection(null)
    }
  }

  const handleTouchEndSwipe = () => {
    if (!isSwipeEnabled || !swipeDirection || !selectedSchedule) {
      setTouchStartX(0)
      setSwipeDirection(null)
      return
    }
    
    if (swipeDirection === "left") {
      // Left swipe action - Cancel/Delete
      if (selectedSchedule.status === "Pending" || selectedSchedule.status === "Accepted") {
        handleCancelSchedule(selectedSchedule.id)
      } else if (selectedSchedule.status === "Finished") {
        handleDeleteSchedule(selectedSchedule.id)
      }
    } else if (swipeDirection === "right") {
      // Right swipe action - Confirm/Join
      if (selectedSchedule.status === "Pending" && !selectedSchedule.confirmed) {
        handleConfirmSchedule(selectedSchedule)
      } else if ((selectedSchedule.status === "Pending" || selectedSchedule.status === "Accepted") && selectedSchedule.confirmed) {
        handleJoinConsultation(selectedSchedule)
      } else if (selectedSchedule.status === "Finished" && !selectedSchedule.rating) {
        setRatingData({ scheduleId: selectedSchedule.id, open: true })
      }
    }
    
    setTouchStartX(0)
    setSwipeDirection(null)
  }

  // Rating form
  const {
    control,
    register: registerRating,
    handleSubmit: handleSubmitRating,
    formState: { errors: errorsRating },
    reset: resetRating,
  } = useForm<RatingData>({
    resolver: yupResolver(ratingSchema),
    defaultValues: {
      stars: 0.5,
      description: "",
    },
  })

  // Schedule form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control: scheduleControl,
  } = useForm({
    resolver: yupResolver(schema),
  })

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

  // Fetch counselors
  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const { data, error } = await supabase.from("counselors").select(`
            id,
            admin:admins(name, email)
          `)

        if (error) {
          console.error("Gagal mengambil data konselor:", error)
          return
        }

        const transformedData = data.map((item: any) => ({
          id: item.id,
          name: item.admin.name,
          adminEmail: item.admin.email,
        }))

        setCounselors(transformedData)
      } catch (err) {
        console.error("Error saat mengambil data konselor:", err)
      }
    }

    fetchCounselors()
  }, [])

  // Fetcher for Accepted schedules
  const getKeyAccepted = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.schedules.length) return null
    return userId ? ["schedules", userId, "Accepted", pageIndex + 1, pageSize] : null
  }

  const fetcherAccepted = (key: any) => fetcher(key[1], key[2], key[3], key[4])

  const {
    data: dataAccepted,
    error: errorAccepted,
    size: sizeAccepted,
    setSize: setSizeAccepted,
    mutate: mutateAccepted,
  } = useSWRInfinite(getKeyAccepted, fetcherAccepted, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  })

  const acceptedSchedules = useMemo(() => {
    return dataAccepted ? dataAccepted.flatMap((page) => page.schedules) : []
  }, [dataAccepted])

  const isLoadingInitialAccepted = !dataAccepted && !errorAccepted
  const isLoadingMoreAccepted =
    isLoadingInitialAccepted ||
    (sizeAccepted > 0 && dataAccepted && typeof dataAccepted[sizeAccepted - 1] === "undefined")
  const isEmptyAccepted = dataAccepted?.[0]?.schedules?.length === 0
  const isReachingEndAccepted =
    isEmptyAccepted || (dataAccepted && dataAccepted[dataAccepted.length - 1]?.schedules.length < pageSize)

  // Fetcher for Pending schedules
  const getKeyPending = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.schedules.length) return null
    return userId ? ["schedules", userId, "Pending", pageIndex + 1, pageSize] : null
  }

  const fetcherPending = (key: any) => fetcher(key[1], key[2], key[3], key[4])

  const {
    data: dataPending,
    error: errorPending,
    size: sizePending,
    setSize: setSizePending,
    mutate: mutatePending,
  } = useSWRInfinite(getKeyPending, fetcherPending, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  })

  const pendingSchedules = useMemo(() => {
    return dataPending ? dataPending.flatMap((page) => page.schedules) : []
  }, [dataPending])

  const isLoadingInitialPending = !dataPending && !errorPending
  const isLoadingMorePending =
    isLoadingInitialPending || (sizePending > 0 && dataPending && typeof dataPending[sizePending - 1] === "undefined")
  const isEmptyPending = dataPending?.[0]?.schedules?.length === 0
  const isReachingEndPending =
    isEmptyPending || (dataPending && dataPending[dataPending.length - 1]?.schedules.length < pageSize)

  // Fetcher for Finished schedules
  const getKeyFinished = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.schedules.length) return null
    return userId ? ["schedules", userId, "Finished", pageIndex + 1, pageSize] : null
  }

  const fetcherFinished = (key: any) => fetcher(key[1], key[2], key[3], key[4])

  const {
    data: dataFinished,
    error: errorFinished,
    size: sizeFinished,
    setSize: setSizeFinished,
    mutate: mutateFinished,
  } = useSWRInfinite(getKeyFinished, fetcherFinished, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  })

  const finishedSchedules = useMemo(() => {
    return dataFinished ? dataFinished.flatMap((page) => page.schedules) : []
  }, [dataFinished])

  const isLoadingInitialFinished = !dataFinished && !errorFinished
  const isLoadingMoreFinished =
    isLoadingInitialFinished ||
    (sizeFinished > 0 && dataFinished && typeof dataFinished[sizeFinished - 1] === "undefined")
  const isEmptyFinished = dataFinished?.[0]?.schedules?.length === 0
  const isReachingEndFinished =
    isEmptyFinished || (dataFinished && dataFinished[dataFinished.length - 1]?.schedules.length < pageSize)

  // All schedules combined for filtering and calendar view
  const allSchedules = useMemo(() => {
    return [...pendingSchedules, ...acceptedSchedules, ...finishedSchedules]
  }, [pendingSchedules, acceptedSchedules, finishedSchedules])

  // Upcoming schedules
  const upcomingSchedules = useMemo(() => {
    const now = new Date()
    return allSchedules
      .filter(s => {
        const scheduleDate = new Date(`${format(s.date, 'yyyy-MM-dd')}T${s.time}`)
        return scheduleDate > now && s.status !== "Canceled"
      })
      .sort((a, b) => {
        const dateA = new Date(`${format(a.date, 'yyyy-MM-dd')}T${a.time}`)
        const dateB = new Date(`${format(b.date, 'yyyy-MM-dd')}T${b.time}`)
        return dateA.getTime() - dateB.getTime()
      })
  }, [allSchedules])

  // Today's schedules
  const todaySchedules = useMemo(() => {
    return allSchedules.filter(s => isToday(s.date))
  }, [allSchedules])

  // This week's schedules
  const thisWeekSchedules = useMemo(() => {
    return allSchedules.filter(s => isThisWeek(s.date))
  }, [allSchedules])

  // Filtered schedules based on search query and filters
  const filteredSchedules = useMemo(() => {
    let filtered = allSchedules

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (schedule) =>
          schedule.title.toLowerCase().includes(query) ||
          schedule.description.toLowerCase().includes(query) ||
          (schedule.counselor?.name.toLowerCase().includes(query) || false) ||
          schedule.address.toLowerCase().includes(query),
      )
    }

    // Filter by location
    if (filterOptions.location !== "all") {
      filtered = filtered.filter((schedule) => {
        if (filterOptions.location === "online") {
          return schedule.address.toLowerCase().includes("online")
        } else if (filterOptions.location === "offline") {
          return !schedule.address.toLowerCase().includes("online")
        }
        return true
      })
    }

    // Filter by counselor
    if (filterOptions.counselor !== "all") {
      filtered = filtered.filter((schedule) => schedule.counselor?.id === filterOptions.counselor)
    }

    // Filter by date range
    if (filterOptions.dateRange !== "all") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (filterOptions.dateRange === "today") {
        filtered = filtered.filter((schedule) => isToday(schedule.date))
      } else if (filterOptions.dateRange === "upcoming") {
        filtered = filtered.filter((schedule) => isFuture(schedule.date))
      } else if (filterOptions.dateRange === "past") {
        filtered = filtered.filter((schedule) => isPast(schedule.date))
      } else if (filterOptions.dateRange === "week") {
        const nextWeek = addDays(today, 7)
        filtered = filtered.filter((schedule) => schedule.date >= today && schedule.date <= nextWeek)
      }
    }

    return filtered
  }, [allSchedules, searchQuery, filterOptions])

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return

    const subscriptionAccepted = supabase
      .channel("accepted-schedules")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "schedules",
          filter: `user_id=eq.${userId}&status=eq.Accepted`,
        },
        () => {
          mutateAccepted()
        },
      )
      .subscribe()

    const subscriptionPending = supabase
      .channel("pending-schedules")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "schedules",
          filter: `user_id=eq.${userId}&status=eq.Pending`,
        },
        () => {
          mutatePending()
        },
      )
      .subscribe()

    const subscriptionFinished = supabase
      .channel("finished-schedules")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "schedules",
          filter: `user_id=eq.${userId}&status=eq.Finished`,
        },
        () => {
          mutateFinished()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscriptionAccepted)
      supabase.removeChannel(subscriptionPending)
      supabase.removeChannel(subscriptionFinished)
    }
  }, [userId, mutateAccepted, mutatePending, mutateFinished])

  // Email notification function
  const sendEmailNotification = async (
    adminEmail: string,
    scheduleId: number,
    date: string,
    time: string,
    address: string,
    title: string,
    senderRole: SenderRole,
    action: string,
  ) => {
    try {
      const subjectMap: Record<string, string> = {
        add: `Jadwal Konsultasi Baru: ${title}`,
        reschedule: `Jadwal Konsultasi Di-reschedule: ${title}`,
        cancel: `Jadwal Konsultasi Dibatalkan: ${title}`,
        confirm: `Konfirmasi Jadwal Konsultasi: ${title}`,
        delete: `Jadwal Konsultasi Dihapus: ${title}`,
        finished: `Jadwal Konsultasi Selesai: ${title}`,
      }

      const bodyMap: Record<string, string> = {
        add: `
Anda memiliki jadwal konsultasi baru.

ID Jadwal: ${scheduleId}
Tanggal: ${date}
Waktu: ${time}
Alamat: ${address}
Judul: ${title}

Silakan login ke dashboard untuk melihat detail lebih lanjut.
        `,
        reschedule: `
Jadwal konsultasi Anda telah di-reschedule.

ID Jadwal: ${scheduleId}
Tanggal Baru: ${date}
Waktu Baru: ${time}
Alamat: ${address}
Judul: ${title}

Silakan login ke dashboard untuk melihat detail lebih lanjut.
        `,
        cancel: `
Jadwal konsultasi Anda telah dibatalkan.

ID Jadwal: ${scheduleId}
Tanggal: ${date}
Waktu: ${time}
Alamat: ${address}
Judul: ${title}

Silakan hubungi kami jika Anda memiliki pertanyaan lebih lanjut.
        `,
        confirm: `
Jadwal konsultasi Anda telah dikonfirmasi.

ID Jadwal: ${scheduleId}
Tanggal: ${date}
Waktu: ${time}
Alamat: ${address}
Judul: ${title}

Terima kasih telah mengonfirmasi jadwal ini.
        `,
        delete: `
Jadwal konsultasi Anda telah dihapus.

ID Jadwal: ${scheduleId}
Tanggal: ${date}
Waktu: ${time}
Alamat: ${address}
Judul: ${title}

Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi kami.
        `,
        finished: `
Jadwal konsultasi Anda telah ditandai sebagai selesai.

ID Jadwal: ${scheduleId}
Tanggal: ${date}
Waktu: ${time}
Alamat: ${address}
Judul: ${title}

Terima kasih telah menggunakan layanan kami.
        `,
      }

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          email: adminEmail,
          subject: subjectMap[action],
          body: bodyMap[action],
          senderRole,
          action,
        }),
      })

      if (response.ok) {
        console.log(`Notifikasi email (${action}) berhasil dikirim.`)
        return true
      } else {
        const data = await response.json()
        console.error(`Gagal mengirim email (${action}):`, data.message)
        return false
      }
    } catch (err) {
      console.error(`Error saat mengirim email (${action}):`, err)
      return false
    }
  }

  // Add schedule function
  const onSubmit = async (formData: any) => {
    const { title, description, time, address, counselor_id } = formData

    if (date) {
      try {
        const userSession = sessionStorage.getItem("userSession")
        if (!userSession) throw new Error("Anda belum login!")

        const { userId } = JSON.parse(userSession)

        const { error } = await supabase
          .from("schedules")
          .insert({
            user_id: userId,
            date: date.toISOString().split("T")[0],
            time: time,
            title: title,
            description: description,
            address: address,
            counselor_id: counselor_id,
            status: "Pending",
            confirmed: false,
          })
          .select(`
            *,
            counselor: counselors(id, admin: admins(name, email))
          `)

        if (error) {
          console.error(error)
          toast.error("Gagal menambahkan jadwal.")
          return
        }

        mutatePending()
        mutateAccepted()
        mutateFinished()

        reset()
        setIsAddScheduleOpen(false)
        toast.success("Jadwal berhasil ditambahkan! Silakan konfirmasi untuk mengirim notifikasi email.")
      } catch (err: any) {
        console.error(err)
        toast.error("Terjadi kesalahan. Coba lagi.")
      }
    } else {
      toast.error("Tanggal wajib dipilih.")
    }
  }

  // Reschedule function
  const handleReschedule = async (scheduleId: number, newDate: Date, newTime: string) => {
    if (!newDate || !newTime) {
      toast.error("Tanggal dan waktu baru wajib diisi.")
      return
    }

    try {
      const { error } = await supabase
        .from("schedules")
        .update({ date: newDate.toISOString().split("T")[0], time: newTime })
        .eq("id", scheduleId)

      if (error) {
        console.error("Gagal mereschedule jadwal:", error)
        toast.error("Gagal mereschedule jadwal.")
        return
      }

      mutatePending()
      mutateAccepted()
      mutateFinished()

      toast.success("Jadwal berhasil di-reschedule!")

      const scheduleItem = [...pendingSchedules, ...acceptedSchedules].find((s) => s.id === scheduleId)
      if (scheduleItem && scheduleItem.counselor) {
        const formattedDate = format(newDate, "dd MMMM yyyy")
        const emailSent = await sendEmailNotification(
          scheduleItem.counselor.adminEmail,
          scheduleItem.id,
          formattedDate,
          newTime,
          scheduleItem.address,
          scheduleItem.title,
          "user",
          "reschedule",
        )

        if (!emailSent) {
          toast.error("Jadwal berhasil di-reschedule, tetapi gagal mengirim notifikasi email.")
        }
      }
    } catch (err: any) {
      console.error("Error saat mereschedule jadwal:", err)
      toast.error("Terjadi kesalahan saat mereschedule jadwal.")
    }
  }

  // Cancel schedule function
  const handleCancelSchedule = async (scheduleId: number) => {
    if (confirm("Apakah Anda yakin ingin membatalkan jadwal ini?")) {
      try {
        const { error } = await supabase.from("schedules").update({ status: "Canceled" }).eq("id", scheduleId)

        if (error) {
          console.error("Gagal membatalkan jadwal:", error)
          toast.error("Gagal membatalkan jadwal.")
          return
        }

        mutatePending()
        mutateAccepted()
        mutateFinished()

        toast.success("Jadwal berhasil dibatalkan!")

        const scheduleItem = [...pendingSchedules, ...acceptedSchedules].find((s) => s.id === scheduleId)
        if (scheduleItem && scheduleItem.counselor) {
          const formattedDate = format(scheduleItem.date, "dd MMMM yyyy")
          const emailSent = await sendEmailNotification(
            scheduleItem.counselor.adminEmail,
            scheduleItem.id,
            formattedDate,
            scheduleItem.time,
            scheduleItem.address,
            scheduleItem.title,
            "user",
            "cancel",
          )

          if (!emailSent) {
            toast.error("Jadwal berhasil dibatalkan, tetapi gagal mengirim notifikasi email.")
          }
        }
      } catch (err: any) {
        console.error("Error saat membatalkan jadwal:", err)
        toast.error("Terjadi kesalahan saat membatalkan jadwal.")
      }
    }
  }

  // Delete schedule function
  const handleDeleteSchedule = async (scheduleId: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      try {
        const { error } = await supabase.from("schedules").delete().eq("id", scheduleId)

        if (error) {
          console.error("Gagal menghapus jadwal:", error)
          toast.error("Gagal menghapus jadwal.")
          return
        }

        mutatePending()
        mutateAccepted()
        mutateFinished()

        toast.success("Jadwal berhasil dihapus!")
      } catch (err: any) {
        console.error("Error saat menghapus jadwal:", err)
        toast.error("Terjadi kesalahan saat menghapus jadwal.")
      }
    }
  }

  // Submit rating function
  const onSubmitRating = async (data: any) => {
    const { stars, description } = data
    const { scheduleId } = ratingData

    try {
      const userSession = sessionStorage.getItem("userSession")
      if (!userSession) {
        toast.error("Anda belum login!")
        return
      }

      const { token } = JSON.parse(userSession)
      if (!token) {
        toast.error("Token tidak tersedia. Harap login ulang.")
        return
      }

      const response = await fetch("/api/submit-rating", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schedule_id: Number(scheduleId),
          stars,
          description,
        }),
      })

      if (!response.ok) {
        const resData = await response.json()
        console.error("Gagal mengirim rating:", resData.message, resData.errors)
        toast.error(`Gagal mengirim rating: ${resData.message || "Terjadi kesalahan."}`)
        return
      }

      toast.success("Rating berhasil dikirim!")
      mutatePending()
      mutateAccepted()
      mutateFinished()

      setRatingData({ scheduleId: 0, open: false })
      resetRating()
    } catch (err) {
      console.error("Error saat mengirim rating:", err)
      toast.error("Terjadi kesalahan saat mengirim rating.")
    }
  }

  // Confirm schedule function
  const handleConfirmSchedule = async (schedule: Schedule) => {
    try {
      const formattedDate = format(schedule.date, "dd MMMM yyyy")

      const emailSent = await sendEmailNotification(
        schedule.counselor!.adminEmail,
        schedule.id,
        formattedDate,
        schedule.time,
        schedule.address,
        schedule.title,
        "user",
        "confirm",
      )

      if (emailSent) {
        toast.success("Notifikasi email berhasil dikirim ke admin.")
        const { error } = await supabase.from("schedules").update({ confirmed: true }).eq("id", schedule.id)

        if (error) {
          console.error("Gagal memperbarui status konfirmasi:", error)
          toast.error("Jadwal telah dikonfirmasi, tetapi gagal memperbarui status.")
          return
        }

        mutatePending()
        mutateAccepted()
        mutateFinished()
      } else {
        toast.error("Gagal mengirim notifikasi email ke admin.")
      }
    } catch (err: any) {
      console.error("Error saat mengonfirmasi jadwal:", err)
      toast.error("Terjadi kesalahan saat mengonfirmasi jadwal.")
    }
  }

  // Join consultation function
  const handleJoinConsultation = (schedule: Schedule) => {
    if (schedule.address.toLowerCase().includes("online")) {
      toast.info("Memulai konsultasi online...")
      // Here you would typically redirect to a video call or chat interface
    } else {
      toast.info(`Lokasi konsultasi: ${schedule.address}`)
    }
  }

  // Mark notification as read
  const markNotificationAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

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

  // Render schedule card
  const renderScheduleCard = (schedule: Schedule) => {
    return (
      <motion.div
        key={schedule.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        layout
        className="mb-4"
        onTouchStart={(e) => handleTouchStartSwipe(e, schedule.id)}
        onTouchMove={handleTouchMoveSwipe}
        onTouchEnd={handleTouchEndSwipe}
      >
        <Card
          className={`backdrop-blur-md bg-white/10 border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 transform ${
            swipeDirection && selectedSchedule?.id === schedule.id
              ? swipeDirection === "left"
                ? "translate-x-[-100px] bg-red-500/20"
                : "translate-x-[100px] bg-green-500/20"
              : ""
          }`}
          onClick={() => {
            setSelectedSchedule(schedule)
            setIsDetailOpen(true)
          }}
        >
          {/* Swipe indicators */}
          {isMobile && isSwipeEnabled && (
            <>
              <div className="absolute left-2 inset-y-0 flex items-center justify-center opacity-0 transition-opacity duration-300 text-red-300"
                style={{ opacity: swipeDirection === "left" && selectedSchedule?.id === schedule.id ? 1 : 0 }}>
                <Trash className="h-6 w-6" />
              </div>
              <div className="absolute right-2 inset-y-0 flex items-center justify-center opacity-0 transition-opacity duration-300 text-green-300"
                style={{ opacity: swipeDirection === "right" && selectedSchedule?.id === schedule.id ? 1 : 0 }}>
                {schedule.status === "Pending" && !schedule.confirmed ? (
                  <Check className="h-6 w-6" />
                ) : (schedule.status === "Pending" || schedule.status === "Accepted") && schedule.confirmed ? (
                  <ArrowRight className="h-6 w-6" />
                ) : schedule.status === "Finished" && !schedule.rating ? (
                  <Star className="h-6 w-6" />
                ) : (
                  <Info className="h-6 w-6" />
                )}
              </div>
            </>
          )}
          
          <CardHeader className="pb-2 relative">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="hidden md:block">
                  <Avatar className="h-10 w-10 border border-white/20">
                    <AvatarImage src={schedule.counselor?.avatarUrl || "/placeholder.svg?height=40&width=40"} />
                    <AvatarFallback className="bg-blue-500/20 text-blue-100">
                      {schedule.counselor?.name.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <CardTitle className="text-lg text-white">{schedule.title}</CardTitle>
                  <CardDescription className="text-blue-200 flex items-center gap-2 mt-1">
                    <CalendarIcon className="h-4 w-4 text-blue-300" />
                    <span>{format(schedule.date, "dd MMM yyyy")}</span>
                    <span className="text-blue-300/50">•</span>
                    <Clock className="h-4 w-4 text-blue-300" />
                    <span>{schedule.time}</span>
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(schedule.status)}
                {isToday(schedule.date) && (
                  <Badge className="bg-blue-500/20 text-blue-100 border-blue-400/30">Hari Ini</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2 text-blue-100 mb-2">
              <div className="flex items-center gap-1">
                {schedule.address.toLowerCase().includes("online") ? (
                  <Video className="h-4 w-4 text-blue-300" />
                ) : (
                  <MapPin className="h-4 w-4 text-blue-300" />
                )}
                <span className="text-sm">{schedule.address}</span>
              </div>
              {schedule.counselor && (
                <div className="flex items-center gap-1 md:ml-4">
                  <User className="h-4 w-4 text-blue-300" />
                  <span className="text-sm">{schedule.counselor.name}</span>
                </div>
              )}
            </div>
            <div className="mt-2 line-clamp-2">
              <p className="text-sm text-blue-200/80">{schedule.description}</p>
            </div>
            {schedule.rating && (
              <div className="flex items-center mt-2 text-yellow-300">
                <Star className="h-4 w-4 mr-1" />
                <span className="text-sm">{schedule.rating.stars} / 5</span>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center pt-0">
            <div className="text-xs text-blue-200/70">
              {schedule.confirmed ? "Terkonfirmasi" : "Belum dikonfirmasi"}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-blue-200 hover:text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedSchedule(schedule)
                setIsDetailOpen(true)
              }}
            >
              <Info className="h-4 w-4 mr-1" /> Detail
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    )
  }

  // Render calendar view
  const renderCalendarView = () => {
    // Group schedules by date
    const schedulesByDate = allSchedules.reduce(
      (acc, schedule) => {
        const dateStr = format(schedule.date, "yyyy-MM-dd")
        if (!acc[dateStr]) {
          acc[dateStr] = []
        }
        acc[dateStr].push(schedule)
        return acc
      },
      {} as Record<string, Schedule[]>,
    )

    return (
      <div className="bg-white/5 rounded-lg border border-white/10 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={calendarView === "month" ? "default" : "outline"}
              className={
                calendarView === "month"
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
              }
              onClick={() => setCalendarView("month")}
            >
              Bulan
            </Button>
            <Button
              size="sm"
              variant={calendarView === "week" ? "default" : "outline"}
              className={
                calendarView === "week"
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
              }
              onClick={() => setCalendarView("week")}
            >
              Minggu
            </Button>
            <Button
              size="sm"
              variant={calendarView === "day" ? "default" : "outline"}
              className={
                calendarView === "day"
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
              }
              onClick={() => setCalendarView("day")}
            >
              Hari
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
              onClick={() => {
                const newDate = new Date(date!)
                if (calendarView === "month") {
                  newDate.setMonth(newDate.getMonth() - 1)
                } else if (calendarView === "week") {
                  newDate.setDate(newDate.getDate() - 7)
                } else {
                  newDate.setDate(newDate.getDate() - 1)
                }
                setDate(newDate)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
              onClick={() => setDate(new Date())}
            >
              Hari Ini
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
              onClick={() => {
                const newDate = new Date(date!)
                if (calendarView === "month") {
                  newDate.setMonth(newDate.getMonth() + 1)
                } else if (calendarView === "week") {
                  newDate.setDate(newDate.getDate() + 7)
                } else {
                  newDate.setDate(newDate.getDate() + 1)
                }
                setDate(newDate)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg border border-white/10 p-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border border-white/10 bg-white/5 text-white"
            modifiers={{
              hasSchedule: Object.keys(schedulesByDate).map((dateStr) => new Date(dateStr)),
              today: [new Date()],
            }}
            modifiersStyles={{
              hasSchedule: {
                backgroundColor: "rgba(59, 130, 246, 0.3)",
                borderRadius: "50%",
              },
              today: {
                border: "2px solid rgba(59, 130, 246, 0.8)",
                borderRadius: "50%",
              }
            }}
          />
        </div>

        {date && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-white mb-2">{format(date, "EEEE, dd MMMM yyyy")}</h3>
            <div className="space-y-2">
              {schedulesByDate[format(date, "yyyy-MM-dd")]?.map((schedule) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedSchedule(schedule)
                    setIsDetailOpen(true)
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-white">{schedule.title}</div>
                      <div className="text-sm text-blue-200 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {schedule.time}
                      </div>
                    </div>
                    {getStatusBadge(schedule.status)}
                  </div>
                </motion.div>
              )) || (
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center text-blue-200">
                  Tidak ada jadwal pada tanggal ini
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render schedule detail
  const renderScheduleDetail = (schedule: Schedule) => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white">{schedule.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-blue-200">
              <CalendarIcon className="h-4 w-4 text-blue-300" />
              <span>{format(schedule.date, "EEEE, dd MMMM yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-blue-200">
              <Clock className="h-4 w-4 text-blue-300" />
              <span>{schedule.time}</span>
            </div>
          </div>
          <div>{getStatusBadge(schedule.status)}</div>
        </div>

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-start gap-2 mb-3">
            <MapPin className="h-5 w-5 text-blue-300 mt-0.5" />
            <div>
              <div className="font-medium text-white">Lokasi</div>
              <div className="text-blue-200">{schedule.address}</div>
            </div>
          </div>

          {schedule.counselor && (
            <div className="flex items-start gap-2 mb-3">
              <User className="h-5 w-5 text-blue-300 mt-0.5" />
              <div>
                <div className="font-medium text-white">Konselor</div>
                <div className="text-blue-200">{schedule.counselor.name}</div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <MessageSquare className="h-5 w-5 text-blue-300 mt-0.5" />
            <div>
              <div className="font-medium text-white">Deskripsi</div>
              <div className="text-blue-200">{schedule.description}</div>
            </div>
          </div>

          {schedule.rating && (
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-white/10">
              <Star className="h-5 w-5 text-yellow-300 mt-0.5" />
              <div>
                <div className="font-medium text-white">Rating</div>
                <div className="flex items-center text-yellow-300">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(schedule.rating!.stars) ? "fill-yellow-300" : "text-yellow-300/30"}`}
                    />
                  ))}
                  <span className="ml-2 text-blue-200">{schedule.rating.stars} / 5</span>
                </div>
                <div className="text-blue-200 mt-1">{schedule.rating.description}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {schedule.status === "Pending" && !schedule.confirmed && (
            <>
              <Button
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                onClick={() => handleConfirmSchedule(schedule)}
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Konfirmasi
              </Button>
              <Button
                variant="destructive"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-400/30"
                onClick={() => {
                  handleDeleteSchedule(schedule.id)
                  setIsDetailOpen(false)
                }}
              >
                <Trash className="h-4 w-4 mr-2" /> Hapus
              </Button>
            </>
          )}
          {(schedule.status === "Pending" || schedule.status === "Accepted") && schedule.confirmed && (
            <>
              <Button
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                onClick={() => handleJoinConsultation(schedule)}
              >
                <ArrowRight className="h-4 w-4 mr-2" /> Gabung
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
                onClick={() => {
                  setRescheduleData({ id: schedule.id, date: schedule.date, time: schedule.time })
                  setIsRescheduleOpen(true)
                  setIsDetailOpen(false)
                }}
              >
                <Edit className="h-4 w-4 mr-2" /> Reschedule
              </Button>
              <Button
                variant="destructive"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-400/30"
                onClick={() => {
                  handleCancelSchedule(schedule.id)
                  setIsDetailOpen(false)
                }}
              >
                <AlertCircle className="h-4 w-4 mr-2" /> Batalkan
              </Button>
            </>
          )}
          {schedule.status === "Finished" && !schedule.rating && (
            <Button
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border border-yellow-400/30"
              onClick={() => {
                setRatingData({ scheduleId: schedule.id, open: true })
                setIsDetailOpen(false)
              }}
            >
              <Star className="h-4 w-4 mr-2" /> Beri Rating
            </Button>
          )}
          {(schedule.status === "Accepted" || schedule.status === "Finished") && (
            <Button
              variant="destructive"
              className="bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-400/30"
              onClick={() => {
                handleDeleteSchedule(schedule.id)
                setIsDetailOpen(false)
              }}
            >
              <Trash className="h-4 w-4 mr-2" /> Hapus
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Render upcoming schedule card
  const renderUpcomingScheduleCard = (schedule: Schedule) => {
    return (
      <motion.div
        key={schedule.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
        onClick={() => {
          setSelectedSchedule(schedule)
          setIsDetailOpen(true)
        }}
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

  // Render notification item
  const renderNotificationItem = (notification: any) => {
    return (
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`p-4 ${notification.read ? 'bg-white/5' : 'bg-blue-500/10'} rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer`}
        onClick={() => markNotificationAsRead(notification.id)}
      >
        <div className="flex items-start gap-3">
          <div className={`${notification.read ? 'bg-blue-500/20' : 'bg-blue-500/40'} rounded-lg p-2 flex-shrink-0`}>
            <Bell className="h-6 w-6 text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white">{notification.title}</h3>
            <p className="text-sm text-blue-200 mt-1">{notification.message}</p>
            <div className="text-xs text-blue-200/70 mt-2">{notification.time}</div>
          </div>
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
          )}
        </div>
      </motion.div>
    )
  }

  // Mobile app layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white">
        {/* Mobile status bar */}
        <div className="sticky top-0 z-50 backdrop-blur-md bg-blue-900/80 border-b border-white/10 px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Jadwal Konsultasi</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white relative"
                onClick={() => setIsNotificationsOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-blue-900 border-white/20 text-white">
                  <DropdownMenuItem onClick={() => setIsSearchOpen(!isSearchOpen)} className="flex items-center gap-2">
                    <Search className="h-4 w-4" /> Cari Jadwal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2">
                    <Filter className="h-4 w-4" /> Filter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")} className="flex items-center gap-2">
                    {viewMode === "list" ? (
                      <>
                        <CalendarIcon2 className="h-4 w-4" /> Tampilan Kalender
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4" /> Tampilan List
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" /> Swipe Actions
                      </div>
                      <Switch 
                        checked={isSwipeEnabled} 
                        onCheckedChange={setIsSwipeEnabled}
                      />
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search bar (collapsible) */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
                  <Input
                    placeholder="Cari jadwal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-blue-200/50 w-full"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-blue-200 hover:text-white"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter options (collapsible) */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <select
                        value={filterOptions.location}
                        onChange={(e) => setFilterOptions({ ...filterOptions, location: e.target.value })}
                        className="w-full p-2 rounded-md bg-white/5 border border-white/20 text-white text-sm"
                      >
                        <option value="all">Semua Lokasi</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={filterOptions.dateRange}
                        onChange={(e) => setFilterOptions({ ...filterOptions, dateRange: e.target.value })}
                        className="w-full p-2 rounded-md bg-white/5 border border-white/20 text-white text-sm"
                      >
                        <option value="all">Semua Waktu</option>
                        <option value="today">Hari Ini</option>
                        <option value="week">Minggu Ini</option>
                        <option value="upcoming">Mendatang</option>
                        <option value="past">Sebelumnya</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <select
                      value={filterOptions.counselor}
                      onChange={(e) => setFilterOptions({ ...filterOptions, counselor: e.target.value })}
                      className="w-full p-2 rounded-md bg-white/5 border border-white/20 text-white text-sm"
                    >
                      <option value="all">Semua Konselor</option>
                      {counselors.map((counselor) => (
                        <option key={counselor.id} value={counselor.id}>
                          {counselor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pull to refresh indicator */}
        {isRefreshing && (
          <div className="flex justify-center items-center py-4 bg-blue-900/20">
            <RefreshCw className="h-5 w-5 text-blue-300 animate-spin" />
            <span className="ml-2 text-blue-200">Memperbarui...</span>
          </div>
        )}

        {/* Main content */}
        <div 
          className="px-4 pb-24 pt-4" 
          ref={scrollRef}
        >
          {viewMode === "list" ? (
            <>
              {/* Upcoming schedules section */}
              {upcomingSchedules.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center">
                    <CalendarDays className="h-5 w-5 mr-2 text-blue-300" />
                    Jadwal Mendatang
                  </h2>
                  <div className="space-y-3">
                    {upcomingSchedules.slice(0, 2).map(renderUpcomingScheduleCard)}
                    {upcomingSchedules.length > 2 && (
                      <Button
                        variant="ghost"
                        className="w-full text-blue-300 hover:text-blue-100 hover:bg-white/10 border border-white/10"
                        onClick={() => {
                          setFilterOptions({ ...filterOptions, dateRange: "upcoming" })
                          setSearchQuery("")
                        }}
                      >
                        Lihat Semua ({upcomingSchedules.length})
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Today's schedules section */}
              {todaySchedules.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-300" />
                    Jadwal Hari Ini
                  </h2>
                  <div className="space-y-3">
                    {todaySchedules.map(renderScheduleCard)}
                  </div>
                </div>
              )}

              {/* Tabs for schedule status */}
              <Tabs
                defaultValue="Pending"
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as any)}
                className="mt-4"
              >
                <TabsList className="grid grid-cols-3 mb-4 bg-white/10 border border-white/10 p-1 rounded-xl">
                  <TabsTrigger
                    value="Pending"
                    className="rounded-lg flex items-center gap-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    <Clock3 className="h-4 w-4" /> 
                    <span>Pending</span>
                    {pendingSchedules.length > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
                        {pendingSchedules.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="Accepted"
                    className="rounded-lg flex items-center gap-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    <CheckCircle className="h-4 w-4" /> 
                    <span>Accepted</span>
                    {acceptedSchedules.length > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
                        {acceptedSchedules.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="Finished"
                    className="rounded-lg flex items-center gap-1 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    <Star className="h-4 w-4" /> 
                    <span>Finished</span>
                    {finishedSchedules.length > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
                        {finishedSchedules.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="Pending" className="mt-0 space-y-4">
                  {isLoadingInitialPending ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
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
                  ) : pendingSchedules.length > 0 ? (
                    <InfiniteScroll
                      dataLength={pendingSchedules.length}
                      next={() => setSizePending(sizePending + 1)}
                      hasMore={!isReachingEndPending}
                      loader={
                        <div className="flex justify-center items-center my-4">
                          <Loader2 className="h-6 w-6 text-blue-300 animate-spin" />
                        </div>
                      }
                      scrollableTarget="scrollableDiv"
                      className="space-y-4"
                    >
                      {pendingSchedules.map(renderScheduleCard)}
                    </InfiniteScroll>
                  ) : (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                      <Clock3 className="h-12 w-12 mx-auto text-blue-300/50 mb-3" />
                      <p className="text-blue-200 mb-4">Belum ada jadwal Pending</p>
                      <Button
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                        onClick={() => setIsAddScheduleOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Tambah Jadwal
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="Accepted" className="mt-0 space-y-4">
                  {isLoadingInitialAccepted ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
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
                  ) : acceptedSchedules.length > 0 ? (
                    <InfiniteScroll
                      dataLength={acceptedSchedules.length}
                      next={() => setSizeAccepted(sizeAccepted + 1)}
                      hasMore={!isReachingEndAccepted}
                      loader={
                        <div className="flex justify-center items-center my-4">
                          <Loader2 className="h-6 w-6 text-blue-300 animate-spin" />
                        </div>
                      }
                      scrollableTarget="scrollableDiv"
                      className="space-y-4"
                    >
                      {acceptedSchedules.map(renderScheduleCard)}
                    </InfiniteScroll>
                  ) : (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                      <CheckCircle className="h-12 w-12 mx-auto text-blue-300/50 mb-3" />
                      <p className="text-blue-200">Belum ada jadwal Accepted</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="Finished" className="mt-0 space-y-4">
                  {isLoadingInitialFinished ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
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
                  ) : finishedSchedules.length > 0 ? (
                    <InfiniteScroll
                      dataLength={finishedSchedules.length}
                      next={() => setSizeFinished(sizeFinished + 1)}
                      hasMore={!isReachingEndFinished}
                      loader={
                        <div className="flex justify-center items-center my-4">
                          <Loader2 className="h-6 w-6 text-blue-300 animate-spin" />
                        </div>
                      }
                      scrollableTarget="scrollableDiv"
                      className="space-y-4"
                    >
                      {finishedSchedules.map(renderScheduleCard)}
                    </InfiniteScroll>
                  ) : (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                      <Star className="h-12 w-12 mx-auto text-blue-300/50 mb-3" />
                      <p className="text-blue-200">Belum ada jadwal Finished</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            renderCalendarView()
          )}
        </div>

        {/* Bottom navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-blue-900/90 backdrop-blur-md border-t border-white/10 z-50">
          <div className="flex justify-around items-center py-2">
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 h-auto py-2 ${
          activeBottomTab === "home" ? "text-white" : "text-blue-200"
              }`}
              onClick={() => window.location.href = '/dashboard'}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </Button>
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
            <div className="-mt-5">
              <Button
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30 shadow-lg"
          size="icon"
          onClick={() => setIsAddScheduleOpen(true)}
              >
          <Plus className="h-6 w-6" />
              </Button>
            </div>
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 h-auto py-2 ${
          activeBottomTab === "chat" ? "text-white" : "text-blue-200"
              }`}
              onClick={() => window.location.href = '/dashboard/konsultasi'}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs">Konsultasi</span>
            </Button>
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 h-auto py-2 ${
          activeBottomTab === "profile" ? "text-white" : "text-blue-200"
              }`}
              onClick={() => window.location.href = '/dashboard/profile'}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>

        {/* Notifications drawer */}
        <Drawer open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
          <DrawerContent className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white border-t border-white/20">
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">Notifikasi</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-200 hover:text-white"
                  onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                >
                  Tandai Semua Dibaca
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[70vh] overflow-auto">
              {notifications.length > 0 ? (
                notifications.map(renderNotificationItem)
              ) : (
                <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                  <Bell className="h-12 w-12 mx-auto text-blue-300/50 mb-3" />
                  <p className="text-blue-200">Tidak ada notifikasi</p>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>

        {/* Add Schedule Dialog */}
        <Drawer open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
          <DrawerContent className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white border-t border-white/20">
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">Tambah Jadwal Baru</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-blue-200 hover:text-white"
                  onClick={() => setIsAddScheduleOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-blue-100">
                    Judul
                  </Label>
                  <Input
                    id="title"
                    placeholder="Masukkan judul jadwal"
                    {...register("title")}
                    className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                  />
                  {errors.title && <p className="text-sm text-red-300">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-blue-100">
                    Tanggal
                  </Label>
                  <div className="relative">
                    <Controller
                      name="date"
                      control={scheduleControl}
                      defaultValue={date}
                      render={({ field }) => (
                        <div
                          className="p-2 bg-white/5 border border-white/20 rounded-md text-white flex items-center justify-between cursor-pointer"
                          onClick={() => document.getElementById("calendar-popup")?.click()}
                        >
                          <span>{date ? format(date, "dd MMMM yyyy") : "Pilih tanggal"}</span>
                          <CalendarIcon className="h-4 w-4 text-blue-300" />
                          <Dialog>
                            <DialogTrigger id="calendar-popup" className="hidden">
                              Open
                            </DialogTrigger>
                            <DialogContent className="bg-gradient-to-br from-blue-900 to-blue-950 text-white border border-white/20 backdrop-blur-md">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(newDate) => {
                                  setDate(newDate)
                                  field.onChange(newDate)
                                }}
                                className="rounded-md border border-white/10 bg-white/5 text-white"
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-blue-100">
                    Waktu
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    {...register("time")}
                    className="bg-white/5 border-white/20 text-white focus:border-blue-400"
                  />
                  {errors.time && <p className="text-sm text-red-300">{errors.time.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-blue-100">
                    Lokasi
                  </Label>
                  <Input
                    id="address"
                    placeholder="Masukkan alamat konsultasi atau 'Online'"
                    {...register("address")}
                    className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                  />
                  {errors.address && <p className="text-sm text-red-300">{errors.address.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="counselor" className="text-blue-100">
                    Konselor
                  </Label>
                  <select
                    id="counselor"
                    {...register("counselor_id")}
                    className="w-full border rounded-md p-2 bg-white/5 border-white/20 text-white focus:border-blue-400"
                  >
                    <option value="">Pilih Konselor</option>
                    {counselors.map((counselor) => (
                      <option key={counselor.id} value={counselor.id}>
                        {counselor.name}
                      </option>
                    ))}
                  </select>
                  {errors.counselor_id && <p className="text-sm text-red-300">{errors.counselor_id.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-blue-100">
                    Deskripsi
                  </Label>
                  <Input
                    id="description"
                    placeholder="Masukkan deskripsi jadwal"
                    {...register("description")}
                    className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                  />
                  {errors.description && <p className="text-sm text-red-300">{errors.description.message}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                >
                  Tambah Jadwal
                </Button>
              </form>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Reschedule Dialog */}
        <Drawer open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
          {rescheduleData && (
            <DrawerContent className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white border-t border-white/20">
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white">Reschedule Jadwal</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-200 hover:text-white"
                    onClick={() => {
                      setIsRescheduleOpen(false)
                      setRescheduleData(null)
                    }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="p-4 max-h-[70vh] overflow-auto">
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newDate" className="flex items-center gap-2 text-blue-100">
                      <CalendarIcon className="h-4 w-4 text-blue-300" /> Tanggal Baru
                    </Label>
                    <div className="relative">
                      <div
                        className="p-2 bg-white/5 border border-white/20 rounded-md text-white flex items-center justify-between cursor-pointer"
                        onClick={() => document.getElementById("reschedule-calendar-popup")?.click()}
                      >
                        <span>{format(rescheduleData.date, "dd MMMM yyyy")}</span>
                        <CalendarIcon className="h-4 w-4 text-blue-300" />
                        <Dialog>
                          <DialogTrigger id="reschedule-calendar-popup" className="hidden">
                            Open
                          </DialogTrigger>
                          <DialogContent className="bg-gradient-to-br from-blue-900 to-blue-950 text-white border border-white/20 backdrop-blur-md">
                            <Calendar
                              mode="single"
                              selected={rescheduleData.date}
                              onSelect={(newDate) => {
                                if (newDate) {
                                  setRescheduleData({
                                    ...rescheduleData,
                                    date: newDate,
                                  })
                                }
                              }}
                              className="rounded-md border border-white/10 bg-white/5 text-white"
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newTime" className="flex items-center gap-2 text-blue-100">
                      <Clock className="h-4 w-4 text-blue-300" /> Waktu Baru
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
                      className="bg-white/5 border-white/20 text-white focus:border-blue-400"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      if (rescheduleData) {
                        handleReschedule(rescheduleData.id, rescheduleData.date, rescheduleData.time)
                        setIsRescheduleOpen(false)
                        setRescheduleData(null)
                      }
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                  >
                    Simpan Perubahan
                  </Button>
                </form>
              </div>
            </DrawerContent>
          )}
        </Drawer>

        {/* Rating Dialog */}
        <Drawer
          open={ratingData.open}
          onOpenChange={(open) => {
            if (!open) {
              setRatingData({ scheduleId: 0, open: false })
              resetRating()
            }
          }}
        >
          {ratingData.open && (
            <DrawerContent className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white border-t border-white/20">
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white">Beri Rating</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-200 hover:text-white"
                    onClick={() => setRatingData({ scheduleId: 0, open: false })}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="p-4 max-h-[70vh] overflow-auto">
                <form onSubmit={handleSubmitRating(onSubmitRating)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stars" className="text-blue-100">
                      Rating
                    </Label>
                    <Controller
                      name="stars"
                      control={control}
                      defaultValue={0.5}
                      render={({ field }) => (
                        <div className="flex items-center justify-center">
                          <ReactStars
                            count={5}
                            onChange={(newRating: number) => field.onChange(newRating)}
                            size={40}
                            half={true}
                            value={field.value}
                            color2={"#ffd700"}
                          />
                        </div>
                      )}
                    />
                    <div className="text-center text-blue-200">{control._formValues.stars} / 5</div>
                    {errorsRating.stars && <p className="text-sm text-red-300 text-center">{errorsRating.stars.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-blue-100">
                      Deskripsi
                    </Label>
                    <Input
                      id="description"
                      placeholder="Berikan komentar tentang konsultasi Anda"
                      {...registerRating("description")}
                      className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                    />
                    {errorsRating.description && (
                      <p className="text-sm text-red-300">{errorsRating.description.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                  >
                    Kirim Rating
                  </Button>
                </form>
              </div>
            </DrawerContent>
          )}
        </Drawer>

        {/* Schedule Detail Sheet */}
        <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          {selectedSchedule && (
            <SheetContent className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white border-l border-white/20 w-full sm:max-w-md">
              <div className="px-1 py-3">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-white">Detail Jadwal</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-200 hover:text-white"
                    onClick={() => setIsDetailOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                {renderScheduleDetail(selectedSchedule)}
              </div>
            </SheetContent>
          )}
        </Sheet>
      </div>
    )
  }

  // Desktop layout
  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white py-6"
    >
      {/* Background elements */}
      <motion.div className="absolute inset-0 z-0 pointer-events-none" style={{ y: backgroundY, opacity }}>
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-950/50 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
      </motion.div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-1/4 right-10 w-16 h-16 rounded-full border border-blue-400/20 backdrop-blur-sm z-0"
        animate={{
          y: [0, -20, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      />

      <motion.div
        className="absolute bottom-1/4 left-10 w-12 h-12 rounded-full border border-blue-400/20 backdrop-blur-sm z-0"
        animate={{
          y: [0, 20, 0],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          delay: 1,
        }}
      />

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
                  <CalendarIcon2 className="h-7 w-7 mr-3 text-blue-300" />
                  Jadwal Konsultasi
                </h1>
                <p className="text-blue-200 mt-1">Kelola semua jadwal konsultasi Anda di sini</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Notifications */}
                <Popover>
                  <PopoverTrigger asChild>
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
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 bg-blue-900 border-white/20">
                    <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
                      <h3 className="font-medium text-white">Notifikasi</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-200 hover:text-white text-xs"
                        onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                      >
                        Tandai Semua Dibaca
                      </Button>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="p-2 space-y-2">
                        {notifications.length > 0 ? (
                          notifications.map(renderNotificationItem)
                        ) : (
                          <div className="text-center py-8">
                            <Bell className="h-8 w-8 mx-auto text-blue-300/50 mb-2" />
                            <p className="text-blue-200 text-sm">Tidak ada notifikasi</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                {/* Search button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                >
                  <Search className="h-5 w-5" />
                </Button>

                {/* Filter button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <Filter className="h-5 w-5" />
                </Button>

                {/* View toggle */}
                <div className="flex rounded-lg overflow-hidden border border-white/20">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    className={
                      viewMode === "list"
                        ? "bg-blue-500 hover:bg-blue-600 text-white rounded-none"
                        : "bg-white/10 hover:bg-white/20 text-blue-100 rounded-none"
                    }
                    onClick={() => setViewMode("list")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" /> List
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "default" : "ghost"}
                    size="sm"
                    className={
                      viewMode === "calendar"
                        ? "bg-blue-500 hover:bg-blue-600 text-white rounded-none"
                        : "bg-white/10 hover:bg-white/20 text-blue-100 rounded-none"
                    }
                    onClick={() => setViewMode("calendar")}
                  >
                    <CalendarIcon2 className="h-4 w-4 mr-2" /> Calendar
                  </Button>
                </div>

                {/* Add schedule button */}
                <Button
                  onClick={() => setIsAddScheduleOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                >
                  <Plus className="h-4 w-4 mr-2" /> Tambah Jadwal
                </Button>
              </div>
            </div>

            {/* Search bar (collapsible) */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
                      <Input
                        placeholder="Cari jadwal berdasarkan judul, deskripsi, konselor, atau lokasi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white/5 border-white/20 text-white placeholder:text-blue-200/50 w-full"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-blue-200 hover:text-white"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter options (collapsible) */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-blue-100 mb-2 block">Lokasi</Label>
                        <select
                          value={filterOptions.location}
                          onChange={(e) => setFilterOptions({ ...filterOptions, location: e.target.value })}
                          className="w-full p-2 rounded-md bg-white/5 border border-white/20 text-white"
                        >
                          <option value="all">Semua Lokasi</option>
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-blue-100 mb-2 block">Konselor</Label>
                        <select
                          value={filterOptions.counselor}
                          onChange={(e) => setFilterOptions({ ...filterOptions, counselor: e.target.value })}
                          className="w-full p-2 rounded-md bg-white/5 border border-white/20 text-white"
                        >
                          <option value="all">Semua Konselor</option>
                          {counselors.map((counselor) => (
                            <option key={counselor.id} value={counselor.id}>
                              {counselor.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-blue-100 mb-2 block">Rentang Waktu</Label>
                        <select
                          value={filterOptions.dateRange}
                          onChange={(e) => setFilterOptions({ ...filterOptions, dateRange: e.target.value })}
                          className="w-full p-2 rounded-md bg-white/5 border border-white/20 text-white"
                        >
                          <option value="all">Semua Waktu</option>
                          <option value="today">Hari Ini</option>
                          <option value="week">Minggu Ini</option>
                          <option value="upcoming">Mendatang</option>
                          <option value="past">Sebelumnya</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar and Info Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={viewMode === "calendar" ? "lg:col-span-3" : "lg:col-span-1"}
          >
            {viewMode === "list" && (
              <Card className="backdrop-blur-md bg-white/10 border border-white/20 overflow-hidden sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <CalendarIcon className="h-5 w-5 mr-2 text-blue-300" /> Kalender
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md border border-white/10 bg-white/5 text-white"
                      modifiers={{
                        hasSchedule: allSchedules.map((s) => s.date),
                        today: [new Date()],
                      }}
                      modifiersStyles={{
                        hasSchedule: {
                          backgroundColor: "rgba(59, 130, 246, 0.3)",
                          borderRadius: "50%",
                        },
                        today: {
                          border: "2px solid rgba(59, 130, 246, 0.8)",
                          borderRadius: "50%",
                        }
                      }}
                    />
                  </div>
                  <div className="mt-6 space-y-3 bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <span className="text-sm text-blue-100">Pending: {pendingSchedules.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      <span className="text-sm text-blue-100">Accepted: {acceptedSchedules.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <span className="text-sm text-blue-100">Finished: {finishedSchedules.length}</span>
                    </div>
                  </div>

                  {/* Today's schedules */}
                  <div className="mt-6">
                    <h3 className="text-white font-medium mb-2">Jadwal Hari Ini</h3>
                    <div className="space-y-2">
                      {todaySchedules.length > 0 ? (
                        todaySchedules
                          .slice(0, 3)
                          .map((schedule) => (
                            <div
                              key={schedule.id}
                              className="p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedSchedule(schedule)
                                setIsDetailOpen(true)
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <div className="truncate">{schedule.title}</div>
                                <div className="text-sm text-blue-300">{schedule.time}</div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-center text-blue-200/70">
                          Tidak ada jadwal hari ini
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upcoming schedules */}
                  {upcomingSchedules.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-white font-medium mb-2">Jadwal Mendatang</h3>
                      <div className="space-y-2">
                        {upcomingSchedules
                          .slice(0, 3)
                          .map((schedule) => (
                            <div
                              key={schedule.id}
                              className="p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedSchedule(schedule)
                                setIsDetailOpen(true)
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="truncate">{schedule.title}</div>
                                  <div className="text-xs text-blue-200">{format(schedule.date, "dd MMM")}</div>
                                </div>
                                <div className="text-sm text-blue-300">{schedule.time}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {viewMode === "calendar" && renderCalendarView()}
          </motion.div>

          {/* Schedules Section */}
          {viewMode === "list" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Tabs
                defaultValue="Pending"
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as any)}
                className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-4"
              >
                <TabsList className="grid grid-cols-3 mb-4 bg-white/10 border border-white/10">
                  <TabsTrigger
                    value="Pending"
                    className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    <Clock3 className="h-4 w-4" /> Pending
                    {pendingSchedules.length > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                        {pendingSchedules.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="Accepted"
                    className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    <CheckCircle className="h-4 w-4" /> Accepted
                    {acceptedSchedules.length > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                        {acceptedSchedules.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="Finished"
                    className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    <Star className="h-4 w-4" /> Finished
                    {finishedSchedules.length > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                        {finishedSchedules.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="Pending" className="mt-0">
                  <Card className="backdrop-blur-md bg-white/5 border border-white/10 overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white">Jadwal Pending</CardTitle>
                      <CardDescription className="text-blue-200">
                        Jadwal yang belum dikonfirmasi oleh admin
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px] pr-4">
                        <InfiniteScroll
                          dataLength={pendingSchedules.length}
                          next={() => setSizePending(sizePending + 1)}
                          hasMore={!isReachingEndPending}
                          loader={
                            <div className="flex justify-center items-center my-4">
                              <Loader2 className="h-6 w-6 text-blue-300 animate-spin" />
                            </div>
                          }
                          scrollableTarget="scrollableDiv"
                        >
                          {isLoadingInitialPending ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-8 w-8 text-blue-300 animate-spin" />
                            </div>
                          ) : pendingSchedules.length > 0 ? (
                            pendingSchedules.map(renderScheduleCard)
                          ) : (
                            <div className="text-center py-8 text-blue-200 bg-white/5 rounded-lg border border-white/10">
                              <Clock3 className="h-12 w-12 mx-auto text-blue-300/50 mb-3" />
                              <p className="mb-4">Belum ada jadwal Pending</p>
                              <Button
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                                onClick={() => setIsAddScheduleOpen(true)}
                              >
                                <Plus className="h-4 w-4 mr-2" /> Tambah Jadwal
                              </Button>
                            </div>
                          )}
                        </InfiniteScroll>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="Accepted" className="mt-0">
                  <Card className="backdrop-blur-md bg-white/5 border border-white/10 overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white">Jadwal Accepted</CardTitle>
                      <CardDescription className="text-blue-200">
                        Jadwal yang telah dikonfirmasi oleh admin
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px] pr-4">
                        <InfiniteScroll
                          dataLength={acceptedSchedules.length}
                          next={() => setSizeAccepted(sizeAccepted + 1)}
                          hasMore={!isReachingEndAccepted}
                          loader={
                            <div className="flex justify-center items-center my-4">
                              <Loader2 className="h-6 w-6 text-blue-300 animate-spin" />
                            </div>
                          }
                          scrollableTarget="scrollableDiv"
                        >
                          {isLoadingInitialAccepted ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-8 w-8 text-blue-300 animate-spin" />
                            </div>
                          ) : acceptedSchedules.length > 0 ? (
                            acceptedSchedules.map(renderScheduleCard)
                          ) : (
                            <div className="text-center py-8 text-blue-200 bg-white/5 rounded-lg border border-white/10">
                              <CheckCircle className="h-12 w-12 mx-auto text-blue-300/50 mb-3" />
                              <p>Belum ada jadwal Accepted</p>
                            </div>
                          )}
                        </InfiniteScroll>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="Finished" className="mt-0">
                  <Card className="backdrop-blur-md bg-white/5 border border-white/10 overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white">Jadwal Finished</CardTitle>
                      <CardDescription className="text-blue-200">Jadwal yang telah selesai</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px] pr-4">
                        <InfiniteScroll
                          dataLength={finishedSchedules.length}
                          next={() => setSizeFinished(sizeFinished + 1)}
                          hasMore={!isReachingEndFinished}
                          loader={
                            <div className="flex justify-center items-center my-4">
                              <Loader2 className="h-6 w-6 text-blue-300 animate-spin" />
                            </div>
                          }
                          scrollableTarget="scrollableDiv"
                        >
                          {isLoadingInitialFinished ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-8 w-8 text-blue-300 animate-spin" />
                            </div>
                          ) : finishedSchedules.length > 0 ? (
                            finishedSchedules.map(renderScheduleCard)
                          ) : (
                            <div className="text-center py-8 text-blue-200 bg-white/5 rounded-lg border border-white/10">
                              <Star className="h-12 w-12 mx-auto text-blue-300/50 mb-3" />
                              <p>Belum ada jadwal Finished</p>
                            </div>
                          )}
                        </InfiniteScroll>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>

        {/* Add Schedule Dialog */}
       <Dialog open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
  <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-blue-900 to-blue-950 text-white border border-white/20 backdrop-blur-md">
    <DialogHeader>
      <VisuallyHidden>
        <DialogTitle>Tambah Jadwal Baru</DialogTitle> {/* Only one title inside VisuallyHidden */}
      </VisuallyHidden>
      <DialogDescription className="text-blue-200">
        Masukkan detail jadwal konsultasi baru di sini.
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-blue-100">
          Judul
        </Label>
        <Input
          id="title"
          placeholder="Masukkan judul jadwal"
          {...register("title")}
          className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400"
        />
        {errors.title && <p className="text-sm text-red-300">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-blue-100">
            Tanggal
          </Label>
          <div className="relative">
            <Controller
              name="date"
              control={scheduleControl}
              defaultValue={date}
              render={({ field }) => (
                <div
                  className="p-2 bg-white/5 border border-white/20 rounded-md text-white flex items-center justify-between cursor-pointer"
                  onClick={() => document.getElementById("calendar-popup")?.click()}
                >
                  <span>{date ? format(date, "dd MMMM yyyy") : "Pilih tanggal"}</span>
                  <CalendarIcon className="h-4 w-4 text-blue-300" />
                  <Dialog>
                    <DialogTrigger id="calendar-popup" className="hidden">
                      Open
                    </DialogTrigger>
                    <DialogContent className="bg-gradient-to-br from-blue-900 to-blue-950 text-white border border-white/20 backdrop-blur-md">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                          setDate(newDate);
                          field.onChange(newDate);
                        }}
                        className="rounded-md border border-white/10 bg-white/5 text-white"
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time" className="text-blue-100">
            Waktu
          </Label>
          <Input
            id="time"
            type="time"
            {...register("time")}
            className="bg-white/5 border-white/20 text-white focus:border-blue-400"
          />
          {errors.time && <p className="text-sm text-red-300">{errors.time.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-blue-100">
          Lokasi
        </Label>
        <Input
          id="address"
          placeholder="Masukkan alamat konsultasi atau 'Online'"
          {...register("address")}
          className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400"
        />
        {errors.address && <p className="text-sm text-red-300">{errors.address.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="counselor" className="text-blue-100">
          Konselor
        </Label>
        <select
          id="counselor"
          {...register("counselor_id")}
          className="w-full border rounded-md p-2 bg-white/5 border-white/20 text-white focus:border-blue-400"
        >
          <option value="">Pilih Konselor</option>
          {counselors.map((counselor) => (
            <option key={counselor.id} value={counselor.id}>
              {counselor.name}
            </option>
          ))}
        </select>
        {errors.counselor_id && <p className="text-sm text-red-300">{errors.counselor_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-blue-100">
          Deskripsi
        </Label>
        <Input
          id="description"
          placeholder="Masukkan deskripsi jadwal"
          {...register("description")}
          className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400"
        />
        {errors.description && <p className="text-sm text-red-300">{errors.description.message}</p>}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAddScheduleOpen(false)}
          className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 hover:text-white"
        >
          Batal
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
        >
          Tambah Jadwal
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

        {/* Reschedule Dialog */}
        <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
          {rescheduleData && (
            <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-blue-900 to-blue-950 text-white border border-white/20 backdrop-blur-md">
              <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Reschedule Jadwal</DialogTitle>
          </VisuallyHidden>
          <DialogTitle className="text-white">Reschedule Jadwal</DialogTitle>
          <DialogDescription className="text-blue-200">
            Masukkan tanggal dan waktu baru untuk jadwal ini.
          </DialogDescription>
              </DialogHeader>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newDate" className="flex items-center gap-2 text-blue-100">
                    <CalendarIcon className="h-4 w-4 text-blue-300" /> Tanggal Baru
                  </Label>
                  <div className="relative">
                    <div
                      className="p-2 bg-white/5 border border-white/20 rounded-md text-white flex items-center justify-between cursor-pointer"
                      onClick={() => document.getElementById("reschedule-calendar-popup")?.click()}
                    >
                      <span>{format(rescheduleData.date, "dd MMMM yyyy")}</span>
                      <CalendarIcon className="h-4 w-4 text-blue-300" />
                      <Dialog>
                        <DialogTrigger id="reschedule-calendar-popup" className="hidden">
                          Open
                        </DialogTrigger>
                        <DialogContent className="bg-gradient-to-br from-blue-900 to-blue-950 text-white border border-white/20 backdrop-blur-md">
                          <Calendar
                            mode="single"
                            selected={rescheduleData.date}
                            onSelect={(newDate) => {
                              if (newDate) {
                                setRescheduleData({
                                  ...rescheduleData,
                                  date: newDate,
                                })
                              }
                            }}
                            className="rounded-md border border-white/10 bg-white/5 text-white"
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newTime" className="flex items-center gap-2 text-blue-100">
                    <Clock className="h-4 w-4 text-blue-300" /> Waktu Baru
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
                    className="bg-white/5 border-white/20 text-white focus:border-blue-400"
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
                    className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 hover:text-white"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (rescheduleData) {
                        handleReschedule(rescheduleData.id, rescheduleData.date, rescheduleData.time)
                        setIsRescheduleOpen(false)
                        setRescheduleData(null)
                      }
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                  >
                    Simpan Perubahan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          )}
        </Dialog>

        {/* Rating Dialog */}
        <Dialog
          open={ratingData.open}
          onOpenChange={(open) => {
            if (!open) {
              setRatingData({ scheduleId: 0, open: false })
              resetRating()
            }
          }}
        >
          {ratingData.open && (
            <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-blue-900 to-blue-950 text-white border border-white/20 backdrop-blur-md">
              <DialogHeader>
              <VisuallyHidden>
                <DialogTitle>Beri Rating</DialogTitle>
              </VisuallyHidden>
              <DialogTitle className="text-white">Beri Rating</DialogTitle>
              <DialogDescription className="text-blue-200">
                Berikan rating dan deskripsi konsultasi Anda.
              </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitRating(onSubmitRating)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stars" className="text-blue-100">
                    Rating
                  </Label>
                  <Controller
                    name="stars"
                    control={control}
                    defaultValue={0.5}
                    render={({ field }) => (
                      <div className="flex items-center justify-center">
                        <ReactStars
                          count={5}
                          onChange={(newRating: number) => field.onChange(newRating)}
                          size={30}
                          half={true}
                          value={field.value}
                          color2={"#ffd700"}
                        />
                        <span className="ml-2 text-sm text-blue-200">{field.value} / 5</span>
                      </div>
                    )}
                  />
                  {errorsRating.stars && <p className="text-sm text-red-300">{errorsRating.stars.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-blue-100">
                    Deskripsi
                  </Label>
                  <Input
                    id="description"
                    placeholder="Berikan komentar tentang konsultasi Anda"
                    {...registerRating("description")}
                    className="bg-white/5 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                  />
                  {errorsRating.description && (
                    <p className="text-sm text-red-300">{errorsRating.description.message}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRatingData({ scheduleId: 0, open: false })}
                    className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 hover:text-white"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                  >
                    Kirim Rating
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          )}
        </Dialog>

        {/* Schedule Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          {selectedSchedule && (
            <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-blue-900 to-blue-950 text-white border border-white/20 backdrop-blur-md">
              <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Detail Jadwal</DialogTitle>
          </VisuallyHidden>
          <DialogTitle className="text-white">Detail Jadwal</DialogTitle>
          <DialogDescription className="text-blue-200">
            Informasi lengkap tentang jadwal konsultasi
          </DialogDescription>
              </DialogHeader>
              {renderScheduleDetail(selectedSchedule)}
            </DialogContent>
          )}
        </Dialog>

        {/* Notifications Popover for Desktop */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white border-blue-400/30 h-14 w-14 rounded-full shadow-lg md:hidden"
            >
              <Bell className="h-6 w-6" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-blue-900 border-white/20">
            <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-medium text-white">Notifikasi</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-200 hover:text-white text-xs"
                onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
              >
                Tandai Semua Dibaca
              </Button>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="p-2 space-y-2">
                {notifications.length > 0 ? (
                  notifications.map(renderNotificationItem)
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-8 w-8 mx-auto text-blue-300/50 mb-2" />
                    <p className="text-blue-200 text-sm">Tidak ada notifikasi</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

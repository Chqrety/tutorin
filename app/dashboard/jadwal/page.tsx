"use client"

import { useState, useEffect, useMemo } from "react"
import useSWRInfinite from "swr/infinite"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import {
  Clock,
  Trash,
  Edit,
  CalendarIcon,
  MapPin,
  User,
  Star,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock3,
} from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { toast } from "react-toastify"
import InfiniteScroll from "react-infinite-scroll-component"
import ReactStars from "react-stars"
import { useMediaQuery } from "@/hooks/use-media-query"

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

  const isMobile = useMediaQuery("(max-width: 768px)")
  const pageSize = 10

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

        const { data: schedule, error } = await supabase
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

  // Render schedule card
  const renderScheduleCard = (schedule: Schedule) => {
    const getStatusBadge = () => {
      switch (schedule.status) {
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
        case "Finished":
          return (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              Finished
            </Badge>
          )
        case "Canceled":
          return (
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
              Canceled
            </Badge>
          )
        default:
          return <Badge variant="outline">{schedule.status}</Badge>
      }
    }

    return (
      <Card key={schedule.id} className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{schedule.title}</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            <div className="flex items-center gap-1 mt-1">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{format(schedule.date, "dd MMMM yyyy")}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{schedule.time}</span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-start gap-1 mb-1">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span>{schedule.address}</span>
          </div>
          {schedule.counselor && (
            <div className="flex items-start gap-1 mb-1">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>
                <strong>Konselor:</strong> {schedule.counselor.name}
              </span>
            </div>
          )}
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">{schedule.description}</p>
          </div>
          {schedule.rating && (
            <div className="flex items-center mt-2">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-sm">{schedule.rating.stars} / 5</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 pt-0">
          {schedule.status === "Pending" && !schedule.confirmed && (
            <>
              <Button size="sm" onClick={() => handleConfirmSchedule(schedule)}>
                <CheckCircle className="h-4 w-4 mr-1" /> Konfirmasi
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDeleteSchedule(schedule.id)}>
                <Trash className="h-4 w-4 mr-1" /> Hapus
              </Button>
            </>
          )}
          {(schedule.status === "Pending" || schedule.status === "Accepted") && schedule.confirmed && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setRescheduleData({ id: schedule.id, date: schedule.date, time: schedule.time })
                  setIsRescheduleOpen(true)
                }}
              >
                <Edit className="h-4 w-4 mr-1" /> Reschedule
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleCancelSchedule(schedule.id)}>
                <AlertCircle className="h-4 w-4 mr-1" /> Batalkan
              </Button>
            </>
          )}
          {schedule.status === "Finished" && !schedule.rating && (
            <Button size="sm" onClick={() => setRatingData({ scheduleId: schedule.id, open: true })}>
              <Star className="h-4 w-4 mr-1" /> Beri Rating
            </Button>
          )}
          {(schedule.status === "Accepted" || schedule.status === "Finished") && (
            <Button size="sm" variant="destructive" onClick={() => handleDeleteSchedule(schedule.id)}>
              <Trash className="h-4 w-4 mr-1" /> Hapus
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Jadwal Konsultasi</h1>
        <Button onClick={() => setIsAddScheduleOpen(true)} className="mt-4 md:mt-0" size={isMobile ? "sm" : "default"}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Jadwal
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar and Info Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" /> Kalender
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border w-full" />
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-sm">Pending: {pendingSchedules.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-sm">Accepted: {acceptedSchedules.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <span className="text-sm">Finished: {finishedSchedules.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedules Section */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="Pending" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="Pending" className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" /> Pending
              </TabsTrigger>
              <TabsTrigger value="Accepted" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Accepted
              </TabsTrigger>
              <TabsTrigger value="Finished" className="flex items-center gap-2">
                <Star className="h-4 w-4" /> Finished
              </TabsTrigger>
            </TabsList>

            <TabsContent value="Pending" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Jadwal Pending</CardTitle>
                  <CardDescription>Jadwal yang belum dikonfirmasi oleh admin</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <InfiniteScroll
                      dataLength={pendingSchedules.length}
                      next={() => setSizePending(sizePending + 1)}
                      hasMore={!isReachingEndPending}
                      loader={
                        <div className="flex justify-center items-center my-4">
                          <svg
                            className="animate-spin h-6 w-6 text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                          </svg>
                        </div>
                      }
                      scrollableTarget="scrollableDiv"
                    >
                      {isLoadingInitialPending ? (
                        <div className="flex justify-center py-8">
                          <svg
                            className="animate-spin h-8 w-8 text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                          </svg>
                        </div>
                      ) : pendingSchedules.length > 0 ? (
                        pendingSchedules.map(renderScheduleCard)
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">Belum ada jadwal Pending</div>
                      )}
                    </InfiniteScroll>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="Accepted" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Jadwal Accepted</CardTitle>
                  <CardDescription>Jadwal yang telah dikonfirmasi oleh admin</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <InfiniteScroll
                      dataLength={acceptedSchedules.length}
                      next={() => setSizeAccepted(sizeAccepted + 1)}
                      hasMore={!isReachingEndAccepted}
                      loader={
                        <div className="flex justify-center items-center my-4">
                          <svg
                            className="animate-spin h-6 w-6 text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                          </svg>
                        </div>
                      }
                      scrollableTarget="scrollableDiv"
                    >
                      {isLoadingInitialAccepted ? (
                        <div className="flex justify-center py-8">
                          <svg
                            className="animate-spin h-8 w-8 text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                          </svg>
                        </div>
                      ) : acceptedSchedules.length > 0 ? (
                        acceptedSchedules.map(renderScheduleCard)
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">Belum ada jadwal Accepted</div>
                      )}
                    </InfiniteScroll>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="Finished" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Jadwal Finished</CardTitle>
                  <CardDescription>Jadwal yang telah selesai</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <InfiniteScroll
                      dataLength={finishedSchedules.length}
                      next={() => setSizeFinished(sizeFinished + 1)}
                      hasMore={!isReachingEndFinished}
                      loader={
                        <div className="flex justify-center items-center my-4">
                          <svg
                            className="animate-spin h-6 w-6 text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                          </svg>
                        </div>
                      }
                      scrollableTarget="scrollableDiv"
                    >
                      {isLoadingInitialFinished ? (
                        <div className="flex justify-center py-8">
                          <svg
                            className="animate-spin h-8 w-8 text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            ></path>
                          </svg>
                        </div>
                      ) : finishedSchedules.length > 0 ? (
                        finishedSchedules.map(renderScheduleCard)
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">Belum ada jadwal Finished</div>
                      )}
                    </InfiniteScroll>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Schedule Dialog */}
      <Dialog open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Jadwal Baru</DialogTitle>
            <DialogDescription>Masukkan detail jadwal konsultasi baru di sini.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul</Label>
                <Input id="title" placeholder="Masukkan judul jadwal" {...register("title")} />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Waktu</Label>
                <Input id="time" type="time" {...register("time")} />
                {errors.time && <p className="text-sm text-red-500">{errors.time.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input id="address" placeholder="Masukkan alamat konsultasi" {...register("address")} />
              {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="counselor">Konselor</Label>
              <select id="counselor" {...register("counselor_id")} className="w-full border rounded-md p-2">
                <option value="">Pilih Konselor</option>
                {counselors.map((counselor) => (
                  <option key={counselor.id} value={counselor.id}>
                    {counselor.name}
                  </option>
                ))}
              </select>
              {errors.counselor_id && <p className="text-sm text-red-500">{errors.counselor_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input id="description" placeholder="Masukkan deskripsi jadwal" {...register("description")} />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddScheduleOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Tambah Jadwal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        {rescheduleData && (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Reschedule Jadwal</DialogTitle>
              <DialogDescription>Masukkan tanggal dan waktu baru untuk jadwal ini.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newDate" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" /> Tanggal Baru
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
                  <Clock className="h-4 w-4" /> Waktu Baru
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
                      handleReschedule(rescheduleData.id, rescheduleData.date, rescheduleData.time)
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Beri Rating</DialogTitle>
              <DialogDescription>Berikan rating dan deskripsi konsultasi Anda.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitRating(onSubmitRating)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stars">Rating</Label>
                <Controller
                  name="stars"
                  control={control}
                  defaultValue={0.5}
                  render={({ field }) => (
                    <div className="flex items-center">
                      <ReactStars
                        count={5}
                        onChange={(newRating: number) => field.onChange(newRating)}
                        size={30}
                        half={true}
                        value={field.value}
                        color2={"#ffd700"}
                      />
                      <span className="ml-2 text-sm text-gray-600">{field.value} / 5</span>
                    </div>
                  )}
                />
                {errorsRating.stars && <p className="text-sm text-red-500">{errorsRating.stars.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  placeholder="Berikan komentar tentang konsultasi Anda"
                  {...registerRating("description")}
                />
                {errorsRating.description && <p className="text-sm text-red-500">{errorsRating.description.message}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRatingData({ scheduleId: 0, open: false })}>
                  Batal
                </Button>
                <Button type="submit">Kirim Rating</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

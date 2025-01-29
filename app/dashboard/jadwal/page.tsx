// pages/jadwal.tsx

"use client"

import { useState, useEffect, useMemo } from "react"
import useSWRInfinite from 'swr/infinite'
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { Clock, Trash, Edit, Calendar as CalendarIcon, MapPin, User, Star } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { toast } from 'react-toastify'
import InfiniteScroll from 'react-infinite-scroll-component'

import ReactStars from 'react-stars'; // Menggunakan 'react-stars'

type SenderRole = 'admin' | 'user'

type Schedule = {
  id: number
  date: Date
  time: string
  title: string
  description: string
  address: string
  status: string
  confirmed: boolean // Properti baru
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
  stars: yup.number()
    .required("Rating bintang wajib diisi")
    .min(0.5, "Minimal 0.5 bintang")
    .max(5, "Maksimal 5 bintang"),
  description: yup.string().required("Deskripsi wajib diisi"),
})

const fetcher = async (userId: string, status: string, page: number, pageSize: number) => {
  console.log(`Fetching schedules for userId: ${userId}, status: ${status}, page: ${page}, pageSize: ${pageSize}`)
  
  const { data, error, count } = await supabase
    .from("schedules")
    .select(`
      *,
      counselor: counselors(id, admin: admins(name, email)),
      rating: ratings(stars, description)
    `, { count: 'exact' })
    .eq("user_id", userId)
    .eq("status", status)
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) {
    console.error("Error in fetcher:", error)
    throw error
  }

  console.log("Fetcher data:", data)

  return {
    schedules: data.map((item: any) => ({
      id: item.id,
      date: new Date(item.date),
      time: item.time,
      title: item.title,
      description: item.description,
      address: item.address,
      status: item.status,
      confirmed: item.confirmed, // Sertakan confirmed
      counselor: item.counselor ? {
        id: item.counselor.id,
        name: item.counselor.admin.name,
        adminEmail: item.counselor.admin.email,
      } : null,
      rating: item.rating ? {
        stars: item.rating.stars,
        description: item.rating.description,
      } : null,
    })),
    total: count,
  }
}

export default function JadwalPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [counselors, setCounselors] = useState<Counselor[]>([])
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [rescheduleData, setRescheduleData] = useState<{ id: number, date: Date, time: string } | null>(null)

  // State untuk rating modal
  const [ratingData, setRatingData] = useState<{ scheduleId: number, open: boolean }>({ scheduleId: 0, open: false })
  
  // Setup React Hook Form untuk rating
  const { 
    control, 
    register: registerRating, 
    handleSubmit: handleSubmitRating, 
    formState: { errors: errorsRating }, 
    reset: resetRating 
  } = useForm<RatingData>({
    resolver: yupResolver(ratingSchema),
    defaultValues: {
      stars: 0.5, // Atur defaultValue ke 0.5
      description: "",
    },
  })

  // Setup React Hook Form untuk jadwal
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
  })

  // Ambil userId dari session
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const userSession = sessionStorage.getItem("userSession")
    if (userSession) {
      const { userId } = JSON.parse(userSession)
      console.log("User ID:", userId) // Untuk verifikasi
      setUserId(userId)
    } else {
      console.error("User session tidak ditemukan!")
    }
  }, [])

  // Fetch counselors
  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const { data, error } = await supabase
          .from("counselors")
          .select(`
            id,
            admin:admins(name, email)
          `)

        if (error) {
          console.error("Gagal mengambil data konselor:", error)
          return
        }

        // Transformasi data untuk menyesuaikan format
        const transformedData = data.map((item: any) => ({
          id: item.id,
          name: item.admin.name, // Nama admin sebagai nama konselor
          adminEmail: item.admin.email, // Email admin
        }))

        console.log("Transformed Counselors:", transformedData) // Untuk verifikasi

        setCounselors(transformedData)
      } catch (err) {
        console.error("Error saat mengambil data konselor:", err)
      }
    }

    fetchCounselors()
  }, [])

  // Fetch schedules untuk 'Accepted' dan 'Pending' dengan SWR Infinite terpisah
  const pageSize = 10 // Tingkatkan pageSize menjadi 10

  // State untuk tab
  const [activeTab, setActiveTab] = useState<'Pending' | 'Accepted' | 'Finished'>('Pending') // ADDED 'Finished'

  // Fetcher Accepted
  const getKeyAccepted = (pageIndex: number, previousPageData: any) => {
    // Jika sudah tidak ada data lagi
    if (previousPageData && !previousPageData.schedules.length) return null
    return userId ? ['schedules', userId, 'Accepted', pageIndex + 1, pageSize] : null
  }

  const fetcherAccepted = (key: any) => fetcher(key[1], key[2], key[3], key[4])

  const { data: dataAccepted, error: errorAccepted, size: sizeAccepted, setSize: setSizeAccepted, mutate: mutateAccepted } = useSWRInfinite(
    getKeyAccepted,
    fetcherAccepted,
    {
      dedupingInterval: 60000, // 1 menit
      revalidateOnFocus: false,
    }
  )

  const acceptedSchedules = useMemo(() => {
    return dataAccepted ? dataAccepted.flatMap(page => page.schedules) : []
  }, [dataAccepted])

  const isLoadingInitialAccepted = !dataAccepted && !errorAccepted
  const isLoadingMoreAccepted =
    isLoadingInitialAccepted ||
    (sizeAccepted > 0 && dataAccepted && typeof dataAccepted[sizeAccepted - 1] === "undefined")
  const isEmptyAccepted = dataAccepted?.[0]?.schedules?.length === 0
  const isReachingEndAccepted =
    isEmptyAccepted || (dataAccepted && dataAccepted[dataAccepted.length - 1]?.schedules.length < pageSize)

  // Fetcher Pending
  const getKeyPending = (pageIndex: number, previousPageData: any) => {
    // Jika sudah tidak ada data lagi
    if (previousPageData && !previousPageData.schedules.length) return null
    return userId ? ['schedules', userId, 'Pending', pageIndex + 1, pageSize] : null // 'Pending' dengan 'P' kapital
  }

  const fetcherPending = (key: any) => fetcher(key[1], key[2], key[3], key[4])

  const { data: dataPending, error: errorPending, size: sizePending, setSize: setSizePending, mutate: mutatePending } = useSWRInfinite(
    getKeyPending,
    fetcherPending,
    {
      dedupingInterval: 60000, // 1 menit
      revalidateOnFocus: false,
    }
  )

  const pendingSchedules = useMemo(() => {
    return dataPending ? dataPending.flatMap(page => page.schedules) : []
  }, [dataPending])

  const isLoadingInitialPending = !dataPending && !errorPending
  const isLoadingMorePending =
    isLoadingInitialPending ||
    (sizePending > 0 && dataPending && typeof dataPending[sizePending - 1] === "undefined")
  const isEmptyPending = dataPending?.[0]?.schedules?.length === 0
  const isReachingEndPending =
    isEmptyPending || (dataPending && dataPending[dataPending.length - 1]?.schedules.length < pageSize)

  // ADDED: Fetcher Finished
  const getKeyFinished = (pageIndex: number, previousPageData: any) => {
    // Jika sudah tidak ada data lagi
    if (previousPageData && !previousPageData.schedules.length) return null
    return userId ? ['schedules', userId, 'Finished', pageIndex + 1, pageSize] : null // 'Finished' dengan 'F' kapital
  }

  const fetcherFinished = (key: any) => fetcher(key[1], key[2], key[3], key[4])

  const { data: dataFinished, error: errorFinished, size: sizeFinished, setSize: setSizeFinished, mutate: mutateFinished } = useSWRInfinite(
    getKeyFinished,
    fetcherFinished,
    {
      dedupingInterval: 60000, // 1 menit
      revalidateOnFocus: false,
    }
  )

  const finishedSchedules = useMemo(() => {
    return dataFinished ? dataFinished.flatMap(page => page.schedules) : []
  }, [dataFinished])

  const isLoadingInitialFinished = !dataFinished && !errorFinished
  const isLoadingMoreFinished =
    isLoadingInitialFinished ||
    (sizeFinished > 0 && dataFinished && typeof dataFinished[sizeFinished - 1] === "undefined")
  const isEmptyFinished = dataFinished?.[0]?.schedules?.length === 0
  const isReachingEndFinished =
    isEmptyFinished || (dataFinished && dataFinished[dataFinished.length - 1]?.schedules.length < pageSize)

  // Menambahkan Real-time Subscriptions
  useEffect(() => {
    if (!userId) return

    // Real-time untuk Jadwal Accepted
    const subscriptionAccepted = supabase
      .channel('accepted-schedules')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'schedules',
        filter: `user_id=eq.${userId}&status=eq.Accepted`, // 'Accepted' dengan 'A' kapital
      }, payload => {
        console.log('Change received for accepted:', payload)
        mutateAccepted()
      })
      .subscribe()

    // Real-time untuk Jadwal Pending
    const subscriptionPending = supabase
      .channel('pending-schedules')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'schedules',
        filter: `user_id=eq.${userId}&status=eq.Pending`, // 'Pending' dengan 'P' kapital
      }, payload => {
        console.log('Change received for pending:', payload)
        mutatePending()
      })
      .subscribe()

    // Real-time untuk Jadwal Finished // ADDED
    const subscriptionFinished = supabase
      .channel('finished-schedules')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'schedules',
        filter: `user_id=eq.${userId}&status=eq.Finished`, // 'Finished' dengan 'F' kapital
      }, payload => {
        console.log('Change received for finished:', payload)
        mutateFinished()
      })
      .subscribe()

    // Cleanup subscriptions saat komponen unmount
    return () => {
      supabase.removeChannel(subscriptionAccepted)
      supabase.removeChannel(subscriptionPending)
      supabase.removeChannel(subscriptionFinished) // ADDED
    }
  }, [userId, mutateAccepted, mutatePending, mutateFinished]) // ADDED mutateFinished

  // Fungsi untuk mengirim notifikasi email
  const sendEmailNotification = async (
    adminEmail: string,
    scheduleId: number,
    date: string,
    time: string,
    address: string,
    title: string,
    senderRole: SenderRole,
    action: string // Tambahkan parameter action untuk membedakan jenis email
  ) => {
    try {
      const subjectMap: Record<string, string> = {
        'add': `Jadwal Konsultasi Baru: ${title}`,
        'reschedule': `Jadwal Konsultasi Di-reschedule: ${title}`,
        'cancel': `Jadwal Konsultasi Dibatalkan: ${title}`,
        'confirm': `Konfirmasi Jadwal Konsultasi: ${title}`, // Tambahkan aksi 'confirm'
        'delete': `Jadwal Konsultasi Dihapus: ${title}`, // Tambahkan aksi 'delete'
        'finished': `Jadwal Konsultasi Selesai: ${title}`, // Tambahkan aksi 'finished'
      }

      const bodyMap: Record<string, string> = {
        'add': `
Anda memiliki jadwal konsultasi baru.

ID Jadwal: ${scheduleId}
Tanggal: ${date}
Waktu: ${time}
Alamat: ${address}
Judul: ${title}

Silakan login ke dashboard untuk melihat detail lebih lanjut.
        `,
        'reschedule': `
Jadwal konsultasi Anda telah di-reschedule.

ID Jadwal: ${scheduleId}
Tanggal Baru: ${date}
Waktu Baru: ${time}
Alamat: ${address}
Judul: ${title}

Silakan login ke dashboard untuk melihat detail lebih lanjut.
        `,
        'cancel': `
Jadwal konsultasi Anda telah dibatalkan.

ID Jadwal: ${scheduleId}
Tanggal: ${date}
Waktu: ${time}
Alamat: ${address}
Judul: ${title}

Silakan hubungi kami jika Anda memiliki pertanyaan lebih lanjut.
        `,
        'confirm': `
Jadwal konsultasi Anda telah dikonfirmasi.

ID Jadwal: ${scheduleId}
Tanggal: ${date}
Waktu: ${time}
Alamat: ${address}
Judul: ${title}

Terima kasih telah mengonfirmasi jadwal ini.
        `,
        'delete': `
Jadwal konsultasi Anda telah dihapus.

ID Jadwal: ${scheduleId}
Tanggal: ${date}
Waktu: ${time}
Alamat: ${address}
Judul: ${title}

Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi kami.
        `,
        'finished': `
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
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`, // Optional: Hapus jika tidak diperlukan
        },
        body: JSON.stringify({
          email: adminEmail, // Email penerima
          subject: subjectMap[action],
          body: bodyMap[action],
          senderRole, // Sertakan senderRole di body
          action, // Sertakan aksi
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

  // Fungsi untuk menambah jadwal
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
            date: date.toISOString().split("T")[0], // Format tanggal
            time: time,
            title: title,
            description: description,
            address: address,
            counselor_id: counselor_id, // Menambahkan counselor_id
            status: 'Pending', // Atur status sebagai 'Pending' untuk jadwal baru
            confirmed: false, // Atur confirmed sebagai false
          })
          .select(`
            *,
            counselor: counselors(id, admin: admins(name, email))
          `) // Menambahkan relasi counselor

        if (error) {
          console.error(error)
          toast.error("Gagal menambahkan jadwal.")
          return
        }

        // Mutasi SWR untuk mengambil data terbaru
        mutatePending()
        mutateAccepted()
        mutateFinished() // ADDED

        reset() // Reset form
        toast.success("Jadwal berhasil ditambahkan! Silakan konfirmasi untuk mengirim notifikasi email.")

        // Tidak mengirim email otomatis di sini

      } catch (err: any) {
        console.error(err)
        toast.error("Terjadi kesalahan. Coba lagi.")
      }
    } else {
      toast.error("Tanggal wajib dipilih.")
    }
  }

  // Fungsi untuk mereschedule jadwal
  const handleReschedule = async (scheduleId: number, newDate: Date, newTime: string) => {
    // Validasi tanggal dan waktu baru
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

      // Mutasi SWR untuk mengambil data terbaru
      mutatePending()
      mutateAccepted()
      mutateFinished() // ADDED

      toast.success("Jadwal berhasil di-reschedule!")

      // Kirim notifikasi email
      const scheduleItem = [...pendingSchedules, ...acceptedSchedules].find(s => s.id === scheduleId)
      if (scheduleItem && scheduleItem.counselor) {
        const formattedDate = format(newDate, "dd MMMM yyyy")
        const emailSent = await sendEmailNotification(
          scheduleItem.counselor.adminEmail, // Kirim ke email admin
          scheduleItem.id,
          formattedDate,
          newTime,
          scheduleItem.address,
          scheduleItem.title,
          'user', // Sertakan senderRole sebagai 'user'
          'reschedule' // Jenis aksi
        )

        if (emailSent) {
          console.log("Email notifikasi berhasil dikirim.")
        } else {
          toast.error("Jadwal berhasil di-reschedule, tetapi gagal mengirim notifikasi email.")
        }
      }

    } catch (err: any) {
      console.error("Error saat mereschedule jadwal:", err)
      toast.error("Terjadi kesalahan saat mereschedule jadwal.")
    }
  }

  // Fungsi untuk membatalkan jadwal (mengubah status menjadi 'Canceled')
  const handleCancelSchedule = async (scheduleId: number) => {
    if (confirm("Apakah Anda yakin ingin membatalkan jadwal ini?")) {
      try {
        const { error } = await supabase
          .from("schedules")
          .update({ status: 'Canceled' }) // Atur status menjadi 'Canceled'
          .eq("id", scheduleId)

        if (error) {
          console.error("Gagal membatalkan jadwal:", error)
          toast.error("Gagal membatalkan jadwal.")
          return
        }

        // Mutasi SWR untuk mengambil data terbaru
        mutatePending()
        mutateAccepted()
        mutateFinished() // ADDED

        toast.success("Jadwal berhasil dibatalkan!")

        // Kirim notifikasi email jika diperlukan
        const scheduleItem = [...pendingSchedules, ...acceptedSchedules].find(s => s.id === scheduleId)
        if (scheduleItem && scheduleItem.counselor) {
          const formattedDate = format(scheduleItem.date, "dd MMMM yyyy")
          const emailSent = await sendEmailNotification(
            scheduleItem.counselor.adminEmail, // Kirim ke email admin
            scheduleItem.id,
            formattedDate,
            scheduleItem.time,
            scheduleItem.address,
            scheduleItem.title,
            'user', // Sertakan senderRole sebagai 'user'
            'cancel' // Jenis aksi
          )

          if (emailSent) {
            console.log("Email notifikasi pembatalan berhasil dikirim.")
          } else {
            toast.error("Jadwal berhasil dibatalkan, tetapi gagal mengirim notifikasi email.")
          }
        }
      } catch (err: any) {
        console.error("Error saat membatalkan jadwal:", err)
        toast.error("Terjadi kesalahan saat membatalkan jadwal.")
      }
    }
  }

  // Fungsi untuk menghapus jadwal secara permanen
  const handleDeleteSchedule = async (scheduleId: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      try {
        const { error } = await supabase
          .from("schedules")
          .delete()
          .eq("id", scheduleId)

        if (error) {
          console.error("Gagal menghapus jadwal:", error)
          toast.error("Gagal menghapus jadwal.")
          return
        }

        // Mutasi SWR untuk mengambil data terbaru
        mutatePending()
        mutateAccepted()
        mutateFinished() // ADDED

        toast.success("Jadwal berhasil dihapus!")

        // Kirim notifikasi email jika diperlukan
        // const scheduleItem = [...pendingSchedules, ...acceptedSchedules].find(s => s.id === scheduleId)
        // if (scheduleItem && scheduleItem.counselor) {
        //   const formattedDate = format(scheduleItem.date, "dd MMMM yyyy")
        //   const emailSent = await sendEmailNotification(
        //     scheduleItem.counselor.adminEmail, // Kirim ke email admin
        //     scheduleItem.id,
        //     formattedDate,
        //     scheduleItem.time,
        //     scheduleItem.address,
        //     scheduleItem.title,
        //     'user', // Sertakan senderRole sebagai 'user'
        //     'delete' // Jenis aksi
        //   )

        //   if (emailSent) {
        //     console.log("Email notifikasi penghapusan berhasil dikirim.")
        //   } else {
        //     toast.error("Jadwal berhasil dihapus, tetapi gagal mengirim notifikasi email.")
        //   }
        // }
      } catch (err: any) {
        console.error("Error saat menghapus jadwal:", err)
        toast.error("Terjadi kesalahan saat menghapus jadwal.")
      }
    }
  }

  // Fungsi untuk menghandle pengiriman rating
  const onSubmitRating = async (data: any) => {
    const { stars, description } = data;
    const { scheduleId } = ratingData; // Pastikan scheduleId adalah angka
  
    try {
      const userSession = sessionStorage.getItem("userSession");
      if (!userSession) {
        toast.error("Anda belum login!");
        return;
      }
  
      const { token } = JSON.parse(userSession);
      if (!token) {
        toast.error("Token tidak tersedia. Harap login ulang.");
        return;
      }
  
      console.log("Data yang dikirim ke backend:", {
        schedule_id: Number(scheduleId), // Pastikan ini angka (int)
        stars,
        description,
      });
  
      const response = await fetch("/api/submit-rating", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Kirim token dalam request
        },
        body: JSON.stringify({
          schedule_id: Number(scheduleId), // Ubah ke angka (int)
          stars,
          description,
        }),
      });
  
      if (!response.ok) {
        const resData = await response.json();
        console.error("Gagal mengirim rating:", resData.message, resData.errors);
        toast.error(`Gagal mengirim rating: ${resData.message || "Terjadi kesalahan."}`);
        return;
      }
  
      toast.success("Rating berhasil dikirim!");
      mutatePending();
      mutateAccepted();
      mutateFinished();
  
      setRatingData({ scheduleId: 0, open: false });
      resetRating();
    } catch (err) {
      console.error("Error saat mengirim rating:", err);
      toast.error("Terjadi kesalahan saat mengirim rating.");
    }
  };
  
  // Fungsi untuk mengonfirmasi jadwal dan mengirim email notifikasi
  const handleConfirmSchedule = async (schedule: Schedule) => {
    try {
      const formattedDate = format(schedule.date, "dd MMMM yyyy")

      const emailSent = await sendEmailNotification(
        schedule.counselor!.adminEmail, // Pastikan counselor ada
        schedule.id,
        formattedDate,
        schedule.time,
        schedule.address,
        schedule.title,
        'user', // Sertakan senderRole sebagai 'user'
        'confirm' // Jenis aksi
      )

      if (emailSent) {
        toast.success("Notifikasi email berhasil dikirim ke admin.")
        // Update field 'confirmed' menjadi true di database
        const { error } = await supabase
          .from("schedules")
          .update({ confirmed: true })
          .eq("id", schedule.id)

        if (error) {
          console.error("Gagal memperbarui status konfirmasi:", error)
          toast.error("Jadwal telah dikonfirmasi, tetapi gagal memperbarui status.")
          return
        }

        // Mutasi SWR untuk mengambil data terbaru
        mutatePending()
        mutateAccepted()
        mutateFinished() // ADDED
      } else {
        toast.error("Gagal mengirim notifikasi email ke admin.")
      }
    } catch (err: any) {
      console.error("Error saat mengonfirmasi jadwal:", err)
      toast.error("Terjadi kesalahan saat mengonfirmasi jadwal.")
    }
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-3xl font-bold tracking-tight mb-4">Jadwal Konsultasi</h2>
      
      {/* Layout untuk Kalender dan Tambah Jadwal */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
        <div className="md:w-1/2 w-full">
          <Calendar 
            mode="single" 
            selected={date} 
            onSelect={setDate} 
            className="rounded-md border p-2 w-full" 
          />
        </div>
        <div className="md:w-1/2 w-full">
          {/* Dialog untuk Menambah Jadwal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">Tambah Jadwal</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] w-full">
              <DialogHeader>
                <DialogTitle>Tambah Jadwal Baru</DialogTitle>
                <DialogDescription>Masukkan detail jadwal konsultasi baru di sini.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="title">Judul</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    className="mt-1"
                  />
                  {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                </div>
                <div>
                  <Label htmlFor="time">Waktu</Label>
                  <Input
                    id="time"
                    type="time"
                    {...register("time")}
                    className="mt-1"
                  />
                  {errors.time && <p className="text-red-500 text-sm">{errors.time.message}</p>}
                </div>
                <div>
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    id="address"
                    {...register("address")}
                    className="mt-1"
                  />
                  {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
                </div>
                <div>
                  <Label htmlFor="counselor">Konselor</Label>
                  <select
                    id="counselor"
                    {...register("counselor_id")}
                    className="mt-1 block w-full border rounded-md p-2"
                  >
                    <option value="">Pilih Konselor</option>
                    {counselors.map((counselor) => (
                      <option key={counselor.id} value={counselor.id}>
                        {counselor.name}
                      </option>
                    ))}
                  </select>
                  {errors.counselor_id && <p className="text-red-500 text-sm">{errors.counselor_id.message}</p>}
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Input
                    id="description"
                    {...register("description")}
                    className="mt-1"
                  />
                  {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">Tambah Jadwal</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4">
        <Button
          variant={activeTab === 'Pending' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('Pending')}
        >
          Pending
        </Button>
        <Button
          variant={activeTab === 'Accepted' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('Accepted')}
        >
          Accepted
        </Button>
        <Button // ADDED: Finished Tab
          variant={activeTab === 'Finished' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('Finished')}
        >
          Finished
        </Button>
      </div>

      {/* List Jadwal Berdasarkan Tab */}
      {activeTab === 'Pending' && (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Jadwal Pending</h3>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <InfiniteScroll
              dataLength={pendingSchedules.length}
              next={() => setSizePending(sizePending + 1)}
              hasMore={!isReachingEndPending}
              loader={
                <div className="flex justify-center items-center my-4">
                  <svg className="animate-spin h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
              }
              endMessage={
                <p className="text-center text-gray-500 mt-4">
                  <b>Anda telah melihat semua jadwal Pending.</b>
                </p>
              }
            >
              {isLoadingInitialPending && <p className="text-center text-gray-500">Memuat jadwal...</p>}
              {pendingSchedules.length > 0 ? (
                pendingSchedules.map((schedule) => (
                  <div key={schedule.id} className="mb-4 p-4 border rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white">
                    <h3 className="font-semibold text-lg flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5 text-blue-500" /> {schedule.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="mr-1 h-4 w-4" />
                      {format(schedule.date, "dd MMMM yyyy")} - {schedule.time}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="mr-1 h-4 w-4" />
                      {schedule.address}
                    </div>
                    <p className="mt-2 text-gray-700">{schedule.description}</p>
                    {schedule.counselor && (
                      <div className="flex items-center text-sm text-gray-600 mt-2">
                        <User className="mr-1 h-4 w-4" />
                        <strong>Konselor:</strong> {schedule.counselor.name}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span className="font-semibold">Status:</span> {schedule.status}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span className="font-semibold">Sudah Dikonfirmasi:</span> {schedule.confirmed ? 'Ya' : 'Tidak'}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {/* Tombol Konfirmasi dan Hapus hanya muncul jika confirmed adalah false */}
                      {!schedule.confirmed && (
                        <>
                          <Button
                            variant="default"
                            onClick={() => handleConfirmSchedule(schedule)}
                            className="flex items-center"
                          >
                            Konfirmasi
                          </Button>
                          <Button variant="destructive" onClick={() => handleDeleteSchedule(schedule.id)}>
                            <Trash className="mr-1 h-4 w-4" /> Hapus
                          </Button>
                        </>
                      )}
                      {/* Tombol Reschedule dan Hapus muncul jika confirmed adalah true */}
                      {schedule.confirmed && (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setRescheduleData({ id: schedule.id, date: schedule.date, time: schedule.time })
                              setIsRescheduleOpen(true)
                            }}
                            className="flex items-center"
                          >
                            <Edit className="mr-1 h-4 w-4" /> Reschedule
                          </Button>
                          <Button variant="destructive" onClick={() => handleCancelSchedule(schedule.id)}>
                            <Trash className="mr-1 h-4 w-4" /> Batalkan
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                !isLoadingInitialPending && <p className="text-center text-gray-500">Belum ada jadwal Pending.</p>
              )}
            </InfiniteScroll>
          </ScrollArea>
        </div>
      )}

      {activeTab === 'Accepted' && (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Jadwal Accepted</h3>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <InfiniteScroll
              dataLength={acceptedSchedules.length}
              next={() => setSizeAccepted(sizeAccepted + 1)}
              hasMore={!isReachingEndAccepted}
              loader={
                <div className="flex justify-center items-center my-4">
                  <svg className="animate-spin h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
              }
              endMessage={
                <p className="text-center text-gray-500 mt-4">
                  <b>Anda telah melihat semua jadwal Accepted.</b>
                </p>
              }
            >
              {isLoadingInitialAccepted && <p className="text-center text-gray-500">Memuat jadwal...</p>}
              {acceptedSchedules.length > 0 ? (
                acceptedSchedules.map((schedule) => (
                  <div key={schedule.id} className="mb-4 p-4 border rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white">
                    <h3 className="font-semibold text-lg flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5 text-green-500" /> {schedule.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="mr-1 h-4 w-4" />
                      {format(schedule.date, "dd MMMM yyyy")} - {schedule.time}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="mr-1 h-4 w-4" />
                      {schedule.address}
                    </div>
                    <p className="mt-2 text-gray-700">{schedule.description}</p>
                    {schedule.counselor && (
                      <div className="flex items-center text-sm text-gray-600 mt-2">
                        <User className="mr-1 h-4 w-4" />
                        <strong>Konselor:</strong> {schedule.counselor.name}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span className="font-semibold">Status:</span> {schedule.status}
                    </div>
                    {schedule.rating && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Star className="mr-1 h-4 w-4 text-yellow-400" />
                        <span className="font-semibold">Rating:</span> {schedule.rating.stars} / 5
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {/* Tombol untuk membatalkan jadwal accepted */}
                      <Button variant="destructive" onClick={() => handleDeleteSchedule(schedule.id)}>
                        <Trash className="mr-1 h-4 w-4" /> Hapus
                      </Button>
                      {/* Tombol untuk memberikan rating hanya jika status selesai dan belum memberi rating */}
                      {schedule.status === 'Finished' && !schedule.rating && (
                        <Button
                          variant="default"
                          onClick={() => setRatingData({ scheduleId: schedule.id, open: true })}
                          className="flex items-center"
                        >
                          Beri Rating
                        </Button>
                      )}
                      {/* Tombol Reschedule */}
                      {schedule.confirmed && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setRescheduleData({ id: schedule.id, date: schedule.date, time: schedule.time })
                            setIsRescheduleOpen(true)
                          }}
                          className="flex items-center"
                        >
                          <Edit className="mr-1 h-4 w-4" /> Reschedule
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                !isLoadingInitialAccepted && <p className="text-center text-gray-500">Belum ada jadwal Accepted.</p>
              )}
            </InfiniteScroll>
          </ScrollArea>
        </div>
      )}

      {/* ADDED: Finished Tab */}
      {activeTab === 'Finished' && (
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold">Jadwal Finished</h3>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <InfiniteScroll
              dataLength={finishedSchedules.length}
              next={() => setSizeFinished(sizeFinished + 1)}
              hasMore={!isReachingEndFinished}
              loader={
                <div className="flex justify-center items-center my-4">
                  <svg className="animate-spin h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
              }
              endMessage={
                <p className="text-center text-gray-500 mt-4">
                  <b>Anda telah melihat semua jadwal Finished.</b>
                </p>
              }
            >
              {isLoadingInitialFinished && <p className="text-center text-gray-500">Memuat jadwal...</p>}
              {finishedSchedules.length > 0 ? (
                finishedSchedules.map((schedule) => (
                  <div key={schedule.id} className="mb-4 p-4 border rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white">
                    <h3 className="font-semibold text-lg flex items-center">
                      <CalendarIcon className="mr-2 h-5 w-5 text-purple-500" /> {schedule.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="mr-1 h-4 w-4" />
                      {format(schedule.date, "dd MMMM yyyy")} - {schedule.time}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="mr-1 h-4 w-4" />
                      {schedule.address}
                    </div>
                    <p className="mt-2 text-gray-700">{schedule.description}</p>
                    {schedule.counselor && (
                      <div className="flex items-center text-sm text-gray-600 mt-2">
                        <User className="mr-1 h-4 w-4" />
                        <strong>Konselor:</strong> {schedule.counselor.name}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span className="font-semibold">Status:</span> {schedule.status}
                    </div>
                    {schedule.rating && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Star className="mr-1 h-4 w-4 text-yellow-400" />
                        <span className="font-semibold">Rating:</span> {schedule.rating.stars} / 5
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {/* Tombol untuk memberikan rating */}
                      {!schedule.rating && (
                        <Button
                          variant="default"
                          onClick={() => setRatingData({ scheduleId: schedule.id, open: true })}
                          className="flex items-center"
                        >
                          Beri Rating
                        </Button>
                      )}
                      {/* Tombol Hapus */}
                      <Button variant="destructive" onClick={() => handleDeleteSchedule(schedule.id)}>
                        <Trash className="mr-1 h-4 w-4" /> Hapus
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                !isLoadingInitialFinished && <p className="text-center text-gray-500">Belum ada jadwal Finished.</p>
              )}
            </InfiniteScroll>
          </ScrollArea>
        </div>
      )}

      {/* Dialog untuk Reschedule */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        {rescheduleData && (
          <DialogContent className="sm:max-w-[425px] w-full">
            <DialogHeader>
              <DialogTitle>Reschedule Jadwal</DialogTitle>
              <DialogDescription>Masukkan tanggal dan waktu baru untuk jadwal ini.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4">
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5 text-blue-500" />
                <Label htmlFor="newDate">Tanggal Baru</Label>
              </div>
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
                className="mt-1"
              />
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-blue-500" />
                <Label htmlFor="newTime">Waktu Baru</Label>
              </div>
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
                className="mt-1"
              />
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => {
                    if (rescheduleData) {
                      handleReschedule(rescheduleData.id, rescheduleData.date, rescheduleData.time)
                      setIsRescheduleOpen(false)
                      setRescheduleData(null)
                    }
                  }}
                  className="w-full"
                >
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialog untuk Rating */}
      <Dialog open={ratingData.open} onOpenChange={(open) => {
        if (!open) {
          setRatingData({ scheduleId: 0, open: false })
          resetRating()
        }
      }}>
        {ratingData.open && (
          <DialogContent className="sm:max-w-[425px] w-full">
            <DialogHeader>
              <DialogTitle>Beri Rating</DialogTitle>
              <DialogDescription>Berikan rating dan deskripsi konsultasi Anda.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitRating(onSubmitRating)} className="space-y-4">
              <div>
                <Label htmlFor="stars">Rating</Label>
                <Controller
                  name="stars"
                  control={control}
                  defaultValue={0.5} // Atur defaultValue ke 0.5
                  render={({ field }) => (
                    <div className="flex items-center mt-1">
                      <ReactStars
                        count={5}
                        onChange={(newRating: number) => field.onChange(newRating)}
                        size={30}
                        half={true}
                        value={field.value}
                        color2={'#ffd700'}
                      />
                      <span className="ml-2 text-sm text-gray-600">{field.value} / 5</span>
                    </div>
                  )}
                />
                {errorsRating.stars && <p className="text-red-500 text-sm">{errorsRating.stars.message}</p>}
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  {...registerRating("description")}
                  className="mt-1"
                />
                {errorsRating.description && <p className="text-red-500 text-sm">{errorsRating.description.message}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">Kirim Rating</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

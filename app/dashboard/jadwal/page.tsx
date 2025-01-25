"use client"
import { useState, useEffect } from "react"
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
import { Clock, Trash, Edit } from "lucide-react"

// Memperbarui tipe Schedule untuk menyertakan address
type Schedule = {
  id: number
  date: Date
  time: string
  title: string
  description: string
  address: string
}

export default function JadwalPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [newSchedule, setNewSchedule] = useState({ title: "", description: "", time: "", address: "" })
  
  // State untuk reschedule
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)
  const [rescheduleData, setRescheduleData] = useState<{ id: number, date: Date, time: string } | null>(null)

  // Ambil data jadwal saat komponen di-mount
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const userSession = sessionStorage.getItem("userSession")
        if (!userSession) throw new Error("Anda belum login!")

        const { userId } = JSON.parse(userSession)

        const { data, error } = await supabase
          .from("schedules")
          .select("*")
          .eq("user_id", userId)

        if (error) {
          console.error("Gagal mengambil jadwal:", error)
          return
        }

        // Transformasi data untuk menyesuaikan format
        const transformedData = data.map((item: any) => ({
          id: item.id,
          date: new Date(item.date),
          time: item.time,
          title: item.title,
          description: item.description,
          address: item.address, // Pastikan field address ada
        }))
        setSchedules(transformedData)
      } catch (err) {
        console.error("Error saat mengambil jadwal:", err)
      }
    }

    fetchSchedules()
  }, [])

  const handleAddSchedule = async () => {
    if (date && newSchedule.title && newSchedule.time && newSchedule.address) {
      try {
        const userSession = sessionStorage.getItem("userSession")
        if (!userSession) throw new Error("Anda belum login!")

        const { userId } = JSON.parse(userSession)

        const { data: schedule, error } = await supabase
          .from("schedules")
          .insert({
            user_id: userId,
            date: date.toISOString().split("T")[0], // Format tanggal
            time: newSchedule.time,
            title: newSchedule.title,
            description: newSchedule.description,
            address: newSchedule.address, // Menambahkan address
          })
          .select()

        if (error) {
          console.error(error)
          alert("Gagal menambahkan jadwal.")
          return
        }

        // Update state lokal untuk menampilkan jadwal baru
        setSchedules([
          ...schedules,
          {
            id: schedule[0].id,
            date: new Date(schedule[0].date),
            time: schedule[0].time,
            title: schedule[0].title,
            description: schedule[0].description,
            address: schedule[0].address, // Menambahkan address
          },
        ])
        setNewSchedule({ title: "", description: "", time: "", address: "" })
        alert("Jadwal berhasil ditambahkan!")
      } catch (err) {
        console.error(err)
        alert("Terjadi kesalahan. Coba lagi.")
      }
    } else {
      alert("Lengkapi semua data untuk menambah jadwal.")
    }
  }

  const handleReschedule = async (scheduleId: number, newDate: Date, newTime: string) => {
    try {
      const { error } = await supabase
        .from("schedules")
        .update({ date: newDate.toISOString().split("T")[0], time: newTime })
        .eq("id", scheduleId)

      if (error) {
        console.error("Gagal mereschedule jadwal:", error)
        alert("Gagal mereschedule jadwal.")
        return
      }

      // Perbarui state lokal
      setSchedules(
        schedules.map((schedule) =>
          schedule.id === scheduleId
            ? { ...schedule, date: newDate, time: newTime }
            : schedule,
        ),
      )
      alert("Jadwal berhasil di-reschedule!")
    } catch (err) {
      console.error("Error saat mereschedule jadwal:", err)
      alert("Terjadi kesalahan saat mereschedule jadwal.")
    }
  }

  const handleDeleteSchedule = async (scheduleId: number) => {
    try {
      const { error } = await supabase.from("schedules").delete().eq("id", scheduleId)
      if (error) {
        console.error("Gagal menghapus jadwal:", error)
        alert("Gagal menghapus jadwal.")
        return
      }

      // Perbarui state lokal
      setSchedules(schedules.filter((schedule) => schedule.id !== scheduleId))
      alert("Jadwal berhasil dihapus!")
    } catch (err) {
      console.error("Error saat menghapus jadwal:", err)
      alert("Terjadi kesalahan saat menghapus jadwal.")
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight mb-4">Jadwal Konsultasi</h2>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2">
          <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
        </div>
        <div className="md:w-1/2">
          {/* Dialog untuk Menambah Jadwal */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full mb-4">Tambah Jadwal</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tambah Jadwal Baru</DialogTitle>
                <DialogDescription>Masukkan detail jadwal konsultasi baru di sini.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Judul
                  </Label>
                  <Input
                    id="title"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    Waktu
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Alamat
                  </Label>
                  <Input
                    id="address"
                    value={newSchedule.address}
                    onChange={(e) => setNewSchedule({ ...newSchedule, address: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Deskripsi
                  </Label>
                  <Input
                    id="description"
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddSchedule}>
                  Tambah Jadwal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog untuk Reschedule */}
          <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
            <DialogTrigger asChild>
              {/* Tombol trigger sudah ada di list jadwal */}
              {/* Tidak perlu di sini */}
            </DialogTrigger>
            {rescheduleData && (
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Reschedule Jadwal</DialogTitle>
                  <DialogDescription>Masukkan tanggal dan waktu baru untuk jadwal ini.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newDate" className="text-right">
                      Tanggal Baru
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
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="newTime" className="text-right">
                      Waktu Baru
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
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
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
              </DialogContent>
            )}
          </Dialog>

          {/* List Jadwal */}
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {schedules.length > 0 ? (
              schedules
                .sort((a, b) => a.date.getTime() - b.date.getTime() || a.time.localeCompare(b.time))
                .map((schedule) => (
                  <div key={schedule.id} className="mb-4 p-4 border rounded-lg">
                    <h3 className="font-semibold">{schedule.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="mr-1 h-4 w-4" />
                      {format(schedule.date, "dd MMMM yyyy")} - {schedule.time}
                    </div>
                    <p className="mt-2">{schedule.description}</p>
                    <p className="mt-2 text-sm text-gray-600">
                      <strong>Alamat:</strong> {schedule.address}
                    </p>
                    <div className="flex gap-2 mt-2">
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
                      <Button variant="destructive" onClick={() => handleDeleteSchedule(schedule.id)}>
                        <Trash className="mr-1 h-4 w-4" /> Hapus
                      </Button>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-gray-500">Belum ada jadwal.</p>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

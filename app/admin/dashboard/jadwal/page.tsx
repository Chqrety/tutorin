"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Clock, Edit, Calendar as CalendarIcon, MapPin, User } from "lucide-react";

// Memperbarui tipe Schedule untuk menyertakan address, counselor_id, dan status
type Schedule = {
  id: number;
  date: Date;
  time: string;
  title: string;
  description: string;
  address: string;
  counselor_id: string;
  status: string; // Tambahkan status
};

// Tipe Counselor dengan user_id dan data user serta profile
type Counselor = {
  id: string;
  admin_id: string;
  user_id: string;
  specialization: string;
  years_of_experience: number;
  created_at: string;
  updated_at: string;
  user: {
    email: string;
    full_name: string;
    profiles: {
      avatar_url: string | null; // Menambahkan avatar_url
    };
  };
};

export default function JadwalAdminPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{
    id: number;
    date: Date;
    time: string;
    address: string;
  } | null>(null);

  // Tambahkan state untuk konselor yang dipilih
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);

  // Ambil data admin dan konselor saat komponen di-mount
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const adminSession = sessionStorage.getItem("adminSession");
        console.log("Admin Session:", adminSession);

        if (!adminSession) throw new Error("Anda belum login!");

        const { adminId } = JSON.parse(adminSession);
        console.log("Parsed adminId:", adminId);

        // Ambil data admin berdasarkan adminId
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("id, name, email")
          .eq("id", adminId)
          .single();

        if (adminError) {
          console.error("Gagal mengambil data admin:", adminError);
          alert("Anda bukan admin atau terjadi kesalahan.");
          return;
        }

        console.log("Admin Data:", adminData);

        // Ambil konselor yang terkait dengan admin ini beserta data user dan profile mereka
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
          .eq("admin_id", adminData.id);

        if (counselorsError) {
          console.error("Gagal mengambil data konselor:", counselorsError);
          return;
        }

        console.log("Counselors Data:", counselorsData);

        if (counselorsData.length > 0) {
          setCounselors(counselorsData as Counselor[]);
        } else {
          console.warn("Tidak ada konselor yang terkait dengan admin ini.");
          setCounselors([]);
        }
      } catch (err: any) {
        console.error("Error saat mengambil data admin:", err);
        alert(err.message);
      }
    };

    fetchAdminData();
  }, []);

  // Ambil jadwal setelah konselor tersedia
  useEffect(() => {
    const fetchSchedules = async () => {
      if (counselors.length === 0) return;

      try {
        // Ambil semua counselor_id dari konselor yang terkait
        const counselorIds = counselors.map((c) => c.id);
        console.log("Counselor IDs:", counselorIds);

        const { data, error } = await supabase
          .from("schedules")
          .select("*")
          .in("counselor_id", counselorIds);

        if (error) {
          console.error("Gagal mengambil jadwal:", error);
          return;
        }

        console.log("Schedules Data:", data);

        // Transformasi data untuk menyesuaikan format
        const transformedData = data.map((item: any) => ({
          id: item.id,
          date: new Date(item.date),
          time: item.time,
          title: item.title,
          description: item.description,
          address: item.address,
          counselor_id: item.counselor_id,
          status: item.status, // Tambahkan ini
        }));
        setSchedules(transformedData);
      } catch (err: any) {
        console.error("Error saat mengambil jadwal:", err);
      }
    };

    fetchSchedules();
  }, [counselors]);

  // Fungsi untuk mengirim notifikasi email
  const sendEmailNotification = async (
    email: string,
    scheduleId: number,
    subject: string,
    body: string,
    senderRole: 'admin' | 'user'
  ) => {
    try {
      const apiUrl = "/api/send-email".trim(); // Pastikan tidak ada karakter tambahan
      console.log(`Sending POST request to: ${apiUrl}`);

      const response = await fetch(apiUrl, { // Pastikan tidak ada \n atau spasi
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`, // Tambahkan header Authorization
        },
        body: JSON.stringify({
          email,
          scheduleId,
          subject,
          body,
          senderRole, // Tambahkan senderRole
        }),
      });

      if (response.ok) {
        console.log("Notifikasi email berhasil dikirim.");
        return true;
      } else {
        const data = await response.json();
        console.error("Gagal mengirim email:", data.message);
        return false;
      }
    } catch (err) {
      console.error("Error saat mengirim email:", err);
      return false;
    }
  };

  // Fungsi untuk mereschedule jadwal
  const handleReschedule = async (
    scheduleId: number,
    newDate: Date,
    newTime: string,
    newAddress: string,
    userEmail: string
  ) => {
    try {
      const { error } = await supabase
        .from("schedules")
        .update({
          date: newDate.toISOString().split("T")[0],
          time: newTime,
          address: newAddress,
          status: 'Pending', // Set ulang status ke 'Pending' setelah reschedule
        })
        .eq("id", scheduleId);

      if (error) {
        console.error("Gagal mereschedule jadwal:", error);
        alert("Gagal mereschedule jadwal.");
        return;
      }

      // Perbarui state lokal
      setSchedules(
        schedules.map((schedule) =>
          schedule.id === scheduleId
            ? { ...schedule, date: newDate, time: newTime, address: newAddress, status: 'Pending' }
            : schedule
        )
      );

      // Kirim notifikasi email ke pengguna
      const schedule = schedules.find((s) => s.id === scheduleId);
      if (!schedule) {
        console.error("Jadwal tidak ditemukan untuk reschedule.");
        return;
      }

      const counselor = counselors.find(
        (c) => c.id === schedule.counselor_id
      );
      if (!counselor) {
        console.error("Konselor terkait tidak ditemukan.");
        return;
      }

      const subject = `Jadwal Konsultasi Di-reschedule: ${schedule.title || 'Jadwal Konsultasi'}`;
      const bodyContent = `
Hai ${counselor.user.full_name || 'Pengguna'},

Jadwal konsultasi Anda dengan ID ${scheduleId} telah di-reschedule oleh admin.

Detail Jadwal Baru:
Tanggal: ${format(newDate, "dd MMMM yyyy")}
Waktu: ${newTime}
Alamat: ${newAddress}

Silakan lakukan tindakan selanjutnya.

Terima kasih telah menggunakan layanan kami.

Salam,
Tim Doscom Konsultan
      `;

      const emailSent = await sendEmailNotification(
        userEmail,
        scheduleId,
        subject,
        bodyContent,
        'admin' // Menandakan pengirim adalah admin
      );

      if (emailSent) {
        alert("Jadwal berhasil di-reschedule dan notifikasi email telah dikirim!");
      } else {
        alert(
          "Jadwal berhasil di-reschedule, tetapi gagal mengirim notifikasi email."
        );
      }
    } catch (err: any) {
      console.error("Error saat mereschedule jadwal:", err);
      alert("Terjadi kesalahan saat mereschedule jadwal.");
    }
  };

  // Fungsi untuk menerima jadwal
  const handleAccept = async (
    scheduleId: number,
    userEmail: string,
    scheduleTitle: string
  ) => {
    try {
      // Update status jadwal menjadi 'Accepted'
      const { error } = await supabase
        .from("schedules")
        .update({ status: 'Accepted' })
        .eq("id", scheduleId);

      if (error) {
        console.error("Gagal menerima jadwal:", error);
        alert("Gagal menerima jadwal.");
        return;
      }

      // Perbarui state lokal
      const updatedSchedules = schedules.map((schedule) =>
        schedule.id === scheduleId
          ? { ...schedule, status: 'Accepted' }
          : schedule
      );
      setSchedules(updatedSchedules);

      // Cari jadwal yang baru diperbarui
      const updatedSchedule = updatedSchedules.find((s) => s.id === scheduleId);
      if (!updatedSchedule) {
        console.error("Jadwal tidak ditemukan setelah update.");
        return;
      }

      const counselor = counselors.find(
        (c) => c.id === updatedSchedule.counselor_id
      );
      if (!counselor) {
        console.error("Konselor terkait tidak ditemukan.");
        return;
      }

      // Kirim notifikasi email kepada pengguna
      const subject = `Jadwal Konsultasi Diterima: ${scheduleTitle}`;
      const bodyContent = `
Hai ${counselor.user.full_name || 'Pengguna'},

Jadwal konsultasi Anda dengan ID ${scheduleId} telah diterima oleh admin.

Detail Jadwal:
Tanggal: ${format(updatedSchedule.date, "dd MMMM yyyy")}
Waktu: ${updatedSchedule.time}
Alamat: ${updatedSchedule.address}

Terima kasih telah menggunakan layanan kami.

Salam,
Tim Doscom Konsultan
      `;

      const emailSent = await sendEmailNotification(
        userEmail,
        scheduleId,
        subject,
        bodyContent,
        'admin'
      );

      if (emailSent) {
        alert("Jadwal berhasil diterima dan notifikasi email telah dikirim!");
      } else {
        alert(
          "Jadwal berhasil diterima, tetapi gagal mengirim notifikasi email."
        );
      }
    } catch (err: any) {
      console.error("Error saat menerima jadwal:", err);
      alert("Terjadi kesalahan saat menerima jadwal.");
    }
  };

  // Fungsi untuk menolak jadwal
  const handleReject = async (
    scheduleId: number,
    userEmail: string,
    scheduleTitle: string
  ) => {
    try {
      // Update status jadwal menjadi 'Rejected'
      const { error } = await supabase
        .from("schedules")
        .update({ status: 'Rejected' })
        .eq("id", scheduleId);

      if (error) {
        console.error("Gagal menolak jadwal:", error);
        alert("Gagal menolak jadwal.");
        return;
      }

      // Perbarui state lokal
      const updatedSchedules = schedules.map((schedule) =>
        schedule.id === scheduleId
          ? { ...schedule, status: 'Rejected' }
          : schedule
      );
      setSchedules(updatedSchedules);

      const rejectedSchedule = updatedSchedules.find((s) => s.id === scheduleId);
      if (!rejectedSchedule) {
        console.error("Jadwal tidak ditemukan setelah update.");
        return;
      }

      const counselor = counselors.find(
        (c) => c.id === rejectedSchedule.counselor_id
      );
      if (!counselor) {
        console.error("Konselor terkait tidak ditemukan.");
        return;
      }

      // Kirim notifikasi email kepada pengguna
      const subject = `Jadwal Konsultasi Ditolak: ${scheduleTitle}`;
      const bodyContent = `
Hai ${counselor.user.full_name || 'Pengguna'},

Jadwal konsultasi Anda dengan ID ${scheduleId} telah ditolak oleh admin.

Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi kami.

Terima kasih telah menggunakan layanan kami.

Salam,
Tim Doscom Konsultan
      `;

      const emailSent = await sendEmailNotification(
        userEmail,
        scheduleId,
        subject,
        bodyContent,
        'admin'
      );

      if (emailSent) {
        alert("Jadwal berhasil ditolak dan notifikasi email telah dikirim!");
      } else {
        alert(
          "Jadwal berhasil ditolak, tetapi gagal mengirim notifikasi email."
        );
      }
    } catch (err: any) {
      console.error("Error saat menolak jadwal:", err);
      alert("Terjadi kesalahan saat menolak jadwal.");
    }
  };

  // Fungsi untuk menandai jadwal sebagai selesai
  const handleFinish = async (
    scheduleId: number,
    userEmail: string,
    scheduleTitle: string
  ) => {
    try {
      // Update status jadwal menjadi 'Finished'
      const { error } = await supabase
        .from("schedules")
        .update({ status: 'Finished' })
        .eq("id", scheduleId);

      if (error) {
        console.error("Gagal menandai jadwal sebagai selesai:", error);
        alert("Gagal menandai jadwal sebagai selesai.");
        return;
      }

      // Perbarui state lokal
      const updatedSchedules = schedules.map((schedule) =>
        schedule.id === scheduleId
          ? { ...schedule, status: 'Finished' }
          : schedule
      );
      setSchedules(updatedSchedules);

      const finishedSchedule = updatedSchedules.find((s) => s.id === scheduleId);
      if (!finishedSchedule) {
        console.error("Jadwal tidak ditemukan setelah update.");
        return;
      }

      const counselor = counselors.find(
        (c) => c.id === finishedSchedule.counselor_id
      );
      if (!counselor) {
        console.error("Konselor terkait tidak ditemukan.");
        return;
      }

      // Kirim notifikasi email kepada pengguna
      const subject = `Jadwal Konsultasi Selesai: ${scheduleTitle}`;
      const bodyContent = `
Hai ${counselor.user.full_name || 'Pengguna'},

Jadwal konsultasi Anda dengan ID ${scheduleId} telah ditandai sebagai selesai oleh admin.

Kami berharap Anda mendapatkan manfaat dari konsultasi ini. Jika Anda memiliki feedback atau pertanyaan lebih lanjut, jangan ragu untuk menghubungi kami.

Terima kasih telah menggunakan layanan kami.

Salam,
Tim Doscom Konsultan
      `;

      const emailSent = await sendEmailNotification(
        userEmail,
        scheduleId,
        subject,
        bodyContent,
        'admin'
      );

      if (emailSent) {
        alert("Jadwal berhasil ditandai sebagai selesai dan notifikasi email telah dikirim!");
      } else {
        alert(
          "Jadwal berhasil ditandai sebagai selesai, tetapi gagal mengirim notifikasi email."
        );
      }
    } catch (err: any) {
      console.error("Error saat menandai jadwal sebagai selesai:", err);
      alert("Terjadi kesalahan saat menandai jadwal sebagai selesai.");
    }
  };

  // Fungsi untuk menghapus jadwal
  const handleDeleteSchedule = async (scheduleId: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      try {
        const { error } = await supabase
          .from("schedules")
          .delete()
          .eq("id", scheduleId);
        if (error) {
          console.error("Gagal menghapus jadwal:", error);
          alert("Gagal menghapus jadwal.");
          return;
        }

        // Perbarui state lokal
        setSchedules(schedules.filter((schedule) => schedule.id !== scheduleId));
        alert("Jadwal berhasil dihapus!");
      } catch (err: any) {
        console.error("Error saat menghapus jadwal:", err);
        alert("Terjadi kesalahan saat menghapus jadwal.");
      }
    }
  };

  // Filter jadwal berdasarkan konselor yang dipilih
  const filteredSchedules = useMemo(() => {
    if (selectedCounselor) {
      return schedules.filter((schedule) => schedule.counselor_id === selectedCounselor.id);
    }
    return schedules;
  }, [schedules, selectedCounselor]);

  // Mengurutkan jadwal: 'pending' di atas, kemudian 'Accepted', 'Rejected', 'Finished'
  const sortedSchedules = useMemo(() => {
    const priority = {
      'Pending': 1,
      'Accepted': 2,
      'Rejected': 3,
      'Finished': 4,
    };
    return [...filteredSchedules].sort((a, b) => {
      const priorityA = priority[a.status] || 5;
      const priorityB = priority[b.status] || 5;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      // Jika status sama, urutkan berdasarkan tanggal dan waktu
      if (a.date.getTime() !== b.date.getTime()) {
        return a.date.getTime() - b.date.getTime();
      }
      return a.time.localeCompare(b.time);
    });
  }, [filteredSchedules]);

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-3xl font-bold tracking-tight mb-4 text-center md:text-left">
        Dashboard Admin - Jadwal Konsultasi
      </h2>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3 w-full">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border p-2 w-full"
          />
        </div>
        <div className="md:w-2/3 w-full flex flex-col">
          {/* Dialog untuk Reschedule */}
          <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
            {rescheduleData && (
              <DialogContent className="sm:max-w-[425px] w-full">
                <DialogHeader>
                  <DialogTitle>Reschedule Jadwal</DialogTitle>
                  <DialogDescription>
                    Masukkan tanggal, waktu, dan alamat baru untuk jadwal ini.
                  </DialogDescription>
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
                    className="mt-1 w-full"
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
                    className="mt-1 w-full"
                  />
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                    <Label htmlFor="newAddress">Alamat Baru</Label>
                  </div>
                  <Input
                    id="newAddress"
                    value={rescheduleData.address || ""}
                    onChange={(e) =>
                      setRescheduleData({
                        ...rescheduleData,
                        address: e.target.value,
                      })
                    }
                    className="mt-1 w-full"
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      onClick={() => {
                        if (rescheduleData) {
                          // Dapatkan email pengguna terkait dari jadwal
                          const schedule = schedules.find(
                            (s) => s.id === rescheduleData.id
                          );
                          if (schedule) {
                            const counselor = counselors.find(
                              (c) => c.id === schedule.counselor_id
                            );
                            if (counselor) {
                              const userEmail = counselor.user.email;
                              handleReschedule(
                                rescheduleData.id,
                                rescheduleData.date,
                                rescheduleData.time,
                                rescheduleData.address,
                                userEmail
                              );
                            } else {
                              alert("Konselor terkait tidak ditemukan.");
                            }
                          }
                          setIsRescheduleOpen(false);
                          setRescheduleData(null);
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

          {/* List Konselor */}
          <div className="mb-6">
            <h3 className="text-2xl font-semibold mb-2">Daftar Konselor</h3>
            <ScrollArea className="h-40 rounded-md border p-4 overflow-auto">
              {counselors.length > 0 ? (
                counselors.map((counselor) => (
                  <div
                    key={counselor.id}
                    className={`mb-2 p-2 border rounded-lg flex items-center cursor-pointer hover:bg-gray-100 ${
                      selectedCounselor?.id === counselor.id ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setSelectedCounselor(counselor)} // Menambahkan onClick
                  >
                    {/* Menampilkan avatar jika tersedia, else menampilkan ikon User */}
                    {counselor.user.profiles.avatar_url ? (
                      <img
                        src={counselor.user.profiles.avatar_url}
                        alt={counselor.user.full_name}
                        className="w-10 h-10 rounded-full mr-3 object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 rounded-full mr-3 text-gray-400" />
                    )}
                    <div>
                      <p className="font-semibold">{counselor.user.full_name || "Belum diisi"}</p>
                      <p className="text-sm text-gray-500">{counselor.user.email || "Belum diisi"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">
                  Belum ada konselor.
                </p>
              )}
            </ScrollArea>
          </div>

          {/* Tombol untuk Reset Pilihan Konselor */}
          {selectedCounselor && (
            <div className="mb-4">
              <Button onClick={() => setSelectedCounselor(null)} className="flex items-center">
                <User className="mr-1 h-4 w-4" /> Lihat Semua Jadwal
              </Button>
            </div>
          )}

          {/* List Jadwal */}
          <h3 className="text-2xl font-semibold mb-2">
            Daftar Jadwal Konsultasi {selectedCounselor ? `- ${selectedCounselor.user.full_name}` : ""}
          </h3>
          <ScrollArea className="h-[400px] rounded-md border p-4 overflow-auto">
            {sortedSchedules.length > 0 ? (
              sortedSchedules.map((schedule) => {
                const counselor = counselors.find(
                  (c) => c.id === schedule.counselor_id
                );
                return (
                  <div
                    key={schedule.id}
                    className="mb-4 p-4 border rounded-lg shadow-md hover:shadow-lg transition-shadow bg-white"
                  >
                    <h3 className="font-semibold flex items-center">
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
                    {counselor && (
                      <div className="flex items-center text-sm text-gray-600 mt-2">
                        <User className="mr-1 h-4 w-4" />
                        <strong>Konselor:</strong> {counselor.user.full_name} 
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span className="font-semibold">Status:</span> {schedule.status}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {schedule.status === 'Pending' && (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setRescheduleData({
                                id: schedule.id,
                                date: schedule.date,
                                time: schedule.time,
                                address: schedule.address,
                              });
                              setIsRescheduleOpen(true);
                            }}
                            className="flex items-center"
                          >
                            <Edit className="mr-1 h-4 w-4" /> Reschedule
                          </Button>
                          <Button
                            variant="success"
                            onClick={() => {
                              if (counselor && counselor.user.email && schedule.title) {
                                handleAccept(schedule.id, counselor.user.email, schedule.title);
                              } else {
                                alert("Email pengguna atau judul jadwal tidak ditemukan.");
                              }
                            }}
                            className="flex items-center"
                          >
                            Terima
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              if (counselor && counselor.user.email && schedule.title) {
                                handleReject(schedule.id, counselor.user.email, schedule.title);
                              } else {
                                alert("Email pengguna atau judul jadwal tidak ditemukan.");
                              }
                            }}
                            className="flex items-center"
                          >
                            Tolak
                          </Button>
                        </>
                      )}
                      {schedule.status === 'Accepted' && (
                        <Button
                          variant="success"
                          onClick={() => {
                            if (counselor && counselor.user.email && schedule.title) {
                              handleFinish(schedule.id, counselor.user.email, schedule.title);
                            } else {
                              alert("Email pengguna atau judul jadwal tidak ditemukan.");
                            }
                          }}
                          className="flex items-center"
                        >
                          Selesai
                        </Button>
                      )}
                      {/* Tidak Menampilkan Aksi untuk Status Lain */}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500">Belum ada jadwal.</p>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

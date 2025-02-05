"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Trophy, Target } from "lucide-react";
import MemoryGame from "./MemoryGame";
import GaleriPortofolio from "../components/GaleriPortofolio";
import SistemNotifikasi from "../components/SistemNotifikasi";
import SistemPeringkatUlasan from "../components/SistemPeringkatUlasan";

// Import (optional) jika Anda masih pakai TambahCatatan di Dashboard
import TambahCatatan from "../components/TambahCatatan";

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    totalWeeklyConsultations: 0,
    totalActiveConsultations: 0,
    totalAchievements: 0,
    careerProgress: 0,
    schedules: [],
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);

  // Daftar catatan terbaru
  const [recentNotes, setRecentNotes] = useState([]);

  // Cek session user
  useEffect(() => {
    try {
      const userSession = sessionStorage.getItem("userSession");
      if (userSession) {
        const parsedSession = JSON.parse(userSession);
        if (parsedSession && parsedSession.userId) {
          setIsLoggedIn(true);
          return;
        }
      }
    } catch (error) {
      console.error("Error parsing user session:", error);
    }
    router.push("/login"); // Redirect jika sesi tidak valid
  }, [router]);

  // Fetch data supabase (consultations, achievements, schedules, notes)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userSession = JSON.parse(sessionStorage.getItem("userSession") || "{}");
        if (!userSession?.userId) {
          router.push("/login");
          return;
        }

        // Ambil data konsultasi, achievement, jadwal, dsb. (sama seperti sebelumnya)
        const [
          { data: consultations, error: consultationError },
          { data: achievements, error: achievementError },
          { data: schedules, error: schedulesError },
        ] = await Promise.all([
          supabase
            .from("consultations")
            .select("id, status, created_at")
            .eq("user_id", userSession.userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("achievements")
            .select("id, title")
            .eq("user_id", userSession.userId),
          supabase
            .from("schedules")
            .select("id, date, time, title, description, address")
            .eq("user_id", userSession.userId)
            .order("date", { ascending: true }),
        ]);

        if (consultationError || schedulesError) {
          throw new Error("Error fetching data from Supabase.");
        }

        // Hitung data ringkasan
        const activeConsultations = consultations?.filter((c) => c.status === "active") || [];
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyConsultations = consultations?.filter(
          (c) => new Date(c.created_at) >= oneWeekAgo
        ) || [];

        const today = new Date();
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(today.getDate() + 7);
        const weeklySchedules = schedules?.filter((s) => {
          const schedulesDate = new Date(s.date);
          return schedulesDate >= today && schedulesDate <= oneWeekFromNow;
        }) || [];

        setDashboardData({
          totalWeeklyConsultations: weeklyConsultations.length,
          totalActiveConsultations: activeConsultations.length,
          totalAchievements: achievements?.length || 0,
          careerProgress: 75, // Static for now
          schedules: weeklySchedules,
        });

        // Ambil 3 catatan terakhir
        const { data: notesData, error: notesError } = await supabase
        .from("notes")
        .select("id, content, created_at")
        .eq("user_id", userSession.userId)
        .order("created_at", { ascending: false })
        .limit(3)
      
      console.log("notesData:", notesData)
      console.log("notesError:", notesError)
      

        if (notesData) {
          setRecentNotes(notesData);
        }

        setIsLoggedIn(true);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [router]);

  // Mini-game logic (opsional)
  const startGame = () => {
    setGameActive(true);
    setGameScore(0);
    setTimeout(() => setGameActive(false), 10000);
  };

  const incrementScore = () => {
    if (gameActive) {
      setGameScore((prev) => prev + 1);
    }
  };

  // Aksi "Lihat" -> ke /dashboard/notes/[noteId]
  const handleViewNote = (noteId: string) => {
    router.push(`/dashboard/notes/${noteId}`);
  };

  // Aksi "Edit" -> misal inline di Dashboard, 
  // tapi di sini kita contohkan push ke /dashboard/notes, 
  // atau Anda bisa inline-langsung di Dashboard.
  const handleEditNote = (noteId: string) => {
    router.push(`/dashboard/notes?edit=${noteId}`);
  };

  // Aksi "Hapus"
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Yakin ingin menghapus catatan ini?")) return;
    try {
      const userSession = JSON.parse(sessionStorage.getItem("userSession") || "{}");
      if (!userSession?.userId) {
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", userSession.userId);

      if (error) throw error;

      // Filter recentNotes di state
      setRecentNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Selamat datang, Mahasiswa!</h2>
        <SistemNotifikasi />
      </div>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konsultasi Minggu Ini</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalWeeklyConsultations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konsultasi Aktif</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalActiveConsultations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pencapaian</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalAchievements}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progres Karir</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.careerProgress}%</div>
            <Progress value={dashboardData.careerProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Jadwal Mingguan */}
      <Card>
        <CardHeader>
          <CardTitle>Jadwal Minggu Ini</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.schedules.length > 0 ? (
            <ul className="space-y-2">
              {dashboardData.schedules.map((schedule) => (
                <li key={schedule.id} className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>
                    {new Date(schedule.date).toLocaleDateString()} - {schedule.time} - {schedule.title}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Tidak ada jadwal untuk minggu ini.</p>
          )}
        </CardContent>
      </Card>

      {/* Memory Game */}
      <Card>
        <CardHeader>
          <CardTitle>Mini-Game: Memory Match</CardTitle>
        </CardHeader>
        <CardContent>
          <MemoryGame />
        </CardContent>
      </Card>

      {/* Daftar Catatan (singkat) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Daftar Catatan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {recentNotes.length > 0 ? (
            <div className="space-y-4">
              {recentNotes.map((note: any) => (
                <div key={note.id} className="bg-gray-50 p-3 rounded-md shadow-sm">
                  <div
                    className="prose max-w-full overflow-hidden text-ellipsis"
                    style={{ maxHeight: "80px" }}
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                  <p className="text-xs text-gray-400 mt-2">Dibuat: {new Date(note.created_at).toLocaleString()}</p>
                  <div className="flex flex-wrap gap-2 mt-2 justify-end">
                    <Button variant="secondary" size="sm" onClick={() => handleViewNote(note.id)}>
                      Lihat
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditNote(note.id)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteNote(note.id)}>
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Belum ada catatan.</p>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => router.push("/dashboard/notes")}>Kelola Catatan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Komponen lain (opsional) */}
      <GaleriPortofolio />
      <SistemPeringkatUlasan />
    </div>
  )
}
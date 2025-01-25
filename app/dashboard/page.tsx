"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Trophy, Target } from "lucide-react";
import CatatanKonsultasi from "../components/CatatanKonsultasi";
import GaleriPortofolio from "../components/GaleriPortofolio";
import SistemNotifikasi from "../components/SistemNotifikasi";
import SistemPeringkatUlasan from "../components/SistemPeringkatUlasan";

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    totalWeeklyConsultations: 0,
    totalActiveConsultations: 0,
    totalAchievements: 0,
    careerProgress: 0,
    schedules: [],
  });
  const [gameScore, setGameScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    try {
      const userSession = sessionStorage.getItem("userSession")
      if (userSession) {
        const parsedSession = JSON.parse(userSession)
        if (parsedSession && parsedSession.userId) {
          setIsLoggedIn(true)
          return
        }
      }
    } catch (error) {
      console.error("Error parsing user session:", error)
    }
    router.push("/login") // Redirect jika sesi tidak valid
  }, [router])
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userSession = JSON.parse(sessionStorage.getItem("userSession") || "{}");
        if (!userSession?.userId) {
          router.push("/login");
          return;
        }

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

        const activeConsultations = consultations?.filter((c) => c.status === "active") || [];
        const weeklyConsultations = consultations?.filter((c) => {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return new Date(c.created_at) >= oneWeekAgo;
        }) || [];
        const weeklySchedules = schedules?.filter((s) => {
          const schedulesDate = new Date(s.date);
          const today = new Date();
          const oneWeekFromNow = new Date();
          oneWeekFromNow.setDate(today.getDate() + 7);
          return schedulesDate >= today && schedulesDate <= oneWeekFromNow;
        }) || [];

        setDashboardData({
          totalWeeklyConsultations: weeklyConsultations.length,
          totalActiveConsultations: activeConsultations.length,
          totalAchievements: achievements?.length || 0,
          careerProgress: 75, // Static for now; can be dynamic if implemented
          schedules: weeklySchedules,
        });

        setIsLoggedIn(true);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [router]);

  const startGame = () => {
    setGameActive(true);
    setGameScore(0);
    setTimeout(() => setGameActive(false), 10000); // Game lasts 10 seconds
  };

  const incrementScore = () => {
    if (gameActive) {
      setGameScore((prev) => prev + 1);
    }
  };

  if (!isLoggedIn) {
    return null; // Jangan render apa pun sebelum login diverifikasi
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Selamat datang, Mahasiswa!</h2>
        <SistemNotifikasi />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jadwal Konsultasi</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalWeeklyConsultations}</div>
            <p className="text-xs text-muted-foreground">Minggu ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konsultasi Aktif</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalActiveConsultations}</div>
            <p className="text-xs text-muted-foreground">Sedang berlangsung</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pencapaian</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalAchievements}</div>
            <p className="text-xs text-muted-foreground">Lencana diperoleh</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Karir</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.careerProgress}%</div>
            <Progress value={dashboardData.careerProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
  <CardHeader>
    <CardTitle className="text-lg font-bold flex items-center gap-2">
      <Calendar className="h-6 w-6 text-blue-500" />
      Jadwal Mingguan
    </CardTitle>
  </CardHeader>
  <CardContent>
    {dashboardData.schedules.length > 0 ? (
      <div className="space-y-4">
        {dashboardData.schedules.map((schedule) => (
          <motion.div
            key={schedule.id}
            className="p-4 bg-gray-50 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-lg font-semibold text-blue-600">{schedule.title}</p>
              <span className="text-sm text-gray-500">
                {new Date(schedule.date).toLocaleDateString()} - {schedule.time}
              </span>
            </div>
            <p className="text-sm text-gray-700">{schedule.description}</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-2-7.414V8a2 2 0 114 0v2.586l1.707 1.707a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 11-1.414-1.414L8 10.586z"
                  clipRule="evenodd"
                />
              </svg>
              <p>{schedule.address}</p>
            </div>
          </motion.div>
        ))}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-100 rounded-lg">
        <Calendar className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Tidak ada jadwal untuk minggu ini.</p>
      </div>
    )}
  </CardContent>
</Card>


      <Card>
        <CardHeader>
          <CardTitle>Mini-Game: Klik Cepat!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p>Klik tombol sebanyak mungkin dalam 10 detik!</p>
            <div className="text-4xl font-bold">{gameScore}</div>
            <Button onClick={startGame} disabled={gameActive}>
              {gameActive ? "Bermain..." : "Mulai Game"}
            </Button>
            {gameActive && (
              <motion.div
                className="w-16 h-16 bg-blue-500 rounded-full mx-auto cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={incrementScore}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <CatatanKonsultasi />
      <GaleriPortofolio />
      <SistemPeringkatUlasan />
    </div>
  );
}

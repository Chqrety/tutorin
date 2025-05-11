"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Modal from "@/components/ui/modal"
import { toast } from "react-toastify"
import {
  Home,
  MessageCircle,
  CalendarPlus2Icon as CalendarIcon2,
  Settings,
  Plus,
  FileQuestion,
  ThumbsUp,
  Calendar,
  Trash2,
  Search,
} from "lucide-react"
import LoadingPage from "@/app/components/LoadingPage"

type UserProfile = {
  full_name: string
  profiles: {
    avatar_url: string | null
  } | null
}

type Question = {
  id: string
  title: string
  votes: number
  created_at: string
  user: UserProfile
}

export default function DashboardPostsPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeBottomTab, setActiveBottomTab] = useState("konsultasi")
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Ambil userId dari sessionStorage
  useEffect(() => {
    try {
      const userSession = sessionStorage.getItem("userSession")
      if (!userSession) {
        // Jika tidak ada session, redirect ke /login
        router.push("/login")
        return
      }
      const parsed = JSON.parse(userSession)
      if (!parsed?.userId) {
        router.push("/login")
        return
      }
      setUserId(parsed.userId)
    } catch (err) {
      console.error("Error parsing user session:", err)
      router.push("/login")
    }
  }, [router])

  // Fetch questions milik user setelah userId terisi
  useEffect(() => {
    async function fetchQuestions() {
      if (!userId) return

      try {
        setLoading(true)
        // Hanya ambil questions milik userId ini
        const { data, error } = await supabase
          .from("questions")
          .select(
            `
            id,
            title,
            votes,
            created_at,
            user: user_id (
              full_name,
              profiles (
                avatar_url
              )
            )
          `,
          )
          .eq("user_id", userId) // Filter: hanya question milik userId
          .order("created_at", { ascending: false })

        if (error) throw error
        if (data) {
          setQuestions(data as unknown as Question[])
        }
      } catch (err) {
        console.error("Error fetching user questions:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [userId])

  // Fungsi hapus postingan
  const handleDelete = async (questionId: string) => {
    try {
      // Hapus question dari DB (pastikan userId cocok)
      const { error } = await supabase.from("questions").delete().eq("id", questionId).eq("user_id", userId) // hanya boleh hapus jika pemilik
      if (error) throw error

      // Hapus juga dari state
      setQuestions((prev) => prev.filter((q) => q.id !== questionId))

      // toast
      toast.success("Question has been deleted")
    } catch (err) {
      console.error("Error deleting question:", err)
      toast.error("Failed to delete question.")
    }
  }

  const handleTabClick = (tab: string) => {
    setActiveBottomTab(tab)
    if (isClient) {
      // Check that this only runs on client
      switch (tab) {
        case "home":
          router.push("/dashboard") // Replace with appropriate route
          break
        case "konsultasi":
          router.push("/dashboard/konsultasi") // Replace with appropriate route
          break
        case "schedule":
          router.push("/dashboard/jadwal") // Replace with appropriate route
          break
        case "settings":
          router.push("/dashboard/profile") // Replace with appropriate route
          break
        default:
          break
      }
    }
  }

  if (!userId) {
    return <LoadingPage />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white flex items-center justify-center">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6 flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-blue-300 border-t-transparent animate-spin"></div>
          <span>Loading questions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white py-4 px-3 sm:py-6 sm:px-4 pb-24 md:pb-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Card className="backdrop-blur-md bg-white/10 border border-white/20">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-white text-xl sm:text-2xl flex items-center">
                  <FileQuestion className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-blue-300" />
                  My Questions
                </CardTitle>
                <CardDescription className="text-blue-200 text-sm sm:text-base">
                  Manage all your posted questions
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 hover:text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                >
                  <Link href="/dashboard/posts/add">
                    <Plus className="h-4 w-4 mr-2" />
                    Ask Question
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {questions.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <FileQuestion className="h-16 w-16 text-blue-300/50" />
                <p className="text-blue-100">No questions found. Try asking one!</p>
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30 mt-2"
                >
                  <Link href="/dashboard/posts/add">
                    <Plus className="h-4 w-4 mr-2" />
                    Ask Your First Question
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold text-white">
                      <Link href={`/dashboard/posts/${q.id}`} className="hover:text-blue-300 transition-colors">
                        {q.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-blue-500/20 text-blue-100 px-2 py-1 rounded-md">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{q.votes}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-200">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(q.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 border border-blue-400/30">
                          <AvatarImage
                            src={q.user?.profiles?.avatar_url || "/placeholder-user.jpg"}
                            alt={q.user?.full_name || "User"}
                          />
                          <AvatarFallback className="bg-blue-500/30 text-blue-100">
                            {q.user?.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-blue-100 font-medium">{q.user?.full_name || "Unknown User"}</p>
                      </div>
                    </div>
                  </CardContent>
                  <div className="flex justify-end px-4 pb-3 border-t border-white/10 pt-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 hover:text-white"
                        asChild
                      >
                        <Link href={`/dashboard/posts/${q.id}`}>View Details</Link>
                      </Button>
                      <Modal title={`Delete "${q.title}"`} onClick={() => handleDelete(q.id)} color="danger">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Modal>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-900/90 backdrop-blur-md border-t border-white/10 z-50 md:hidden">
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

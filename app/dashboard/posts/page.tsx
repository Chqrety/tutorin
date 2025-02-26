"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Modal from "@/components/ui/modal"
import { toast } from "react-toastify"

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
          setQuestions(data as Question[])
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
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId)
        .eq("user_id", userId) // hanya boleh hapus jika pemilik
      if (error) throw error

      // Hapus juga dari state
      setQuestions((prev) => prev.filter((q) => q.id !== questionId))

      // toast
      toast.success("Question has been deleted")
    } catch (err) {
      console.error("Error deleting question:", err)
      alert("Failed to delete question.")
    }
  }

  if (!userId) {
    // Mungkin masih proses cek session / redirect
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <p>Checking session...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <p>Loading questions...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Questions</h1>
        {/* Button ke halaman "Add Question" (mis: /dashboard/posts/add) */}
        <Button asChild>
          <Link href="/dashboard/posts/add">Ask Question</Link>
        </Button>
      </div>

      {questions.length === 0 ? (
        <p>No questions found. Try asking one!</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg font-bold">
                  {/* Link ke detail question */}
                  <Link href={`/dashboard/posts/${q.id}`} className="hover:underline">
                    {q.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="mr-2 font-medium text-gray-600">Votes: {q.votes}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={q.user?.profiles?.avatar_url || "/placeholder-user.jpg"}
                      alt={q.user?.full_name || "User"}
                    />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{q.user?.full_name || "Unknown User"}</p>
                </div>
              </CardContent>
              {/* Tombol Hapus Question */}
              <div className="flex justify-end px-4 pb-4">
                <Modal
                  children={"Delete"}
                  color={"danger"}
                  title={q.title}
                  onClick={() => handleDelete(q.id)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

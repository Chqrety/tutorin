"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"

export default function SingleNotePage() {
  const router = useRouter()
  const params = useParams()
  const noteId = params.noteId

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [note, setNote] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const userSession = sessionStorage.getItem("userSession")
      if (userSession) {
        const parsed = JSON.parse(userSession)
        if (parsed?.userId) {
          setUserId(parsed.userId)
          setIsLoggedIn(true)
        } else {
          router.push("/login")
        }
      } else {
        router.push("/login")
      }
    } catch (err) {
      console.error("Session error:", err)
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    if (!isLoggedIn || !userId) return

    const fetchNote = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("notes")
          .select("id, content, created_at")
          .eq("id", noteId)
          .eq("user_id", userId)
          .single()

        if (error) {
          console.error("fetchNote error:", error)
          return
        }
        setNote(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchNote()
  }, [isLoggedIn, userId, noteId])

  if (!isLoggedIn) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-2xl font-semibold text-gray-700 mb-4">Catatan tidak ditemukan.</p>
        <Button onClick={() => router.push("/dashboard/notes")} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Catatan
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white shadow-md">
        <div className="flex justify-between items-center h-16 px-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/notes")} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
          <Button onClick={() => router.push(`/dashboard/notes?edit=${note.id}`)} className="flex items-center">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
      </header>
      <main className="flex-grow overflow-auto bg-white">
        <div className="p-4 md:p-6">
          <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: note.content }} />
          <p className="text-sm text-gray-500">
            Dibuat:{" "}
            {new Date(note.created_at).toLocaleString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </main>
    </div>
  )
}


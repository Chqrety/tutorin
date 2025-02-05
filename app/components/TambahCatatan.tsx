"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuill } from "react-quilljs"
import "quill/dist/quill.snow.css"

import { supabase } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"

type NoteItem = {
  id: string
  user_id: string
  content: string
  created_at: string
}

export default function TambahCatatan() {
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [notes, setNotes] = useState<NoteItem[]>([])

  /**
   * useQuill Hook dari react-quilljs:
   * - quill: instance Quill
   * - quillRef: ref DOM untuk editor
   * - other config
   */
  const { quill, quillRef } = useQuill({
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
    },
    theme: "snow",
    placeholder: "Tulis catatan Anda di sini...",
  })

  // Ambil userId dari sessionStorage
  useEffect(() => {
    try {
      const userSession = sessionStorage.getItem("userSession")
      if (userSession) {
        const parsed = JSON.parse(userSession)
        if (parsed.userId) {
          setUserId(parsed.userId)
        }
      }
    } catch (err) {
      console.error("Error parsing session:", err)
    }
  }, [])

  // Fetch catatan user
  const fetchNotes = useCallback(async () => {
    if (!userId) return
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      if (data) {
        setNotes(data as NoteItem[])
      }
    } catch (error) {
      console.error("Error fetching notes:", error)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchNotes()
  }, [userId, fetchNotes])

  // Fungsi simpan catatan
  const handleSave = async () => {
    if (!userId) {
      toast({ title: "Error", description: "User tidak terdeteksi" })
      return
    }

    if (!quill) {
      toast({ title: "Error", description: "Editor belum siap" })
      return
    }

    try {
      // Ambil HTML dari editor
      const content = quill.root.innerHTML

      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: userId,
          content,
        })
        .select("*")

      if (error) throw error

      toast({ title: "Berhasil", description: "Catatan berhasil disimpan" })

      // Reset isi editor
      quill.setContents([])

      // Tambahkan data baru ke state
      if (data && data.length > 0) {
        setNotes((prev) => [data[0], ...prev])
      }
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Gagal menyimpan catatan" })
    }
  }

  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Tambah Catatan (react-quilljs)</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Quill Editor */}
        <div className="bg-white border rounded-md min-h-[200px]" ref={quillRef} />

        <div className="flex justify-end mt-2">
          <Button onClick={handleSave} variant="default">
            Simpan Catatan
          </Button>
        </div>
      </CardContent>

      <Separator className="my-4" />

      <CardHeader>
        <CardTitle className="text-lg font-bold">Daftar Catatan Saya</CardTitle>
      </CardHeader>
      <CardContent>
        {notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="p-3 border rounded-md bg-gray-50">
                <div
                  className="prose max-w-full"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
                <p className="text-sm text-gray-400 mt-2">
                  {new Date(note.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Belum ada catatan.</p>
        )}
      </CardContent>
    </Card>
  )
}

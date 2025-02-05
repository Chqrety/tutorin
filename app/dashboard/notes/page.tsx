"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { useQuill } from "react-quilljs"
import "quill/dist/quill.snow.css"
import { Plus, Edit, Trash2, X, Save } from "lucide-react"

type NoteItem = {
  id: string
  user_id: string
  content: string
  created_at: string
}

export default function NotesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [editNoteId, setEditNoteId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

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
    placeholder: "Edit catatan di sini...",
  })

  useEffect(() => {
    try {
      const session = sessionStorage.getItem("userSession")
      if (session) {
        const parsed = JSON.parse(session)
        if (parsed.userId) {
          setUserId(parsed.userId)
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
    } catch (err) {
      console.error(err)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchNotes()
  }, [userId, fetchNotes])

  const handleEdit = (noteId: string, content: string) => {
    setEditNoteId(noteId)
    setIsCreating(false)
    setIsEditing(true)
    if (quill) {
      quill.clipboard.dangerouslyPasteHTML(content)
    }
  }

  const handleSave = async () => {
    if (!quill || (!editNoteId && !isCreating) || !userId) return
    try {
      const newContent = quill.root.innerHTML
      let result
      if (isCreating) {
        result = await supabase.from("notes").insert({ content: newContent, user_id: userId })
      } else {
        result = await supabase.from("notes").update({ content: newContent }).eq("id", editNoteId).eq("user_id", userId)
      }
      if (result.error) throw result.error

      toast({ title: "Berhasil", description: isCreating ? "Catatan dibuat" : "Catatan diperbarui" })
      setEditNoteId(null)
      setIsCreating(false)
      setIsEditing(false)
      fetchNotes()
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Gagal menyimpan catatan" })
    }
  }

  const handleCancelEdit = () => {
    setEditNoteId(null)
    setIsCreating(false)
    setIsEditing(false)
    if (quill) {
      quill.setContents([])
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!userId) return
    if (!confirm("Yakin ingin menghapus catatan ini?")) return
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId).eq("user_id", userId)
      if (error) throw error

      toast({ title: "Dihapus", description: "Catatan berhasil dihapus" })
      fetchNotes()
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Gagal menghapus catatan" })
    }
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditNoteId(null)
    setIsEditing(true)
    if (quill) {
      quill.setContents([])
    }
  }

  if (!userId) return null

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className={`w-full md:w-1/3 border-r overflow-y-auto ${isEditing ? "hidden md:block" : ""}`}>
        <div className="p-4">
          <Button onClick={handleCreate} className="w-full mb-4">
            <Plus className="mr-2 h-4 w-4" /> Buat Catatan Baru
          </Button>
          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="p-3 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="prose max-w-full text-sm line-clamp-3">
                    {note.content.replace(/<[^>]*>/g, "").slice(0, 100)}...
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{new Date(note.created_at).toLocaleString()}</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(note.id, note.content)}
                      disabled={editNoteId === note.id}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(note.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Belum ada catatan.</p>
          )}
        </div>
      </div>
      <div className={`flex-1 flex flex-col ${!isEditing ? "hidden md:flex" : ""}`}>
        {(editNoteId || isCreating) && (
          <div className="border-b p-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Button variant="outline" onClick={handleCancelEdit} className="w-full sm:w-auto">
              <X className="h-4 w-4 mr-2" /> Batal
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {isCreating ? "Buat Catatan" : "Simpan Perubahan"}
            </Button>
          </div>
        )}
        <div className="flex-1 p-4 overflow-auto">
          <div className="bg-white border rounded-md h-full" ref={quillRef as any} />
        </div>
      </div>
    </div>
  )
}


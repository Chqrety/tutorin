"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Spinner } from "@heroui/spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import LoadingPage from "@/app/components/LoadingPage"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tag } from "lucide-react"
import { toast } from "react-toastify"

export default function AddPost() {
  const router = useRouter()

  // State input form
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [tags, setTags] = useState("")
  const [codeSnippet, setCodeSnippet] = useState("") // <--- Tambahan untuk code
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  // userId dari session
  const [userId, setUserId] = useState<string | null>(null)

  // Ambil userId dari sessionStorage
  useEffect(() => {
    try {
      const userSession = sessionStorage.getItem("userSession")
      if (!userSession) {
        router.push("/login")
        return
      }
      const parsedSession = JSON.parse(userSession)
      if (!parsedSession?.userId) {
        router.push("/login")
        return
      }
      setUserId(parsedSession.userId)
    } catch (err) {
      console.error("Error parsing user session:", err)
      router.push("/login")
    }
  }, [router])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (title.trim().length < 15) {
      newErrors.title = "Title must be at least 15 characters long"
    }
    if (details.trim().length < 30) {
      newErrors.details = "Question details must be at least 30 characters long"
    }
    if (tags.trim().split(/\s+/).filter(Boolean).length < 1) {
      newErrors.tags = "Please add at least one tag"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true)

    e.preventDefault()
    if (!userId) {
      // Jika user belum terdeteksi, jangan lanjut
      return
    }
    if (!validateForm()) {
      setIsLoading(false)
      return
    }
    try {
      // Insert ke tabel 'questions' di Supabase
      // catatan: 'content' = details, 'tags' = tags, 'code' = codeSnippet
      const { data, error } = await supabase
        .from("questions")
        .insert({
          user_id: userId,
          title: title.trim(),
          content: details.trim(),
          tags: tags.trim(),
          code: codeSnippet.trim(), // <--- Masukkan code snippet ke kolom 'code'
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error inserting question:", error)
        return
      }

      // Dapatkan id question yang baru dibuat
      const newQuestionId = data?.id
      // console.log("Inserted question with id:", newQuestionId)
      // toast berhasil
      toast.success("Pertanyaan berhasil diposting!", { position: "top-right" })
      // Redirect ke halaman detail question
      router.push(`/dashboard/posts/${newQuestionId}`)
    } catch (err) {
      console.error("Unexpected error submitting question:", err)
    }
    setIsLoading(false)
  }

  // Jika userId null, mungkin masih loading / redirect. Boleh tampil loading.
  if (!userId) {
    return <LoadingPage />
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Ask a public question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. How do I center a div using Flexbox?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Details */}
              <div>
                <Label htmlFor="details">Question details</Label>
                <Textarea
                  id="details"
                  placeholder="Provide details about your question..."
                  rows={6}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
                {errors.details && <p className="text-red-500 text-sm mt-1">{errors.details}</p>}
              </div>

              {/* Code Snippet */}
              <div>
                <Label htmlFor="codeSnippet">Code snippet (optional)</Label>
                <Textarea
                  id="codeSnippet"
                  placeholder={`e.g.\n.parent {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}`}
                  rows={6}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                />
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex items-center space-x-2">
                  <Tag className="w-5 h-5" />
                  <Input
                    id="tags"
                    placeholder="e.g. javascript react css"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
                {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          {/* Submit button */}
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Spinner color="secondary" size="sm" /> : ""}
            Post Your Question
          </Button>
        </CardFooter>
      </Card>

      {/* Preview */}
      {(title || details || tags || codeSnippet) && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-bold mb-4">{title || "Your question title"}</h2>
            <p className="whitespace-pre-wrap mb-4">{details || "Your question details"}</p>

            {/* Preview code snippet */}
            {codeSnippet && (
              <pre className="bg-gray-100 p-4 rounded-md mb-4 whitespace-pre-wrap">
                {codeSnippet}
              </pre>
            )}

            {tags && (
              <div className="flex flex-wrap gap-2">
                {tags
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

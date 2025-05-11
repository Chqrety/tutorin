"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Send, Eye, HelpCircle, Hash } from "lucide-react"
import { motion } from "framer-motion"

export default function AddPost() {
  const router = useRouter()

  // State input form
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [tags, setTags] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    e.preventDefault()

    if (!userId) {
      // Jika user belum terdeteksi, jangan lanjut
      return
    }

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Insert ke tabel 'questions' di Supabase
      // catatan: 'content' = details, 'tags' = tags
      const { data, error } = await supabase
        .from("questions")
        .insert({
          user_id: userId,
          title: title.trim(),
          content: details.trim(),
          tags: tags.trim(),
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error inserting question:", error)
        setIsSubmitting(false)
        return
      }

      // Dapatkan id question yang baru dibuat
      const newQuestionId = data?.id
      console.log("Inserted question with id:", newQuestionId)

      // Redirect ke halaman detail question, misalnya:
      // "/dashboard/posts/[questionId]"
      router.push(`/dashboard/posts/${newQuestionId}`)
    } catch (err) {
      console.error("Unexpected error submitting question:", err)
      setIsSubmitting(false)
    }
  }

  // Jika userId null, mungkin masih loading / redirect. Boleh tampil loading.
  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white flex items-center justify-center">
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-6 flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-blue-300 border-t-transparent animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white py-4 px-3 sm:py-6 sm:px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Button
            variant="ghost"
            className="mb-4 sm:mb-6 text-blue-200 hover:text-white hover:bg-white/10"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="sm:inline">Back</span>
          </Button>

          <Card className="backdrop-blur-md bg-white/10 border border-white/20 mb-6 sm:mb-8">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-white text-xl sm:text-2xl flex items-center">
                <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-blue-300" />
                Ask a Public Question
              </CardTitle>
              <CardDescription className="text-blue-200 text-sm sm:text-base">
                Share your question with the community
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Title */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="title" className="text-blue-100 text-sm sm:text-base">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. How do I center a div using Flexbox?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-blue-400/20 text-sm sm:text-base"
                  />
                  {errors.title && <p className="text-red-300 text-xs sm:text-sm">{errors.title}</p>}
                </div>

                {/* Details */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="details" className="text-blue-100 text-sm sm:text-base">
                    Question details
                  </Label>
                  <Textarea
                    id="details"
                    placeholder="Provide details about your question..."
                    rows={5}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-blue-400/20 text-sm sm:text-base"
                  />
                  {errors.details && <p className="text-red-300 text-xs sm:text-sm">{errors.details}</p>}
                </div>

                {/* Tags */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="tags" className="text-blue-100 text-sm sm:text-base">
                    Tags
                  </Label>
                  <div className="flex items-center space-x-2 bg-white/5 border border-white/20 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/20">
                    <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
                    <Input
                      id="tags"
                      placeholder="e.g. javascript react css"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-white placeholder:text-blue-300/50 text-sm sm:text-base"
                    />
                  </div>
                  {errors.tags && <p className="text-red-300 text-xs sm:text-sm">{errors.tags}</p>}
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between border-t border-white/10 pt-4 px-4 sm:px-6">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full sm:w-auto bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 hover:text-white order-2 sm:order-1"
              >
                Cancel
              </Button>
              {/* Submit button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30 order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Your Question
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Preview */}
        {(title || details || tags) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="backdrop-blur-md bg-white/10 border border-white/20">
              <CardHeader className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-white text-lg sm:text-xl flex items-center">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-300" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-white">
                  {title || "Your question title"}
                </h2>
                <p className="whitespace-pre-wrap mb-4 sm:mb-6 text-blue-100 text-sm sm:text-base">
                  {details || "Your question details"}
                </p>
                {tags && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {tags
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-500/20 text-blue-100 border border-blue-400/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md text-xs sm:text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}

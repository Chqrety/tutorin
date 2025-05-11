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
import {
  ArrowLeft,
  Send,
  Eye,
  HelpCircle,
  Hash,
  Home,
  MessageCircle,
  CalendarPlus2Icon as CalendarIcon2,
  Settings,
  Plus,
  Code,
} from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "react-toastify"
import LoadingPage from "@/app/components/LoadingPage"

export default function AddPost() {
  const router = useRouter()

  // State input form
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [tags, setTags] = useState("")
  const [codeSnippet, setCodeSnippet] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeBottomTab, setActiveBottomTab] = useState("konsultasi")
  const [isClient, setIsClient] = useState(false)

  // userId dari session
  const [userId, setUserId] = useState<string | null>(null)

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

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
      const { data, error } = await supabase
        .from("questions")
        .insert({
          user_id: userId,
          title: title.trim(),
          content: details.trim(),
          tags: tags.trim(),
          code: codeSnippet.trim(),
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

      // Toast berhasil
      toast.success("Pertanyaan berhasil diposting!", { position: "top-right" })

      // Redirect ke halaman detail question
      router.push(`/dashboard/posts/${newQuestionId}`)
    } catch (err) {
      console.error("Unexpected error submitting question:", err)
      setIsSubmitting(false)
    }
  }

  const handleTabClick = (tab: string) => {
    setActiveBottomTab(tab)
    if (isClient) {
      // Cek bahwa ini hanya jalan di client
      switch (tab) {
        case "home":
          router.push("/dashboard") // Ganti dengan rute halaman yang sesuai
          break
        case "konsultasi":
          router.push("/dashboard/konsultasi") // Ganti dengan rute halaman yang sesuai
          break
        case "schedule":
          router.push("/dashboard/jadwal") // Ganti dengan rute halaman yang sesuai
          break
        case "settings":
          router.push("/dashboard/profile") // Ganti dengan rute halaman yang sesuai
          break
        default:
          break
      }
    }
  }

  // Jika userId null, mungkin masih loading / redirect. Boleh tampil loading.
  if (!userId) {
    return <LoadingPage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white py-4 px-3 sm:py-6 sm:px-4 pb-24">
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

                {/* Code Snippet */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="codeSnippet" className="text-blue-100 text-sm sm:text-base flex items-center">
                    <Code className="h-4 w-4 mr-1.5 text-blue-300" />
                    Code snippet (optional)
                  </Label>
                  <Textarea
                    id="codeSnippet"
                    placeholder={`e.g.\n.parent {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}`}
                    rows={4}
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-blue-400/20 text-sm sm:text-base font-mono"
                  />
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
        {(title || details || tags || codeSnippet) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 mb-20">
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

                {/* Preview code snippet */}
                {codeSnippet && (
                  <pre className="bg-blue-950/50 border border-blue-800/50 p-3 sm:p-4 rounded-md mb-4 sm:mb-6 whitespace-pre-wrap text-xs sm:text-sm text-blue-100 font-mono overflow-x-auto">
                    {codeSnippet}
                  </pre>
                )}

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

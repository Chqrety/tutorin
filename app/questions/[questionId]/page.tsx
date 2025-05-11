"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, ChevronDown, ChevronUp, MessageSquare, Share2, Code, Clock } from "lucide-react"

// Types
type UserProfile = {
  full_name: string
  profiles: {
    avatar_url: string | null
  } | null
}

type QuestionType = {
  id: string
  title: string
  content: string
  tags: string | null
  code?: string | null
  votes: number
  created_at: string
  user: UserProfile
}

type CommentType = {
  id: string
  content: string
  created_at: string
  user: UserProfile | null
  parent_id?: string | null
  replies?: (CommentType | null)[]
}

export default function StackOverflowPostPage() {
  const { questionId } = useParams()
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [question, setQuestion] = useState<QuestionType | null>(null)
  const [loading, setLoading] = useState(true)

  // State untuk komentar pada pertanyaan
  const [questionComments, setQuestionComments] = useState<CommentType[]>([])
  const [questionCommentOpen, setQuestionCommentOpen] = useState(false)
  const [questionCommentText, setQuestionCommentText] = useState("")

  // State untuk reply pada komentar
  const [replyForms, setReplyForms] = useState<{ [commentId: string]: boolean }>({})
  const [replyTexts, setReplyTexts] = useState<{ [commentId: string]: string }>({})

  // State untuk menyimpan status vote agar user hanya dapat vote sekali per postingan
  const [questionVoted, setQuestionVoted] = useState(false)

  // Handle back button navigation
  const handleBack = () => {
    router.back()
  }

  // Scroll to bottom when new comments are added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [questionComments])

  // Cek sesi menggunakan sessionStorage
  useEffect(() => {
    const storedSession = sessionStorage.getItem("userSession")
    if (storedSession) {
      setIsLoggedIn(true)
    } else {
      router.push("/login")
    }
  }, [router])

  // Ambil data pertanyaan dan komentar
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        if (!questionId) return

        // 1) Ambil data pertanyaan dengan join ke tabel users dan profiles
        const { data: questionData, error: qError } = await supabase
          .from("questions")
          .select(
            `
            id,
            title,
            content,
            tags,
            code,
            votes,
            created_at,
            user:users (
              full_name,
              profiles:profiles (
                avatar_url
              )
            )
          `,
          )
          .eq("id", questionId)
          .maybeSingle()

        if (qError) throw qError
        if (!questionData) {
          setQuestion(null)
          return
        }

        // 2) Ambil komentar untuk pertanyaan
        const { data: allComments, error: cError } = await supabase
          .from("comments")
          .select(
            `
            id,
            content,
            created_at,
            question_id,
            parent_id,
            user:users (
              full_name,
              profiles:profiles (
                avatar_url
              )
            )
          `,
          )
          .eq("question_id", questionData.id)
          .order("created_at", { ascending: true })

        if (cError) throw cError

        // Organize comments
        const questionComments: CommentType[] = []
        const commentReplies: { [key: string]: CommentType[] } = {}

        allComments.forEach((comment) => {
          if (!comment.parent_id) {
            questionComments.push(comment as CommentType)
          } else {
            if (!commentReplies[comment.parent_id]) {
              commentReplies[comment.parent_id] = []
            }
            commentReplies[comment.parent_id].push(comment as CommentType)
          }
        })

        // Add replies to their parent comments
        const addRepliesToComments = (comments: CommentType[]) => {
          return comments.map((comment) => ({
            ...comment,
            replies: commentReplies[comment.id] || [],
          }))
        }

        setQuestion(questionData as QuestionType)
        setQuestionComments(addRepliesToComments(questionComments))
      } catch (err) {
        console.error("Error fetching question/comments:", err)
        setQuestion(null)
        setQuestionComments([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [questionId])

  // Fungsi untuk voting pada pertanyaan (setiap user hanya bisa vote sekali)
  const handleVoteQuestion = async (delta: number) => {
    if (!isLoggedIn || !question) {
      alert("Please log in to vote.")
      return
    }
    if (questionVoted) {
      alert("You have already voted on this question.")
      return
    }
    const newVotes = question.votes + delta
    // Optimistic update
    setQuestion({ ...question, votes: newVotes })
    const { error } = await supabase.from("questions").update({ votes: newVotes }).eq("id", question.id)
    if (error) {
      console.error("Error updating question vote:", error.message)
      // Rollback jika error
      setQuestion({ ...question, votes: question.votes })
    } else {
      setQuestionVoted(true)
    }
  }

  // Fungsi untuk share (menggunakan URL halaman saat ini)
  const handleShare = async (url: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check out this post",
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        alert("Link copied to clipboard!")
      }
    } catch (err) {
      console.error("Error sharing:", err)
    }
  }

  // Fungsi untuk submit komentar pada pertanyaan
  const handleSubmitQuestionComment = async () => {
    const storedSession = sessionStorage.getItem("userSession")
    if (!storedSession || !question) {
      alert("Please log in to comment.")
      return
    }
    const sessionData = JSON.parse(storedSession)
    const userId = sessionData.userId
    const { data, error } = await supabase
      .from("comments")
      .insert({
        content: questionCommentText,
        question_id: question.id,
        user_id: userId,
      })
      .select(
        `
      id,
      content,
      created_at,
      user:users (
        full_name,
        profiles:profiles (
          avatar_url
        )
      )
    `,
      )
      .single()
    if (error || !data) {
      console.error("Error adding question comment:", error?.message)
      return
    }
    setQuestionComments((prev) => [...prev, data])
    setQuestionCommentText("")
    setQuestionCommentOpen(false)
  }

  // Fungsi untuk submit reply (nested comment) pada komentar
  const handleSubmitReply = async (parentId: string) => {
    if (!isLoggedIn) {
      alert("Please log in to comment.")
      return
    }
    const storedSession = sessionStorage.getItem("userSession")
    if (!storedSession || !question) return
    const sessionData = JSON.parse(storedSession)
    const userId = sessionData.userId
    const replyText = replyTexts[parentId] || ""
    if (!replyText.trim()) return

    const insertObj = {
      content: replyText,
      parent_id: parentId,
      user_id: userId,
      question_id: question.id,
    }

    const { data, error } = await supabase
      .from("comments")
      .insert(insertObj)
      .select(
        `
      id,
      content,
      created_at,
      user:users (
        full_name,
        profiles:profiles (
          avatar_url
        )
      )
    `,
      )
      .single()

    if (error || !data) {
      console.error("Error adding reply:", error)
      return
    }

    setQuestionComments((prev) =>
      prev.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: comment.replies ? [...comment.replies, data] : [data],
            }
          : comment,
      ),
    )
    setReplyForms((prev) => ({ ...prev, [parentId]: false }))
    setReplyTexts((prev) => ({ ...prev, [parentId]: "" }))
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-300"></div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Question not found</h2>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-10 backdrop-blur-md bg-blue-900/80 border-b border-white/10 p-4"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="bg-white/10 border border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 truncate">
            <h1 className="text-xl md:text-2xl font-bold text-white truncate">{question.title}</h1>
          </div>
          <Button
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hidden sm:flex"
            onClick={() => handleShare(window.location.href)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="relative z-1 p-4 md:p-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 overflow-hidden w-full">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex flex-wrap gap-2">
                {question.tags &&
                  question.tags
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((tag, index) => (
                      <Badge key={index} className="bg-blue-500/20 text-blue-100 border-blue-400/30">
                        {tag}
                      </Badge>
                    ))}
              </div>
              <CardTitle className="text-xl text-white mt-2">Question Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex">
                  {/* Votes Section */}
                  <div className="flex flex-col items-center mr-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleVoteQuestion(1)}
                      disabled={questionVoted}
                      className="text-white hover:bg-white/10"
                    >
                      <ChevronUp className="h-5 w-5" />
                    </Button>
                    <span className="font-bold my-2 text-white">{question.votes}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleVoteQuestion(-1)}
                      disabled={questionVoted}
                      className="text-white hover:bg-white/10"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Question Content */}
                  <div className="flex-grow">
                    <p className="mb-4 text-blue-50">{question.content}</p>

                    {question.code && (
                      <div className="mb-4 relative">
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-blue-500/20 text-blue-100 border-blue-400/30">
                            <Code className="h-3 w-3 mr-1" /> Code
                          </Badge>
                        </div>
                        <pre className="bg-blue-900/50 border border-blue-700/50 p-4 rounded-lg text-blue-100 overflow-x-auto">
                          {question.code}
                        </pre>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-blue-200 mt-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(window.location.href)}
                        className="text-blue-200 hover:bg-white/10 hover:text-white sm:hidden"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>

                      <div className="flex items-center gap-3 ml-auto">
                        <div className="flex items-center gap-2 bg-blue-900/30 px-3 py-1 rounded-full">
                          <Clock className="h-3 w-3 text-blue-300" />
                          <span className="text-xs">{new Date(question.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-blue-400/30">
                            <AvatarImage
                              src={question.user?.profiles?.avatar_url || "/placeholder.svg"}
                              alt={question.user?.full_name || "User"}
                            />
                            <AvatarFallback className="bg-blue-500/20 text-blue-100">
                              {question.user?.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white">{question.user?.full_name || "Unknown User"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              {questionComments.length > 0 && (
                <div className="border-t border-white/10 p-4">
                  <h3 className="text-sm font-medium text-white mb-3">Comments ({questionComments.length})</h3>
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-4 pr-4">
                      {questionComments.map((comment) => (
                        <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6 border border-blue-400/30">
                              <AvatarImage
                                src={comment.user?.profiles?.avatar_url || "/placeholder.svg"}
                                alt={comment.user?.full_name || "User"}
                              />
                              <AvatarFallback className="bg-blue-500/20 text-blue-100">
                                {comment.user?.full_name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-white">
                              {comment.user?.full_name || "Unknown User"}
                            </span>
                            <span className="text-xs text-blue-300">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto text-blue-200 hover:text-white hover:bg-white/10 h-7 px-2"
                              onClick={() =>
                                setReplyForms((prev) => ({
                                  ...prev,
                                  [comment.id]: !prev[comment.id],
                                }))
                              }
                            >
                              Reply
                            </Button>
                          </div>

                          <p className="text-sm text-blue-100">{comment.content}</p>

                          {/* Reply Form */}
                          {replyForms[comment.id] && (
                            <div className="mt-3 bg-blue-900/30 rounded-lg p-3">
                              <Textarea
                                className="min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-blue-200/50 mb-2"
                                placeholder="Write your reply..."
                                value={replyTexts[comment.id] || ""}
                                onChange={(e) =>
                                  setReplyTexts((prev) => ({
                                    ...prev,
                                    [comment.id]: e.target.value,
                                  }))
                                }
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                                  onClick={() => handleSubmitReply(comment.id)}
                                >
                                  Submit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-white/10 border-white/20 text-blue-200 hover:bg-white/20 hover:text-white"
                                  onClick={() => setReplyForms((prev) => ({ ...prev, [comment.id]: false }))}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Nested Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 pl-4 border-l border-blue-700/50 space-y-3">
                              {comment.replies.map(
                                (reply) =>
                                  reply && (
                                    <div key={reply.id} className="bg-blue-900/30 rounded-lg p-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Avatar className="h-5 w-5 border border-blue-400/30">
                                          <AvatarImage
                                            src={reply.user?.profiles?.avatar_url || "/placeholder.svg"}
                                            alt={reply.user?.full_name || "User"}
                                          />
                                          <AvatarFallback className="bg-blue-500/20 text-blue-100 text-xs">
                                            {reply.user?.full_name?.charAt(0) || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-medium text-white">
                                          {reply.user?.full_name || "Unknown User"}
                                        </span>
                                        <span className="text-xs text-blue-300">
                                          {new Date(reply.created_at).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-xs text-blue-100 ml-7">{reply.content}</p>
                                    </div>
                                  ),
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-white/10 p-4">
              {questionCommentOpen ? (
                <div className="w-full">
                  <Textarea
                    className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-blue-200/50 mb-3"
                    placeholder="Write your comment..."
                    value={questionCommentText}
                    onChange={(e) => setQuestionCommentText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                      onClick={handleSubmitQuestionComment}
                    >
                      Submit
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white/10 border-white/20 text-blue-200 hover:bg-white/20 hover:text-white"
                      onClick={() => {
                        setQuestionCommentOpen(false)
                        setQuestionCommentText("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-blue-200 hover:bg-white/20 hover:text-white w-full"
                  onClick={() => setQuestionCommentOpen(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add a comment
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

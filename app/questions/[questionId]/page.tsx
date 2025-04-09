"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, MessageSquare, Share2 } from "lucide-react"
import BackButton from "@/app/components/BackButton"

// Karena data user tersimpan di tabel "users" (full_name)
// dan data avatar tersimpan di tabel "profiles" (avatar_url)
// dengan relasi FK antar id, tipe data di-update menjadi:
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
  tags: string | null // misalnya: "react javascript css"
  code?: string | null
  votes: number
  created_at: string
  user: UserProfile
}

type AnswerType = {
  id: string
  content: string
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

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [question, setQuestion] = useState<QuestionType | null>(null)
  const [answers, setAnswers] = useState<AnswerType[]>([])
  const [loading, setLoading] = useState(true)

  // State untuk komentar pada pertanyaan
  const [questionComments, setQuestionComments] = useState<CommentType[]>([])
  const [questionCommentOpen, setQuestionCommentOpen] = useState(false)
  const [questionCommentText, setQuestionCommentText] = useState("")

  // State untuk komentar pada jawaban: objek dengan key = answer.id
  const [answerComments, setAnswerComments] = useState<{ [key: string]: CommentType[] }>({})
  // State untuk form komentar tambahan (di bawah jawaban)
  const [answerCommentForms, setAnswerCommentForms] = useState<{ [key: string]: boolean }>({})
  const [answerCommentTexts, setAnswerCommentTexts] = useState<{ [key: string]: string }>({})

  // State untuk reply pada komentar (digunakan untuk komentar di pertanyaan dan jawaban)
  const [replyForms, setReplyForms] = useState<{ [commentId: string]: boolean }>({})
  const [replyTexts, setReplyTexts] = useState<{ [commentId: string]: string }>({})

  // State untuk menyimpan status vote agar user hanya dapat vote sekali per postingan
  const [questionVoted, setQuestionVoted] = useState(false)
  const [answerVoted, setAnswerVoted] = useState<{ [key: string]: boolean }>({})

  // Cek sesi menggunakan sessionStorage
  useEffect(() => {
    const storedSession = sessionStorage.getItem("userSession")
    console.log("Session from sessionStorage:", storedSession)
    if (storedSession) {
      setIsLoggedIn(true)
    } else {
      router.push("/login")
    }
  }, [router])

  // Ambil data pertanyaan, jawaban, dan komentar (top-level)
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
          setAnswers([])
          return
        }

        // 2) Ambil jawaban untuk pertanyaan dengan join ke tabel users dan profiles
        const { data: answersData, error: aError } = await supabase
          .from("answers")
          .select(
            `
            id,
            content,
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
          .eq("question_id", questionData.id)
          .order("created_at", { ascending: true })

        if (aError) throw aError

        // 3) Ambil semua komentar untuk pertanyaan dan jawaban
        const { data: allComments, error: cError } = await supabase
          .from("comments")
          .select(
            `
            id,
            content,
            created_at,
            question_id,
            answer_id,
            parent_id,
            user:users (
              full_name,
              profiles:profiles (
                avatar_url
              )
            )
          `,
          )
          .or(
            `question_id.eq.${questionData.id},answer_id.in.(${(answersData as AnswerType[])
              .map((a) => a.id)
              .join(",")})`,
          )
          .order("created_at", { ascending: true })

        if (cError) throw cError

        // Organize comments
        const questionComments: CommentType[] = []
        const answerComments: { [key: string]: CommentType[] } = {}
        const commentReplies: { [key: string]: CommentType[] } = {}

        allComments.forEach((comment) => {
          if (comment.question_id && !comment.parent_id) {
            questionComments.push(comment as CommentType)
          } else if (comment.answer_id && !comment.parent_id) {
            if (!answerComments[comment.answer_id]) {
              answerComments[comment.answer_id] = []
            }
            answerComments[comment.answer_id].push(comment as CommentType)
          } else if (comment.parent_id) {
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
        setAnswers((answersData as AnswerType[]) || [])
        setQuestionComments(addRepliesToComments(questionComments))
        setAnswerComments(
          Object.fromEntries(
            Object.entries(answerComments).map(([answerId, comments]) => [
              answerId,
              addRepliesToComments(comments),
            ]),
          ),
        )
      } catch (err) {
        console.error("Error fetching question/answers/comments:", err)
        setQuestion(null)
        setAnswers([])
        setQuestionComments([])
        setAnswerComments({})
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
    const { error } = await supabase
      .from("questions")
      .update({ votes: newVotes })
      .eq("id", question.id)
    if (error) {
      console.error("Error updating question vote:", error.message)
      // Rollback jika error
      setQuestion({ ...question, votes: question.votes })
    } else {
      setQuestionVoted(true)
    }
  }

  // Fungsi untuk voting pada jawaban (setiap user hanya bisa vote sekali per jawaban)
  const handleVoteAnswer = async (answerId: string, delta: number) => {
    if (!isLoggedIn) {
      alert("Please log in to vote.")
      return
    }
    if (answerVoted[answerId]) {
      alert("You have already voted on this answer.")
      return
    }
    // Optimistic update: update state jawaban dengan vote baru
    setAnswers((prev) =>
      prev.map((ans) => (ans.id === answerId ? { ...ans, votes: ans.votes + delta } : ans)),
    )
    const { error } = await supabase
      .from("answers")
      .update({ votes: supabase.raw("votes + ?", [delta]) })
      .eq("id", answerId)
    if (error) {
      console.error("Error updating answer vote:", error.message)
    } else {
      setAnswerVoted((prev) => ({ ...prev, [answerId]: true }))
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

  // Fungsi untuk submit komentar pada jawaban
  const handleSubmitAnswerComment = async (answerId: string) => {
    const storedSession = sessionStorage.getItem("userSession")
    if (!storedSession) {
      alert("Please log in to comment.")
      return
    }
    const sessionData = JSON.parse(storedSession)
    const userId = sessionData.userId
    const commentText = answerCommentTexts[answerId] || ""
    if (!commentText.trim()) return
    const { data, error } = await supabase
      .from("comments")
      .insert({
        content: commentText,
        answer_id: answerId,
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
      console.error("Error adding answer comment:", error?.message)
      return
    }
    setAnswerComments((prev) => ({
      ...prev,
      [answerId]: [...(prev[answerId] || []), data],
    }))
    setAnswerCommentTexts((prev) => ({ ...prev, [answerId]: "" }))
    setAnswerCommentForms((prev) => ({ ...prev, [answerId]: false }))
  }

  // Fungsi untuk submit reply (nested comment) pada komentar
  const handleSubmitReply = async (
    parentId: string,
    postType: "question" | "answer",
    postId?: string,
  ) => {
    if (!isLoggedIn) {
      alert("Please log in to comment.")
      return
    }
    const storedSession = sessionStorage.getItem("userSession")
    if (!storedSession) return
    const sessionData = JSON.parse(storedSession)
    const userId = sessionData.userId
    const replyText = replyTexts[parentId] || ""
    if (!replyText.trim()) return

    const insertObj: any = {
      content: replyText,
      parent_id: parentId,
      user_id: userId,
    }
    if (postType === "question" && question) {
      insertObj.question_id = question.id
    } else if (postType === "answer" && postId) {
      insertObj.answer_id = postId
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

    if (postType === "question") {
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
    } else if (postType === "answer" && postId) {
      setAnswerComments((prev) => {
        const commentsForAnswer = prev[postId] || []
        const updated = commentsForAnswer.map((comment) =>
          comment.id === parentId
            ? {
                ...comment,
                replies: comment.replies ? [...comment.replies, data] : [data],
              }
            : comment,
        )
        return { ...prev, [postId]: updated }
      })
    }
    setReplyForms((prev) => ({ ...prev, [parentId]: false }))
    setReplyTexts((prev) => ({ ...prev, [parentId]: "" }))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <p>Loading question...</p>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <p>Question not found.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row justify-between items-center">
          <div className="flex gap-x-3 items-center">
            <BackButton />
            <CardTitle className="text-2xl font-bold">{question.title}</CardTitle>
          </div>
          <Button variant="outline">Ask Question</Button>
        </CardHeader>
        <CardContent>
          <div className="flex">
            {/* Votes Section for Question */}
            <div className="flex flex-col items-center mr-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleVoteQuestion(1)}
                disabled={questionVoted}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="font-bold my-2">{question.votes}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleVoteQuestion(-1)}
                disabled={questionVoted}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            {/* Question Content */}
            <div className="flex-grow">
              <p className="mb-4">{question.content}</p>
              {question.code && (
                <pre className="bg-gray-100 p-4 rounded-md mb-4 whitespace-pre-wrap">
                  {question.code}
                </pre>
              )}
              {question.tags && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {question.tags
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(window.location.href)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={question.user?.profiles?.avatar_url || "/placeholder-user.jpg"}
                      alt={question.user?.full_name || "User"}
                    />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{question.user?.full_name || "Unknown User"}</p>
                    <p>asked {new Date(question.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="ghost"
            className="ml-auto"
            onClick={() => setQuestionCommentOpen((prev) => !prev)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Add a comment
          </Button>
        </CardFooter>
        {/* Form komentar untuk pertanyaan */}
        {questionCommentOpen && (
          <CardContent className="border-t pt-4">
            <textarea
              className="w-full p-2 border rounded-md mb-2"
              placeholder="Write your comment..."
              value={questionCommentText}
              onChange={(e) => setQuestionCommentText(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button variant="primary" onClick={handleSubmitQuestionComment}>
                Submit
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setQuestionCommentOpen(false)
                  setQuestionCommentText("")
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
        {/* Tampilkan komentar pertanyaan beserta tombol Reply */}
        {questionComments.filter((comment) => comment !== null).length > 0 && (
          <CardContent className="border-t pt-4">
            {questionComments
              .filter((comment) => comment !== null)
              .map((comment) => (
                <div key={comment.id} className="mb-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={comment.user?.profiles?.avatar_url || "/placeholder-user.jpg"}
                        alt={comment.user?.full_name || "User"}
                      />
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{comment.user?.full_name || "Unknown User"}</span>
                    <span>
                      {comment.created_at
                        ? new Date(comment.created_at).toLocaleString()
                        : "Unknown Date"}
                    </span>
                    <Button
                      variant="ghost"
                      size="xs"
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
                  <p className="ml-8">{comment.content}</p>
                  {/* Form reply untuk komentar pertanyaan */}
                  {replyForms[comment.id] && (
                    <div className="ml-12 mt-2">
                      <textarea
                        className="w-full p-2 border rounded-md mb-2 text-sm"
                        placeholder="Write your reply..."
                        value={replyTexts[comment.id] || ""}
                        onChange={(e) =>
                          setReplyTexts((prev) => ({
                            ...prev,
                            [comment.id]: e.target.value,
                          }))
                        }
                      />
                      <div className="flex space-x-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSubmitReply(comment.id, "question")}
                        >
                          Submit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setReplyForms((prev) => ({ ...prev, [comment.id]: false }))
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Tampilkan nested replies jika ada */}
                  {comment.replies &&
                    comment.replies.filter((reply) => reply !== null).length > 0 && (
                      <div className="ml-12 mt-2">
                        {comment.replies
                          .filter((reply) => reply !== null)
                          .map((reply) => (
                            <div key={reply!.id} className="mb-1">
                              <div className="flex items-center space-x-2 text-xs text-gray-600">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage
                                    src={
                                      reply?.user?.profiles?.avatar_url || "/placeholder-user.jpg"
                                    }
                                    alt={reply?.user?.full_name || "User"}
                                  />
                                  <AvatarFallback>?</AvatarFallback>
                                </Avatar>
                                <span>{reply?.user?.full_name || "Unknown User"}</span>
                                <span>
                                  {reply?.created_at
                                    ? new Date(reply.created_at).toLocaleString()
                                    : "Unknown Date"}
                                </span>
                              </div>
                              <p className="ml-6 text-xs">{reply?.content || ""}</p>
                            </div>
                          ))}
                      </div>
                    )}
                </div>
              ))}
          </CardContent>
        )}
      </Card>

      {/* Answers Section */}
      <h2 className="text-xl font-bold mb-4">{answers.length} Answers</h2>
      {answers.map((answer) => (
        <Card className="mb-6" key={answer.id}>
          <CardContent className="pt-6">
            <div className="flex">
              {/* Votes Section for Answer */}
              <div className="flex flex-col items-center mr-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleVoteAnswer(answer.id, 1)}
                  disabled={!!answerVoted[answer.id]}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <span className="font-bold my-2">{answer.votes}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleVoteAnswer(answer.id, -1)}
                  disabled={!!answerVoted[answer.id]}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-grow">
                <p className="mb-4">{answer.content}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(window.location.href)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={answer.user?.profiles?.avatar_url || "/placeholder-user.jpg"}
                        alt={answer.user?.full_name || "User"}
                      />
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{answer.user?.full_name || "Unknown User"}</p>
                      <p>answered {new Date(answer.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              className="ml-auto"
              onClick={() =>
                setAnswerCommentForms((prev) => ({
                  ...prev,
                  [answer.id]: !prev[answer.id],
                }))
              }
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Add a comment
            </Button>
          </CardFooter>
          {/* Form komentar untuk jawaban */}
          {answerCommentForms[answer.id] && (
            <CardContent className="border-t pt-4">
              <textarea
                className="w-full p-2 border rounded-md mb-2"
                placeholder="Write your comment..."
                value={answerCommentTexts[answer.id] || ""}
                onChange={(e) =>
                  setAnswerCommentTexts((prev) => ({
                    ...prev,
                    [answer.id]: e.target.value,
                  }))
                }
              />
              <div className="flex space-x-2">
                <Button variant="primary" onClick={() => handleSubmitAnswerComment(answer.id)}>
                  Submit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAnswerCommentForms((prev) => ({ ...prev, [answer.id]: false }))}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          )}
          {/* Tampilkan komentar untuk jawaban beserta tombol Reply */}
          {answerComments[answer.id] &&
            answerComments[answer.id].filter((comment) => comment !== null).length > 0 && (
              <CardContent className="border-t pt-4">
                {answerComments[answer.id]
                  .filter((comment) => comment !== null)
                  .map((comment) => (
                    <div key={comment.id} className="mb-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={comment.user?.profiles?.avatar_url || "/placeholder-user.jpg"}
                            alt={comment.user?.full_name || "User"}
                          />
                          <AvatarFallback>?</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {comment.user?.full_name || "Unknown User"}
                        </span>
                        <span>
                          {comment.created_at
                            ? new Date(comment.created_at).toLocaleString()
                            : "Unknown Date"}
                        </span>
                        <Button
                          variant="ghost"
                          size="xs"
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
                      <p className="ml-8">{comment.content}</p>
                      {/* Form reply untuk komentar jawaban */}
                      {replyForms[comment.id] && (
                        <div className="ml-12 mt-2">
                          <textarea
                            className="w-full p-2 border rounded-md mb-2 text-sm"
                            placeholder="Write your reply..."
                            value={replyTexts[comment.id] || ""}
                            onChange={(e) =>
                              setReplyTexts((prev) => ({
                                ...prev,
                                [comment.id]: e.target.value,
                              }))
                            }
                          />
                          <div className="flex space-x-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSubmitReply(comment.id, "answer", answer.id)}
                            >
                              Submit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setReplyForms((prev) => ({ ...prev, [comment.id]: false }))
                              }
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                      {/* Tampilkan nested replies jika ada */}
                      {comment.replies &&
                        comment.replies.filter((reply) => reply !== null).length > 0 && (
                          <div className="ml-12 mt-2">
                            {comment.replies
                              .filter((reply) => reply !== null)
                              .map((reply) => (
                                <div key={reply!.id} className="mb-1">
                                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage
                                        src={
                                          reply?.user?.profiles?.avatar_url ||
                                          "/placeholder-user.jpg"
                                        }
                                        alt={reply?.user?.full_name || "User"}
                                      />
                                      <AvatarFallback>?</AvatarFallback>
                                    </Avatar>
                                    <span>{reply?.user?.full_name || "Unknown User"}</span>
                                    <span>
                                      {reply?.created_at
                                        ? new Date(reply.created_at).toLocaleString()
                                        : "Unknown Date"}
                                    </span>
                                  </div>
                                  <p className="ml-6 text-xs">{reply?.content || ""}</p>
                                </div>
                              ))}
                          </div>
                        )}
                    </div>
                  ))}
              </CardContent>
            )}
        </Card>
      ))}
    </div>
  )
}

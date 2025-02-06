"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChevronDown, ChevronUp, MessageSquare, Share2 } from "lucide-react"

//
// Tipe data untuk user dan profile
//
type UserProfile = {
  full_name: string
  profiles: {
    avatar_url: string | null
  } | null
}

//
// Tipe data untuk question
//
type QuestionType = {
  id: string
  title: string
  content: string
  tags: string | null    // Disimpan sebagai string, misalnya: "react javascript css"
  code?: string | null   // Optional, untuk code snippet
  votes: number
  created_at: string
  user: UserProfile
}

//
// Tipe data untuk answer
//
type AnswerType = {
  id: string
  content: string
  votes: number
  created_at: string
  user: UserProfile
}

export default function StackOverflowPostPage() {
  // Ambil questionId dari URL (dari folder [questionId])
  const { questionId } = useParams()

  const [question, setQuestion] = useState<QuestionType | null>(null)
  const [answers, setAnswers] = useState<AnswerType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        if (!questionId) return

        // 1) Ambil question berdasarkan id = questionId
        const { data: questionData, error: qError } = await supabase
          .from("questions")
          .select(`
            id,
            title,
            content,
            tags,
            code,
            votes,
            created_at,
            user: user_id (
              full_name,
              profiles (
                avatar_url
              )
            )
          `)
          .eq("id", questionId)
          .maybeSingle()

        if (qError) throw qError
        if (!questionData) {
          setQuestion(null)
          setAnswers([])
          return
        }

        // 2) Ambil semua answers yang memiliki question_id = questionData.id
        const { data: answersData, error: aError } = await supabase
          .from("answers")
          .select(`
            id,
            content,
            votes,
            created_at,
            user: user_id (
              full_name,
              profiles (
                avatar_url
              )
            )
          `)
          .eq("question_id", questionData.id)
          .order("created_at", { ascending: true })

        if (aError) throw aError

        setQuestion(questionData as QuestionType)
        setAnswers((answersData as AnswerType[]) || [])
      } catch (err) {
        console.error("Error fetching question/answers:", err)
        setQuestion(null)
        setAnswers([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [questionId])

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
          <CardTitle className="text-2xl font-bold">{question.title}</CardTitle>
          <Button variant="outline">Ask Question</Button>
        </CardHeader>
        <CardContent>
          <div className="flex">
            {/* Votes Section */}
            <div className="flex flex-col items-center mr-4">
              <Button variant="ghost" size="icon">
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="font-bold my-2">{question.votes}</span>
              <Button variant="ghost" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            {/* Question Content */}
            <div className="flex-grow">
              <p className="mb-4">{question.content}</p>

              {/* Tampilkan Code Snippet jika ada */}
              {question.code && (
                <pre className="bg-gray-100 p-4 rounded-md mb-4 whitespace-pre-wrap">
                  {question.code}
                </pre>
              )}

              {/* Tampilkan Tags, jika ada */}
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
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    Follow
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
                    <p className="font-medium">
                      {question.user?.full_name || "Unknown User"}
                    </p>
                    <p>
                      asked {new Date(question.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="ml-auto">
            <MessageSquare className="h-4 w-4 mr-2" />
            Add a comment
          </Button>
        </CardFooter>
      </Card>

      {/* Answers Section */}
      <h2 className="text-xl font-bold mb-4">{answers.length} Answers</h2>
      {answers.map((answer) => (
        <Card className="mb-6" key={answer.id}>
          <CardContent className="pt-6">
            <div className="flex">
              <div className="flex flex-col items-center mr-4">
                <Button variant="ghost" size="icon">
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <span className="font-bold my-2">{answer.votes}</span>
                <Button variant="ghost" size="icon">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-grow">
                <p className="mb-4">{answer.content}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="ghost" size="sm">
                      Edit
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
                      <p className="font-medium">
                        {answer.user?.full_name || "Unknown User"}
                      </p>
                      <p>
                        answered {new Date(answer.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="ml-auto">
              <MessageSquare className="h-4 w-4 mr-2" />
              Add a comment
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

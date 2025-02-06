import Link from "next/link"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, ArrowUpCircle, ArrowDownCircle, Share2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function QuestionsPage() {
  // Buat Supabase client di server (Next.js 13 server component)
  const supabase = createServerComponentClient({ cookies })

  /**
   * Panggil aggregator count di relasi `answers` dan `question_comments`.
   * Pastikan di Supabase relationship bernama "answers" & "question_comments".
   */
  const { data: questions, error } = await supabase
    .from("questions")
    .select(`
      id,
      title,
      content,
      code,
      tags,
      votes,
      created_at,
      user: user_id (
        full_name,
        profiles (
          avatar_url
        )
      ),
      answers(count),            
      question_comments(count)   
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching questions:", error)
    return <div>Error loading questions. Please try again later.</div>
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Questions Feed</h1>
          <Button asChild>
            <Link href="/questions/ask">Ask Question</Link>
          </Button>
        </div>

        {questions && questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((question) => {
              // aggregator "answers(count)" -> question.answers?.count
              const answersCount = question.answers?.count || 0
              // aggregator "question_comments(count)" -> question.question_comments?.count
              const commentsCount = question.question_comments?.count || 0

              return (
                <Card
                  key={question.id}
                  className="bg-white shadow-md hover:shadow-lg transition-shadow duration-200"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={question.user.profiles?.avatar_url || "/placeholder-user.jpg"}
                          alt={question.user.full_name || "Unknown User"}
                        />
                        <AvatarFallback>
                          {question.user.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {question.user.full_name || "Unknown User"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(question.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href={`/questions/${question.id}`}
                      className="hover:text-blue-600 transition-colors duration-200"
                    >
                      <CardTitle className="text-xl mb-2">{question.title}</CardTitle>
                    </Link>
                    <p className="text-gray-700 mb-4">{question.content}</p>
                    {question.code && (
                      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto mb-4">
                        <code>{question.code}</code>
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
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between items-center text-sm text-gray-500 pt-0">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <ArrowUpCircle className="h-4 w-4 mr-1 text-green-500" />
                        <ArrowDownCircle className="h-4 w-4 mr-1 text-red-500" />
                        {question.votes} votes
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {answersCount} answers
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {commentsCount} comments
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          <p>No questions found.</p>
        )}
      </div>
    </div>
  )
}

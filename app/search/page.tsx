import { createClient } from "@supabase/supabase-js"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import ProtectedLink from "../components/ProtectedLink"
import VoteShareButtons from "../components/VoteShareButtons"
import AskQuestionButton from "../components/AskQuestionButton"
import ClientSearchWrapper from "../components/ClientSearchWrapper"

export const dynamic = "force-dynamic"

// Definisi tipe data
type UserProfile = {
  full_name: string
  profiles: {
    avatar_url: string | null
  } | null
}

type Question = {
  id: string
  title: string
  content: string
  code: string | null
  tags: string | null
  votes: number
  created_at: string
  user: UserProfile
  answers: { id: string }[] | null
  question_comments: { id: string }[] | null
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default async function QuestionsPage() {
  // --- Ambil data Questions beserta relasinya ---
  const { data: questions, error } = await supabase
    .from("questions")
    .select(
      `
      id,
      title,
      content,
      code,
      tags,
      votes,
      created_at,
      user: user_id (
        full_name,
        profiles ( avatar_url )
      ),
      answers: answers!question_id ( id ),
      question_comments: question_comments!question_id ( id )
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching questions:", error)
    return <div>Error loading questions. Please try again later.</div>
  }

  // --- Ambil data Sidebar ---
  // 1. Ambil semua tag unik dari tabel questions
  const { data: allQuestions, error: questionsError } = await supabase.from("questions").select("tags")
  let distinctTags: string[] = []
  if (!questionsError && allQuestions) {
    const tagsSet = new Set<string>()
    allQuestions.forEach((q: any) => {
      if (q.tags) {
        q.tags.split(/\s+/).forEach((tag: string) => {
          const trimmed = tag.trim()
          if (trimmed) tagsSet.add(trimmed)
        })
      }
    })
    distinctTags = Array.from(tagsSet)
  }

  // 2. Ambil Popular Posts (3 postingan dengan votes tertinggi)
  const { data: popularPosts } = await supabase
    .from("questions")
    .select("id, title")
    .order("votes", { ascending: false })
    .limit(3)
  const popular = popularPosts || []

  // 3. Ambil Last Posts (3 postingan terbaru)
  const { data: lastPosts } = await supabase
    .from("questions")
    .select("id, title")
    .order("created_at", { ascending: false })
    .limit(3)
  const last = lastPosts || []

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Desktop - Wrapped in ClientSearchWrapper */}
          <aside className="hidden lg:block lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto w-80">
            <ClientSearchWrapper
              tags={distinctTags}
              popularPosts={popular}
              lastPosts={last}
              questions={questions || []}
            />
          </aside>

          {/* Sidebar Mobile - Collapsible */}
          <aside className="lg:hidden w-full">
            <details className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <summary className="p-4 font-medium cursor-pointer flex items-center justify-between">
                <span>Browse & Search</span>
                <span className="text-blue-600">▼</span>
              </summary>
              <div className="p-4 border-t border-gray-100">
                <ClientSearchWrapper
                  tags={distinctTags}
                  popularPosts={popular}
                  lastPosts={last}
                  questions={questions || []}
                  isMobile={true}
                />
              </div>
            </details>
          </aside>

          {/* Main Content: Questions Feed */}
          <main className="flex-1" id="questions-container">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Questions Feed</h1>
              <AskQuestionButton />
            </div>

            {questions && questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question) => {
                  const answersCount = question.answers?.length || 0
                  const commentsCount = question.question_comments?.length || 0

                  return (
                    <Card
                      key={question.id}
                      data-question-id={question.id}
                      className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 border-gray-100"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage
                              src={question.user.profiles?.avatar_url || "/placeholder-user.jpg"}
                              alt={question.user.full_name || "Unknown User"}
                            />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {question.user.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{question.user.full_name || "Unknown User"}</p>
                            <p className="text-xs text-gray-500">{new Date(question.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ProtectedLink href={`/questions/${question.id}`}>
                          <CardTitle className="text-xl mb-2 hover:text-blue-600 transition-colors">
                            {question.title}
                          </CardTitle>
                        </ProtectedLink>
                        <p className="text-gray-700 mb-4 line-clamp-3">{question.content}</p>
                        {question.code && (
                          <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto mb-4 border border-gray-200">
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
                                  className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs border border-blue-100"
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between items-center text-sm text-gray-500 pt-0 border-t border-gray-100">
                        <VoteShareButtons
                          questionId={question.id}
                          initialVotes={question.votes}
                          questionUrl={`https://yourdomain.com/questions/${question.id}`}
                        />
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {answersCount} answers
                          </span>
                          <span className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {commentsCount} comments
                          </span>
                        </div>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl text-center border border-gray-100 shadow-sm">
                <p className="text-gray-500">No questions found.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

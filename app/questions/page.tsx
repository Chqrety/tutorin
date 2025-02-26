// app/questions/page.tsx
import Link from "next/link"
import { createClient } from "@supabase/supabase-js" // gunakan Supabase client berbasis anon key
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Search, FileText } from "lucide-react"
import ProtectedLink from "../components/ProtectedLink"
import SidebarProfile from "../components/SidebarProfile"
import VoteShareButtons from "../components/VoteShareButtons"
import AskQuestionButton from "../components/AskQuestionButton"
import BackButton from "../components/BackButton"

export const dynamic = "force-dynamic"

// Definisi tipe data (sesuaikan jika perlu)
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

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
  const { data: allQuestions, error: questionsError } = await supabase
    .from("questions")
    .select("tags")
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
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-4 max-w-6xl relative">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Desktop */}
          <aside className="hidden md:block md:fixed md:left-0 md:top-0 md:h-screen md:overflow-y-auto w-80 p-4 border border-gray-200 rounded-lg bg-white">
            <div className="h-full">
              {/* back button */}
              <BackButton />

              {/* Profile Section */}
              <SidebarProfile />

              {/* Menu Item: My Questions */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">My Questions</h2>
                <ProtectedLink href="/question">
                  <div className="flex items-center space-x-2 text-blue-600 hover:underline">
                    <FileText className="h-5 w-5" />
                    <span>View My Questions</span>
                  </div>
                </ProtectedLink>
              </div>

              {/* Search Section */}
              <div className="mb-6 relative">
                <Input type="text" placeholder="Search..." className="w-full pl-10" />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* By Tags Section */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">By Tags</h2>
                <ul className="space-y-2">
                  {distinctTags.map((tag, index) => (
                    <li key={index}>
                      <Link
                        href={`/tags/${tag.toLowerCase()}`}
                        className="text-blue-600 hover:underline"
                      >
                        {tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Popular Posts Section */}
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Popular Posts</h2>
                <ul className="space-y-2">
                  {popular.map((post: any) => (
                    <li key={post.id}>
                      <Link href={`/posts/${post.id}`} className="hover:underline text-gray-800">
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Last Posts Section */}
              <div>
                <h2 className="text-xl font-bold mb-2">Last Posts</h2>
                <ul className="space-y-2">
                  {last.map((post: any) => (
                    <li key={post.id}>
                      <Link href={`/posts/${post.id}`} className="hover:underline text-gray-800">
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Sidebar Mobile */}
          <aside className="md:hidden w-full p-4 border border-gray-200 rounded-lg bg-white mb-6">
            <div>
              <SidebarProfile />
              <div className="mb-6 relative">
                <Input type="text" placeholder="Search..." className="w-full pl-10" />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">By Tags</h2>
                <ul className="space-y-2">
                  {distinctTags.map((tag, index) => (
                    <li key={index}>
                      <Link
                        href={`/tags/${tag.toLowerCase()}`}
                        className="text-blue-600 hover:underline"
                      >
                        {tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Popular Posts</h2>
                <ul className="space-y-2">
                  {popular.map((post: any) => (
                    <li key={post.id}>
                      <Link href={`/posts/${post.id}`} className="hover:underline text-gray-800">
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Last Posts</h2>
                <ul className="space-y-2">
                  {last.map((post: any) => (
                    <li key={post.id}>
                      <Link href={`/posts/${post.id}`} className="hover:underline text-gray-800">
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Main Content: Questions Feed */}
          <main className="flex-1 ml-0 md:ml-80">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Questions Feed</h1>
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
                        <ProtectedLink href={`/questions/${question.id}`}>
                          <CardTitle className="text-xl mb-2">{question.title}</CardTitle>
                        </ProtectedLink>
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
              <p>No questions found.</p>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

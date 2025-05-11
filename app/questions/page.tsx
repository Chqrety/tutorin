import { createClient } from "@supabase/supabase-js"
import QuestionsPageClient from "./QuestionsPageClient"

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

  return <QuestionsPageClient questions={questions || []} tags={distinctTags} popularPosts={popular} lastPosts={last} />
}

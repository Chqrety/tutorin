"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import VoteShareButtons from "./VoteShareButtons"
import ProtectedLink from "./ProtectedLink"

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
  votes?: number // This is now optional as we'll fetch the real count
  created_at: string
  user: UserProfile
}

export default function QuestionCard({ question }: { question: Question }) {
  const [answersCount, setAnswersCount] = useState(0)
  const [commentsCount, setCommentsCount] = useState(0)

  // Fetch actual counts from the database
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Count answers
        const { count: ansCount, error: ansError } = await supabase
          .from("answers")
          .select("*", { count: "exact", head: false })
          .eq("question_id", question.id)

        if (ansError) throw ansError
        setAnswersCount(ansCount || 0)

        // Count comments
        const { count: comCount, error: comError } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: false })
          .eq("question_id", question.id)

        if (comError) throw comError
        setCommentsCount(comCount || 0)
      } catch (err) {
        console.error("Error fetching counts:", err)
      }
    }

    fetchCounts()
  }, [question.id])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="bg-zinc-900/80 backdrop-blur-sm hover:bg-zinc-900/90 transition-colors border border-zinc-800 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Avatar className="h-10 w-10 border border-zinc-700">
              <AvatarImage
                src={question.user.profiles?.avatar_url || "/placeholder.svg?height=40&width=40"}
                alt={question.user.full_name || "Unknown User"}
              />
              <AvatarFallback className="bg-zinc-800">{question.user.full_name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">{question.user.full_name || "Unknown User"}</p>
              <p className="text-xs text-zinc-400">{new Date(question.created_at).toLocaleString()}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProtectedLink href={`/questions/${question.id}`}>
            <CardTitle className="text-xl mb-2 text-white hover:text-zinc-300 transition-colors">
              {question.title}
            </CardTitle>
          </ProtectedLink>
          <p className="text-zinc-300 mb-4 line-clamp-3">{question.content}</p>
          {question.code && (
            <pre className="bg-black p-3 rounded-md text-sm overflow-x-auto mb-4 border border-zinc-800 text-zinc-300">
              <code>{question.code}</code>
            </pre>
          )}
          {question.tags && (
            <div className="flex flex-wrap gap-2 mb-4">
              {question.tags
                .split(/\s+/)
                .filter(Boolean)
                .map((tag, index) => (
                  <Badge key={index} className="bg-zinc-800 text-white border-zinc-700">
                    {tag}
                  </Badge>
                ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center text-sm text-zinc-400 pt-0 border-t border-zinc-800">
          <VoteShareButtons questionId={question.id} />
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              {answersCount} answers
            </span>
            <span className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              {commentsCount} comments
            </span>
            <span className="hidden md:flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {Math.floor(Math.random() * 100) + 10} views
            </span>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { ThumbsUp, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

interface VoteShareButtonsProps {
  questionId: string
  initialVotes?: number // Make this optional since we'll fetch the real count
}

export default function VoteShareButtons({ questionId, initialVotes = 0 }: VoteShareButtonsProps) {
  const [votes, setVotes] = useState(0)
  const [voted, setVoted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch the actual vote count and check if user has voted
  useEffect(() => {
    const fetchVoteData = async () => {
      try {
        // Get user session from sessionStorage
        const userSession = sessionStorage.getItem("userSession")
        let currentUserId = null

        if (userSession) {
          const parsedSession = JSON.parse(userSession)
          if (parsedSession?.userId) {
            currentUserId = parsedSession.userId
            setUserId(currentUserId)
          }
        }

        // Count total votes for this question
        const { count: voteCount, error: countError } = await supabase
          .from("question_votes")
          .select("*", { count: "exact", head: false })
          .eq("question_id", questionId)

        if (countError) throw countError

        setVotes(voteCount || 0)

        // Check if current user has voted (if logged in)
        if (currentUserId) {
          const { data: userVote, error: voteError } = await supabase
            .from("question_votes")
            .select("id")
            .eq("question_id", questionId)
            .eq("user_id", currentUserId)
            .single()

          if (voteError && voteError.code !== "PGRST116") {
            // PGRST116 is "no rows returned" which is expected if user hasn't voted
            console.error("Error checking vote status:", voteError)
          }

          setVoted(!!userVote)
        }
      } catch (err) {
        console.error("Error fetching vote data:", err)
      }
    }

    fetchVoteData()
  }, [questionId])

  const handleVote = async () => {
    // Check if user is logged in
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote on questions",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (voted) {
        // Remove vote
        const { error } = await supabase
          .from("question_votes")
          .delete()
          .eq("question_id", questionId)
          .eq("user_id", userId)

        if (error) throw error

        setVotes((prev) => Math.max(0, prev - 1))
        setVoted(false)
        toast({
          title: "Vote removed",
          description: "Your vote has been removed",
        })
      } else {
        // Add vote
        const { error } = await supabase.from("question_votes").insert({
          question_id: questionId,
          user_id: userId,
        })

        if (error) {
          // If error is due to unique constraint, user has already voted
          if (error.code === "23505") {
            toast({
              title: "Already voted",
              description: "You have already voted for this question",
              variant: "destructive",
            })
            setVoted(true)
            return
          }
          throw error
        }

        setVotes((prev) => prev + 1)
        setVoted(true)
        toast({
          title: "Vote added",
          description: "Your vote has been added",
        })
      }
    } catch (err) {
      console.error("Error voting:", err)
      toast({
        title: "Error",
        description: "There was an error processing your vote",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/questions/${questionId}`)
    toast({
      title: "Link copied",
      description: "Question link copied to clipboard",
    })
  }

  return (
    <div className="flex items-center gap-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-zinc-400 hover:text-white hover:bg-zinc-800 gap-2",
                voted && "text-white bg-zinc-800",
                isLoading && "opacity-50 cursor-not-allowed",
              )}
              onClick={handleVote}
              disabled={isLoading}
            >
              <ThumbsUp className={cn("h-4 w-4", voted && "fill-white")} />
              <span>{votes}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{voted ? "Remove vote" : "Add vote"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share this question</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

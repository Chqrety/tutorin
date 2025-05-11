"use client"

import { useState, useEffect } from "react"

interface QuestionCounts {
  votes: number
  answers: number
  comments: number
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useQuestionCounts(questionId: string): QuestionCounts {
  const [counts, setCounts] = useState({
    votes: 0,
    answers: 0,
    comments: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      if (!questionId) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/questions/${questionId}/counts`)

        if (!response.ok) {
          throw new Error(`Error fetching counts: ${response.status}`)
        }

        const data = await response.json()
        setCounts({
          votes: data.votes,
          answers: data.answers,
          comments: data.comments,
        })
      } catch (err) {
        console.error("Error in useQuestionCounts:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCounts()
  }, [questionId, refreshKey])

  const refetch = () => setRefreshKey((prev) => prev + 1)

  return {
    ...counts,
    isLoading,
    error,
    refetch,
  }
}

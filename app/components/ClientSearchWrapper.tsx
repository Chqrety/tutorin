"use client"

import { useState, useEffect } from "react"
import Sidebar from "./Sidebar"

type Question = {
  id: string
  title: string
  content: string
  code: string | null
  tags: string | null
  votes: number
  created_at: string
  user: {
    full_name: string
    profiles: {
      avatar_url: string | null
    } | null
  }
  answers: { id: string }[] | null
  question_comments: { id: string }[] | null
}

interface SidebarProps {
  tags: string[]
  popularPosts: { id: string; title: string }[]
  lastPosts: { id: string; title: string }[]
  onSearch: (query: string) => void
}

type ClientSearchWrapperProps = {
  tags: string[]
  popularPosts: { id: string; title: string }[]
  lastPosts: { id: string; title: string }[]
  questions: Question[]
  isMobile?: boolean
}

export default function ClientSearchWrapper({
  tags,
  popularPosts,
  lastPosts,
  questions,
  isMobile = false,
}: ClientSearchWrapperProps) {
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])

  // Initialize with all questions
  useEffect(() => {
    setFilteredQuestions(questions)
  }, [questions])

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      // If search is empty, show all questions
      setFilteredQuestions(questions)
      return
    }

    // Filter questions based on search query
    const filtered = questions.filter(
      (q) =>
        q.title.toLowerCase().includes(query.toLowerCase()) ||
        q.content.toLowerCase().includes(query.toLowerCase()) ||
        (q.tags && q.tags.toLowerCase().includes(query.toLowerCase())),
    )

    setFilteredQuestions(filtered)

    // Update the DOM to show only filtered questions
    const container = document.getElementById("questions-container")
    if (container) {
      // Hide all question cards first
      const allCards = container.querySelectorAll(".card")
      allCards.forEach((card) => {
        card.classList.add("hidden")
      })

      // Show only filtered questions
      filtered.forEach((q) => {
        const card = container.querySelector(`[data-question-id="${q.id}"]`)
        if (card) {
          card.classList.remove("hidden")
        }
      })

      // Update the heading to show search results
      const heading = container.querySelector("h1")
      if (heading) {
        heading.textContent = filtered.length > 0 ? `Search Results (${filtered.length})` : "No Results Found"
      }
    }
  }

  return <Sidebar tags={tags} popularPosts={popularPosts} lastPosts={lastPosts} />
}

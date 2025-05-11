"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import ProtectedLink from "../components/ProtectedLink"
import AskQuestionButton from "../components/AskQuestionButton"
import {
  MessageSquare,
  ThumbsUp,
  Menu,
  Search,
  Bell,
  User,
  Home,
  Bookmark,
  TrendingUp,
  Clock,
  Filter,
  Plus,
  Hash,
} from "lucide-react"

// Replace the QuestionCard component with an import
import QuestionCard from "../components/QuestionCard"

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
  user: UserProfile // Single UserProfile object, not an array
  answers: { id: string }[] | null
  question_comments: { id: string }[] | null
}
type SidebarProps = {
  tags: string[]
  popularPosts: { id: string; title: string }[]
  lastPosts: { id: string; title: string }[]
}

// Header Component
function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleLoginClick = () => {
    window.location.href = "/login"
  }

  useEffect(() => {
    const userSession = sessionStorage.getItem("userSession")
    setIsLoggedIn(!!userSession)
  }, [])

  return (
    <header className="h-16 bg-black/80 backdrop-blur-sm border-b border-zinc-800 flex items-center justify-between px-4 sticky top-0 z-50 shadow-md">
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="mr-2 text-white hover:bg-zinc-800 lg:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <img src="/logo.png" alt="DevQA Logo" className="w-36 h-30 object-contain" />
    </div>

      <div className="hidden md:flex relative max-w-md mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search questions, topics, or users..."
            className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 w-full md:w-80 lg:w-96"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-800 md:hidden">
          <Search className="h-5 w-5" />
        </Button>

        <div className="hidden md:block">
          {isLoggedIn ? (
            <AskQuestionButton />
          ) : (
            <Button onClick={handleLoginClick} className="bg-zinc-800 hover:bg-zinc-700 text-white">
              Log In to Ask
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          className="flex items-center gap-2 text-white hover:bg-zinc-800 px-2"
          onClick={handleLoginClick}
        >
          <Avatar className="h-8 w-8 border border-zinc-700">
            <AvatarImage src="/placeholder.svg?height=40&width=40" />
            <AvatarFallback className="bg-zinc-800">U</AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  )
}

// Sidebar Component
function Sidebar({ tags, popularPosts, lastPosts }: SidebarProps) {
  return (
    <div className="flex flex-col gap-6 text-white">
      <div className="rounded-lg bg-zinc-900/80 backdrop-blur-sm overflow-hidden border border-zinc-800">
        <div className="p-4 border-b border-zinc-800 font-medium flex items-center gap-2">
          <Home className="h-4 w-4 text-zinc-400" />
          <span>Navigation</span>
        </div>
        <div className="p-2">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-zinc-800 rounded-md mb-1" asChild>
            <ProtectedLink href="/">
              <Home className="h-4 w-4 mr-2" />
              Home Feed
            </ProtectedLink>
          </Button>

          <Button variant="ghost" className="w-full justify-start text-white hover:bg-zinc-800 rounded-md mb-1" asChild>
            <ProtectedLink href="/trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </ProtectedLink>
          </Button>

          <Button variant="ghost" className="w-full justify-start text-white hover:bg-zinc-800 rounded-md mb-1" asChild>
            <ProtectedLink href="/bookmarks">
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmarks
            </ProtectedLink>
          </Button>
        </div>
      </div>

      <div className="rounded-lg bg-zinc-900/80 backdrop-blur-sm overflow-hidden border border-zinc-800">
        <div className="p-4 border-b border-zinc-800 font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-zinc-400" />
          <span>Popular Questions</span>
        </div>
        <div className="p-2">
          {popularPosts.map((post) => (
            <ProtectedLink key={post.id} href={`/questions/${post.id}`}>
              <div className="p-2 hover:bg-zinc-800 rounded-md transition-colors">
                <div className="flex items-start gap-2">
                  <ThumbsUp className="h-3 w-3 text-zinc-400 mt-1" />
                  <p className="text-sm line-clamp-2">{post.title}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-5">
                  <Badge className="bg-zinc-800 text-white border-zinc-700 text-xs">Hot</Badge>
                </div>
              </div>
            </ProtectedLink>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-zinc-900/80 backdrop-blur-sm overflow-hidden border border-zinc-800">
        <div className="p-4 border-b border-zinc-800 font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-400" />
          <span>Recent Questions</span>
        </div>
        <div className="p-2">
          {lastPosts.map((post) => (
            <ProtectedLink key={post.id} href={`/questions/${post.id}`}>
              <div className="p-2 hover:bg-zinc-800 rounded-md transition-colors">
                <div className="flex items-start gap-2">
                  <Clock className="h-3 w-3 text-zinc-400 mt-1" />
                  <p className="text-sm line-clamp-2">{post.title}</p>
                </div>
                <p className="text-xs text-zinc-400 mt-1 ml-5">Recently posted</p>
              </div>
            </ProtectedLink>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-zinc-900/80 backdrop-blur-sm overflow-hidden border border-zinc-800">
        <div className="p-4 border-b border-zinc-800 font-medium flex items-center gap-2">
          <Hash className="h-4 w-4 text-zinc-400" />
          <span>Popular Tags</span>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge key={index} className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 cursor-pointer">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Filter Bar Component
function FilterBar() {
  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-lg p-3 mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-zinc-400" />
        <span className="text-sm font-medium">Filter by:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700">
          <Clock className="h-3 w-3 mr-1" />
          Latest
        </Button>

        <Button variant="outline" size="sm" className="h-8 border-zinc-700 hover:bg-zinc-700 text-white">
          <TrendingUp className="h-3 w-3 mr-1" />
          Trending
        </Button>

        <Button variant="outline" size="sm" className="h-8 border-zinc-700 hover:bg-zinc-700 text-white">
          <ThumbsUp className="h-3 w-3 mr-1" />
          Most Voted
        </Button>

        <Button variant="outline" size="sm" className="h-8 border-zinc-700 hover:bg-zinc-700 text-white">
          <MessageSquare className="h-3 w-3 mr-1" />
          Most Answered
        </Button>
      </div>
    </div>
  )
}

// Main Client Component
export default function QuestionsPageClient({

  questions,
  tags,
  popularPosts,
  lastPosts,
}: {
  questions: Question[]
  tags: string[]
  popularPosts: { id: string; title: string }[]
  lastPosts: { id: string; title: string }[]
}) {
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeTab, setActiveTab] = useState("latest")
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const userSession = sessionStorage.getItem("userSession")
    setIsLoggedIn(!!userSession)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Header */}
      <Header onMenuToggle={() => setShowSidebar(!showSidebar)} />

      {/* Mobile Sidebar */}
      <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
        <SheetContent side="left" className="bg-black/90 backdrop-blur-sm border-r border-zinc-800 p-0 w-80">
          <div className="h-16 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800 flex items-center px-4">
            <h2 className="text-xl font-bold text-white">DevQA</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-4rem)] p-4">
            <Sidebar tags={tags} popularPosts={popularPosts} lastPosts={lastPosts} />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 container mx-auto p-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Desktop */}
          <aside className="hidden lg:block lg:w-80">
            <div className="sticky top-20">
              <ScrollArea className="h-[calc(100vh-5rem)]">
                <Sidebar tags={tags} popularPosts={popularPosts} lastPosts={lastPosts} />
              </ScrollArea>
            </div>
          </aside>

          {/* Main Content: Questions Feed */}
          <main className="flex-1 pb-16 lg:pb-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-white">Questions Feed</h1>
              <div className="hidden md:block">
                {isLoggedIn ? (
                  <AskQuestionButton />
                ) : (
                  <Button
                    onClick={() => (window.location.href = "/login")}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white"
                  >
                    Log In to Ask
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="bg-zinc-900/80 border border-zinc-800 p-1 h-auto">
                <TabsTrigger value="latest" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                  <Clock className="h-4 w-4 mr-2" />
                  Latest
                </TabsTrigger>
                <TabsTrigger
                  value="trending"
                  className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="popular" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Popular
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filter Bar */}
            <FilterBar />

            {/* Questions Feed */}
            <div className="space-y-6">
              {questions && questions.length > 0 ? (
                questions.map((question) => <QuestionCard key={question.id} question={question} />)
              ) : (
                <div className="bg-zinc-900/80 backdrop-blur-sm p-8 rounded-lg text-center border border-zinc-800">
                  <p className="text-zinc-400">No questions found.</p>
                </div>
              )}

              {/* Load More Button */}
              {questions.length > 0 && (
                <div className="text-center py-4">
                  <Button className="bg-zinc-800 hover:bg-zinc-700 text-white">Load More</Button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-zinc-800 z-30">
        <div className="flex justify-around items-center py-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 text-zinc-400 hover:text-white hover:bg-transparent"
            asChild
          >
            <ProtectedLink href="/">
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </ProtectedLink>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 text-zinc-400 hover:text-white hover:bg-transparent"
            asChild
          >
            <ProtectedLink href="/trending">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Trending</span>
            </ProtectedLink>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 text-zinc-400 hover:text-white hover:bg-transparent"
            asChild
          >
            <ProtectedLink href="/questions/ask">
              <Plus className="h-5 w-5" />
              <span className="text-xs">Ask</span>
            </ProtectedLink>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 text-zinc-400 hover:text-white hover:bg-transparent"
            asChild
          >
            <ProtectedLink href="/notifications">
              <Bell className="h-5 w-5" />
              <span className="text-xs">Alerts</span>
            </ProtectedLink>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 text-zinc-400 hover:text-white hover:bg-transparent"
            asChild
          >
            <ProtectedLink href="/profile">
              <User className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </ProtectedLink>
          </Button>
        </div>
      </div>
    </div>
  )
}

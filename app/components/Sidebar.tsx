"use client"

import type React from "react"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Tag, TrendingUp, Clock, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react"
import SidebarProfile from "./SidebarProfile"
import ProtectedLink from "./ProtectedLink"

type SidebarProps = {
  tags: string[]
  popularPosts: { id: string; title: string }[]
  lastPosts: { id: string; title: string }[]
  onSearch?: (query: string) => void
}

export default function Sidebar({ tags, popularPosts, lastPosts, onSearch }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    tags: true,
    popular: true,
    last: true,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const toggleSection = (section: "tags" | "popular" | "last") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleSearch = useCallback(() => {
    if (onSearch) {
      // If onSearch prop is provided, use it (for parent component handling)
      onSearch(searchQuery)
    } else {
      // Default behavior: redirect to search page with query parameter
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }, [searchQuery, onSearch, router])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Back button */}
      <div className="p-4 border-b border-gray-100">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
      </div>

      {/* Profile Section */}
      <div className="p-4 border-b border-gray-100">
        <SidebarProfile />
      </div>

      {/* My Questions Section */}
      <div className="p-4 border-b border-gray-100">
        <ProtectedLink href="/question">
          <Button
            variant="outline"
            className="w-full justify-start bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span>My Questions</span>
          </Button>
        </ProtectedLink>
      </div>

      {/* Search Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search questions..."
            className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button size="sm" className="mt-2 w-full" onClick={handleSearch} disabled={!searchQuery.trim()}>
            Search
          </Button>
        </div>
      </div>

      {/* Tags Section */}
      <div className="border-b border-gray-100">
        <button
          className="flex items-center justify-between w-full p-4 text-left font-medium"
          onClick={() => toggleSection("tags")}
        >
          <div className="flex items-center">
            <Tag className="h-4 w-4 mr-2 text-blue-600" />
            <span>Browse by Tags</span>
          </div>
          {expandedSections.tags ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.tags && (
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Link key={index} href={`/tags/${tag.toLowerCase()}`}>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Popular Posts Section */}
      <div className="border-b border-gray-100">
        <button
          className="flex items-center justify-between w-full p-4 text-left font-medium"
          onClick={() => toggleSection("popular")}
        >
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-orange-600" />
            <span>Popular Posts</span>
          </div>
          {expandedSections.popular ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.popular && (
          <div className="px-4 pb-4">
            <ul className="space-y-2">
              {popularPosts.map((post) => (
                <li key={post.id} className="overflow-hidden text-ellipsis">
                  <Link
                    href={`/posts/${post.id}`}
                    className="text-sm text-gray-700 hover:text-blue-600 hover:underline line-clamp-1"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Last Posts Section */}
      <div>
        <button
          className="flex items-center justify-between w-full p-4 text-left font-medium"
          onClick={() => toggleSection("last")}
        >
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-green-600" />
            <span>Recent Posts</span>
          </div>
          {expandedSections.last ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {expandedSections.last && (
          <div className="px-4 pb-4">
            <ul className="space-y-2">
              {lastPosts.map((post) => (
                <li key={post.id} className="overflow-hidden text-ellipsis">
                  <Link
                    href={`/posts/${post.id}`}
                    className="text-sm text-gray-700 hover:text-blue-600 hover:underline line-clamp-1"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

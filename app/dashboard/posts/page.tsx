"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Post = {
  id: number
  title: string
  content: string
  tags: string[]
  author: string
  createdAt: string
}

const initialPosts: Post[] = [
  {
    id: 1,
    title: "How to prepare for a job interview?",
    content: "I have an upcoming job interview and I'm not sure how to prepare...",
    tags: ["interview", "career", "advice"],
    author: "John Doe",
    createdAt: "2023-06-15T10:00:00Z",
  },
  {
    id: 2,
    title: "Best resources for learning React",
    content: "I'm looking for recommendations on the best resources to learn React...",
    tags: ["react", "javascript", "webdev"],
    author: "Jane Smith",
    createdAt: "2023-06-14T15:30:00Z",
  },
]

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Community Posts</h1>
        <Link href="/dashboard/posts/create">
          <Button>Create New Post</Button>
        </Link>
      </div>
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{post.content.substring(0, 150)}...</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="text-sm text-gray-500">
              Posted by {post.author} on {new Date(post.createdAt).toLocaleDateString()}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}


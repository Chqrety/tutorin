"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Post = {
  id: number
  title: string
  author: string
  tags: string[]
  createdAt: string
  status: "published" | "pending" | "rejected"
}

const initialPosts: Post[] = [
  {
    id: 1,
    title: "How to prepare for a job interview?",
    author: "John Doe",
    tags: ["interview", "career", "advice"],
    createdAt: "2023-06-15T10:00:00Z",
    status: "published",
  },
  {
    id: 2,
    title: "Best resources for learning React",
    author: "Jane Smith",
    tags: ["react", "javascript", "webdev"],
    createdAt: "2023-06-14T15:30:00Z",
    status: "pending",
  },
]

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  const handleStatusChange = (id: number, newStatus: Post["status"]) => {
    setPosts(posts.map((post) => (post.id === id ? { ...post, status: newStatus } : post)))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Manage User Posts</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell>{post.title}</TableCell>
              <TableCell>{post.author}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    post.status === "published" ? "success" : post.status === "pending" ? "warning" : "destructive"
                  }
                >
                  {post.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(post.id, "published")}
                    disabled={post.status === "published"}
                  >
                    Publish
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(post.id, "rejected")}
                    disabled={post.status === "rejected"}
                  >
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}


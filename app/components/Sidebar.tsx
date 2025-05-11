import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Hash, ThumbsUp } from "lucide-react"
import ProtectedLink from "./ProtectedLink"

type ProtectedLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;  // Add className here to allow it
};

type SidebarProps = {
  tags: string[]
  popularPosts: { id: string; title: string }[]
  lastPosts: { id: string; title: string }[]
}
export default function Sidebar({ tags, popularPosts, lastPosts }: SidebarProps) {
  return (
    <div className="space-y-6">
      {/* Popular Posts */}
      <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 font-medium flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-zinc-400" />
          <span className="text-white">Popular Questions</span>
        </div>
        <div className="p-4">
          <ul className="space-y-3">
            {popularPosts.map((post) => (
              <li key={post.id}>
                <ProtectedLink
                  href={`/questions/${post.id}`}
                  className="text-zinc-300 hover:text-white text-sm line-clamp-2"
                >
                  {post.title}
                </ProtectedLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-400" />
          <span className="text-white">Recent Questions</span>
        </div>
        <div className="p-4">
          <ul className="space-y-3">
            {lastPosts.map((post) => (
              <li key={post.id}>
                <ProtectedLink
                  href={`/questions/${post.id}`}
                  className="text-zinc-300 hover:text-white text-sm line-clamp-2"
                >
                  {post.title}
                </ProtectedLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tags */}
      <div className="bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 font-medium flex items-center gap-2">
          <Hash className="h-4 w-4 text-zinc-400" />
          <span className="text-white">Popular Tags</span>
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

      {/* Browse More */}
      <div className="text-center">
        <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 w-full" asChild>
          <ProtectedLink href="/tags" className="text-white">
            Browse All Tags
          </ProtectedLink>
        </Button>
      </div>
    </div>
  );
}

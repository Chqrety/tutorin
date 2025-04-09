"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function BackButton() {
  const router = useRouter()
  return (
    <div
      onClick={() => router.back()}
      className="p-2 rounded-full transition-all cursor-pointer hover:bg-gray-300 flex w-fit"
    >
      <ChevronLeft className="w-5 h-5" />
    </div>
  )
}

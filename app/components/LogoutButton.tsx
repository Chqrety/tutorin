"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface LogoutButtonProps {
  className?: string
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Clear session storage
      sessionStorage.removeItem("userSession")

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex items-center gap-1.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 ${className}`}
    >
      {isLoggingOut ? (
        <div className="h-3.5 w-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <LogOut className="h-3.5 w-3.5" />
      )}
      <span>Logout</span>
    </Button>
  )
}

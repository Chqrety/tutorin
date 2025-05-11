"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Calendar, MessageSquare, Clock, Settings, LogOut, FileText, ChevronRight, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"

// Menu standar
const menuItems = [
  { icon: Home, label: "Beranda", href: "/dashboard" },
  { icon: Calendar, label: "Jadwal", href: "/dashboard/jadwal" },
  { icon: MessageSquare, label: "Konsultasi", href: "/dashboard/konsultasi" },
  { icon: FileText, label: "Posts", href: "/dashboard/posts" },
  { icon: Clock, label: "Riwayat", href: "/dashboard/riwayat" },
  { icon: Settings, label: "Pengaturan", href: "/dashboard/pengaturan" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [userSession, setUserSession] = useState<string | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  // Ambil session dari sessionStorage (client-side)
  useEffect(() => {
    const session = sessionStorage.getItem("userSession")
    setUserSession(session)
  }, [])

  // Menu Question
  const questionMenu = {
    icon: FileText,
    label: "Question",
    href: userSession ? "/questions" : "/login",
  }

  // Render list of links (for both desktop and mobile)
  const renderNav = () => (
    <nav className="mt-6 px-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-800/50 scrollbar-track-transparent">
      {[...menuItems, questionMenu].map((item, index) => {
        const isActive = pathname === item.href
        return (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            onHoverStart={() => setHoveredItem(item.href)}
            onHoverEnd={() => setHoveredItem(null)}
          >
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className="relative flex items-center px-4 py-3 my-1 rounded-xl text-blue-100 group"
            >
              {/* Highlight background */}
              {(isActive || hoveredItem === item.href) && (
                <motion.div
                  layoutId="activeBackground"
                  className="absolute inset-0 bg-white/10 filter blur-sm border border-white/10 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}

              {/* Icon */}
              <div
                className={
                  `flex items-center justify-center w-10 h-10 rounded-full mr-3 transition-colors duration-200 ` +
                  (isActive
                    ? "bg-gradient-to-r from-blue-400 to-blue-500"
                    : "bg-blue-800/30")
                }
              >
                <item.icon
                  className={`h-5 w-5 ${isActive ? "text-white" : "text-blue-300"}`}
                />
              </div>

              <span className={`font-medium ${isActive ? "text-white" : ""}
              `}>
                {item.label}
              </span>

              {isActive && (
                <motion.div
                  className="ml-auto"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                >
                  <ChevronRight className="h-4 w-4 text-blue-300" />
                </motion.div>
              )}
            </Link>
          </motion.div>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile Sidebar as Sheet */}
     

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-72">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950 to-blue-900 overflow-hidden">
          <motion.div
            className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.div
            className="absolute top-40 left-20 w-16 h-16 rounded-full border border-blue-400/20"
            animate={{ y: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
          />
        </div>

        <div className="relative h-full flex flex-col z-10">
          {/* Header */}
          <div className="flex items-center justify-center h-20 px-6 border-b border-blue-800/30">
            <div className="flex items-center gap-1 mt-10">
              <motion.img
                src="/logo.png"
                alt="Tutorin Logo"
                className="w-45 h-45 mb-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              />
              
            </div>
          </div>


          {/* Navigation */}
          {renderNav()}

          {/* Logout */}
          <div className="p-4 border-t border-blue-800/30 backdrop-blur-md">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/logout"
                className="flex items-center px-4 py-3 rounded-xl text-blue-100 bg-white/5 hover:bg-white/10 transition-colors duration-200"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20 mr-3">
                  <LogOut className="h-5 w-5 text-red-300" />
                </div>
                <span className="font-medium">Keluar</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  )
}

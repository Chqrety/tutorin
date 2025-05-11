"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Calendar, MessageSquare, Clock, Settings, LogOut, FileText, Menu, X, ChevronRight } from "lucide-react"

// Menu standar
const menuItems = [
  { icon: Home, label: "Beranda", href: "/dashboard" },
  { icon: Calendar, label: "Jadwal", href: "/dashboard/jadwal" },
  { icon: MessageSquare, label: "Konsultasi", href: "/dashboard/konsultasi" },
  { icon: FileText, label: "Posts", href: "/dashboard/posts" },
  { icon: Clock, label: "Riwayat", href: "/dashboard/riwayat" },
  { icon: Settings, label: "Pengaturan", href: "/dashboard/pengaturan" },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [userSession, setUserSession] = useState<string | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Ambil session dari sessionStorage (client-side)
  useEffect(() => {
    const session = sessionStorage.getItem("userSession")
    setUserSession(session)
  }, [])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  // Tambahkan menu "Question" yang mengarah ke /question jika sudah login,
  // jika belum login, arahkan ke /login.
  const questionMenu = {
    icon: FileText,
    label: "Question",
    href: userSession ? "/questions" : "/login",
  }

  return (
    <>
      {/* Hamburger Button untuk mobile */}
      <motion.button
        className="md:hidden p-3 bg-blue-500/20 backdrop-blur-md rounded-full border border-blue-400/20 text-blue-100 focus:outline-none z-50 relative"
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </motion.button>

      {/* Overlay (gelap) ketika sidebar terbuka di mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`fixed top-0 left-0 h-full w-72 z-50 md:translate-x-0 md:static md:shadow-none`}
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Background gradient and effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950 to-blue-900 overflow-hidden">
          {/* Animated background elements */}
          <motion.div
            className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />
          <motion.div
            className="absolute top-40 left-20 w-16 h-16 rounded-full border border-blue-400/20 backdrop-blur-sm"
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />
        </div>

        <div className="relative h-full flex flex-col z-10">
          {/* Header */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-blue-800/30 backdrop-blur-md">
            <motion.span
              className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              TUTORIN
            </motion.span>
            {/* Tombol close untuk mobile */}
            <motion.button
              className="md:hidden p-2 rounded-full bg-blue-800/30 text-blue-100 focus:outline-none"
              onClick={toggleSidebar}
              aria-label="Close Sidebar"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Navigation */}
          <nav className="mt-6 px-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-800/50 scrollbar-track-transparent">
            {menuItems.map((item, index) => (
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
                  className="relative flex items-center px-4 py-3 my-1 rounded-xl text-blue-100 group"
                  onClick={() => setIsOpen(false)}
                >
                  {/* Background highlight for active/hover state */}
                  {(pathname === item.href || hoveredItem === item.href) && (
                    <motion.div
                      layoutId="activeBackground"
                      className="absolute inset-0 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}

                  {/* Icon with gradient background for active items */}
                  <div
                    className={`
                    flex items-center justify-center w-10 h-10 rounded-full mr-3
                    ${pathname === item.href ? "bg-gradient-to-r from-blue-400 to-blue-500" : "bg-blue-800/30"}
                    transition-colors duration-200
                  `}
                  >
                    <item.icon className={`h-5 w-5 ${pathname === item.href ? "text-white" : "text-blue-300"}`} />
                  </div>

                  <span className={`font-medium ${pathname === item.href ? "text-white" : ""}`}>{item.label}</span>

                  {pathname === item.href && (
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
            ))}

            {/* Menu Question */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + menuItems.length * 0.05 }}
              onHoverStart={() => setHoveredItem(questionMenu.href)}
              onHoverEnd={() => setHoveredItem(null)}
            >
              <Link
                href={questionMenu.href}
                className="relative flex items-center px-4 py-3 my-1 rounded-xl text-blue-100 group"
                onClick={() => setIsOpen(false)}
              >
                {/* Background highlight for active/hover state */}
                {(pathname === questionMenu.href || hoveredItem === questionMenu.href) && (
                  <motion.div
                    layoutId="activeBackground"
                    className="absolute inset-0 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}

                {/* Icon with gradient background for active items */}
                <div
                  className={`
                  flex items-center justify-center w-10 h-10 rounded-full mr-3
                  ${pathname === questionMenu.href ? "bg-gradient-to-r from-blue-400 to-blue-500" : "bg-blue-800/30"}
                  transition-colors duration-200
                `}
                >
                  <questionMenu.icon
                    className={`h-5 w-5 ${pathname === questionMenu.href ? "text-white" : "text-blue-300"}`}
                  />
                </div>

                <span className={`font-medium ${pathname === questionMenu.href ? "text-white" : ""}`}>
                  {questionMenu.label}
                </span>

                {pathname === questionMenu.href && (
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
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-blue-800/30 backdrop-blur-md">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/logout"
                className="flex items-center px-4 py-3 rounded-xl text-blue-100 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20 mr-3">
                  <LogOut className="h-5 w-5 text-red-300" />
                </div>
                <span className="font-medium">Keluar</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

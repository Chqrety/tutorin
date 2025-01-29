"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, MessageSquare, Clock, Settings, LogOut, FileText, Menu, X } from "lucide-react"

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

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Hamburger Menu */}
      <button
        className="md:hidden p-4 focus:outline-none z-50"
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white w-64 shadow-lg transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 md:translate-x-0 md:static md:shadow-none`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <span className="text-2xl font-bold text-blue-600">Doscom Konsultan</span>
          {/* Close button on mobile */}
          <button
            className="md:hidden focus:outline-none"
            onClick={toggleSidebar}
            aria-label="Close Sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
                pathname === item.href ? "bg-gray-100 text-blue-600" : ""
              }`}
              onClick={() => setIsOpen(false)} // Tutup sidebar saat link diklik di mobile
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full">
          <Link
            href="/logout"
            className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600"
            onClick={() => setIsOpen(false)} // Tutup sidebar saat link diklik di mobile
          >
            <LogOut className="h-5 w-5 mr-3" />
            Keluar
          </Link>
        </div>
      </div>
    </>
  )
}

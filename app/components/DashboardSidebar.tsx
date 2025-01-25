"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, MessageSquare, Clock, Settings, LogOut, FileText } from "lucide-react"

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

  return (
    <div className="bg-white w-64 h-full shadow-lg">
      <div className="flex items-center justify-center h-16 border-b">
        <span className="text-2xl font-bold text-blue-600">Doscom Konsultan</span>
      </div>
      <nav className="mt-6">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 ${
              pathname === item.href ? "bg-gray-100 text-blue-600" : ""
            }`}
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
        >
          <LogOut className="h-5 w-5 mr-3" />
          Keluar
        </Link>
      </div>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home, Calendar, Users, Settings, LogOut, FileText, Menu, X,
} from "lucide-react"

const menuItems = [
  { icon: Home,      label: "Dashboard",   href: "/admin/dashboard" },
  { icon: Calendar,  label: "Jadwal",      href: "/admin/dashboard/jadwal" },
  { icon: Calendar,  label: "Konsultasi",  href: "/admin/dashboard/konsultasi" },
  { icon: Users,     label: "Pengguna",    href: "/admin/dashboard/pengguna" },
  { icon: FileText,  label: "Posts",       href: "/admin/dashboard/posts" },
  { icon: Settings,  label: "Pengaturan",  href: "/admin/dashboard/pengaturan" },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()          // ⬅️  gunakan hook
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)

  /* ⬇️  Cek sesi admin sekali saat mount */
  useEffect(() => {
    if (!sessionStorage.getItem("adminSession")) {
      router.replace("/admin/login")
    }
  }, [router])

  /* ⬇️  Handler logout */
  const handleLogout = () => {
    sessionStorage.removeItem("adminSession")   // hapus sesi yg benar
    router.replace("/admin/login")              // redirect
  }

  return (
    <>
      {/* Hamburger */}
      <button className="md:hidden p-4" onClick={toggleSidebar} aria-label="Toggle Sidebar">
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black opacity-50 z-40 md:hidden" onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          transition-transform duration-300 ease-in-out z-50
          md:translate-x-0 md:static md:shadow-none`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <span className="text-2xl font-bold text-blue-600">Admin Panel</span>
          <button className="md:hidden" onClick={toggleSidebar} aria-label="Close Sidebar">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600
                ${pathname === item.href ? "bg-gray-100 text-blue-600" : ""}`}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Tombol Keluar */}
        <button
          onClick={handleLogout}
          className="absolute bottom-0 flex w-full items-center px-6 py-3 text-gray-600
                     hover:bg-gray-100 hover:text-blue-600"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Keluar
        </button>
      </aside>
    </>
  )
}

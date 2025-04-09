"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react" // Ikon Menu dan Close dari Lucide React
import { Button } from "@/components/ui/button"

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-90 shadow-md"
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Doscom Konsultan
          </Link>

          {/* Menu Desktop */}
          <ul className="hidden md:flex space-x-6 items-center">
            <li>
              <Link
                href="#layanan"
                className="hover:text-blue-600 transition-colors"
              >
                Layanan
              </Link>
            </li>
            <li>
              <Link
                href="#testimoni"
                className="hover:text-blue-600 transition-colors"
              >
                Testimoni
              </Link>
            </li>
            <li>
              <Link
                href="#faq"
                className="hover:text-blue-600 transition-colors"
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                href="#kontak"
                className="hover:text-blue-600 transition-colors"
              >
                Kontak
              </Link>
            </li>
            <li>
              <Link href={"login"}>
                <Button>Login</Button>
              </Link>
            </li>
          </ul>

          {/* Menu Burger (Mobile) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden focus:outline-none"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Menu Mobile */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={
            isOpen ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }
          }
          transition={{ duration: 0.3 }}
          className={`md:hidden overflow-hidden ${isOpen ? "block" : "hidden"}`}
        >
          <ul className="flex flex-col space-y-4 mt-4 bg-white p-4 shadow-lg rounded-lg">
            <li>
              <Link
                href="#layanan"
                className="block text-center py-2 hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                Layanan
              </Link>
            </li>
            <li>
              <Link
                href="#testimoni"
                className="block text-center py-2 hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                Testimoni
              </Link>
            </li>
            <li>
              <Link
                href="#faq"
                className="block text-center py-2 hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                href="#kontak"
                className="block text-center py-2 hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                Kontak
              </Link>
            </li>
            <li>
              <Link href={"login"}>
                <Button>Login</Button>
              </Link>
            </li>
          </ul>
        </motion.div>
      </nav>
    </motion.header>
  )
}

export default Header

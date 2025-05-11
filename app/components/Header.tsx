"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Droplets, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "py-3 backdrop-blur-lg bg-white/10 shadow-lg border-b border-white/10"
          : "py-5 backdrop-blur-sm bg-transparent"
      }`}
    >
      <nav className="container mx-auto px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg mr-2 shadow-md group-hover:shadow-blue-500/20 transition-all duration-300">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <motion.span
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Doscom Konsultan
            </motion.span>
          </Link>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            <ul className="flex space-x-1 items-center mr-4">
              {["Layanan", "Testimoni", "FAQ", "Kontak"].map((item, index) => (
                <motion.li key={item} whileHover={{ y: -2 }}>
                  <Link
                    href={`#${item.toLowerCase()}`}
                    className="px-4 py-2 rounded-full text-blue-50 hover:bg-white/10 transition-all duration-200 flex items-center"
                  >
                    {item}
                    <ChevronDown className="ml-1 w-4 h-4 opacity-70" />
                  </Link>
                </motion.li>
              ))}
            </ul>

            <Link href="/login">
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30 shadow-md hover:shadow-blue-500/20 transition-all duration-300">
                Login
              </Button>
            </Link>
          </div>

          {/* Menu Burger (Mobile) */}
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden focus:outline-none bg-blue-500/20 p-2 rounded-lg backdrop-blur-md border border-blue-400/20"
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} className="text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={24} className="text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Menu Mobile */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden mt-4"
            >
              <motion.ul
                className="flex flex-col space-y-2 backdrop-blur-xl bg-blue-900/30 p-4 rounded-2xl border border-white/10 shadow-xl"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
                initial="hidden"
                animate="show"
              >
                {["Layanan", "Testimoni", "FAQ", "Kontak"].map((item, index) => (
                  <motion.li
                    key={item}
                    variants={{
                      hidden: { opacity: 0, y: -10 },
                      show: { opacity: 1, y: 0 },
                    }}
                  >
                    <Link
                      href={`#${item.toLowerCase()}`}
                      className="block text-center py-3 px-4 rounded-xl text-blue-50 hover:bg-blue-700/30 transition-all"
                      onClick={() => setIsOpen(false)}
                    >
                      {item}
                    </Link>
                  </motion.li>
                ))}
                <motion.li
                  variants={{
                    hidden: { opacity: 0, y: -10 },
                    show: { opacity: 1, y: 0 },
                  }}
                  className="pt-2"
                >
                  <Link href="/login" onClick={() => setIsOpen(false)} className="block">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30">
                      Login
                    </Button>
                  </Link>
                </motion.li>
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}

export default Header

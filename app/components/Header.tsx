import Link from "next/link"
import { motion } from "framer-motion"

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-90 shadow-md"
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            KampusKarirKu
          </Link>
          <ul className="flex space-x-6">
            <li>
              <Link href="#layanan" className="hover:text-blue-600 transition-colors">
                Layanan
              </Link>
            </li>
            <li>
              <Link href="#testimoni" className="hover:text-blue-600 transition-colors">
                Testimoni
              </Link>
            </li>
            <li>
              <Link href="#faq" className="hover:text-blue-600 transition-colors">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="#kontak" className="hover:text-blue-600 transition-colors">
                Kontak
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </motion.header>
  )
}

export default Header


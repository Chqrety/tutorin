import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Doscom Konsultan</h3>
            <p className="mb-4">Temukan dan kembangkan potensi terbaikmu bersama kami.</p>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-blue-400 transition-colors">
                <Facebook />
              </Link>
              <Link href="#" className="hover:text-blue-400 transition-colors">
                <Twitter />
              </Link>
              <Link href="#" className="hover:text-blue-400 transition-colors">
                <Instagram />
              </Link>
              <Link href="#" className="hover:text-blue-400 transition-colors">
                <Linkedin />
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-xl font-semibold mb-4">Tautan Cepat</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">
                  Layanan
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">
                  Testimoni
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-semibold mb-4">Hubungi Kami</h4>
            <p>Jl. Imam Bonjol Udinus. 123</p>
            <p>Semarang, Indonesia 12345</p>
            <p>Email: Doscomkonsultan@gmail.com</p>
            <p>Telepon: +62-882-2508-9622</p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p>&copy; 2025 Doscom Konsultan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer


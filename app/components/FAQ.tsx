"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { ChevronDown, MessageCircle, HelpCircle, Search, Plus, Minus } from "lucide-react"

const faqs = [
  {
    question: "Apakah layanan ini gratis untuk mahasiswa?",
    answer:
      "Ya, layanan dasar kami gratis untuk semua mahasiswa. Namun, ada beberapa layanan premium yang memerlukan biaya tambahan. Kami menawarkan paket khusus dengan harga terjangkau untuk mahasiswa yang membutuhkan konsultasi lebih mendalam atau pelatihan khusus.",
    category: "Biaya",
  },
  {
    question: "Berapa lama proses konsultasi berlangsung?",
    answer:
      "Proses konsultasi biasanya berlangsung sekitar 1-2 jam, tergantung pada kebutuhan individu. Untuk konsultasi pertama, kami menyarankan untuk menyediakan waktu hingga 90 menit agar konselor dapat memahami kebutuhan Anda dengan baik dan memberikan saran yang tepat sasaran.",
    category: "Konsultasi",
  },
  {
    question: "Apakah saya bisa mendapatkan sertifikat setelah mengikuti pelatihan?",
    answer:
      "Ya, kami menyediakan sertifikat digital untuk setiap pelatihan yang Anda ikuti di platform kami. Sertifikat ini dapat diunduh langsung dari akun Anda dan dapat ditambahkan ke CV atau profil LinkedIn Anda untuk meningkatkan kredibilitas profesional Anda.",
    category: "Pelatihan",
  },
  {
    question: "Bagaimana cara mendaftar untuk sesi mentoring?",
    answer:
      "Anda dapat mendaftar untuk sesi mentoring melalui dashboard akun Anda setelah login ke platform kami. Pilih menu 'Mentoring', kemudian pilih mentor yang sesuai dengan kebutuhan Anda, dan jadwalkan sesi pada waktu yang tersedia. Anda akan menerima konfirmasi melalui email beserta tautan untuk bergabung dengan sesi mentoring.",
    category: "Mentoring",
  },
  {
    question: "Apakah konsultasi bisa dilakukan secara online?",
    answer:
      "Ya, semua konsultasi dapat dilakukan secara online melalui platform video conference kami yang aman dan nyaman. Anda dapat mengakses konsultasi dari mana saja dengan koneksi internet yang stabil. Kami juga menyediakan opsi konsultasi melalui chat untuk situasi di mana video call tidak memungkinkan.",
    category: "Konsultasi",
  },
  {
    question: "Bagaimana kerahasiaan data saya dijamin?",
    answer:
      "Kami menjamin kerahasiaan semua data dan informasi yang Anda berikan. Platform kami menggunakan enkripsi end-to-end untuk semua komunikasi, dan kami memiliki kebijakan privasi yang ketat yang melarang pembagian informasi pribadi Anda kepada pihak ketiga tanpa persetujuan Anda.",
    category: "Privasi",
  },
]

const categories = [...new Set(faqs.map((faq) => faq.category))]

interface FAQItemProps {
  question: string;
  answer: string;
  category: string;
  isOpen: boolean;
  toggleOpen: () => void;
  index: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, category, isOpen, toggleOpen, index }) => {
  const [faqRef, faqInView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  })

  return (
    <motion.div
      ref={faqRef}
      initial={{ opacity: 0, y: 20 }}
      animate={faqInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`backdrop-blur-md rounded-2xl overflow-hidden border transition-all duration-300 mb-4 ${
        isOpen
          ? "bg-white/15 border-white/20 shadow-lg shadow-blue-500/10"
          : "bg-white/10 border-white/10 hover:bg-white/15"
      }`}
    >
      <div className="relative">
        {/* Category badge */}
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-200 backdrop-blur-sm border border-blue-400/20">
            {category}
          </span>
        </div>

        <button
          className="flex justify-between items-center w-full text-left p-6 pr-24"
          onClick={toggleOpen}
          aria-expanded={isOpen}
        >
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 transition-colors ${
                isOpen ? "bg-blue-500 text-white" : "bg-blue-500/20 text-blue-300"
              }`}
            >
              {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <h3 className="font-medium text-lg text-white">{question}</h3>
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="px-6 pb-6"
            >
              <div className="pl-12 pr-4 text-blue-100/80 leading-relaxed">{answer}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("Semua")
  const [sectionRef, sectionInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  interface FAQToggleProps {
    index: number | null;
  }

  const toggleFAQ = (index: number): void => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "Semua" || faq.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <section id="faq" className="py-24 relative overflow-hidden bg-gradient-to-b from-blue-900 to-blue-950">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-950/50 to-transparent"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl"></div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-1/3 left-10 w-16 h-16 rounded-full border border-blue-400/20 backdrop-blur-sm"
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

      <div ref={sectionRef} className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={sectionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 px-6 py-2 rounded-full bg-blue-500/10 backdrop-blur-sm border border-blue-400/20"
          >
            <span className="text-blue-200 font-medium">Bantuan</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={sectionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
          >
            Pertanyaan yang Sering Diajukan
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={sectionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-blue-100/80 text-lg"
          >
            Temukan jawaban untuk pertanyaan umum tentang layanan konsultasi kami
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Search and filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={sectionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search input */}
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  type="text"
                  placeholder="Cari pertanyaan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Category filter */}
              <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 md:justify-end">
                <button
                  onClick={() => setActiveCategory("Semua")}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    activeCategory === "Semua"
                      ? "bg-blue-500 text-white"
                      : "bg-blue-500/20 text-blue-200 hover:bg-blue-500/30"
                  }`}
                >
                  Semua
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                      activeCategory === category
                        ? "bg-blue-500 text-white"
                        : "bg-blue-500/20 text-blue-200 hover:bg-blue-500/30"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* FAQ items */}
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  {...faq}
                  isOpen={openIndex === index}
                  toggleOpen={() => toggleFAQ(index)}
                  index={index}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 backdrop-blur-md bg-white/5 rounded-2xl border border-white/10"
              >
                <HelpCircle className="w-12 h-12 text-blue-300/50 mx-auto mb-4" />
                <p className="text-blue-100">
                  Tidak ada pertanyaan yang cocok dengan pencarian Anda. Coba kata kunci lain atau{" "}
                  <a href="#kontak" className="text-blue-300 underline">
                    hubungi kami
                  </a>{" "}
                  untuk bantuan lebih lanjut.
                </p>
              </motion.div>
            )}
          </div>

          {/* Still have questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={sectionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8">
              <MessageCircle className="w-12 h-12 text-blue-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Masih Punya Pertanyaan?</h3>
              <p className="text-blue-100/80 mb-6 max-w-lg mx-auto">
                Jika Anda tidak menemukan jawaban yang Anda cari, jangan ragu untuk menghubungi tim dukungan kami.
              </p>
              <a
                href="#kontak"
                className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              >
                Hubungi Kami
                <ChevronDown className="ml-2 w-5 h-5 rotate-270" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default FAQ

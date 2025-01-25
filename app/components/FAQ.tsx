import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"

const faqs = [
  {
    question: "Apakah layanan ini gratis untuk mahasiswa?",
    answer:
      "Ya, layanan dasar kami gratis untuk semua mahasiswa. Namun, ada beberapa layanan premium yang memerlukan biaya tambahan.",
  },
  {
    question: "Berapa lama proses konsultasi berlangsung?",
    answer: "Proses konsultasi biasanya berlangsung sekitar 1-2 jam, tergantung pada kebutuhan individu.",
  },
  {
    question: "Apakah saya bisa mendapatkan sertifikat setelah mengikuti pelatihan?",
    answer: "Ya, kami menyediakan sertifikat untuk setiap pelatihan yang Anda ikuti di platform kami.",
  },
  {
    question: "Bagaimana cara mendaftar untuk sesi mentoring?",
    answer: "Anda dapat mendaftar untuk sesi mentoring melalui dashboard akun Anda setelah login ke platform kami.",
  },
]

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-200 py-4">
      <button className="flex justify-between items-center w-full text-left" onClick={() => setIsOpen(!isOpen)}>
        <span className="font-semibold">{question}</span>
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 text-gray-600"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const FAQ = () => {
  return (
    <section id="faq" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12">Pertanyaan yang Sering Diajukan</h2>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <FAQItem key={index} {...faq} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ


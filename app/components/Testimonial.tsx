import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

const testimonials = [
  {
    name: "Andi Pratama",
    role: "Mahasiswa Teknik Informatika",
    content:
      "KampusKarirKu membantu saya menemukan passion saya dalam pengembangan software. Sekarang saya sudah mendapatkan pekerjaan impian saya!",
  },
  {
    name: "Siti Nurhayati",
    role: "Mahasiswa Manajemen",
    content:
      "Berkat konsultasi di KampusKarirKu, saya bisa menentukan jalur karir yang sesuai dengan minat dan bakat saya. Terima kasih!",
  },
  {
    name: "Budi Santoso",
    role: "Fresh Graduate Psikologi",
    content:
      "Program mentoring di KampusKarirKu sangat membantu saya dalam mempersiapkan diri memasuki dunia kerja. Sangat direkomendasikan!",
  },
]

const TestimonialCard = ({ name, role, content }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <p className="text-gray-600 mb-4">{content}</p>
      <div className="font-semibold">{name}</div>
      <div className="text-sm text-gray-500">{role}</div>
    </motion.div>
  )
}

const Testimonial = () => {
  return (
    <section id="testimoni" className="py-20 bg-blue-50">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12">Apa Kata Mereka?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonial


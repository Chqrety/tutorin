import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

const CTA = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section ref={ref} className="py-20 bg-blue-600">
      <div className="container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold text-white mb-6">Siap Meraih Karir Impianmu?</h2>
          <p className="text-xl text-white mb-8">
            Mulai perjalanan karirmu bersama TUTORIN dan wujudkan potensimu!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full"
          >
            Daftar Sekarang
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA


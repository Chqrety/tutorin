"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Image from "next/image"

export default function About() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section ref={ref} className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="md:w-1/2 mb-8 md:mb-0"
          >
            <Image
              src="/about-image.jpg"
              alt="Tentang KampusKarirKu"
              width={500}
              height={500}
              className="rounded-lg shadow-lg"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:w-1/2 md:pl-12"
          >
            <h2 className="text-3xl font-bold mb-4">Tentang KampusKarirKu</h2>
            <p className="text-xl text-gray-600 mb-6">
              KampusKarirKu adalah platform konsultasi karir yang didedikasikan untuk membantu mahasiswa menemukan dan
              mengembangkan potensi terbaik mereka. Kami menghubungkan mahasiswa dengan konselor profesional dan
              menyediakan sumber daya yang diperlukan untuk merencanakan karir yang sukses.
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>✓ Konsultasi one-on-one dengan ahli karir</li>
              <li>✓ Tes minat dan bakat terakreditasi</li>
              <li>✓ Akses ke sumber daya karir eksklusif</li>
              <li>✓ Komunitas pendukung sesama mahasiswa</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


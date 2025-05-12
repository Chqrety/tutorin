"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Image from "next/image"
import { ArrowRight, Sparkles, Users, BookOpen } from "lucide-react"

export default function Hero() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0.6, 1, 1, 0.6])

  return (
    <section
      ref={containerRef}
      className="py-24 relative overflow-hidden bg-gradient-to-b from-blue-900 to-blue-950 min-h-screen flex items-center"
    >
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-950/50 to-transparent"></div>
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl"></div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-1/4 right-10 w-20 h-20 rounded-full border border-blue-400/20 backdrop-blur-sm"
        style={{ y, opacity }}
      />

      <motion.div
        className="absolute bottom-1/4 left-10 w-12 h-12 rounded-full border border-blue-400/20 backdrop-blur-sm"
        animate={{
          y: [0, -15, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
      />

      <div ref={ref} className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="order-2 lg:order-1"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="inline-block mb-4 px-6 py-2 rounded-full bg-blue-500/10 backdrop-blur-sm border border-blue-400/20"
            >
              <span className="text-blue-200 font-medium flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                Platform Konsultasi Karir
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
            >
              TUTORIN
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-blue-100/80 text-xl mb-8 max-w-lg"
            >
              Temukan potensi terbaik dan jalur karir yang tepat untuk masa depan Anda bersama konsultan profesional
              kami.
            </motion.p>

            <div className="flex flex-wrap gap-4">
              <motion.a
                href="#layanan"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Mulai Konsultasi
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                  }}
                >
                  <ArrowRight className="ml-2 w-5 h-5" />
                </motion.span>
              </motion.a>

              <motion.a
                href="#tentang"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="inline-flex items-center px-6 py-3 rounded-full backdrop-blur-sm bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Pelajari Lebih Lanjut
              </motion.a>
            </div>

            {/* Stats */}
            <motion.div
              className="flex flex-wrap gap-6 mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/20 flex items-center justify-center mr-3">
                  <Users className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">1000+</div>
                  <div className="text-blue-200 text-sm">Mahasiswa Terbantu</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full backdrop-blur-md bg-white/10 border border-white/20 flex items-center justify-center mr-3">
                  <BookOpen className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-blue-200 text-sm">Program Karir</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right side: Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="order-1 lg:order-2"
          >
            <div className="relative">
              {/* Main image with glass effect */}
              <motion.div
                className="rounded-3xl overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 p-3"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                  <Image
                    src="/hero.png?height=600&width=800"
                    alt="Konsultasi Karir Mahasiswa"
                    width={800}
                    height={600}
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 to-transparent"></div>

                  {/* Image caption */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white text-xl font-bold">Konsultasi Karir Profesional</h3>
                    <p className="text-blue-100/80 text-sm">Bimbingan personal untuk masa depan cerah</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating card */}
              <motion.div
                className="absolute -bottom-10 -right-10 w-64 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 p-4 shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                    <Sparkles className="w-5 h-5 text-blue-300" />
                  </div>
                  <div className="text-white font-medium">Temukan Potensimu</div>
                </div>
                <p className="text-blue-100/80 text-sm">
                  Kami membantu Anda menemukan jalur karir yang sesuai dengan minat dan bakat Anda
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

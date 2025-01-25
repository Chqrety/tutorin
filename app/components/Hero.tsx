"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const generateParticles = (count: number) => {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: Math.random() * 4 + 2,
  }))
}

const Hero = () => {
  const [particles, setParticles] = useState<{ x: number; y: number; size: number }[]>([])

  useEffect(() => {
    setParticles(generateParticles(50))
  }, [])

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="absolute inset-0">
        {particles.map((particle, index) => (
          <motion.div
            key={index}
            className="absolute bg-white rounded-full"
            style={{
              left: `${particle.x * 100}%`,
              top: `${particle.y * 100}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 2 + 3,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
            }}
          />
        ))}
      </div>
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.h1
            className="text-5xl md:text-6xl font-bold text-white mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Temukan Potensi Terbaikmu
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-white mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Konsultasi minat bakat khusus mahasiswa untuk meraih karir impianmu
          </motion.p>
          <Link href="/daftar">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full inline-flex items-center"
            >
              Mulai Sekarang <ArrowRight className="ml-2" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero


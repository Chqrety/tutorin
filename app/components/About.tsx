"use client"

import React from "react"

import { useState, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Image from "next/image"
import { Users, Award, BookOpen, BarChart3, CheckCircle, ArrowRight } from "lucide-react"

export default function About() {
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

  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    {
      icon: Users,
      title: "Tim Kami",
      content:
        "Tim kami terdiri dari konselor karir berpengalaman, psikolog, dan profesional industri yang berkomitmen membantu mahasiswa menemukan jalur karir terbaik mereka.",
    },
    {
      icon: Award,
      title: "Misi Kami",
      content:
        "Misi kami adalah memberdayakan mahasiswa dengan wawasan, alat, dan dukungan yang mereka butuhkan untuk membuat keputusan karir yang tepat dan mencapai potensi penuh mereka.",
    },
    {
      icon: BookOpen,
      title: "Pendekatan",
      content:
        "Pendekatan kami berfokus pada penilaian individual, konsultasi personal, dan rencana pengembangan yang disesuaikan untuk memenuhi kebutuhan unik setiap mahasiswa.",
    },
  ]

  const benefits = [
    "Konsultasi one-on-one dengan ahli karir",
    "Tes minat dan bakat terakreditasi",
    "Akses ke sumber daya karir eksklusif",
    "Komunitas pendukung sesama mahasiswa",
    "Jaringan dengan profesional industri",
    "Workshop pengembangan keterampilan",
  ]

  return (
    <section ref={containerRef} className="py-24 relative overflow-hidden bg-gradient-to-b from-blue-900 to-blue-950">
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
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 px-6 py-2 rounded-full bg-blue-500/10 backdrop-blur-sm border border-blue-400/20"
          >
            <span className="text-blue-200 font-medium">Tentang Kami</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
          >
         TUTORIN
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-blue-100/80 text-lg"
          >
            Platform konsultasi karir yang didedikasikan untuk membantu mahasiswa menemukan dan mengembangkan potensi
            terbaik mereka
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side: Image and stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
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
                    src="/DSCF1198-2.JPG?height=600&width=800"
                    alt="Doscom Konsultan Team"
                    width={800}
                    height={600}
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 to-transparent"></div>

                  {/* Image caption */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white text-xl font-bold">Tim Profesional Kami</h3>
                    <p className="text-blue-100/80 text-sm">Konselor berpengalaman siap membantu Anda</p>
                  </div>
                </div>
              </motion.div>

              {/* Stats cards */}
              <motion.div
                className="absolute -bottom-10 -right-10 w-40 h-40 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 p-4 flex flex-col items-center justify-center shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <BarChart3 className="w-8 h-8 text-blue-300 mb-2" />
                <span className="text-3xl font-bold text-white">95%</span>
                <span className="text-blue-200 text-sm text-center">Tingkat Kepuasan Klien</span>
              </motion.div>

              <motion.div
                className="absolute -top-8 -left-8 w-36 h-36 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 p-4 flex flex-col items-center justify-center shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Users className="w-8 h-8 text-blue-300 mb-2" />
                <span className="text-3xl font-bold text-white">1000+</span>
                <span className="text-blue-200 text-sm text-center">Mahasiswa Terbantu</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Right side: Content tabs */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* Tab navigation */}
            <div className="flex space-x-2 mb-6">
              {tabs.map((tab, index) => (
                <motion.button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`flex items-center px-4 py-2 rounded-full backdrop-blur-sm border transition-all ${
                    activeTab === index
                      ? "bg-blue-500/20 border-blue-400/30 text-white"
                      : "bg-white/5 border-white/10 text-blue-200 hover:bg-white/10"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <tab.icon className={`w-4 h-4 mr-2 ${activeTab === index ? "text-blue-300" : "text-blue-400/70"}`} />
                  <span>{tab.title}</span>
                </motion.button>
              ))}
            </div>

            {/* Tab content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8 mb-8"
            >
              <div className="flex items-start mb-4">
                {React.createElement(tabs[activeTab].icon, { className: "w-10 h-10 text-blue-400 mr-4" })}
                <h3 className="text-2xl font-bold text-white">{tabs[activeTab].title}</h3>
              </div>
              <p className="text-blue-100/80 text-lg">{tabs[activeTab].content}</p>
            </motion.div>

            {/* Benefits list */}
            <h3 className="text-xl font-bold text-white mb-4">Yang Kami Tawarkan:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className="flex items-start"
                >
                  <CheckCircle className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-blue-100/90">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <a
                href="#kontak"
                className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              >
                Hubungi Kami
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
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

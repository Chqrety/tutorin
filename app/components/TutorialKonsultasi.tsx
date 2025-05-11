"use client"

import React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, MessageCircle, Video, CheckCircle, ChevronRight } from "lucide-react"

const steps = [
  {
    title: "Daftar dan Isi Profil",
    description: "Lengkapi profil Anda dengan informasi akademik dan minat karir.",
    icon: FileText,
    color: "from-blue-400 to-cyan-400",
    details: [
      "Buat akun dengan email atau media sosial",
      "Isi data pendidikan dan pengalaman",
      "Tentukan minat dan tujuan karir Anda",
    ],
  },
  {
    title: "Pilih Konselor",
    description: "Pilih konselor yang sesuai dengan kebutuhan dan minat Anda.",
    icon: MessageCircle,
    color: "from-indigo-400 to-purple-400",
    details: [
      "Lihat profil dan spesialisasi konselor",
      "Baca ulasan dari pengguna lain",
      "Pilih berdasarkan kecocokan dengan kebutuhan Anda",
    ],
  },
  {
    title: "Jadwalkan Konsultasi",
    description: "Tentukan waktu yang tepat untuk sesi konsultasi Anda.",
    icon: Video,
    color: "from-blue-500 to-blue-600",
    details: [
      "Pilih jadwal yang tersedia",
      "Tentukan metode konsultasi (video/chat)",
      "Dapatkan pengingat otomatis sebelum sesi",
    ],
  },
]

export default function TutorialKonsultasi() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const [activeStep, setActiveStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleNextStep = () => {
    if (isAnimating) return

    setIsAnimating(true)
    setTimeout(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
      setIsAnimating(false)
    }, 500)
  }

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-blue-950 to-blue-900">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-900/20 to-transparent"></div>
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-40 left-20 w-16 h-16 rounded-full border border-blue-400/20 backdrop-blur-sm"
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

      <div className="container mx-auto px-6 relative z-10">
        <div ref={ref} className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 px-6 py-2 rounded-full bg-blue-500/10 backdrop-blur-sm border border-blue-400/20"
          >
            <span className="text-blue-200 font-medium">Panduan Langkah demi Langkah</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
          >
            Cara Memulai Konsultasi
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-blue-100/80 text-lg"
          >
            Ikuti langkah-langkah sederhana ini untuk memulai perjalanan karir Anda
          </motion.p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative mb-16 px-10"
          >
            <div className="h-1 bg-blue-800/50 rounded-full">
              <motion.div
                className="h-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex justify-between absolute w-full top-0 left-0 transform -translate-y-1/2">
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  className={`flex flex-col items-center cursor-pointer`}
                  onClick={() => setActiveStep(idx)}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      idx <= activeStep
                        ? "bg-gradient-to-r from-blue-400 to-blue-500 border-blue-300"
                        : "bg-blue-900/50 border-blue-700"
                    }`}
                    animate={
                      idx === activeStep
                        ? {
                            scale: [1, 1.2, 1],
                            boxShadow: [
                              "0 0 0 rgba(59, 130, 246, 0)",
                              "0 0 20px rgba(59, 130, 246, 0.5)",
                              "0 0 0 rgba(59, 130, 246, 0)",
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                  >
                    {idx < activeStep ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white font-medium">{idx + 1}</span>
                    )}
                  </motion.div>
                  <motion.span
                    className={`text-sm mt-2 font-medium ${idx <= activeStep ? "text-blue-300" : "text-blue-500/50"}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                  >
                    {step.title.split(" ")[0]}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Main content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left side: Step visualization */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 p-8 flex items-center justify-center relative">
                {/* Animated background */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    className={`absolute w-80 h-80 rounded-full bg-gradient-to-r ${steps[activeStep].color} filter blur-3xl opacity-20`}
                    animate={{
                      x: [0, 10, 0],
                      y: [0, 15, 0],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  />
                </div>

                {/* Step icon */}
                <motion.div
                  key={activeStep}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`w-32 h-32 rounded-full bg-gradient-to-br ${steps[activeStep].color} flex items-center justify-center shadow-lg`}
                >
                  {React.createElement(steps[activeStep].icon, { className: "w-16 h-16 text-white" })}
                </motion.div>

                {/* Step number */}
                <div className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <span className="text-white font-bold text-xl">{activeStep + 1}</span>
                </div>
              </div>
            </motion.div>

            {/* Right side: Step details */}
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.5 }}
              className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8"
            >
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-white mb-3"
              >
                {steps[activeStep].title}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-blue-100/80 mb-6"
              >
                {steps[activeStep].description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-4 mb-8"
              >
                {steps[activeStep].details.map((detail, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="flex items-start"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-blue-100/90">{detail}</span>
                  </motion.div>
                ))}
              </motion.div>

              <div className="flex justify-between items-center">
                <span className="text-blue-300 text-sm">
                  Langkah {activeStep + 1} dari {steps.length}
                </span>

                <Button
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30 shadow-lg"
                >
                  {activeStep < steps.length - 1 ? (
                    <>
                      Langkah Berikutnya
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Mulai Sekarang
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center mt-16"
          >
            <a
              href="#daftar"
              className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
            >
              Daftar dan Mulai Konsultasi
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
        </div>
      </div>
    </section>
  )
}

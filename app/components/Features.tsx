"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Lightbulb, Target, Users, BookOpen, ArrowRight, CheckCircle } from "lucide-react"

const features = [
  {
    icon: Lightbulb,
    title: "Tes Minat Bakat",
    description: "Kenali potensi dirimu melalui tes minat bakat yang dirancang khusus untuk mahasiswa",
    color: "from-blue-400 to-cyan-300",
    benefits: [
      "Analisis mendalam tentang kekuatan dan kelemahan",
      "Rekomendasi karir berdasarkan hasil tes",
      "Laporan detail yang mudah dipahami",
    ],
  },
  {
    icon: Target,
    title: "Konsultasi Karir",
    description: "Dapatkan saran karir yang sesuai dengan jurusan dan minatmu",
    color: "from-indigo-400 to-purple-400",
    benefits: [
      "Konsultasi one-on-one dengan pakar karir",
      "Pemetaan jalur karir yang sesuai",
      "Strategi pengembangan profesional",
    ],
  },
  {
    icon: Users,
    title: "Mentoring",
    description: "Bimbingan langsung dari para profesional dan alumni sukses",
    color: "from-blue-500 to-blue-600",
    benefits: [
      "Akses ke jaringan mentor profesional",
      "Sesi mentoring reguler dan terstruktur",
      "Insight industri dari praktisi berpengalaman",
    ],
  },
  {
    icon: BookOpen,
    title: "Pelatihan Skill",
    description: "Akses ke berbagai pelatihan untuk meningkatkan soft skill dan hard skill",
    color: "from-sky-400 to-blue-500",
    benefits: [
      "Workshop interaktif dengan sertifikasi",
      "Kurikulum yang disesuaikan dengan kebutuhan industri",
      "Praktik langsung dengan studi kasus nyata",
    ],
  },
]

import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  benefits: string[];
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, color, benefits, index, isActive, onClick }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <motion.div
        className={`h-full rounded-2xl backdrop-blur-md border border-white/20 overflow-hidden transition-all duration-300 ${
          isActive ? "bg-white/15 shadow-lg shadow-blue-500/10 scale-105 z-10" : "bg-white/10 hover:bg-white/15"
        }`}
        whileHover={{ y: -5 }}
        layout
      >
        <div className="p-6">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-blue-100/80 mb-4">{description}</p>

          <motion.div className="flex items-center text-blue-300 font-medium" animate={{ x: isActive ? 5 : 0 }}>
            <span>Pelajari Lebih Lanjut</span>
            <ArrowRight className="ml-2 w-4 h-4" />
          </motion.div>
        </div>

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-6 pb-6"
            >
              <div className="pt-4 border-t border-white/10">
                <h4 className="font-medium text-white mb-3">Manfaat:</h4>
                <ul className="space-y-2">
                  {benefits.map((benefit, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start"
                    >
                      <CheckCircle className="w-5 h-5 text-blue-300 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-blue-100/90 text-sm">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

const Features = () => {
  const [activeFeature, setActiveFeature] = useState<number | null>(null)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const handleFeatureClick = (index: number) => {
    setActiveFeature(activeFeature === index ? null : index)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <section id="layanan" className="py-24 relative overflow-hidden bg-gradient-to-b from-blue-900 to-blue-950">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-800/20 to-transparent"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl"></div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-20 right-20 w-20 h-20 rounded-full border border-blue-400/20 backdrop-blur-sm"
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

      <motion.div
        className="absolute bottom-40 left-20 w-10 h-10 rounded-full border border-blue-400/20 backdrop-blur-sm"
        animate={{
          y: [0, 15, 0],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          delay: 1,
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 px-6 py-2 rounded-full bg-blue-500/10 backdrop-blur-sm border border-blue-400/20"
          >
            <span className="text-blue-200 font-medium">Layanan Unggulan</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
          >
            Layanan Kami
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-blue-100/80 text-lg"
          >
            Kami menyediakan berbagai layanan untuk membantu kamu menemukan dan mengembangkan potensi terbaikmu
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              {...feature}
              index={index}
              isActive={activeFeature === index}
              onClick={() => handleFeatureClick(index)}
            />
          ))}
        </motion.div>

        {/* Interactive element */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <a
            href="#kontak"
            className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
          >
            Mulai Konsultasi Sekarang
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
    </section>
  )
}

export default Features

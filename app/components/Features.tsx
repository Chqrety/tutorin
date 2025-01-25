"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Lightbulb, Target, Users, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Lightbulb,
    title: "Tes Minat Bakat",
    description: "Kenali potensi dirimu melalui tes minat bakat yang dirancang khusus untuk mahasiswa",
  },
  {
    icon: Target,
    title: "Konsultasi Karir",
    description: "Dapatkan saran karir yang sesuai dengan jurusan dan minatmu",
  },
  {
    icon: Users,
    title: "Mentoring",
    description: "Bimbingan langsung dari para profesional dan alumni sukses",
  },
  {
    icon: BookOpen,
    title: "Pelatihan Skill",
    description: "Akses ke berbagai pelatihan untuk meningkatkan soft skill dan hard skill",
  },
]

const FeatureCard = ({ icon: Icon, title, description }) => {
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
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon className="w-6 h-6 mr-2 text-blue-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const Features = () => {
  return (
    <section id="layanan" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-center mb-12"
        >
          Layanan Kami
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features


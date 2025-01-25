"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Video, FileText, MessageCircle } from "lucide-react"

const steps = [
  {
    title: "Daftar dan Isi Profil",
    description: "Lengkapi profil Anda dengan informasi akademik dan minat karir.",
    icon: FileText,
  },
  {
    title: "Pilih Konselor",
    description: "Pilih konselor yang sesuai dengan kebutuhan dan minat Anda.",
    icon: MessageCircle,
  },
  {
    title: "Jadwalkan Konsultasi",
    description: "Tentukan waktu yang tepat untuk sesi konsultasi Anda.",
    icon: Video,
  },
]

export default function TutorialKonsultasi() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section ref={ref} className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Cara Memulai Konsultasi</h2>
          <p className="text-xl text-gray-600">
            Ikuti langkah-langkah sederhana ini untuk memulai perjalanan karir Anda
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <step.icon className="w-6 h-6 mr-2 text-blue-500" />
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Button size="lg">
            Mulai Sekarang <ArrowRight className="ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}


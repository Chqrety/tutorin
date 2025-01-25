"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send } from "lucide-react"

export default function CommunityJoin() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section ref={ref} className="py-20 bg-blue-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Bergabung dengan Komunitas Kami</h2>
          <p className="text-xl text-gray-600">
            Dapatkan dukungan, berbagi pengalaman, dan perluas jaringan Anda bersama mahasiswa lainnya
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Grup Telegram KampusKarirKu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Bergabunglah dengan lebih dari 5000+ mahasiswa di grup Telegram kami. Dapatkan tips karir, info magang,
                dan kesempatan networking secara eksklusif.
              </p>
              <Button size="lg" className="w-full">
                <Send className="mr-2" /> Gabung Sekarang
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}


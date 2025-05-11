"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase" // Pastikan path benar
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Image from "next/image"
import { Star, ChevronLeft, ChevronRight, Quote, User } from "lucide-react"

// Sample testimonials for preview (will be replaced by actual data from Supabase)
const sampleTestimonials = [
  {
    fullName: "Anisa Wijaya",
    role: "Mahasiswa Teknik Informatika",
    content:
      "Konsultasi dengan Doscom benar-benar membuka mata saya tentang jalur karir yang sesuai dengan minat dan bakat saya. Konselor sangat memahami kebutuhan saya dan memberikan saran yang tepat sasaran.",
    avatarUrl: "/placeholder.svg?height=200&width=200",
    stars: 5,
  },
  {
    fullName: "Budi Santoso",
    role: "Mahasiswa Manajemen Bisnis",
    content:
      "Saya awalnya bingung menentukan arah karir setelah lulus. Berkat bantuan Doscom Konsultan, saya mendapatkan kejelasan dan keyakinan tentang langkah yang harus saya ambil. Sangat direkomendasikan!",
    avatarUrl: "/placeholder.svg?height=200&width=200",
    stars: 4.5,
  },
  {
    fullName: "Citra Lestari",
    role: "Mahasiswa Psikologi",
    content:
      "Tes minat bakat yang diberikan sangat akurat dan membantu saya memahami kekuatan dan kelemahan saya. Konselor juga sangat profesional dan memberikan insight yang berharga untuk pengembangan karir saya.",
    avatarUrl: "/placeholder.svg?height=200&width=200",
    stars: 4.8,
  },
  {
    fullName: "Deni Pratama",
    role: "Mahasiswa Ilmu Komunikasi",
    content:
      "Platform yang luar biasa dengan konselor yang sangat berpengalaman. Mereka tidak hanya membantu saya menemukan jalur karir yang tepat, tetapi juga memberikan strategi konkret untuk mencapainya.",
    avatarUrl: "/placeholder.svg?height=200&width=200",
    stars: 5,
  },
]

const TestimonialCard = ({ fullName, role, content, avatarUrl, stars, index, active }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: active ? 1 : 0.5,
        scale: active ? 1 : 0.9,
        y: active ? 0 : 20,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className={`backdrop-blur-md rounded-2xl overflow-hidden border transition-all duration-300 h-full flex flex-col ${
        active ? "bg-white/15 border-white/20 shadow-lg shadow-blue-500/10 z-10" : "bg-white/10 border-white/10"
      }`}
    >
      <div className="p-8 flex flex-col h-full">
        {/* Quote icon */}
        <div className="mb-6">
          <Quote className="w-10 h-10 text-blue-300/50" />
        </div>

        {/* Testimonial content */}
        <p className="text-blue-100 mb-6 flex-grow text-lg leading-relaxed">"{content}"</p>

        {/* Footer with avatar and info */}
        <div className="flex items-center mt-auto">
          {/* Avatar */}
          {avatarUrl ? (
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-300/30 mr-4">
              <Image
                src={avatarUrl || "/placeholder.svg"}
                alt={fullName}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center mr-4 border-2 border-blue-300/30">
              <User className="w-6 h-6 text-blue-300" />
            </div>
          )}

          <div className="flex-grow">
            <div className="font-semibold text-white">{fullName}</div>
            <div className="text-sm text-blue-200">{role}</div>
          </div>

          {/* Star Rating */}
          <div className="flex flex-col items-end">
            <div className="flex items-center mb-1">
              {[...Array(5)].map((_, i) => {
                const isFull = i < Math.floor(stars)
                const isHalf = i === Math.floor(stars) && stars % 1 !== 0

                return (
                  <div key={i} className="relative w-4 h-4">
                    <Star size={16} className="text-blue-900/30 absolute inset-0" />
                    {isFull && <Star size={16} className="text-yellow-400 absolute inset-0" fill="#facc15" />}
                    {isHalf && (
                      <div className="absolute top-0 left-0 h-full w-1/2 overflow-hidden">
                        <Star size={16} className="text-yellow-400" fill="#facc15" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-xs font-medium text-blue-200">{stars.toFixed(1)}/5</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const Testimonial = () => {
  const [testimonials, setTestimonials] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const carouselRef = useRef(null)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setIsLoading(true)
        // Ambil data ratings + user + profile dalam satu query
        const { data: ratings, error: ratingError } = await supabase.from("ratings").select(`
            stars,
            description,
            user_id,
            users (
              full_name,
              profiles (
                avatar_url
              )
            )
          `)

        if (ratingError) throw ratingError

        // Gabungkan data ratings dengan users & profiles
        const combinedData = ratings.map((rating) => ({
          fullName: rating.users ? rating.users.full_name : "Pengguna Anonim",
          avatarUrl: rating.users && rating.users.profiles ? rating.users.profiles.avatar_url : null,
          role: "Mahasiswa",
          content: rating.description,
          stars: rating.stars || 0, // Pastikan ada nilai stars
        }))

        setTestimonials(combinedData.length > 0 ? combinedData : sampleTestimonials)
      } catch (err) {
        console.error("Error fetching testimonials:", err.message)
        // Fallback to sample data if there's an error
        setTestimonials(sampleTestimonials)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTestimonials()
  }, [])

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      nextTestimonial()
    }, 6000)

    return () => clearInterval(interval)
  }, [testimonials.length])

  // Calculate visible testimonials based on screen size and active index
  const getVisibleTestimonials = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      // Mobile: show only active
      return [testimonials[activeIndex]]
    } else if (typeof window !== "undefined" && window.innerWidth < 1024) {
      // Tablet: show active and next
      return [testimonials[activeIndex], testimonials[(activeIndex + 1) % testimonials.length]]
    } else {
      // Desktop: show 3 testimonials
      return [
        testimonials[activeIndex],
        testimonials[(activeIndex + 1) % testimonials.length],
        testimonials[(activeIndex + 2) % testimonials.length],
      ]
    }
  }

  return (
    <section
      id="testimoni"
      ref={ref}
      className="py-24 relative overflow-hidden bg-gradient-to-b from-blue-950 to-blue-900"
    >
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-900/20 to-transparent"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl"></div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-1/3 right-20 w-16 h-16 rounded-full border border-blue-400/20 backdrop-blur-sm"
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
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4 px-6 py-2 rounded-full bg-blue-500/10 backdrop-blur-sm border border-blue-400/20"
          >
            <span className="text-blue-200 font-medium">Testimoni</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200"
          >
            Apa Kata Mereka?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-blue-100/80 text-lg"
          >
            Pengalaman mahasiswa yang telah menggunakan layanan konsultasi kami
          </motion.p>
        </div>

        {/* Testimonial carousel */}
        <div className="relative max-w-6xl mx-auto" ref={carouselRef}>
          {/* Carousel navigation */}
          <div className="flex justify-between absolute -top-20 right-0 space-x-2 z-20">
            <motion.button
              onClick={prevTestimonial}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={nextTestimonial}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Testimonial cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[400px]">
              {[1, 2, 3].map((_, index) => (
                <div
                  key={index}
                  className="backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 bg-white/10 animate-pulse h-full"
                ></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
              <AnimatePresence>
                {testimonials.length > 0 ? (
                  getVisibleTestimonials().map((testimonial, index) => (
                    <TestimonialCard
                      key={`${activeIndex}-${index}`}
                      {...testimonial}
                      index={index}
                      active={index === 0}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-3 text-center text-blue-200"
                  >
                    Belum ada testimoni.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination indicators */}
          <div className="flex justify-center mt-10 space-x-2">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full ${
                  index === activeIndex ? "bg-blue-400" : "bg-blue-400/30"
                } transition-all duration-300`}
                whileHover={{ scale: 1.2 }}
                animate={index === activeIndex ? { scale: [1, 1.2, 1] } : {}}
                transition={
                  index === activeIndex ? { duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" } : {}
                }
              />
            ))}
          </div>

          {/* Overall rating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <div className="inline-block backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-8 py-4">
              <div className="flex items-center justify-center">
                <div className="flex items-center mr-3">
                  {[1, 2, 3, 4, 5].map((_, index) => (
                    <Star key={index} className="w-5 h-5 text-yellow-400" fill="#facc15" />
                  ))}
                </div>
                <span className="text-white font-medium">
                  {testimonials.length > 0
                    ? (testimonials.reduce((acc, curr) => acc + curr.stars, 0) / testimonials.length).toFixed(1)
                    : "0"}{" "}
                  dari 5 ({testimonials.length} ulasan)
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Testimonial

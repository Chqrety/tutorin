"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import Header from "./components/Header"
import Hero from "./components/Hero"
import Features from "./components/Features"
import TutorialKonsultasi from "./components/TutorialKonsultasi"
import About from "./components/About"

import Testimonial from "./components/Testimonial"
import FAQ from "./components/FAQ"
import CTA from "./components/CTA"
import Footer from "./components/Footer"

export default function Home() {
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <motion.div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url(/background-pattern.svg)",
          backgroundSize: "cover",
          y: backgroundY,
        }}
      />
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <Features />
          <TutorialKonsultasi />
          <About />
        
          <Testimonial />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  )
}


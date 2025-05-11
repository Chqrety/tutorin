"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, HeartHandshake } from "lucide-react"

const Hero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const animationRef = useRef<number>(0)
  const liquidPointsRef = useRef<
    Array<{ x: number; y: number; originX: number; originY: number; dx: number; dy: number }>
  >([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Initialize liquid points in a grid
      initLiquidPoints()
    }

    // Initialize liquid points
    const initLiquidPoints = () => {
      liquidPointsRef.current = []
      const gridSize = 40 // Distance between points
      const width = canvas.width
      const height = canvas.height

      for (let x = 0; x <= width; x += gridSize) {
        for (let y = 0; y <= height; y += gridSize) {
          liquidPointsRef.current.push({
            x: x,
            y: y,
            originX: x,
            originY: y,
            dx: 0,
            dy: 0,
          })
        }
      }
    }

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    // Animation function
    const animate = () => {
      if (!ctx || !canvas) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw liquid effect
      drawLiquid(ctx)

      // Continue animation loop
      animationRef.current = requestAnimationFrame(animate)
    }

    // Draw liquid effect
    const drawLiquid = (ctx: CanvasRenderingContext2D) => {
      const points = liquidPointsRef.current
      const mouse = mousePosition
      const radius = 200 // Influence radius
      const strength = 20 // Distortion strength

      // Update points based on mouse position
      for (let i = 0; i < points.length; i++) {
        const point = points[i]

        // Calculate distance from point to mouse
        const dx = mouse.x - point.originX
        const dy = mouse.y - point.originY
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Apply force based on distance (inverse square law)
        const force = radius / Math.max(distance, 1)

        // Calculate displacement
        if (distance < radius) {
          point.dx = (dx / distance) * force * strength
          point.dy = (dy / distance) * force * strength
        } else {
          // Return to original position
          point.dx *= 0.9
          point.dy *= 0.9
        }

        // Update position with easing
        point.x = point.originX + point.dx
        point.y = point.originY + point.dy
      }

      // Draw metaballs
      ctx.fillStyle = "rgba(30, 64, 175, 0.05)" // Blue color with transparency

      // Draw each point as a circle
      for (let i = 0; i < points.length; i++) {
        const point = points[i]
        ctx.beginPath()
        // Size based on distance to mouse
        const dx = mouse.x - point.originX
        const dy = mouse.y - point.originY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const radius = Math.max(5, 30 * (1 - distance / 300))

        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Connect points with bezier curves for a more liquid look
      ctx.fillStyle = "rgba(59, 130, 246, 0.1)" // Blue color
      ctx.beginPath()

      // Create grid cells and draw bezier curves
      const gridSize = Math.sqrt(points.length)
      for (let y = 0; y < gridSize - 1; y++) {
        for (let x = 0; x < gridSize - 1; x++) {
          const index = y * gridSize + x
          if (index + gridSize + 1 < points.length) {
            const p0 = points[index]
            const p1 = points[index + 1]
            const p2 = points[index + gridSize]
            const p3 = points[index + gridSize + 1]

            // Skip if any point is undefined
            if (!p0 || !p1 || !p2 || !p3) continue

            ctx.moveTo(p0.x, p0.y)
            ctx.bezierCurveTo((p0.x + p1.x) / 2, p0.y, (p0.x + p1.x) / 2, p1.y, p1.x, p1.y)
            ctx.bezierCurveTo(p1.x, (p1.y + p3.y) / 2, p3.x, (p1.y + p3.y) / 2, p3.x, p3.y)
            ctx.bezierCurveTo((p2.x + p3.x) / 2, p3.y, (p2.x + p3.x) / 2, p2.y, p2.x, p2.y)
            ctx.bezierCurveTo(p2.x, (p0.y + p2.y) / 2, p0.x, (p0.y + p2.y) / 2, p0.x, p0.y)
          }
        }
      }
      ctx.fill()
    }

    // Set up event listeners and start animation
    window.addEventListener("resize", resizeCanvas)
    window.addEventListener("mousemove", handleMouseMove)
    resizeCanvas()
    animate()

    // Clean up
    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      {/* Canvas for liquid effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Content container */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center justify-center">
          {/* Glass card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="backdrop-blur-lg bg-white/10 p-8 md:p-12 rounded-3xl border border-white/20 shadow-xl max-w-3xl w-full"
          >
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex justify-center mb-8"
              >
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-4 rounded-full shadow-lg border border-blue-300/30">
                  <HeartHandshake className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              <motion.h1
                className="font-sans text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-cyan-200">
                  Temukan Potensi Terbaikmu
                </span>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl font-light text-blue-100/90 mb-10 max-w-2xl mx-auto leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                Konsultasi minat bakat khusus mahasiswa untuk meraih karir impianmu
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="flex justify-center"
              >
                <Link href="/daftar">
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 0 25px rgba(59, 130, 246, 0.5)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-4 px-10 rounded-full inline-flex items-center border border-blue-400/30 transition-all shadow-lg"
                  >
                    <span className="text-lg">Mulai Sekarang</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "loop",
                        ease: "easeInOut",
                      }}
                    >
                      <ArrowRight className="ml-3 w-5 h-5" />
                    </motion.div>
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Hero

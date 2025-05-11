"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"

interface Bubble {
  id: number
  x: number
  y: number
  size: number
  color: string
  text: string
  vx: number
  vy: number
}

const TechBubbles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const animationRef = useRef<number | null>(null)

  const techTerms = [
    "HTML",
    "CSS",
    "JS",
    "React",
    "Vue",
    "Angular",
    "Node",
    "Python",
    "Java",
    "PHP",
    "SQL",
    "NoSQL",
    "API",
    "Git",
    "AWS",
    "Azure",
    "Docker",
    "Kubernetes",
    "AI",
    "ML",
    "DevOps",
    "UI/UX",
    "Mobile",
    "Cloud",
  ]

  const colors = [
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#10b981", // emerald
    "#f59e0b", // amber
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Initialize bubbles
    const initBubbles = () => {
      const newBubbles: Bubble[] = []
      const count = Math.min(15, Math.floor(canvas.width / 100))

      for (let i = 0; i < count; i++) {
        const size = gsap.utils.random(30, 60)
        newBubbles.push({
          id: i,
          x: gsap.utils.random(size, canvas.width - size),
          y: gsap.utils.random(size, canvas.height - size),
          size,
          color: colors[Math.floor(Math.random() * colors.length)],
          text: techTerms[Math.floor(Math.random() * techTerms.length)],
          vx: gsap.utils.random(-0.5, 0.5),
          vy: gsap.utils.random(-0.5, 0.5),
        })
      }

      setBubbles(newBubbles)
    }

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight

      // Recreate bubbles when canvas is resized
      initBubbles()
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw bubbles
      setBubbles((prevBubbles) => {
        const updatedBubbles = [...prevBubbles]

        updatedBubbles.forEach((bubble) => {
          // Move bubble
          bubble.x += bubble.vx
          bubble.y += bubble.vy

          // Bounce off walls
          if (bubble.x <= bubble.size || bubble.x >= canvas.width - bubble.size) {
            bubble.vx *= -1
          }
          if (bubble.y <= bubble.size || bubble.y >= canvas.height - bubble.size) {
            bubble.vy *= -1
          }

          // Draw bubble
          ctx.beginPath()
          ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
          ctx.fillStyle = bubble.color + "20" // Add transparency
          ctx.fill()
          ctx.strokeStyle = bubble.color + "40"
          ctx.lineWidth = 1
          ctx.stroke()

          // Draw text
          ctx.font = `${bubble.size / 3}px Inter, sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillStyle = bubble.color
          ctx.fillText(bubble.text, bubble.x, bubble.y)
        })

        return updatedBubbles
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute bottom-0 left-0 w-full h-64 pointer-events-none z-0" />
}

export default TechBubbles

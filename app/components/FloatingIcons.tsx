"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { useMediaQuery } from "../../hooks/use-media-query"

const FloatingIcons = () => {
  const iconsContainerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 640px)")

  useEffect(() => {
    if (!iconsContainerRef.current || isMobile) return

    const icons = iconsContainerRef.current.querySelectorAll(".floating-icon")

    icons.forEach((icon) => {
      // Random starting position
      gsap.set(icon, {
        x: gsap.utils.random(-100, 100),
        y: gsap.utils.random(-100, 100),
        rotation: gsap.utils.random(-10, 10),
        opacity: 0,
      })

      // Animate in
      gsap.to(icon, {
        opacity: 0.7,
        duration: 1,
        delay: gsap.utils.random(0, 1),
      })

      // Continuous floating animation
      gsap.to(icon, {
        x: gsap.utils.random(-150, 150),
        y: gsap.utils.random(-150, 150),
        rotation: gsap.utils.random(-15, 15),
        duration: gsap.utils.random(15, 25),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      })
    })

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const rect = iconsContainerRef.current?.getBoundingClientRect()

      if (!rect) return

      const mouseX = clientX - rect.left
      const mouseY = clientY - rect.top

      icons.forEach((icon) => {
        const iconRect = icon.getBoundingClientRect()
        const iconX = iconRect.left - rect.left + iconRect.width / 2
        const iconY = iconRect.top - rect.top + iconRect.height / 2

        const distX = mouseX - iconX
        const distY = mouseY - iconY
        const distance = Math.sqrt(distX * distX + distY * distY)

        if (distance < 150) {
          gsap.to(icon, {
            x: `+=${-distX * 0.2}`,
            y: `+=${-distY * 0.2}`,
            duration: 0.5,
            ease: "power2.out",
          })
        }
      })
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isMobile])

  if (isMobile) return null

  return (
    <div ref={iconsContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="floating-icon absolute text-blue-500/30 text-5xl font-bold">{"{ }"}</div>
      <div className="floating-icon absolute text-purple-500/30 text-5xl">&lt;/&gt;</div>
      <div className="floating-icon absolute text-cyan-500/30 text-5xl">AI</div>
      <div className="floating-icon absolute text-pink-500/30 text-5xl">@</div>
      <div className="floating-icon absolute text-green-500/30 text-5xl">#</div>
      <div className="floating-icon absolute text-yellow-500/30 text-5xl">$</div>
      <div className="floating-icon absolute text-red-500/30 text-5xl">*</div>
      <div className="floating-icon absolute text-indigo-500/30 text-5xl">&lt;/&gt;</div>
      <div className="floating-icon absolute text-orange-500/30 text-5xl">DB</div>
      <div className="floating-icon absolute text-teal-500/30 text-5xl">API</div>
    </div>
  )
}

export default FloatingIcons

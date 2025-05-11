"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import gsap from "gsap"

interface ProgressBarProps {
  current: number
  total: number
  percentage: number
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, percentage }) => {
  const progressRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: `${percentage}%`,
        duration: 0.8,
        ease: "power2.out",
      })
    }

    if (textRef.current) {
      gsap.from(textRef.current.children, {
        y: -10,
        opacity: 0,
        duration: 0.3,
        stagger: 0.1,
        ease: "power2.out",
      })
    }
  }, [percentage])

  return (
    <div className="mb-8">
      <div ref={textRef} className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">
          Soal {current} dari {total}
        </span>
        <span className="text-sm font-medium text-gray-600">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-3 bg-gray-200/50 backdrop-blur-sm rounded-full overflow-hidden">
        <div
          ref={progressRef}
          className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

export default ProgressBar

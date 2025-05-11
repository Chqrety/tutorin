"use client"

import { useState } from "react"
import type React from "react"
import { Chart, registerables } from "chart.js"
import { Doughnut } from "react-chartjs-2"
import Confetti from "react-confetti"

// Register Chart.js components
Chart.register(...registerables)

interface ResultCardProps {
  results: {
    network: number
    ai: number
    web: number
    mobile: number
    topCategory: "network" | "ai" | "web" | "mobile"
  }
  descriptions: {
    [key: string]: string
  }
  onReset: () => void
}

const ResultCard: React.FC<ResultCardProps> = ({ results, descriptions, onReset }) => {
  // Category labels for display
  const categoryLabels = {
    network: "Network Engineering",
    ai: "Artificial Intelligence",
    web: "Web Development",
    mobile: "Mobile Development",
  }

  const [showConfetti, setShowConfetti] = useState(true)
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 800,
    height: typeof window !== "undefined" ? window.innerHeight : 600,
  })

  // Effect to hide confetti after 5 seconds
  useState(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    // Update window size for confetti
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }

      window.addEventListener("resize", handleResize)
      return () => {
        clearTimeout(timer)
        window.removeEventListener("resize", handleResize)
      }
    }

    return () => clearTimeout(timer)
  })

  // Chart data
  const chartData = {
    labels: Object.values(categoryLabels),
    datasets: [
      {
        data: [results.network, results.ai, results.web, results.mobile],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // blue-500
          "rgba(139, 92, 246, 0.8)", // purple-500
          "rgba(236, 72, 153, 0.8)", // pink-500
          "rgba(6, 182, 212, 0.8)", // cyan-500
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)", // blue-500
          "rgba(139, 92, 246, 1)", // purple-500
          "rgba(236, 72, 153, 1)", // pink-500
          "rgba(6, 182, 212, 1)", // cyan-500
        ],
        borderWidth: 1,
      },
    ],
  }

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
          padding: 20,
          color: "#000000",
        },
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  }

  // Calculate total score
  const totalScore = results.network + results.ai + results.web + results.mobile

  // Calculate percentages
  const percentages = {
    network: Math.round((results.network / totalScore) * 100),
    ai: Math.round((results.ai / totalScore) * 100),
    web: Math.round((results.web / totalScore) * 100),
    mobile: Math.round((results.mobile / totalScore) * 100),
  }

  // Get color for category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "network":
        return "bg-blue-500"
      case "ai":
        return "bg-purple-500"
      case "web":
        return "bg-pink-500"
      case "mobile":
        return "bg-cyan-500"
      default:
        return "bg-blue-500"
    }
  }

  // Tech stack logos
  const techLogos = {
    network: (
      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </div>
    ),
    ai: (
      <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-purple-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
          <rect x="7" y="13" width="2" height="2"></rect>
          <rect x="15" y="13" width="2" height="2"></rect>
        </svg>
      </div>
    ),
    web: (
      <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-pink-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </div>
    ),
    mobile: (
      <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-cyan-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
      </div>
    ),
  }

  return (
    <>
      {showConfetti && (
        <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />
      )}

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        <div className="p-6 md:p-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Hasil Tes Minat Bakat</h2>

          {/* Chart Section */}
          <div className="mb-8">
            <div className="h-64 md:h-72">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Top Category Result */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8 border border-blue-200">
            <div className="flex flex-row items-start gap-4">
              <div className="flex-shrink-0">{techLogos[results.topCategory]}</div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                  Bakatmu ada di bidang {categoryLabels[results.topCategory]}!
                </h3>
                <p className="text-gray-700">{descriptions[results.topCategory]}</p>
              </div>
            </div>
          </div>

          {/* Percentage Results */}
          <div className="space-y-5 mb-8">
            <h3 className="text-xl font-semibold text-gray-800">Persentase Kecocokan:</h3>

            {Object.entries(percentages).map(([category, percentage]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    style={{ width: `${percentage}%` }}
                    className={`h-4 rounded-full ${getCategoryColor(category)}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onReset}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg border border-gray-300"
            >
              Ulangi Tes
            </button>

            <button
              onClick={() => {
                // Create shareable text
                const text = `Hasil Tes Minat Bakat IT saya:\n${categoryLabels[results.topCategory]}: ${
                  percentages[results.topCategory]
                }%\n${descriptions[results.topCategory]}`

                // Try to use Web Share API if available
                if (navigator.share) {
                  navigator
                    .share({
                      title: "Hasil Tes Minat Bakat IT",
                      text: text,
                    })
                    .catch((err) => {
                      console.error("Error sharing:", err)
                    })
                } else {
                  // Fallback to copy to clipboard
                  navigator.clipboard
                    .writeText(text)
                    .then(() => {
                      alert("Hasil tes berhasil disalin ke clipboard!")
                    })
                    .catch((err) => {
                      console.error("Error copying to clipboard:", err)
                    })
                }
              }}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Bagikan Hasil
            </button>
          </div>

          {/* Recommendations */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Rekomendasi Langkah Selanjutnya</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-medium text-blue-700">Pelajari Dasar-dasar</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Mulai dengan mempelajari konsep dasar {categoryLabels[results.topCategory]}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-medium text-purple-700">Ikuti Kursus Online</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Temukan kursus online terbaik untuk {categoryLabels[results.topCategory]}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-medium text-pink-700">Bergabung dengan Komunitas</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Temukan dan bergabung dengan komunitas {categoryLabels[results.topCategory]}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-medium text-cyan-700">Buat Proyek Portofolio</h4>
                <p className="text-sm text-gray-600 mt-1">Mulai membuat proyek untuk menunjukkan keahlianmu</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ResultCard

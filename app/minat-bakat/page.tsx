"use client"

import { useState, useEffect } from "react"
import { questions } from "../data/questions"
import QuestionCard from "../components/QuestionCard"
import ResultCard from "../components/ResultCard"
import ProgressBar from "../components/ProgressBar"

// Define category descriptions
const descriptions = {
  network:
    "Kamu memiliki bakat di bidang Network Engineering! Kamu cenderung menyukai hal-hal teknis seperti konfigurasi jaringan, keamanan sistem, dan infrastruktur IT.",
  ai: "Kamu memiliki bakat di bidang Artificial Intelligence! Kamu cenderung menyukai analisis data, machine learning, dan pengembangan sistem cerdas.",
  web: "Kamu memiliki bakat di bidang Web Development! Kamu cenderung menyukai pembuatan aplikasi web, desain antarmuka, dan pengalaman pengguna.",
  mobile:
    "Kamu memiliki bakat di bidang Mobile Development! Kamu cenderung menyukai pembuatan aplikasi mobile, pengembangan UI/UX untuk perangkat mobile.",
}

const MinatBakatPage = () => {
  // State for current question index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // State for user answers
  const [answers, setAnswers] = useState<{ [id: number]: string }>({})

  // State for test completion
  const [isCompleted, setIsCompleted] = useState(false)

  // State for results
  const [results, setResults] = useState<{
    network: number
    ai: number
    web: number
    mobile: number
    topCategory: "network" | "ai" | "web" | "mobile"
  } | null>(null)

  // Load saved progress from localStorage on component mount
  useEffect(() => {
    const savedAnswers = localStorage.getItem("aptitude-test-answers")
    const savedCompleted = localStorage.getItem("aptitude-test-completed")
    const savedResults = localStorage.getItem("aptitude-test-results")

    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers))
    }

    if (savedCompleted === "true") {
      setIsCompleted(true)
    }

    if (savedResults) {
      setResults(JSON.parse(savedResults))
    }
  }, [])

  // Save progress to localStorage whenever answers change
  useEffect(() => {
    localStorage.setItem("aptitude-test-answers", JSON.stringify(answers))
  }, [answers])

  // Handle option selection
  const handleSelectOption = (questionId: number, category: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: category,
    }))
  }

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  // Navigate to previous question
  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  // Calculate and submit results
  const handleSubmit = () => {
    const score = { network: 0, ai: 0, web: 0, mobile: 0 }

    // Count answers by category
    questions.forEach((q) => {
      const selectedOption = answers[q.id]
      if (selectedOption) {
        const category = q.options.find((opt) => opt.label === selectedOption)?.category
        if (category) {
          score[category]++
        }
      }
    })

    // Find category with highest score
    const topCategory = Object.keys(score).reduce((a, b) =>
      score[a as keyof typeof score] > score[b as keyof typeof score] ? a : b,
    ) as keyof typeof score

    const finalResults = {
      ...score,
      topCategory,
    }

    // Save results and mark test as completed
    setResults(finalResults)
    setIsCompleted(true)
    localStorage.setItem("aptitude-test-completed", "true")
    localStorage.setItem("aptitude-test-results", JSON.stringify(finalResults))
  }

  // Reset test
  const handleReset = () => {
    setAnswers({})
    setCurrentQuestionIndex(0)
    setIsCompleted(false)
    setResults(null)
    localStorage.removeItem("aptitude-test-answers")
    localStorage.removeItem("aptitude-test-completed")
    localStorage.removeItem("aptitude-test-results")
  }

  // Current question
  const currentQuestion = questions[currentQuestionIndex]

  // Calculate progress percentage
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 mb-2">
            Tes Minat Bakat Bidang IT
          </h1>
          <p className="mt-2 text-lg text-gray-600">Temukan bidang IT yang paling sesuai dengan minat dan bakatmu</p>
        </div>

        {!isCompleted ? (
          <div className="backdrop-blur-xl bg-white/60 shadow-lg rounded-2xl overflow-hidden border border-white/40">
            <div className="p-8">
              <ProgressBar current={currentQuestionIndex + 1} total={questions.length} percentage={progress} />

              <QuestionCard
                question={currentQuestion}
                selectedOption={answers[currentQuestion.id]}
                onSelectOption={(option) => handleSelectOption(currentQuestion.id, option)}
              />

              <div className="mt-10 flex justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    currentQuestionIndex === 0
                      ? "bg-gray-300/50 cursor-not-allowed text-gray-500"
                      : "bg-white/80 hover:bg-white text-gray-700 shadow-md hover:shadow-lg border border-white/40"
                  }`}
                >
                  Sebelumnya
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id]}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      !answers[currentQuestion.id]
                        ? "bg-gray-300/50 cursor-not-allowed text-gray-500"
                        : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg"
                    }`}
                  >
                    Selanjutnya
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!answers[currentQuestion.id]}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      !answers[currentQuestion.id]
                        ? "bg-gray-300/50 cursor-not-allowed text-gray-500"
                        : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-md hover:shadow-lg"
                    }`}
                  >
                    Lihat Hasil
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <ResultCard results={results!} descriptions={descriptions} onReset={handleReset} />
        )}
      </div>
    </div>
  )
}

export default MinatBakatPage

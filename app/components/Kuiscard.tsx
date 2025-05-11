"use client"

import type React from "react"
import type { Question } from "../data/questions"

interface QuestionCardProps {
  question: Question
  selectedOption: string | undefined
  onSelectOption: (option: string) => void
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, selectedOption, onSelectOption }) => {
  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">{question.text}</h2>

      <div className="space-y-4">
        {question.options.map((option, index) => (
          <div
            key={index}
            onClick={() => onSelectOption(option.label)}
            className={`p-5 backdrop-blur-sm rounded-xl cursor-pointer transition-all duration-200 ${
              selectedOption === option.label
                ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-300/50 shadow-md"
                : "bg-white/30 border border-white/40 hover:bg-white/50 hover:shadow-md"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                  selectedOption === option.label
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 border-2 border-white"
                    : "border-2 border-gray-300 bg-white/50"
                }`}
              >
                {selectedOption === option.label && <div className="w-2 h-2 rounded-full bg-white"></div>}
              </div>
              <span
                className={`ml-4 font-medium ${selectedOption === option.label ? "text-blue-800" : "text-gray-700"}`}
              >
                {option.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuestionCard

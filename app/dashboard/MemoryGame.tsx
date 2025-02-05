"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

import {
  FaReact,
  FaVuejs,
  FaAngular,
  FaNodeJs,
  FaPython,
  FaPhp,
} from "react-icons/fa"
import { IconType } from "react-icons"

type MemoryCard = {
  id: number
  Icon: IconType
  isMatched: boolean
  color: string
}

const iconConfigs = [
  { Icon: FaReact, color: "text-cyan-400" },
  { Icon: FaVuejs, color: "text-green-400" },
  { Icon: FaAngular, color: "text-red-400" },
  { Icon: FaNodeJs, color: "text-lime-400" },
  { Icon: FaPython, color: "text-yellow-400" },
  { Icon: FaPhp, color: "text-indigo-400" },
]

function createCards(): MemoryCard[] {
  const cards: MemoryCard[] = []
  iconConfigs.forEach(({ Icon, color }, idx) => {
    cards.push(
      { id: idx * 2, Icon, color, isMatched: false },
      { id: idx * 2 + 1, Icon, color, isMatched: false }
    )
  })
  return cards.sort(() => Math.random() - 0.5)
}

export default function MemoryGame() {
  const [cards, setCards] = useState<MemoryCard[]>(createCards())
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const [isChecking, setIsChecking] = useState(false)

  const handleCardClick = (clickedIndex: number) => {
    if (isChecking || cards[clickedIndex].isMatched) return
    if (flippedIndexes.includes(clickedIndex)) return
    if (flippedIndexes.length === 2) return

    const newFlipped = [...flippedIndexes, clickedIndex]
    setFlippedIndexes(newFlipped)

    if (newFlipped.length === 2) {
      setIsChecking(true)
      const [firstIndex, secondIndex] = newFlipped
      const firstCard = cards[firstIndex]
      const secondCard = cards[secondIndex]

      if (firstCard.Icon === secondCard.Icon) {
        // match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === firstIndex || idx === secondIndex
                ? { ...c, isMatched: true }
                : c
            )
          )
          setFlippedIndexes([])
          setMatches((m) => m + 1)
          setIsChecking(false)

          if (matches === (cards.length / 2) - 1) {
            toast("🎉 Selamat! Anda sudah menemukan semua pasangan! 🎈", {
              className: "bg-purple-900 text-purple-100 border-purple-700",
            })
          }
        }, 500)
      } else {
        // no match
        setTimeout(() => {
          setFlippedIndexes([])
          setIsChecking(false)
        }, 1000)
      }
    }
  }

  const resetGame = () => {
    setCards(createCards())
    setFlippedIndexes([])
    setMatches(0)
    setIsChecking(false)
  }

  return (
    <div
      className="
        flex flex-col items-center justify-center min-h-screen p-4 space-y-8
        bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950
        
        /* Mengecilkan seluruh container di mobile */
        scale-75
        sm:scale-100
        origin-top
      "
    >
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 text-transparent bg-clip-text">
          Memory Match Game
        </h1>
        <p className="text-indigo-200">
          Matches found: {matches} of {cards.length / 2}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-6 rounded-xl bg-indigo-950/50 backdrop-blur-sm">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ rotateY: 0 }}
            animate={{
              rotateY:
                card.isMatched || flippedIndexes.includes(index) ? 180 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="perspective-1000"
          >
            <Card
              className={`relative 
                w-20 h-20 
                sm:w-24 sm:h-24 
                md:w-28 md:h-28 
                lg:w-32 lg:h-32
                cursor-pointer transform-style-3d transition-all duration-300
                ${
                  card.isMatched
                    ? "bg-indigo-900/50 border-indigo-400/50"
                    : flippedIndexes.includes(index)
                    ? "bg-indigo-800/50 border-indigo-500/50"
                    : "bg-indigo-950 border-indigo-800 hover:border-indigo-600 hover:bg-indigo-900/80"
                }`}
              onClick={() => handleCardClick(index)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-indigo-500/5 to-white/5" />
              <AnimatePresence>
                {(card.isMatched || flippedIndexes.includes(index)) && (
                  <motion.div
                    initial={{ opacity: 0, rotateY: 180 }}
                    animate={{ opacity: 1, rotateY: 180 }}
                    exit={{ opacity: 0, rotateY: 180 }}
                    className="absolute inset-0 flex items-center justify-center backface-hidden"
                  >
                    <card.Icon
                      className={`w-10 h-10 
                        sm:w-12 sm:h-12 
                        md:w-14 md:h-14
                        ${
                          card.isMatched
                            ? `${card.color} drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`
                            : card.color
                        }`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>

      <Button
        onClick={resetGame}
        variant="outline"
        size="lg"
        className="bg-indigo-950 border-indigo-700 hover:bg-indigo-900 hover:border-indigo-500 text-indigo-200 hover:text-indigo-100"
      >
        Start New Game
      </Button>
    </div>
  )
}

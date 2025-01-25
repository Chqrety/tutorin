// app/login/page.tsx
"use client"

import React from "react"
import { motion } from "framer-motion"

import LoginForm from "../components/LoginForm"

export default function LoginPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gray-100"
    >
      <LoginForm />
    </motion.div>
  )
}

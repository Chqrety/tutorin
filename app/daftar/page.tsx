import RegistrationForm from "../components/RegistrationForm"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Daftar | Doscom Konsultan",
  description: "Daftarkan diri Anda untuk memulai perjalanan karir impian Anda",
}

export default function RegistrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <RegistrationForm />
    </div>
  )
}


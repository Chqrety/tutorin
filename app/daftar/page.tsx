import RegistrationForm from "../components/RegistrationForm"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Daftar | TUTORIN",
  description: "Daftarkan diri Anda untuk memulai perjalanan karir impian Anda",
}

export default function RegistrationPage() {
  return (
   
      <RegistrationForm />
    
  )
}


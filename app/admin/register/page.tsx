"use client"

import { useState,useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminRegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    // Check admin session
    const adminSession = sessionStorage.getItem("adminSession")
    if (adminSession) {
      setIsLoggedIn(true)
   
    } else {
      router.push("/admin/login")
    }
  }, [router])
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("") // Reset pesan error

    if (password !== confirmPassword) {
      setErrorMessage("Password and confirm password do not match.")
      return
    }

    setIsSubmitting(true)

    try {
      // Buat akun admin di Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        console.error("Error registering admin in auth:", authError)
        setErrorMessage(authError.message)
        setIsSubmitting(false)
        return
      }

      // Enkripsi password sebelum menyimpannya di tabel admins
      const hashedPassword = await bcrypt.hash(password, 10)

      // Tambahkan data tambahan admin ke tabel "admins"
      const { error: insertError } = await supabase
        .from("admins")
        .insert({
          id: authData.user?.id, // Gunakan ID dari Supabase Auth
          name,
          email,
          password: hashedPassword, // Simpan password yang telah di-hash
        })

      if (insertError) {
        console.error("Error adding admin to database:", insertError)
        setErrorMessage("Failed to register. Please try again.")
        setIsSubmitting(false)
        return
      }

      // Redirect ke halaman login admin
      alert("Registration successful! You can now log in.")
      router.push("/admin/login")
    } catch (error) {
      console.error("Unexpected error during registration:", error)
      setErrorMessage("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Admin Registration</CardTitle>
          <CardDescription>Create a new admin account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/admin/login")} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleRegister} disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

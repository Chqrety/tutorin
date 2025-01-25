"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase" // Pastikan konfigurasi Supabase sudah ada
import bcrypt from "bcryptjs" // Pastikan bcryptjs sudah diinstal
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("") // Reset pesan error
    setIsSubmitting(true)

    try {
      // Ambil data admin berdasarkan email
      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("id, email, name, password") // Pastikan kolom password disimpan dalam bentuk hash
        .eq("email", email)
        .single()

      if (adminError || !admin) {
        console.error("Admin not found:", adminError)
        setErrorMessage("Email tidak terdaftar sebagai admin.")
        setIsSubmitting(false)
        return
      }

      // Verifikasi password menggunakan bcrypt
      const isPasswordValid = await bcrypt.compare(password, admin.password)
      if (!isPasswordValid) {
        setErrorMessage("Password salah.")
        setIsSubmitting(false)
        return
      }

      // Simpan sesi admin ke sessionStorage
      sessionStorage.setItem(
        "adminSession",
        JSON.stringify({
          adminId: admin.id,
          email: admin.email,
          name: admin.name,
        })
      )

      // Redirect ke dashboard admin
      router.push("/admin/dashboard")
    } catch (err) {
      console.error("Error during login:", err)
      setErrorMessage("Terjadi kesalahan. Coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid w-full items-center gap-4">
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
              {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button onClick={handleLogin} disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

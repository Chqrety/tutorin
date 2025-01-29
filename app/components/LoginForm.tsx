"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import * as z from "zod"

import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import bcrypt from "bcryptjs"

// Import skema Zod dan tipe data
import { loginSchema, LoginFormData } from "@/schemas/loginSchema"

export default function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Kirim data ke backend untuk login
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        const resData = await response.json();
        toast({
          variant: "destructive",
          title: "Gagal Masuk",
          description: resData.message || "Terjadi kesalahan.",
        });
        return;
      }
  
      const { userId, email, token } = await response.json();
  
      // **Pastikan token ada**
      if (!token) {
        console.error("Token tidak ditemukan dalam respons login!");
        toast.error("Login gagal: Token tidak ditemukan.");
        return;
      }
  
      // **Simpan user session dengan token**
      sessionStorage.setItem("userSession", JSON.stringify({ userId, email, token }));
  
      console.log("Login sukses! User session:", { userId, email, token });
  
      // Redirect ke dashboard
      toast({ title: "Berhasil Masuk!", description: "Anda telah berhasil masuk." });
      router.push("/dashboard");
    } catch (err) {
      console.error("Terjadi kesalahan:", err);
      toast({
        variant: "destructive",
        title: "Terjadi Kesalahan",
        description: "Tidak dapat memproses permintaan Anda.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
      <h2 className="text-2xl font-bold text-center text-primary mb-6">
        Masuk ke KampusKarirKu
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="masukkan email Anda"
            {...register("email")}
            className="mt-1"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="masukkan password Anda"
            {...register("password")}
            className="mt-1"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Masuk...
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </div>
      </form>

      {/* Link to Register */}
      <p className="text-center text-sm text-gray-600 mt-4">
        Belum punya akun?{" "}
        <a href="/register" className="text-primary hover:underline">
          Daftar di sini
        </a>
      </p>
    </div>
  )
}
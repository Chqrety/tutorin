"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import bcrypt from "bcryptjs"
import { Loader2, Upload, Check, ChevronLeft, ChevronRight } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

// Maksimum ukuran file 500KB
const MAX_FILE_SIZE = 500_000

// Skema Zod untuk form
const formSchema = z.object({
  fullName: z.string().min(2, { message: "Nama lengkap harus diisi" }),
  email: z.string().email({ message: "Email tidak valid" }),
  password: z.string().min(8, { message: "Password minimal 8 karakter" }),
  university: z.string().min(2, { message: "Nama universitas harus diisi" }),
  major: z.string().min(2, { message: "Jurusan harus diisi" }),
  semester: z.number().min(1).max(14, { message: "Semester harus antara 1 hingga 14" }),
  gender: z.enum(["male", "female", "other"], { required_error: "Jenis kelamin harus dipilih" }),
  avatar: z
    .union([
      z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE, "Ukuran file maksimum 500KB"),
      z.undefined(),
    ])
    .optional(),
})

type FormData = z.infer<typeof formSchema>
const steps = ["Informasi Pribadi", "Informasi Akademik", "Finalisasi"]

export default function RegistrationForm() {
  console.log("RegistrationForm rendered!")

  const [step, setStep] = useState(0)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  // Fungsi yang dipanggil saat submit form
  const onSubmit = async (data: FormData) => {
    try {
      console.log("Form disubmit:", data)
  
      // Enkripsi password pakai bcryptjs sebelum dikirim ke DB
      const hashedPassword = await bcrypt.hash(data.password, 10)
  
      // Daftarkan pengguna ke auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: hashedPassword,
      })
  
      if (authError) {
        console.error("authError:", authError)
        toast({
          variant: "destructive",
          title: "Gagal Mendaftar",
          description: authError.message,
        })
        return
      }
  
      const authUserId = authData?.user?.id
      console.log("User berhasil didaftarkan ke auth.users dengan ID:", authUserId)
  
      if (!authUserId) {
        toast({
          variant: "destructive",
          title: "Gagal Mendapatkan ID User",
          description: "ID user tidak ditemukan setelah pendaftaran.",
        })
        return
      }
  
      // Simpan data tambahan pengguna ke tabel "users"
      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: authUserId, // Gunakan ID dari auth.users
          email: data.email,
          encrypted_password: hashedPassword,
          full_name: data.fullName,
          university: data.university,
          major: data.major,
          semester: data.semester
        })
  
      if (userError) {
        console.error("userError:", userError)
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan Data Pengguna",
          description: userError.message,
        })
        return
      }
  
      // Upload avatar jika ada
      let avatarUrl: string | null = null
      if (data.avatar) {
        const fileExt = data.avatar.name.split(".").pop()
        const fileName = `${authUserId}.${fileExt}`
  
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, data.avatar, { upsert: true })
  
        if (uploadError) {
          console.error("uploadError:", uploadError)
          toast({
            variant: "destructive",
            title: "Gagal Upload Avatar",
            description: uploadError.message,
          })
          return
        }
  
        const { data: urlData, error: urlError } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName)
  
        if (urlError) {
          console.error("urlError:", urlError)
          toast({
            variant: "destructive",
            title: "Gagal Mendapatkan URL Avatar",
            description: urlError.message,
          })
          return
        }
  
        avatarUrl = urlData?.publicUrl ?? null
      }
  
      // Tambahkan data avatar ke tabel "profiles"
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authUserId,
          avatar_url: avatarUrl,
          bio: "Hello, ini bio default saya!",
        })
  
      if (profileError) {
        console.error("profileError:", profileError)
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan Profil",
          description: profileError.message,
        })
        return
      }
  
      // Tampilkan toast sukses
      toast({
        title: "Pendaftaran Berhasil!",
        description: "Akun baru berhasil dibuat. Silakan login.",
      })
  
      // Reset form
      reset()
      setStep(0)
      setAvatarPreview(null)
    } catch (err) {
      console.error("Terjadi error tak terduga:", err)
      toast({
        variant: "destructive",
        title: "Terjadi Kesalahan",
        description: String(err),
      })
    }
  }
  
  // Handler untuk navigasi step
  const nextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() // Pastikan mencegah default behavior
    console.log("Maju ke step:", step + 1)
    setStep((prev) => Math.min(prev + 1, steps.length - 1))
  }
  const prevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() // Pastikan mencegah default behavior
    console.log("Mundur ke step:", step - 1)
    setStep((prev) => Math.max(prev - 1, 0))
  }

  // Handler untuk menampilkan preview avatar
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    console.log("File terpilih:", file)
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "Ukuran file terlalu besar. Maksimum 500KB.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Mengawasi perubahan pada field avatar untuk preview
  const watchedAvatar = watch("avatar")

  // Handler untuk mencegah form submit saat menekan Enter di langkah 0 dan 1
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && step < steps.length - 1) {
      e.preventDefault()
      console.log("Prevented form submission on Enter key")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden"
    >
      <div className="p-8">
        <h2 className="text-3xl font-bold text-center text-primary mb-6">
          Daftar Doscom Konsultan
        </h2>
        <Progress value={((step + 1) / steps.length) * 100} className="mb-6" />

        {/* Indikator Step */}
        <div className="flex justify-between mb-8">
          {steps.map((stepName, index) => (
            <div
              key={stepName}
              className={`text-sm font-medium ${
                index <= step ? "text-primary" : "text-gray-400"
              }`}
            >
              {stepName}
            </div>
          ))}
        </div>

        {/* Form pendaftaran */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" onKeyDown={handleKeyDown}>
          {/* Step 0: Informasi Pribadi */}
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input id="fullName" {...register("fullName")} className="mt-1" />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="mt-1"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="mt-1"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label>Jenis Kelamin</Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} className="flex space-x-4 mt-1">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">Laki-laki</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">Perempuan</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other">Lainnya</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 1: Informasi Akademik */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="university">Universitas</Label>
                <Input id="university" {...register("university")} className="mt-1" />
                {errors.university && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.university.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="major">Jurusan</Label>
                <Input id="major" {...register("major")} className="mt-1" />
                {errors.major && (
                  <p className="text-red-500 text-sm mt-1">{errors.major.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="semester">Semester</Label>
                <Controller
                  name="semester"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => field.onChange(Number(value))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(14)].map((_, i) => (
                          <SelectItem key={i} value={(i + 1).toString()}>
                            Semester {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.semester && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.semester.message}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Finalisasi & Avatar */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="avatar">Avatar (Maksimum 500KB)</Label>
                <div className="mt-1 flex items-center space-x-4">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  {/* Gunakan Controller untuk avatar */}
                  <Controller
                    name="avatar"
                    control={control}
                    render={({ field }) => (
                      <>
                        <input
                          type="file"
                          id="avatar"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            handleFileChange(e)
                            field.onChange(e.target.files?.[0])
                          }}
                        />
                        <Button
                          type="button" // Pastikan type="button"
                          onClick={() => {
                            document.getElementById("avatar")?.click()
                          }}
                        >
                          Pilih Gambar
                        </Button>
                      </>
                    )}
                  />
                </div>
                {errors.avatar && (
                  <p className="text-red-500 text-sm mt-1">{errors.avatar.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Konfirmasi Data</h3>
                <p>Nama: {watch("fullName")}</p>
                <p>Email: {watch("email")}</p>
                <p>Universitas: {watch("university")}</p>
                <p>Jurusan: {watch("major")}</p>
                <p>Semester: {watch("semester")}</p>
                <p>Jenis Kelamin: {watch("gender")}</p>
              </div>
            </motion.div>
          )}

          {/* Tombol Navigasi Bawah */}
          <div className="flex justify-between mt-8">
            {step > 0 && (
              <Button type="button" onClick={prevStep} variant="outline">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Sebelumnya
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button type="button" onClick={nextStep} className="ml-auto">
                Selanjutnya
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" className="ml-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mohon tunggu
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Daftar
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-center text-gray-500">
          Dengan mendaftar, Anda menyetujui Syarat dan Ketentuan serta Kebijakan Privasi kami.
        </p>
      </div>
    </motion.div>
  )
}

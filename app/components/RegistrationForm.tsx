"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import bcrypt from "bcryptjs"
import {
  Loader2,
  Upload,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Lock,
  GraduationCap,
  Building,
  Calendar,
  UserCircle2,
  ImageIcon,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

const steps = [
  {
    id: "personal",
    title: "Informasi Pribadi",
    icon: UserCircle2,
    description: "Lengkapi data diri Anda",
  },
  {
    id: "academic",
    title: "Informasi Akademik",
    icon: GraduationCap,
    description: "Informasi pendidikan Anda",
  },
  {
    id: "finalize",
    title: "Finalisasi",
    icon: Check,
    description: "Konfirmasi dan selesaikan pendaftaran",
  },
]

export default function RegistrationForm() {
  console.log("RegistrationForm rendered!")

  const [step, setStep] = useState(0)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    reset,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
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
      const { error: userError } = await supabase.from("users").insert({
        id: authUserId, // Gunakan ID dari auth.users
        email: data.email,
        encrypted_password: hashedPassword,
        full_name: data.fullName,
        university: data.university,
        major: data.major,
        semester: data.semester,
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

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName)

        avatarUrl = urlData?.publicUrl ?? null
      }

      // Tambahkan data avatar ke tabel "profiles"
      const { error: profileError } = await supabase.from("profiles").upsert({
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
      // Redirect ke halaman login
      window.location.href = "/login"
      // Reset form
    
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
  const nextStep = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    // Validate current step fields
    let fieldsToValidate: (keyof FormData)[] = []

    if (step === 0) {
      fieldsToValidate = ["fullName", "email", "password", "gender"]
    } else if (step === 1) {
      fieldsToValidate = ["university", "major", "semester"]
    }

    const isValid = await trigger(fieldsToValidate)

    if (isValid) {
      setIsAnimating(true)
      setTimeout(() => {
        setStep((prev) => Math.min(prev + 1, steps.length - 1))
        setIsAnimating(false)
      }, 300)
    }
  }

  const prevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsAnimating(true)
    setTimeout(() => {
      setStep((prev) => Math.max(prev - 1, 0))
      setIsAnimating(false)
    }, 300)
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

  // Floating particles effect
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; duration: number }[]>([])

  useEffect(() => {
    const generateParticles = () => {
      return Array.from({ length: 20 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 3 + 2,
      }))
    }

    setParticles(generateParticles())
  }, [])

  return (
    <div className="min-h-screen w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-950/50 to-transparent"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl"></div>

      {/* Particles */}
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute bg-white/20 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Header with logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center p-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30 mb-4"
          >
            <GraduationCap className="h-8 w-8 text-blue-100" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">Daftar TUTORIN</h2>
          <p className="text-blue-200/80">Mulai perjalanan konsultasi karir Anda sekarang</p>
        </div>

        {/* Main card */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          {/* Step indicators */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between relative">
              {steps.map((stepItem, index) => {
                const StepIcon = stepItem.icon
                return (
                  <div key={stepItem.id} className="flex flex-col items-center relative z-10">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        index < step
                          ? "bg-blue-500 border-blue-400 text-white"
                          : index === step
                            ? "bg-blue-500/20 border-blue-400 text-blue-100"
                            : "bg-blue-900/30 border-blue-800/50 text-blue-400/50"
                      } transition-all duration-300`}
                    >
                      {index < step ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${index <= step ? "text-blue-200" : "text-blue-400/50"}`}
                    >
                      {stepItem.title}
                    </span>
                  </div>
                )
              })}

              {/* Connecting lines as separate elements */}
              <div className="absolute top-5 left-0 right-0 flex justify-center z-0">
                {steps.map((_, index) => {
                  if (index < steps.length - 1) {
                    const lineWidth = `${100 / (steps.length - 1)}%`
                    return (
                      <div key={`line-${index}`} className="h-0.5 relative" style={{ width: lineWidth }}>
                        <div
                          className={`absolute left-0 right-0 h-full transition-all duration-500 ${
                            index < step ? "bg-blue-500" : "bg-blue-800/50"
                          }`}
                          style={{
                            width: index < step ? "100%" : index === step ? "50%" : "0%",
                            transformOrigin: "left",
                          }}
                        />
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          </div>

          {/* Form content */}
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" onKeyDown={handleKeyDown}>
              <AnimatePresence mode="wait">
                {/* Step 0: Informasi Pribadi */}
                {step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: isAnimating ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-white">{steps[0].title}</h3>
                      <p className="text-blue-200/70 text-sm">{steps[0].description}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <Label htmlFor="fullName" className="text-blue-100">
                          Nama Lengkap
                        </Label>
                        <div className="relative mt-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-blue-400/70" />
                          </div>
                          <Input
                            id="fullName"
                            {...register("fullName")}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                            placeholder="Masukkan nama lengkap"
                          />
                        </div>
                        {errors.fullName && <p className="text-red-300 text-sm mt-1">{errors.fullName.message}</p>}
                      </div>

                      <div className="relative">
                        <Label htmlFor="email" className="text-blue-100">
                          Email
                        </Label>
                        <div className="relative mt-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-blue-400/70" />
                          </div>
                          <Input
                            id="email"
                            type="email"
                            {...register("email")}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                            placeholder="nama@email.com"
                          />
                        </div>
                        {errors.email && <p className="text-red-300 text-sm mt-1">{errors.email.message}</p>}
                      </div>

                      <div className="relative">
                        <Label htmlFor="password" className="text-blue-100">
                          Password
                        </Label>
                        <div className="relative mt-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-blue-400/70" />
                          </div>
                          <Input
                            id="password"
                            type="password"
                            {...register("password")}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                            placeholder="Minimal 8 karakter"
                          />
                        </div>
                        {errors.password && <p className="text-red-300 text-sm mt-1">{errors.password.message}</p>}
                      </div>

                      <div>
                        <Label className="text-blue-100">Jenis Kelamin</Label>
                        <Controller
                          name="gender"
                          control={control}
                          render={({ field }) => (
                            <RadioGroup
                              onValueChange={field.onChange}
                              className="flex flex-col space-y-2 mt-2 sm:flex-row sm:space-y-0 sm:space-x-4"
                            >
                              <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 cursor-pointer hover:bg-white/10 transition-colors">
                                <RadioGroupItem value="male" id="male" className="text-blue-400" />
                                <Label htmlFor="male" className="text-blue-100 cursor-pointer">
                                  Laki-laki
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 cursor-pointer hover:bg-white/10 transition-colors">
                                <RadioGroupItem value="female" id="female" className="text-blue-400" />
                                <Label htmlFor="female" className="text-blue-100 cursor-pointer">
                                  Perempuan
                                </Label>
                              </div>
                             
                            </RadioGroup>
                          )}
                        />
                        {errors.gender && <p className="text-red-300 text-sm mt-1">{errors.gender.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Informasi Akademik */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: isAnimating ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-white">{steps[1].title}</h3>
                      <p className="text-blue-200/70 text-sm">{steps[1].description}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <Label htmlFor="university" className="text-blue-100">
                          Universitas
                        </Label>
                        <div className="relative mt-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building className="h-5 w-5 text-blue-400/70" />
                          </div>
                          <Input
                            id="university"
                            {...register("university")}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                            placeholder="Nama universitas"
                          />
                        </div>
                        {errors.university && <p className="text-red-300 text-sm mt-1">{errors.university.message}</p>}
                      </div>

                      <div className="relative">
                        <Label htmlFor="major" className="text-blue-100">
                          Jurusan
                        </Label>
                        <div className="relative mt-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <GraduationCap className="h-5 w-5 text-blue-400/70" />
                          </div>
                          <Input
                            id="major"
                            {...register("major")}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                            placeholder="Jurusan atau program studi"
                          />
                        </div>
                        {errors.major && <p className="text-red-300 text-sm mt-1">{errors.major.message}</p>}
                      </div>

                      <div className="relative">
                        <Label htmlFor="semester" className="text-blue-100">
                          Semester
                        </Label>
                        <div className="relative mt-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-blue-400/70" />
                          </div>
                          <Controller
                            name="semester"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={(value) => field.onChange(Number(value))}>
                                <SelectTrigger className="pl-10 bg-white/5 border-white/10 text-white focus:ring-blue-400 focus:border-blue-400">
                                  <SelectValue placeholder="Pilih semester" />
                                </SelectTrigger>
                                <SelectContent className="bg-blue-900 border-blue-700 text-white">
                                  {[...Array(14)].map((_, i) => (
                                    <SelectItem
                                      key={i}
                                      value={(i + 1).toString()}
                                      className="focus:bg-blue-800 focus:text-white"
                                    >
                                      Semester {i + 1}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        {errors.semester && <p className="text-red-300 text-sm mt-1">{errors.semester.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Finalisasi & Avatar */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: isAnimating ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-white">{steps[2].title}</h3>
                      <p className="text-blue-200/70 text-sm">{steps[2].description}</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="avatar" className="text-blue-100">
                          Avatar (Maksimum 500KB)
                        </Label>
                        <div className="mt-3 flex flex-col sm:flex-row items-center gap-4">
                          {avatarPreview ? (
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-400/30 shadow-lg shadow-blue-500/20"
                            >
                              <img
                                src={avatarPreview || "/placeholder.svg"}
                                alt="Avatar preview"
                                className="w-full h-full object-cover"
                              />
                            </motion.div>
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-400/30">
                              <ImageIcon className="w-10 h-10 text-blue-300/70" />
                            </div>
                          )}

                          <div className="flex-1">
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
                                    type="button"
                                    onClick={() => {
                                      document.getElementById("avatar")?.click()
                                    }}
                                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 border border-blue-400/30"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Pilih Gambar
                                  </Button>
                                </>
                              )}
                            />
                            <p className="text-blue-200/70 text-xs mt-2">
                              Upload foto profil Anda (opsional). Format yang didukung: JPG, PNG, GIF.
                            </p>
                          </div>
                        </div>
                        {errors.avatar && <p className="text-red-300 text-sm mt-1">{errors.avatar.message}</p>}
                      </div>

                      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                        <h3 className="text-lg font-semibold text-white mb-3">Konfirmasi Data</h3>
                        <div className="space-y-2 text-blue-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-blue-400/70" />
                              <span className="text-blue-200/70">Nama:</span>
                              <span className="font-medium text-white">{watch("fullName")}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-blue-400/70" />
                              <span className="text-blue-200/70">Email:</span>
                              <span className="font-medium text-white">{watch("email")}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4 text-blue-400/70" />
                              <span className="text-blue-200/70">Universitas:</span>
                              <span className="font-medium text-white">{watch("university")}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="w-4 h-4 text-blue-400/70" />
                              <span className="text-blue-200/70">Jurusan:</span>
                              <span className="font-medium text-white">{watch("major")}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-400/70" />
                              <span className="text-blue-200/70">Semester:</span>
                              <span className="font-medium text-white">{watch("semester")}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <UserCircle2 className="w-4 h-4 text-blue-400/70" />
                              <span className="text-blue-200/70">Jenis Kelamin:</span>
                              <span className="font-medium text-white">
                                {watch("gender") === "male"
                                  ? "Laki-laki"
                                  : watch("gender") === "female"
                                    ? "Perempuan"
                                    : watch("gender") === "other"
                                      ? "Lainnya"
                                      : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tombol Navigasi Bawah */}
              <div className="flex justify-between mt-8 pt-4 border-t border-white/10">
                {step > 0 && (
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    className="border-white/20 text-blue-100 hover:bg-white/10 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Sebelumnya
                  </Button>
                )}
                {step < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className={`ml-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30`}
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="ml-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                    disabled={isSubmitting}
                  >
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

            <div className="px-6 py-4 bg-blue-900/30 border-t border-white/10">
            <p className="text-xs text-center text-blue-200/70">
              Dengan mendaftar, Anda menyetujui Syarat dan Ketentuan serta Kebijakan Privasi kami.
            </p>
            <p className="text-sm text-center text-blue-200/70 mt-2">
              Sudah punya akun?{" "}
              <a href="/login" className="text-blue-400 hover:text-blue-300 underline">
              Login di sini
              </a>
            </p>
            </div>
        </div>
      </motion.div>
    </div>
  )
}

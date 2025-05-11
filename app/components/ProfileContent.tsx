"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import bcrypt from "bcryptjs"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Shield,
  Edit2,
  Save,
  X,
  Upload,
  Home,
  MessageCircle,
  CalendarPlus2Icon as CalendarIcon2,
  Settings,
  Plus,
  School,
  Mail,
  BookOpen,
  Calendar,
  Key,
  Lock,
} from "lucide-react"
import LoadingPage from "@/app/components/LoadingPage"

// Skema Validasi (Zod)
const profileSchema = z
  .object({
    fullName: z.string().min(2, "Nama lengkap harus diisi"),
    email: z.string().email("Email tidak valid"),
    university: z.string().optional(),
    major: z.string().optional(),
    semester: z.string().optional(),

    currentPassword: z.string().min(1, "Password saat ini harus diisi"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),

    // Field untuk file avatar (opsional).
    avatarFile: z.any().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfileContent() {
  const router = useRouter()
  const { toast } = useToast()

  // State untuk edit mode
  const [isEditing, setIsEditing] = useState(false)
  // Menyimpan URL avatar (profil) dari DB
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  // State untuk loading
  const [isLoading, setIsLoading] = useState(true)
  // State untuk submitting
  const [isSubmitting, setIsSubmitting] = useState(false)
  // State untuk active tab
  const [activeTab, setActiveTab] = useState("info")
  // State untuk mobile navigation
  const [activeBottomTab, setActiveBottomTab] = useState("settings")
  const [isClient, setIsClient] = useState(false)

  // Ambil userId dari session
  const [userId, setUserId] = useState<string | null>(null)

  // Set isClient to true when component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Cek sessionStorage untuk userSession
  useEffect(() => {
    try {
      const userSession = sessionStorage.getItem("userSession")
      if (userSession) {
        const parsedSession = JSON.parse(userSession)
        if (parsedSession && parsedSession.userId) {
          setUserId(parsedSession.userId)
          return
        }
      }
      // Jika tidak ada userId, redirect ke /login
      router.push("/login")
    } catch (error) {
      console.error("Error parsing user session:", error)
      router.push("/login")
    }
  }, [router])

  // Setup react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      university: "",
      major: "",
      semester: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      avatarFile: null,
    },
  })

  // Ambil file avatar jika diperlukan (misalnya untuk preview)
  const avatarFile = watch("avatarFile")

  // Ambil data user dan avatar dari Supabase
  useEffect(() => {
    if (!userId) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // 1. Ambil data user
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, email, encrypted_password, full_name, university, major, semester")
          .eq("id", userId)
          .single()

        if (userError) {
          console.error("Error fetching user:", userError)
          return
        }

        if (userData) {
          setValue("fullName", userData.full_name ?? "")
          setValue("email", userData.email ?? "")
          setValue("university", userData.university ?? "")
          setValue("major", userData.major ?? "")
          setValue("semester", userData.semester ?? "")
        }

        // 2. Ambil data profiles untuk avatar_url
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", userId) // id di profiles sama dengan user.id
          .single()

        if (profileError) {
          console.error("Error fetching profile:", profileError)
          return
        }

        if (profileData?.avatar_url) {
          setAvatarUrl(profileData.avatar_url)
        }
      } catch (err) {
        console.error("Unexpected error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId, setValue])

  // Fungsi upload avatar ke bucket "avatars"
  const uploadAvatar = async (file: File) => {
    try {
      // Buat path unik untuk file
      const filePath = `avatars/${userId}-${Date.now()}`

      // Upload ke bucket "avatars"
      const { data, error } = await supabase.storage.from("avatars").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        throw error
      }

      // Dapatkan public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)
      const publicUrl = urlData?.publicUrl

      return publicUrl
    } catch (error) {
      console.error("Error uploading avatar:", error)
      return null
    }
  }

  // Fungsi handle submit form (update data user)
  const onSubmit = async (formData: ProfileFormData) => {
    if (!userId) {
      // Jika userId tidak ada, mungkin user belum login -> balik ke login
      router.push("/login")
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Ambil encrypted_password dari DB (untuk cek currentPassword)
      const { data: userPassData, error: userPassError } = await supabase
        .from("users")
        .select("encrypted_password")
        .eq("id", userId)
        .single()

      if (userPassError || !userPassData) {
        toast({
          title: "Error",
          description: "Gagal memeriksa password lama",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // 2. Bandingkan currentPassword (plaintext) dengan encrypted_password (hash)
      const match = await bcrypt.compare(formData.currentPassword, userPassData.encrypted_password)
      if (!match) {
        toast({
          title: "Error",
          description: "Password saat ini tidak cocok",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // 3. Hash password baru
      const hashedNewPassword = await bcrypt.hash(formData.newPassword, 10)

      // 4. Update tabel users
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: formData.fullName,
          email: formData.email,
          university: formData.university,
          major: formData.major,
          semester: formData.semester,
          encrypted_password: hashedNewPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (updateError) {
        console.error("Error updating user:", updateError)
        toast({
          title: "Error",
          description: "Gagal memperbarui data pengguna",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // 5. Jika ada file avatar baru, upload ke bucket
      let newAvatarUrl: string | null = null
      if (avatarFile && avatarFile[0] instanceof File) {
        newAvatarUrl = await uploadAvatar(avatarFile[0])
      }

      // 6. Jika berhasil upload, update tabel profiles
      if (newAvatarUrl) {
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ avatar_url: newAvatarUrl })
          .eq("id", userId)

        if (profileUpdateError) {
          console.error("Error updating avatar_url:", profileUpdateError)
          toast({
            title: "Error",
            description: "Gagal memperbarui avatar",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }

        // Perbarui state avatarUrl supaya avatar terbaru langsung tampil
        setAvatarUrl(newAvatarUrl)
      }

      // 7. Beri notifikasi sukses
      toast({
        title: "Profil Diperbarui",
        description: "Informasi profil Anda telah berhasil diperbarui.",
      })

      setIsEditing(false)
    } catch (err) {
      console.error("Unexpected error:", err)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memperbarui profil",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTabClick = (tab: string) => {
    setActiveBottomTab(tab)
    if (isClient) {
      // Check that this only runs on client
      switch (tab) {
        case "home":
          router.push("/dashboard") // Replace with appropriate route
          break
        case "konsultasi":
          router.push("/dashboard/konsultasi") // Replace with appropriate route
          break
        case "schedule":
          router.push("/dashboard/jadwal") // Replace with appropriate route
          break
        case "settings":
          // Already on settings page
          break
        default:
          break
      }
    }
  }

  // Jika masih cek session (userId == null), tampilkan loading
  if (userId === null) {
    return <LoadingPage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white py-4 px-3 sm:py-6 sm:px-4 pb-24 md:pb-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="backdrop-blur-md bg-white/10 border border-white/20">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-blue-400/30 bg-blue-500/20">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="Profile picture" />
                    ) : (
                      <AvatarFallback className="bg-blue-500/30 text-white text-xl">
                        {watch("fullName")?.charAt(0) || "?"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {isEditing && (
                    <label
                      htmlFor="avatarFile"
                      className="absolute inset-0 flex items-center justify-center bg-blue-900/70 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                    >
                      <Upload className="h-8 w-8 text-white" />
                      <input id="avatarFile" type="file" className="sr-only" {...register("avatarFile")} />
                    </label>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <CardTitle className="text-white text-2xl mb-1">
                    {isLoading ? "Loading..." : watch("fullName") || "Your Profile"}
                  </CardTitle>
                  <CardDescription className="text-blue-200">Kelola data profil, email, dan password</CardDescription>
                </div>
                <div className="sm:ml-auto">
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Profil
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="bg-white/10 border-white/20 text-blue-100 hover:bg-white/20 hover:text-white"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Batal
                      </Button>
                      <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Simpan
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 p-1">
                  <TabsTrigger value="info" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                    <User className="h-4 w-4 mr-2" />
                    Informasi Profil
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Keamanan
                  </TabsTrigger>
                </TabsList>

                {/* TAB INFORMASI */}
                <TabsContent value="info" className="mt-6">
                  {isLoading ? (
                    <div className="space-y-6">
                      <div className="h-10 bg-white/5 animate-pulse rounded-md"></div>
                      <div className="h-10 bg-white/5 animate-pulse rounded-md"></div>
                      <div className="h-10 bg-white/5 animate-pulse rounded-md"></div>
                      <div className="h-10 bg-white/5 animate-pulse rounded-md"></div>
                      <div className="h-10 bg-white/5 animate-pulse rounded-md"></div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="text-blue-100 flex items-center">
                          <User className="h-4 w-4 mr-2 text-blue-300" />
                          Nama Lengkap
                        </Label>
                        <Input
                          id="fullName"
                          {...register("fullName")}
                          disabled={!isEditing}
                          className="bg-white/5 border-white/20 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-blue-400/20"
                        />
                        {errors.fullName && <p className="text-red-300 text-xs mt-1">{errors.fullName.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-blue-100 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-blue-300" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          disabled={!isEditing}
                          className="bg-white/5 border-white/20 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-blue-400/20"
                        />
                        {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="university" className="text-blue-100 flex items-center">
                          <School className="h-4 w-4 mr-2 text-blue-300" />
                          Universitas
                        </Label>
                        <Input
                          id="university"
                          {...register("university")}
                          disabled={!isEditing}
                          className="bg-white/5 border-white/20 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-blue-400/20"
                        />
                        {errors.university && <p className="text-red-300 text-xs mt-1">{errors.university.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="major" className="text-blue-100 flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-blue-300" />
                          Jurusan
                        </Label>
                        <Input
                          id="major"
                          {...register("major")}
                          disabled={!isEditing}
                          className="bg-white/5 border-white/20 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-blue-400/20"
                        />
                        {errors.major && <p className="text-red-300 text-xs mt-1">{errors.major.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="semester" className="text-blue-100 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-blue-300" />
                          Semester
                        </Label>
                        <Input
                          id="semester"
                          {...register("semester")}
                          disabled={!isEditing}
                          className="bg-white/5 border-white/20 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-blue-400/20"
                        />
                        {errors.semester && <p className="text-red-300 text-xs mt-1">{errors.semester.message}</p>}
                      </div>
                    </form>
                  )}
                </TabsContent>

                {/* TAB KEAMANAN */}
                <TabsContent value="security" className="mt-6">
                  {isLoading ? (
                    <div className="space-y-6">
                      <div className="h-10 bg-white/5 animate-pulse rounded-md"></div>
                      <div className="h-10 bg-white/5 animate-pulse rounded-md"></div>
                      <div className="h-10 bg-white/5 animate-pulse rounded-md"></div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="currentPassword" className="text-blue-100 flex items-center">
                          <Key className="h-4 w-4 mr-2 text-blue-300" />
                          Password Saat Ini
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          {...register("currentPassword")}
                          disabled={!isEditing}
                          className="bg-white/5 border-white/20 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-blue-400/20"
                        />
                        {errors.currentPassword && (
                          <p className="text-red-300 text-xs mt-1">{errors.currentPassword.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="newPassword" className="text-blue-100 flex items-center">
                          <Lock className="h-4 w-4 mr-2 text-blue-300" />
                          Password Baru
                        </Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...register("newPassword")}
                          disabled={!isEditing}
                          className="bg-white/5 border-white/20 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-blue-400/20"
                        />
                        {errors.newPassword && (
                          <p className="text-red-300 text-xs mt-1">{errors.newPassword.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword" className="text-blue-100 flex items-center">
                          <Lock className="h-4 w-4 mr-2 text-blue-300" />
                          Konfirmasi Password Baru
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...register("confirmPassword")}
                          disabled={!isEditing}
                          className="bg-white/5 border-white/20 text-white placeholder:text-blue-300/50 focus:border-blue-400 focus:ring-blue-400/20"
                        />
                        {errors.confirmPassword && (
                          <p className="text-red-300 text-xs mt-1">{errors.confirmPassword.message}</p>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-md">
                          <p className="text-sm text-blue-100 flex items-center">
                            <Shield className="h-4 w-4 mr-2 text-blue-300" />
                            Untuk mengubah password, klik &quot;Edit Profil&quot; terlebih dahulu.
                          </p>
                        </div>
                      )}
                    </form>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="border-t border-white/10 pt-4">
              <p className="text-sm text-blue-200">Terakhir diperbarui: {new Date().toLocaleDateString()}</p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-900/90 backdrop-blur-md border-t border-white/10 z-50 md:hidden">
        <div className="flex justify-around items-center py-2">
          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-1 h-auto py-2 ${
              activeBottomTab === "home" ? "text-white" : "text-blue-200"
            }`}
            onClick={() => handleTabClick("home")}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>
          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-1 h-auto py-2 ${
              activeBottomTab === "konsultasi" ? "text-white" : "text-blue-200"
            }`}
            onClick={() => handleTabClick("konsultasi")}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs">Konsultasi</span>
          </Button>
          <div className="-mt-5">
            <Button
              className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400/30 shadow-lg"
              size="icon"
              onClick={() => {}}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-1 h-auto py-2 ${
              activeBottomTab === "schedule" ? "text-white" : "text-blue-200"
            }`}
            onClick={() => handleTabClick("schedule")}
          >
            <CalendarIcon2 className="h-5 w-5" />
            <span className="text-xs">Jadwal</span>
          </Button>
          <Button
            variant="ghost"
            className={`flex flex-col items-center gap-1 h-auto py-2 ${
              activeBottomTab === "settings" ? "text-white" : "text-blue-200"
            }`}
            onClick={() => handleTabClick("settings")}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import bcrypt from "bcryptjs"
import { useRouter } from "next/navigation"

import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// --------------------
// Skema Validasi (Zod)
// --------------------
// Kita tambahkan field untuk fullName, university, major, semester.
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

  // Ambil userId dari session
  const [userId, setUserId] = useState<string | null>(null)

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
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
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

    try {
      // 1. Ambil encrypted_password dari DB (untuk cek currentPassword)
      const { data: userPassData, error: userPassError } = await supabase
        .from("users")
        .select("encrypted_password")
        .eq("id", userId)
        .single()

      if (userPassError || !userPassData) {
        toast({ title: "Error", description: "Gagal memeriksa password lama" })
        return
      }

      // 2. Bandingkan currentPassword (plaintext) dengan encrypted_password (hash)
      const match = await bcrypt.compare(
        formData.currentPassword,
        userPassData.encrypted_password
      )
      if (!match) {
        toast({ title: "Error", description: "Password saat ini tidak cocok" })
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
        toast({ title: "Error", description: "Gagal memperbarui data pengguna" })
        return
      }

      // 5. Jika ada file avatar baru, upload ke bucket
      let newAvatarUrl: string | null = null
      if (avatarFile && avatarFile instanceof File) {
        newAvatarUrl = await uploadAvatar(avatarFile)
      }

      // 6. Jika berhasil upload, update tabel profiles
      if (newAvatarUrl) {
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ avatar_url: newAvatarUrl })
          .eq("id", userId)

        if (profileUpdateError) {
          console.error("Error updating avatar_url:", profileUpdateError)
          toast({ title: "Error", description: "Gagal memperbarui avatar" })
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
      toast({ title: "Error", description: "Terjadi kesalahan saat memperbarui profil" })
    }
  }

  // Jika masih cek session (userId == null), tampilkan loading
  if (userId === null) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="w-20 h-20">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="Profile picture" />
            ) : (
              <AvatarFallback>?</AvatarFallback>
            )}
          </Avatar>
          <div>
            <CardTitle>Profil Anda</CardTitle>
            <CardDescription>Kelola data profil, email, dan password</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informasi Profil</TabsTrigger>
            <TabsTrigger value="security">Keamanan</TabsTrigger>
          </TabsList>

          {/* TAB INFORMASI */}
          <TabsContent value="info">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input id="fullName" {...register("fullName")} disabled={!isEditing} />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} disabled={!isEditing} />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="university">Universitas</Label>
                <Input id="university" {...register("university")} disabled={!isEditing} />
                {errors.university && (
                  <p className="text-red-500 text-sm mt-1">{errors.university.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="major">Jurusan</Label>
                <Input id="major" {...register("major")} disabled={!isEditing} />
                {errors.major && (
                  <p className="text-red-500 text-sm mt-1">{errors.major.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Input id="semester" {...register("semester")} disabled={!isEditing} />
                {errors.semester && (
                  <p className="text-red-500 text-sm mt-1">{errors.semester.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="avatarFile">Avatar</Label>
                <Input
                  id="avatarFile"
                  type="file"
                  {...register("avatarFile")}
                  disabled={!isEditing}
                />
                {errors.avatarFile && (
                  <p className="text-red-500 text-sm mt-1">{String(errors.avatarFile.message)}</p>
                )}
              </div>

              {isEditing ? (
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit">Simpan Perubahan</Button>
                </div>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit Profil
                </Button>
              )}
            </form>
          </TabsContent>

          {/* TAB KEAMANAN */}
          <TabsContent value="security">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...register("currentPassword")}
                  disabled={!isEditing}
                />
                {errors.currentPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...register("newPassword")}
                  disabled={!isEditing}
                />
                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  disabled={!isEditing}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {isEditing ? (
                <Button type="submit">Ubah Password</Button>
              ) : (
                <p className="text-sm text-gray-500">
                  Untuk mengubah password, klik &quot;Edit Profil&quot; terlebih dahulu.
                </p>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter>
        <p className="text-sm text-gray-500">
          Terakhir diperbarui: {new Date().toLocaleDateString()}
        </p>
      </CardFooter>
    </Card>
  )
}

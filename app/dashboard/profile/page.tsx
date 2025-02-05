import type { Metadata } from "next"
import ProfileContent from "../../components/ProfileContent"

export const metadata: Metadata = {
  title: "Profil Pengguna | KampusKarirKu",
  description: "Kelola informasi profil Anda di KampusKarirKu",
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen ">
   
        <ProfileContent />
      </div>
   
  )
}


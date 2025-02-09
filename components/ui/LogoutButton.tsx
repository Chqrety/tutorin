// app/components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // Hapus session dari sessionStorage (sesuaikan dengan implementasi session Anda)
    sessionStorage.removeItem("userSession");
    // Redirect ke halaman login (atau halaman utama)
    router.push("/login");
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      Logout
    </Button>
  );
}

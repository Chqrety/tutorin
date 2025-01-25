"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

type Notifikasi = {
  id: number
  pesan: string
  dibaca: boolean
  tanggal: string
}

export default function SistemNotifikasi() {
  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>([])

  useEffect(() => {
    // Simulasi mendapatkan notifikasi dari server
    const notifikasiAwal = [
      { id: 1, pesan: "Jadwal konsultasi Anda besok pukul 10:00", dibaca: false, tanggal: "2023-06-20" },
      { id: 2, pesan: "Ada balasan baru pada postingan Anda", dibaca: false, tanggal: "2023-06-19" },
      { id: 3, pesan: "Konselor Anda telah mengubah jadwal konsultasi", dibaca: true, tanggal: "2023-06-18" },
    ]
    setNotifikasi(notifikasiAwal)
  }, [])

  const jumlahBelumDibaca = notifikasi.filter((n) => !n.dibaca).length

  const tandaiSebagaiDibaca = (id: number) => {
    setNotifikasi(notifikasi.map((n) => (n.id === id ? { ...n, dibaca: true } : n)))
  }

  const tandaiSemuaSebagaiDibaca = () => {
    setNotifikasi(notifikasi.map((n) => ({ ...n, dibaca: true })))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {jumlahBelumDibaca > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 px-2 py-1">
              {jumlahBelumDibaca}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          Notifikasi
          <Button variant="ghost" size="sm" onClick={tandaiSemuaSebagaiDibaca}>
            Tandai semua dibaca
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifikasi.length === 0 ? (
          <DropdownMenuItem>Tidak ada notifikasi</DropdownMenuItem>
        ) : (
          notifikasi.map((n) => (
            <DropdownMenuItem key={n.id} onSelect={() => tandaiSebagaiDibaca(n.id)}>
              <div className={`flex flex-col ${n.dibaca ? "opacity-50" : ""}`}>
                <span>{n.pesan}</span>
                <span className="text-xs text-gray-500">{n.tanggal}</span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


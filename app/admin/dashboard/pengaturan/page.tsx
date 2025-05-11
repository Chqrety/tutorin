"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPengaturanPage() {
  const [settings, setSettings] = useState({
    siteName: "TUTORIN",
    adminEmail: "admin@TUTORIN.com",
    maxConsultationsPerDay: "10",
  })

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the settings to your backend
    console.log("Saving settings:", settings)
    alert("Settings saved successfully!")
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Pengaturan Admin</h2>

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Umum</CardTitle>
          <CardDescription>Konfigurasi pengaturan umum untuk platform konsultasi.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="siteName">Nama Situs</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="adminEmail">Email Admin</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="maxConsultations">Maksimum Konsultasi per Hari</Label>
                <Input
                  id="maxConsultations"
                  type="number"
                  value={settings.maxConsultationsPerDay}
                  onChange={(e) => setSettings({ ...settings, maxConsultationsPerDay: e.target.value })}
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Batal</Button>
          <Button onClick={handleSaveSettings}>Simpan Pengaturan</Button>
        </CardFooter>
      </Card>
    </div>
  )
}


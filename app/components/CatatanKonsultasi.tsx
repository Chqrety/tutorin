"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

type Catatan = {
  id: number
  tanggal: string
  judul: string
  isi: string
}

export default function CatatanKonsultasi() {
  const [catatan, setCatatan] = useState<Catatan[]>([])
  const [judul, setJudul] = useState("")
  const [isi, setIsi] = useState("")

  const tambahCatatan = () => {
    if (judul && isi) {
      const newCatatan: Catatan = {
        id: Date.now(),
        tanggal: new Date().toLocaleDateString("id-ID"),
        judul,
        isi,
      }
      setCatatan([newCatatan, ...catatan])
      setJudul("")
      setIsi("")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Catatan Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="judul" className="block text-sm font-medium text-gray-700">
                Judul
              </label>
              <Input
                id="judul"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Masukkan judul catatan"
              />
            </div>
            <div>
              <label htmlFor="isi" className="block text-sm font-medium text-gray-700">
                Isi Catatan
              </label>
              <Textarea
                id="isi"
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                placeholder="Tulis catatan Anda di sini"
                rows={4}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={tambahCatatan}>Simpan Catatan</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catatan Konsultasi</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {catatan.map((item) => (
              <div key={item.id} className="mb-4 p-4 border rounded">
                <h3 className="font-semibold">{item.judul}</h3>
                <p className="text-sm text-gray-500 mb-2">{item.tanggal}</p>
                <p>{item.isi}</p>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}


"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Star } from "lucide-react"

type Ulasan = {
  id: number
  nama: string
  peringkat: number
  komentar: string
  tanggal: string
}

export default function SistemPeringkatUlasan() {
  const [ulasan, setUlasan] = useState<Ulasan[]>([])
  const [nama, setNama] = useState("")
  const [peringkat, setPeringkat] = useState(0)
  const [komentar, setKomentar] = useState("")

  const tambahUlasan = () => {
    if (nama && peringkat && komentar) {
      const newUlasan: Ulasan = {
        id: Date.now(),
        nama,
        peringkat,
        komentar,
        tanggal: new Date().toLocaleDateString("id-ID"),
      }
      setUlasan([newUlasan, ...ulasan])
      setNama("")
      setPeringkat(0)
      setKomentar("")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Berikan Ulasan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="nama" className="block text-sm font-medium text-gray-700">
                Nama
              </label>
              <Input
                id="nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama Anda"
              />
            </div>
            <div>
              <label htmlFor="peringkat" className="block text-sm font-medium text-gray-700">
                Peringkat
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button key={star} variant="ghost" size="sm" onClick={() => setPeringkat(star)}>
                    <Star
                      className={`h-6 w-6 ${star <= peringkat ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    />
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="komentar" className="block text-sm font-medium text-gray-700">
                Komentar
              </label>
              <Textarea
                id="komentar"
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
                placeholder="Tulis komentar Anda di sini"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={tambahUlasan}>Kirim Ulasan</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ulasan Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {ulasan.map((item) => (
              <div key={item.id} className="mb-4 p-4 border rounded">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{item.nama}</h3>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= item.peringkat ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.komentar}</p>
                <p className="text-xs text-gray-500">{item.tanggal}</p>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}


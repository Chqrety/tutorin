"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, X } from "lucide-react"

type PortofolioItem = {
  id: number
  judul: string
  deskripsi: string
  gambar: string
}

export default function GaleriPortofolio() {
  const [items, setItems] = useState<PortofolioItem[]>([])
  const [judul, setJudul] = useState("")
  const [deskripsi, setDeskripsi] = useState("")
  const [gambar, setGambar] = useState("")

  const tambahItem = () => {
    if (judul && deskripsi && gambar) {
      const newItem: PortofolioItem = {
        id: Date.now(),
        judul,
        deskripsi,
        gambar,
      }
      setItems([...items, newItem])
      setJudul("")
      setDeskripsi("")
      setGambar("")
    }
  }

  const hapusItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Item Portofolio</CardTitle>
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
                placeholder="Masukkan judul item"
              />
            </div>
            <div>
              <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700">
                Deskripsi
              </label>
              <Textarea
                id="deskripsi"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Jelaskan tentang item portofolio Anda"
                rows={3}
              />
            </div>
            <div>
              <label htmlFor="gambar" className="block text-sm font-medium text-gray-700">
                URL Gambar
              </label>
              <Input
                id="gambar"
                value={gambar}
                onChange={(e) => setGambar(e.target.value)}
                placeholder="Masukkan URL gambar"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={tambahItem}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah Item
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Galeri Portofolio</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => hapusItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-lg">{item.judul}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={item.gambar || "/placeholder.svg"}
                      alt={item.judul}
                      className="w-full h-40 object-cover mb-2 rounded"
                    />
                    <p className="text-sm text-gray-600">{item.deskripsi}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}


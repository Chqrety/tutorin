import "./globals.css"
import { Inter } from "next/font/google"
import { ToastProvider, ToastViewport } from "@/components/ui/toast"
const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "DoscomKonsultan - Konsultasi Minat Bakat Mahasiswa",
  description: "Temukan potensi terbaikmu dan raih karir impianmu",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          {children}
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  )
}

  
import "./globals.css"
import { Inter } from "next/font/google"
// import { ToastProvider, ToastViewport } from "@/components/ui/toast"
import { HeroUIProvider } from "@heroui/system"
import { ToastContainer } from "react-toastify"
import { Slide, Zoom, Flip, Bounce } from "react-toastify"
const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "DoscomKonsultan - Konsultasi Minat Bakat Mahasiswa",
  description: "Temukan potensi terbaikmu dan raih karir impianmu",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <HeroUIProvider>
          {/* <ToastProvider> */}
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            // hideProgressBar
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            stacked
            transition={Flip}
          />
          {/* <ToastViewport /> */}
          {/* </ToastProvider> */}
        </HeroUIProvider>
      </body>
    </html>
  )
}

"use client"

import * as React from "react"

type ToastOptions = {
  variant?: "default" | "destructive"
  title?: string
  description?: string
}

// Hook sederhana, tanpa integrasi store global:
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastOptions[]>([])

  // Fungsi "toast" untuk menambah toast ke dalam state
  function toast(options: ToastOptions) {
    setToasts((prev) => [...prev, options])
    // Anda bisa menambahkan logika penjadwalan auto-dismiss, dsb.
  }

  // Anda juga bisa menambahkan fungsi removeToast, dsb.
  // ...

  return {
    toasts,
    toast,
  }
}

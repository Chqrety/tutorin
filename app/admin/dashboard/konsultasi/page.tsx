"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  ChevronRight,
  MessageCircle,
  Send,
  History,
  MessageSquare,
  X,
  AlertCircle,
  User,
} from "lucide-react"

type Message = {
  id: number
  sender: "user" | "admin"
  content: string
  timestamp: Date
  full_name?: string
  avatar_url?: string
}

type Consultation = {
  id: number
  topic: string
  messages: Message[]
  status: "active" | "closed"
  created_at?: string
}

const TypingIndicator = () => (
  <div className="flex items-center gap-1 p-2 rounded-lg bg-muted w-16">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.2}s` }}
      ></div>
    ))}
  </div>
)

export default function AdminKonsultasiPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [activeConsultation?.messages])

  // Check admin session
  useEffect(() => {
    const adminSession = sessionStorage.getItem("adminSession")
    if (adminSession) {
      setIsLoggedIn(true)
    } else {
      router.push("/admin/login")
    }
  }, [router])

  // Fetch consultations and related messages
  useEffect(() => {
    if (!isLoggedIn) return

    const fetchConsultations = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("consultations")
          .select("id, topic, status, created_at")
          .order("created_at", { ascending: false })

        if (error) throw error

        const consultationsWithMessages = await Promise.all(
          data.map(async (consultation) => {
            const { data: messages, error: messagesError } = await supabase
              .from("messages")
              .select("*, users(full_name), profiles(avatar_url)")
              .eq("consultation_id", consultation.id)
              .order("timestamp", { ascending: true })

            if (messagesError) throw messagesError

            return {
              ...consultation,
              messages: messages.map((msg) => ({
                ...msg,
                full_name: msg.users?.full_name || "Pengguna",
                avatar_url: msg.profiles?.avatar_url || "/default-avatar.png",
                timestamp: new Date(msg.timestamp),
              })),
            }
          }),
        )

        setConsultations(consultationsWithMessages)
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching consultations:", err)
        setIsLoading(false)
      }
    }

    fetchConsultations()
  }, [isLoggedIn])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!isLoggedIn) return

    const messageSubscription = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const newMsg = payload.new

        // Prevent message duplication
        if (
          activeConsultation?.messages.some((msg) => msg.id === newMsg.id) ||
          consultations.some((c) => c.messages.some((msg) => msg.id === newMsg.id))
        ) {
          return
        }

        try {
          // Get user and profile data
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", newMsg.user_id)
            .single()

          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", newMsg.user_id)
            .single()

          if (userError || profileError) {
            console.error("Error fetching user or profile data:", userError || profileError)
          }

          const enrichedMessage = {
            ...newMsg,
            full_name: userData?.full_name || "Pengguna",
            avatar_url: profileData?.avatar_url || "/default-avatar.png",
            timestamp: new Date(newMsg.timestamp),
          }

          // Add message to related consultation
          setConsultations((prev) =>
            prev.map((consultation) =>
              consultation.id === newMsg.consultation_id
                ? {
                    ...consultation,
                    messages: [...consultation.messages, enrichedMessage],
                  }
                : consultation,
            ),
          )

          // If active consultation, update activeConsultation state
          if (activeConsultation?.id === newMsg.consultation_id) {
            setActiveConsultation((prev) =>
              prev
                ? {
                    ...prev,
                    messages: [...prev.messages, enrichedMessage],
                  }
                : null,
            )
          }
        } catch (err) {
          console.error("Error enriching message data:", err)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(messageSubscription)
    }
  }, [isLoggedIn, activeConsultation, consultations])

  // Real-time subscription for consultation status updates
  useEffect(() => {
    if (!isLoggedIn) return

    const consultationChannel = supabase
      .channel("consultations-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "consultations",
        },
        (payload) => {
          const updatedConsultation = payload.new
          // Update consultations list
          setConsultations((prev) =>
            prev.map((consultation) =>
              consultation.id === updatedConsultation.id
                ? { ...consultation, status: updatedConsultation.status }
                : consultation,
            ),
          )
          // Update activeConsultation if relevant
          if (activeConsultation?.id === updatedConsultation.id) {
            setActiveConsultation((prev) => (prev ? { ...prev, status: updatedConsultation.status } : null))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(consultationChannel)
    }
  }, [isLoggedIn, activeConsultation])

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConsultation) {
      return
    }

    const adminSession = sessionStorage.getItem("adminSession")
    if (!adminSession) {
      console.error("Admin ID tidak ditemukan.")
      return
    }

    try {
      const { adminId } = JSON.parse(adminSession)
      const payload = {
        consultation_id: activeConsultation.id,
        sender: "admin",
        content: newMessage,
        admin_id: adminId,
      }

      const { data, error } = await supabase.from("messages").insert(payload).select("*").single()

      if (error) throw error

      const newMsg: Message = {
        id: data.id,
        sender: "admin",
        content: data.content,
        timestamp: new Date(data.timestamp),
      }

      const updatedConsultation = {
        ...activeConsultation,
        messages: [...activeConsultation.messages, newMsg],
      }

      setActiveConsultation(updatedConsultation)
      setConsultations((prev) => prev.map((c) => (c.id === updatedConsultation.id ? updatedConsultation : c)))
      setNewMessage("")
    } catch (err) {
      console.error("Error sending message:", err)
    }
  }

  // Close consultation function
  const closeConsultation = async () => {
    if (!activeConsultation) {
      console.error("Tidak ada konsultasi yang aktif untuk ditutup.")
      return
    }

    try {
      const { error } = await supabase
        .from("consultations")
        .update({ status: "closed" })
        .eq("id", activeConsultation.id)

      if (error) throw error

      setConsultations((prev) => prev.map((c) => (c.id === activeConsultation.id ? { ...c, status: "closed" } : c)))
      setActiveConsultation(null)
      setIsCloseDialogOpen(false)
    } catch (err) {
      console.error("Error closing consultation:", err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Admin Konsultasi</h1>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Konsultasi Aktif
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" /> Riwayat Konsultasi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-3")}>
              {/* Consultation List - Hidden on mobile when a chat is active */}
              <div className={cn("col-span-1", isMobile && activeConsultation ? "hidden" : "block")}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Daftar Konsultasi Aktif</CardTitle>
                    <CardDescription>Pilih konsultasi untuk memulai percakapan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : consultations.filter((c) => c.status === "active").length > 0 ? (
                      <ScrollArea className="h-[500px] pr-4">
                        {consultations
                          .filter((c) => c.status === "active")
                          .map((consultation) => {
                            const userMessage = consultation.messages.find((msg) => msg.sender === "user")
                            return (
                              <div
                                key={consultation.id}
                                className={cn(
                                  "mb-3 p-3 rounded-lg cursor-pointer transition-all relative border",
                                  activeConsultation?.id === consultation.id
                                    ? "bg-muted border-primary"
                                    : "hover:bg-muted/50",
                                )}
                                onClick={() => setActiveConsultation(consultation)}
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={userMessage?.avatar_url || "/default-avatar.png"} />
                                    <AvatarFallback>
                                      <User className="h-5 w-5" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                      <h3 className="font-medium line-clamp-1">{consultation.topic}</h3>
                                      <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground flex-shrink-0" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatDate(consultation.created_at)}
                                    </p>
                                    {consultation.messages.length > 0 && (
                                      <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                                        {consultation.messages[consultation.messages.length - 1].content}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>Belum ada konsultasi aktif</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Chat Area - Full width on mobile */}
              <div
                className={cn(
                  isMobile ? "col-span-1" : "col-span-2",
                  isMobile && !activeConsultation ? "hidden" : "block",
                )}
              >
                <Card className="h-full">
                  {activeConsultation ? (
                    <>
                      <CardHeader className="pb-3">
                        <div className="flex items-center">
                          {isMobile && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mr-2"
                              onClick={() => setActiveConsultation(null)}
                            >
                              <ArrowLeft className="h-4 w-4" />
                              <span className="sr-only">Kembali</span>
                            </Button>
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-lg">{activeConsultation.topic}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  activeConsultation.status === "active"
                                    ? "bg-green-100 text-green-800 border-green-300"
                                    : "bg-gray-100 text-gray-800 border-gray-300"
                                }
                              >
                                {activeConsultation.status === "active" ? "Aktif" : "Selesai"}
                              </Badge>
                              <span className="text-xs">{formatDate(activeConsultation.created_at)}</span>
                            </CardDescription>
                          </div>
                          {activeConsultation.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              onClick={() => setIsCloseDialogOpen(true)}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Tutup Konsultasi</span>
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[500px] pr-4">
                          <div className="space-y-4">
                            {activeConsultation.messages.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <p>Belum ada pesan. Mulai percakapan sekarang!</p>
                              </div>
                            ) : (
                              activeConsultation.messages.map((message, index) => (
                                <div
                                  key={index}
                                  className={cn("flex", message.sender === "admin" ? "justify-end" : "justify-start")}
                                >
                                  <div
                                    className={cn(
                                      "max-w-[80%] rounded-lg p-3",
                                      message.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-muted",
                                    )}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage
                                          src={message.avatar_url || "/default-avatar.png"}
                                          alt={message.full_name || "User"}
                                        />
                                        <AvatarFallback>{message.sender === "admin" ? "A" : "U"}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs font-medium">
                                        {message.sender === "admin" ? "Admin" : message.full_name || "Pengguna"}
                                      </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p
                                      className={cn(
                                        "text-xs mt-1 text-right",
                                        message.sender === "admin"
                                          ? "text-primary-foreground/70"
                                          : "text-muted-foreground",
                                      )}
                                    >
                                      {message.timestamp.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                            {isTyping && (
                              <div className="flex justify-start">
                                <TypingIndicator />
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>
                        </ScrollArea>
                      </CardContent>
                      <CardFooter>
                        {activeConsultation.status === "active" ? (
                          <div className="flex w-full gap-2">
                            <Textarea
                              placeholder="Ketik pesan Anda..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="min-h-[60px]"
                            />
                            <Button onClick={sendMessage} size="icon" className="h-auto">
                              <Send className="h-4 w-4" />
                              <span className="sr-only">Kirim</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="w-full text-center py-2 text-muted-foreground bg-muted rounded-lg">
                            Konsultasi ini telah selesai
                          </div>
                        )}
                      </CardFooter>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[500px] text-center p-4">
                      <MessageSquare className="h-16 w-16 mb-4 text-muted-foreground opacity-20" />
                      <h3 className="text-lg font-medium mb-2">Belum ada konsultasi yang dipilih</h3>
                      <p className="text-muted-foreground mb-6">
                        Pilih konsultasi dari daftar untuk memulai percakapan
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Konsultasi</CardTitle>
                <CardDescription>Konsultasi yang telah selesai</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : consultations.filter((c) => c.status === "closed").length > 0 ? (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="grid gap-4">
                      {consultations
                        .filter((c) => c.status === "closed")
                        .map((consultation) => {
                          const userMessage = consultation.messages.find((msg) => msg.sender === "user")
                          return (
                            <Card key={consultation.id} className="overflow-hidden">
                              <CardHeader className="pb-3">
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={userMessage?.avatar_url || "/default-avatar.png"} />
                                    <AvatarFallback>
                                      <User className="h-5 w-5" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <CardTitle className="text-base">{consultation.topic}</CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                                        Selesai
                                      </Badge>
                                      <span className="text-xs">{formatDate(consultation.created_at)}</span>
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardFooter className="pt-0">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setActiveConsultation(consultation)
                                    document.querySelector('[data-value="active"]')?.click()
                                  }}
                                >
                                  Lihat Detail
                                </Button>
                              </CardFooter>
                            </Card>
                          )
                        })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Belum ada riwayat konsultasi</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Close Consultation Confirmation Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Konsultasi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menutup konsultasi ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={closeConsultation} className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Tutup Konsultasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
import { Input } from "@/components/ui/input"
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
  MessageCircle,
  Send,
  History,
  MessageSquare,
  X,
  AlertCircle,
  User,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Calendar,
  Bell,
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
  user_id?: string
  user_name?: string
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
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all")
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
          .select("id, topic, status, created_at, user_id")
          .order("created_at", { ascending: false })

        if (error) throw error

        // Fetch user names for each consultation
        const consultationsWithUserNames = await Promise.all(
          data.map(async (consultation) => {
            // Skip user data fetching if user_id is missing
            if (!consultation.user_id) {
              return { ...consultation, user_name: "Unknown User" }
            }

            try {
              const { data: userData } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", consultation.user_id)
                .maybeSingle() // Use maybeSingle instead of single to avoid errors if no record is found

              return {
                ...consultation,
                user_name: userData?.full_name || "Unknown User",
              }
            } catch (err) {
              console.error("Error fetching user data for ID:", consultation.user_id, err)
              return { ...consultation, user_name: "Unknown User" }
            }
          }),
        )

        const consultationsWithMessages = await Promise.all(
          consultationsWithUserNames.map(async (consultation) => {
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

  const formatTime = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Filter consultations based on search query and status filter
  const filteredConsultations = consultations.filter((consultation) => {
    const matchesSearch =
      consultation.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultation.user_name?.toLowerCase().includes(searchQuery.toLowerCase())

    if (statusFilter === "all") return matchesSearch
    return matchesSearch && consultation.status === statusFilter
  })

  // Get active and closed consultations
  const activeConsultations = filteredConsultations.filter((c) => c.status === "active")
  const closedConsultations = filteredConsultations.filter((c) => c.status === "closed")

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Admin Konsultasi</h1>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari konsultasi..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "closed")}
              >
                <option value="all">Semua</option>
                <option value="active">Aktif</option>
                <option value="closed">Selesai</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Stats Cards */}
          <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  Total Konsultasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{consultations.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeConsultations.length} aktif, {closedConsultations.length} selesai
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Konsultasi Aktif
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeConsultations.length}</div>
                <p className="text-xs text-muted-foreground">Perlu ditanggapi</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Konsultasi Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {consultations.length > 0 ? formatTime(consultations[0].created_at) : "-"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {consultations.length > 0 ? formatDate(consultations[0].created_at) : "Tidak ada data"}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4 text-purple-500" />
                  Pesan Belum Dibaca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Semua pesan telah dibaca</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-12">
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
                <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-12")}>
                  {/* Consultation List - Hidden on mobile when a chat is active */}
                  <div className={cn("md:col-span-4", isMobile && activeConsultation ? "hidden" : "block")}>
                    <Card className="h-full">
                      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-transparent">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageCircle className="h-5 w-5 text-blue-500" /> Daftar Konsultasi Aktif
                        </CardTitle>
                        <CardDescription>Pilih konsultasi untuk memulai percakapan</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        {isLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : activeConsultations.length > 0 ? (
                          <ScrollArea className="h-[600px]">
                            <div className="divide-y">
                              {activeConsultations.map((consultation) => {
                                const userMessage = consultation.messages.find((msg) => msg.sender === "user")
                                const lastMessage = consultation.messages[consultation.messages.length - 1]
                                return (
                                  <div
                                    key={consultation.id}
                                    className={cn(
                                      "p-4 cursor-pointer transition-all relative hover:bg-muted/50",
                                      activeConsultation?.id === consultation.id &&
                                        "bg-muted border-l-4 border-primary",
                                    )}
                                    onClick={() => setActiveConsultation(consultation)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <Avatar className="h-10 w-10 border">
                                        <AvatarImage src={userMessage?.avatar_url || "/default-avatar.png"} />
                                        <AvatarFallback className="bg-blue-100 text-blue-600">
                                          <User className="h-5 w-5" />
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                          <h3 className="font-medium line-clamp-1">{consultation.user_name}</h3>
                                          <span className="text-xs text-muted-foreground">
                                            {lastMessage ? formatTime(lastMessage.timestamp.toISOString()) : ""}
                                          </span>
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground line-clamp-1 mt-0.5">
                                          {consultation.topic}
                                        </p>
                                        {consultation.messages.length > 0 && (
                                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                            {lastMessage.sender === "admin" ? "Anda: " : ""}
                                            {lastMessage.content}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                          <Badge
                                            variant="outline"
                                            className="bg-green-100 text-green-800 border-green-300 text-xs"
                                          >
                                            Aktif
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {formatDate(consultation.created_at)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-center py-12 px-4">
                            <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                              <MessageSquare className="h-8 w-8 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Belum ada konsultasi aktif</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                              Saat ini tidak ada konsultasi aktif yang perlu ditanggapi.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chat Area - Full width on mobile */}
                  <div
                    className={cn(
                      isMobile ? "col-span-1" : "md:col-span-8",
                      isMobile && !activeConsultation ? "hidden" : "block",
                    )}
                  >
                    <Card className="h-full border-2 border-muted">
                      {activeConsultation ? (
                        <>
                          <CardHeader className="pb-3 border-b bg-gradient-to-r from-blue-50 to-transparent">
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
                              <Avatar className="h-10 w-10 mr-3 border">
                                <AvatarImage
                                  src={
                                    activeConsultation.messages.find((msg) => msg.sender === "user")?.avatar_url ||
                                    "/default-avatar.png" ||
                                    "/placeholder.svg" ||
                                    "/placeholder.svg"
                                  }
                                />
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  <User className="h-5 w-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <CardTitle className="text-lg">{activeConsultation.user_name}</CardTitle>
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
                                  <span className="text-xs flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(activeConsultation.created_at)}
                                  </span>
                                </CardDescription>
                              </div>
                              {activeConsultation.status === "active" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                  onClick={() => setIsCloseDialogOpen(true)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Tutup Konsultasi
                                </Button>
                              )}
                            </div>
                            <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                              <div className="flex items-start gap-2">
                                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Topik Konsultasi</p>
                                  <p className="text-sm text-muted-foreground">{activeConsultation.topic}</p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <ScrollArea className="h-[450px]">
                              <div className="p-4 space-y-4">
                                {activeConsultation.messages.length === 0 ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <p>Belum ada pesan. Mulai percakapan sekarang!</p>
                                  </div>
                                ) : (
                                  activeConsultation.messages.map((message, index) => (
                                    <div
                                      key={index}
                                      className={cn(
                                        "flex",
                                        message.sender === "admin" ? "justify-end" : "justify-start",
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "max-w-[80%] rounded-lg p-3",
                                          message.sender === "admin"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted",
                                        )}
                                      >
                                        <div className="flex items-center gap-2 mb-1">
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage
                                              src={message.avatar_url || "/default-avatar.png"}
                                              alt={message.full_name || "User"}
                                            />
                                            <AvatarFallback
                                              className={
                                                message.sender === "admin"
                                                  ? "bg-primary-foreground text-primary"
                                                  : "bg-blue-100 text-blue-600"
                                              }
                                            >
                                              {message.sender === "admin" ? "A" : "U"}
                                            </AvatarFallback>
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
                          <CardFooter className="border-t p-3">
                            {activeConsultation.status === "active" ? (
                              <div className="flex w-full gap-2">
                                <Textarea
                                  placeholder="Ketik pesan Anda..."
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  className="min-h-[60px] resize-none"
                                />
                                <Button onClick={sendMessage} size="icon" className="h-auto bg-primary">
                                  <Send className="h-4 w-4" />
                                  <span className="sr-only">Kirim</span>
                                </Button>
                              </div>
                            ) : (
                              <div className="w-full text-center py-3 text-muted-foreground bg-muted rounded-lg">
                                <XCircle className="h-4 w-4 inline mr-2" />
                                Konsultasi ini telah selesai
                              </div>
                            )}
                          </CardFooter>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[600px] text-center p-4">
                          <div className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center mb-4">
                            <MessageSquare className="h-12 w-12 text-blue-500" />
                          </div>
                          <h3 className="text-xl font-medium mb-2">Belum ada konsultasi yang dipilih</h3>
                          <p className="text-muted-foreground mb-6 max-w-md">
                            Pilih konsultasi dari daftar untuk memulai percakapan. Anda dapat melihat semua konsultasi
                            aktif di panel sebelah kiri.
                          </p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <Card>
                  <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-transparent">
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-gray-500" /> Riwayat Konsultasi
                    </CardTitle>
                    <CardDescription>Konsultasi yang telah selesai</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : closedConsultations.length > 0 ? (
                      <ScrollArea className="h-[600px] pr-4">
                        <div className="grid gap-4">
                          {closedConsultations.map((consultation) => {
                            const userMessage = consultation.messages.find((msg) => msg.sender === "user")
                            const messageCount = consultation.messages.length
                            return (
                              <Card key={consultation.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-10 w-10 border">
                                      <AvatarImage src={userMessage?.avatar_url || "/default-avatar.png"} />
                                      <AvatarFallback className="bg-gray-100 text-gray-600">
                                        <User className="h-5 w-5" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">{consultation.user_name}</CardTitle>
                                        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                                          Selesai
                                        </Badge>
                                      </div>
                                      <CardDescription className="mt-1">{consultation.topic}</CardDescription>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {formatDate(consultation.created_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <MessageSquare className="h-3 w-3" />
                                          {messageCount} pesan
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardFooter className="pt-0 flex justify-end">
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
                      <div className="text-center py-12">
                        <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <History className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Belum ada riwayat konsultasi</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Semua konsultasi yang telah selesai akan muncul di sini. Saat ini belum ada konsultasi yang
                          selesai.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
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

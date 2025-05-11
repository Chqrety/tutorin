"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  Clock,
  CheckCircle2,
  Bell,
  Search,
  X,
  AlertCircle,
  XCircle,
  Info,
  Calendar,
  User,
} from "lucide-react"

// =============================================================
// Types
// =============================================================
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
  status: "queued" | "active" | "closed"
  created_at?: string
  user_id?: string
  user_name?: string
}

// =============================================================
// Component
// =============================================================
export default function AdminKonsultasiPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [queuedConsultations, setQueuedConsultations] = useState<Consultation[]>([])
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "queued" | "active" | "closed">("all")
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeConsultation?.messages])

  // Session check
  useEffect(() => {
    const adminSession = sessionStorage.getItem("adminSession")
    if (adminSession) setIsLoggedIn(true)
    else router.push("/admin/login")
  }, [router])

  // Fetch and split by status
  useEffect(() => {
    if (!isLoggedIn) return
    const fetchConsultations = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("consultations")
          .select("id, topic, status, created_at, user_id")
          .order("created_at", { ascending: false })
        if (error) throw error

        // enrich user
        const withUser = await Promise.all(
          data.map(async (c) => {
            if (!c.user_id) return { ...c, user_name: "Unknown User" }
            const { data: u } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", c.user_id)
              .maybeSingle()
            return { ...c, user_name: u?.full_name || "Unknown User" }
          }),
        )

        // enrich messages
        const enriched = await Promise.all(
          withUser.map(async (c) => {
            const { data: msgs, error: me } = await supabase
              .from("messages")
              .select("*, users(full_name), profiles(avatar_url)")
              .eq("consultation_id", c.id)
              .order("timestamp", { ascending: true })
            if (me) throw me
            return {
              ...c,
              messages: msgs.map((m: any) => ({
                id: m.id,
                sender: m.sender,
                content: m.content,
                timestamp: new Date(m.timestamp),
                full_name: m.users?.full_name || "Pengguna",
                avatar_url: m.profiles?.avatar_url || "/default-avatar.png",
              })),
            }
          }),
        )

        setConsultations(enriched)
        setQueuedConsultations(enriched.filter((c) => c.status === "queued"))
      } catch (err) {
        console.error("Error fetching:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchConsultations()
  }, [isLoggedIn])

  // Realtime new messages
  useEffect(() => {
      if (!isLoggedIn) return
      const sub = supabase
        .channel("messages-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          async ({ new: newMsg }: any) => {
            const { data: u } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", newMsg.user_id)
              .single()
            const { data: p } = await supabase
              .from("profiles")
              .select("avatar_url")
              .eq("id", newMsg.user_id)
              .single()
            const msg: Message = {
              id: newMsg.id,
              sender: newMsg.sender,
              content: newMsg.content,
              timestamp: new Date(newMsg.timestamp),
              full_name: u?.full_name || "Pengguna",
              avatar_url: p?.avatar_url || "/default-avatar.png",
            }
            setConsultations((prev) =>
              prev.map((c) =>
                c.id === newMsg.consultation_id
                  ? { ...c, messages: [...c.messages, msg] }
                  : c,
              ),
            )
            if (activeConsultation?.id === newMsg.consultation_id) {
              setActiveConsultation((prev) =>
                prev ? { ...prev, messages: [...prev.messages, msg] } : null,
              )
            }
          },
        )
        .subscribe()
      return () => {
        supabase.removeChannel(sub)
      }
    }, [isLoggedIn, activeConsultation])

  // Realtime status
    useEffect(() => {
    if (!isLoggedIn) return
    const sub = supabase
      .channel("consultations-channel")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "consultations" },
        ({ new: up }: any) => {
          setConsultations((prev) =>
            prev.map((c) => (c.id === up.id ? { ...c, status: up.status } : c)),
          )
          setQueuedConsultations((prev) =>
            up.status === "queued"
              ? [...prev.filter((c) => c.id !== up.id), up]
              : prev.filter((c) => c.id !== up.id),
          )
        },
      )
      .subscribe()
  
    return () => {
      // Ensure the cleanup function does not return a Promise
      supabase.removeChannel(sub).catch((error) => {
        console.error("Failed to remove channel:", error)
      })
    }
  }, [isLoggedIn, activeConsultation])

  // Actions
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConsultation) return
    const session = sessionStorage.getItem("adminSession")!
    const { adminId } = JSON.parse(session)
    const { error } = await supabase.from("messages").insert({
      consultation_id: activeConsultation.id,
      sender: "admin",
      content: newMessage,
      admin_id: adminId,
    })
    if (error) console.error(error)
    else setNewMessage("")
  }

  const takeConsultation = async (c: Consultation) => {
    const session = sessionStorage.getItem("adminSession")!
    const { adminId } = JSON.parse(session)
    const { error } = await supabase
      .from("consultations")
      .update({ status: "active", consultant_id: adminId })
      .eq("id", c.id)
    if (error) console.error(error)
  }

  const closeConsultation = async () => {
    if (!activeConsultation) return
    const { error } = await supabase
      .from("consultations")
      .update({ status: "closed" })
      .eq("id", activeConsultation.id)
    if (error) console.error(error)
    else setActiveConsultation(null)
  }

  const formatDate = (d?: string) =>
    d
      ? new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(d))
      : ""
  const formatTime = (t?: string) =>
    t
      ? new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(t))
      : ""

  // Filters
  const filtered = consultations.filter((c) => {
    const m = c.topic.toLowerCase().includes(searchQuery.toLowerCase()) || c.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return statusFilter === "all" ? m : m && c.status === statusFilter
  })
  const queuedList = (statusFilter === "all" || statusFilter === "queued")
    ? queuedConsultations
    : queuedConsultations.filter((c) => c.status === statusFilter)
  const activeList = filtered.filter((c) => c.status === "active")
  const closedList = filtered.filter((c) => c.status === "closed")

  if (!isLoggedIn) return null

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Admin Konsultasi</h1>
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
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Semua</option>
            <option value="queued">Antrian</option>
            <option value="active">Aktif</option>
            <option value="closed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <MessageCircle className="h-4 w-4 text-blue-500" /> Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultations.length}</div>
            <p className="text-xs text-muted-foreground">
              {queuedConsultations.length} antri, {activeList.length} aktif, {closedList.length} selesai
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeList.length}</div>
            <p className="text-xs text-muted-foreground">Perlu ditanggapi</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-orange-500" /> Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consultations[0] ? formatTime(consultations[0].created_at) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {consultations[0] ? formatDate(consultations[0].created_at) : "Tidak ada"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Bell className="h-4 w-4 text-purple-500" /> Belum Dibaca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Semua terbaca</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="queue">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Antrian
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Aktif
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" /> Riwayat
          </TabsTrigger>
        </TabsList>

        {/* Antrian */}
        <TabsContent value="queue" className="mt-6">
          {queuedList.length ? (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {queuedList
                  .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime())
                  .map((c) => (
                    <Card key={c.id}>
                      <CardHeader>
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{c.user_name}</h3>
                            <CardDescription>{formatDate(c.created_at)}</CardDescription>
                          </div>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                            Antri
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm">{c.topic}</p>
                      </CardHeader>
                      <CardFooter className="justify-end">
                        <Button size="sm" onClick={() => takeConsultation(c)}>
                          Ambil
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Tidak ada dalam antrean.
            </div>
          )}
        </TabsContent>

        {/* Aktif */}
        <TabsContent value="active" className="mt-6">
          <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-12")}>
            {/* List */}
            <div className={cn("md:col-span-4", isMobile && activeConsultation ? "hidden" : "block")}>
              <Card className="h-full">
                <CardHeader className="bg-blue-50 pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-5 w-5 text-blue-500" /> Aktif
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
                    </div>
                  ) : activeList.length ? (
                    <ScrollArea className="h-[600px]">
                      <div className="divide-y">
                        {activeList.map((c) => {
                          const last = c.messages[c.messages.length - 1]
                          return (
                            <div
                              key={c.id}
                              className={cn(
                                "p-4 cursor-pointer",
                                activeConsultation?.id === c.id && "bg-muted border-l-4 border-primary",
                              )}
                              onClick={() => setActiveConsultation(c)}
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={c.messages.find((m) => m.sender === "user")?.avatar_url} />
                                  <AvatarFallback className="bg-blue-100 text-blue-600">
                                    <User className="h-5 w-5" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <h3 className="font-medium line-clamp-1">{c.user_name}</h3>
                                    <span className="text-xs text-muted-foreground">
                                      {last ? formatTime(last.timestamp.toISOString()) : ""}
                                    </span>
                                  </div>
                                  <p className="text-sm line-clamp-2 mt-1">{c.topic}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Belum ada aktif.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chat */}
            <div className={cn(isMobile ? "col-span-1" : "md:col-span-8", isMobile && !activeConsultation ? "hidden" : "")}>
              <Card className="h-full border">
                {activeConsultation ? (
                  <>
                    <CardHeader className="flex items-center justify-between bg-blue-50 pb-2">
                      <div className="flex items-center gap-3">
                        {isMobile && (
                          <Button variant="ghost" size="icon" onClick={() => setActiveConsultation(null)}>
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                        )}
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={activeConsultation.messages.find((m) => m.sender === "user")?.avatar_url} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle>{activeConsultation.user_name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                activeConsultation.status === "active"
                                  ? "bg-green-50 text-green-800 border-green-300"
                                  : "bg-gray-100 text-gray-800 border-gray-300"
                              }
                            >
                              {activeConsultation.status === "active" ? "Aktif" : "Selesai"}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs">
                              <Calendar className="h-3 w-3" />
                              {formatDate(activeConsultation.created_at)}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      {activeConsultation.status === "active" && (
                        <Button variant="outline" size="sm" onClick={() => setIsCloseDialogOpen(true)}>
                          <X className="h-4 w-4" /> Tutup
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[450px]">
                        <div className="p-4 space-y-4">
                          {activeConsultation.messages.length === 0 ? (
                            <p className="text-center text-muted-foreground">Belum ada pesan.</p>
                          ) : (
                            activeConsultation.messages.map((m) => (
                              <div
                                key={m.id}
                                className={cn(
                                  "flex",
                                  m.sender === "admin" ? "justify-end" : "justify-start",
                                )}
                              >
                                <div
                                  className={cn(
                                    "max-w-[80%] p-3 rounded-lg",
                                    m.sender === "admin"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted",
                                  )}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={m.avatar_url} />
                                      <AvatarFallback>
                                        {m.sender === "admin" ? "A" : "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium">
                                      {m.sender === "admin" ? "Admin" : m.full_name}
                                    </span>
                                  </div>
                                  <p className="whitespace-pre-wrap">{m.content}</p>
                                  <p className="text-xs mt-1 text-right text-muted-foreground">
                                    {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                          {isTyping && (
                            <div className="flex justify-start">
                              <MessageSquare className="animate-ping h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    </CardContent>
                    <CardFooter className="p-3 border-t flex gap-2">
                      {activeConsultation.status === "active" ? (
                        <>
                          <Textarea
                            placeholder="Tulis pesan..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                sendMessage()
                              }
                            }}
                            className="flex-1 min-h-[60px]"
                          />
                          <Button size="icon" onClick={sendMessage}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="text-center w-full text-muted-foreground">
                          Konsultasi telah selesai.
                        </div>
                      )}
                    </CardFooter>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[450px] text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <h3 className="text-xl font-medium">Pilih konsultasi</h3>
                    <p className="text-muted-foreground">Pilih sesi dari daftar untuk melihat detail.</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Riwayat */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader className="bg-gray-50 pb-2">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-500" /> Riwayat Konsultasi
              </CardTitle>
              <CardDescription>Semua sesi yang sudah selesai</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
                </div>
              ) : closedList.length ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {closedList.map((c) => (
                      <Card key={c.id}> 
                        <CardHeader>
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">{c.user_name}</h3>
                              <CardDescription>{formatDate(c.created_at)}</CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                              Selesai
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm">{c.topic}</p>
                        </CardHeader>
                        <CardFooter className="justify-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setActiveConsultation(c)
                              const activeTab = document.querySelector('[data-value="active"]') as HTMLElement | null
                              activeTab?.click()
                            }}
                          >
                            Lihat Detail
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Belum ada riwayat.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Tutup */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Konsultasi</DialogTitle>
            <DialogDescription>Yakin ingin menutup sesi ini?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={closeConsultation} className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

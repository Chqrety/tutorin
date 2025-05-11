"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"

/* ------------------------- shadcn‑ui & lucide ------------------------ */
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Calendar, ChevronRight, Clock, History, Home, Info, Loader2, LogOut, Menu, MessageCircle, MessageSquare, PanelRightClose, Plus, Send, Settings, User, X  as  CalendarIcon2, X} from 'lucide-react'
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types & Helpers                                                   */
/* ------------------------------------------------------------------ */
type Message = {
  id: number
  sender: "user" | "admin"
  content: string
  timestamp: Date
  full_name: string
  avatar_url: string
  read?: boolean
}

type ConsultationStatus = "queued" | "active" | "closed"

type Consultation = {
  id: number
  topic: string
  consultant_id: string | null
  messages: Message[]
  status: ConsultationStatus
  hasNewMessage: boolean
  created_at?: string
}

type UserProfile = {
  id: string
  full_name: string
  email: string
  avatar_url: string
}

const queuePos = (list: Consultation[], c: Consultation | null): number | null => {
  if (!c || c.status !== "queued" || !c.consultant_id) return null
  return (
    list
      .filter((x) => x.consultant_id === c.consultant_id && x.status === "queued")
      .sort((a, b) => new Date(a.created_at ?? "").getTime() - new Date(b.created_at ?? "").getTime())
      .findIndex((x) => x.id === c.id) + 1
  )
}

const TypingIndicator = () => (
  <div className="flex items-center gap-1 p-2 rounded-lg bg-blue-500/10 backdrop-blur-sm w-16">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </div>
)

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function UserKonsultasiPage() {
  /* ---------------------------- State ---------------------------- */
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [newTopic, setNewTopic] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [openNew, setOpenNew] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSidebar, setShowSidebar] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [activeTab, setActiveTab] = useState("active")
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<number>>(new Set())
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [infoCollapsed, setInfoCollapsed] = useState(true)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /* ---------------------------- Hooks ---------------------------- */
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")
  const bottomRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<Consultation | null>(activeConsultation)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  /* keep ref sync */
  useEffect(() => {
    let isSubscribed = true;
    activeRef.current = activeConsultation;
    
    const cleanup = () => {
      isSubscribed = false;
    };
    
    return cleanup;
  }, [activeConsultation])

  /* scroll bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeConsultation?.messages])

  /* autofocus */
  useEffect(() => {
    if (activeConsultation?.status === "active" && !isMobile) {
      setTimeout(() => messageInputRef.current?.focus(), 100)
    }
  }, [activeConsultation, isMobile])

  /* sidebar visibility mobile */
  useEffect(() => {
    if (isMobile && activeConsultation) setShowSidebar(false)
    if (!isMobile) setShowSidebar(true)
  }, [activeConsultation, isMobile])

  /* handle back button on mobile */
  useEffect(() => {
    const onPop = () => {
      if (isMobile && activeConsultation) {
        window.history.pushState(null, "", window.location.pathname)
        setActiveConsultation(null)
        setShowSidebar(true)
      }
    }
    if (isMobile && activeConsultation && !showSidebar) {
      window.history.pushState(null, "", window.location.pathname)
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [isMobile, activeConsultation, showSidebar])

  /* keyboard shortcuts */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close dialogs
      if (e.key === "Escape") {
        if (showInfo) setShowInfo(false)
        if (openNew) setOpenNew(false)
        return
      }

      // Only process if no modals are open and not typing in an input
      const isInputActive =
        document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement

      if (showInfo || openNew || isInputActive) return

      // Ctrl+N for new consultation
      if (e.key === "n" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setOpenNew(true)
        return
      }

      // Toggle sidebar with Ctrl+B
      if (e.key === "b" && (e.ctrlKey || e.metaKey) && !isMobile) {
        e.preventDefault()
        setSidebarCollapsed((prev) => !prev)
        return
      }

      // Toggle info panel with Ctrl+I
      if (e.key === "i" && (e.ctrlKey || e.metaKey) && activeConsultation && !isMobile) {
        e.preventDefault()
        setInfoCollapsed((prev) => !prev)
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showInfo, openNew, isMobile, activeConsultation])

  /* get session userId */
  useEffect(() => {
    const s = sessionStorage.getItem("userSession")
    try {
      if (s) {
        const { userId } = JSON.parse(s)
        if (userId) {
          setUserId(userId)
          return
        }
      }
    } catch {}
    router.push("/login")
  }, [router])

  /* get user profile */
  useEffect(() => {
    if (!userId) return
    const fetchProfile = async () => {
      try {
  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      full_name,
      email,
      profiles (avatar_url)
    `)
    .eq("id", userId)
    .single()
  if (error) throw error

  setUserProfile({
    id: data.id,
    full_name: data.full_name,
    email: data.email,
    avatar_url: data.profiles?.[0]?.avatar_url || "/placeholder.svg"
  } as UserProfile)
      } catch (err) {
        console.error("Error fetching profile:", err) 
        toast({
          title: "Error",
          description: "Gagal memuat data profil",
          variant: "destructive"
        })
      }
    }
    fetchProfile()
  }, [userId])

  /* ------------------------------------------------------------------ */
  /*  Load consultations (initial)                                       */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!userId) return
    const load = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("consultations")
          .select("id, topic, status, consultant_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
        if (error) throw error

        const full = await Promise.all(
          data.map(async (c: any) => {
            const { data: msgs } = await supabase
              .from("messages")
              .select("*, profiles(avatar_url), admins(name)")
              .eq("consultation_id", c.id)
              .order("timestamp")

            return {
              ...c,
              messages: (msgs ?? []).map((m: any) => ({
                id: m.id,
                sender: m.sender,
                content: m.content,
                timestamp: new Date(m.timestamp),
                full_name: m.sender === "admin" ? m.admins?.name || "Admin" : "Anda",
                avatar_url: m.profiles?.avatar_url || "/placeholder.svg?height=40&width=40",
                read: true,
              })),
              hasNewMessage: false,
            } as Consultation
          }),
        )
        setConsultations(full)

        if (!activeConsultation && full.length) {
          const act = full.find((c) => c.status === "active")
          if (act) setActiveConsultation(act)
        }
      } catch (err) {
        console.error(err)
        toast({ title: "Error", description: "Gagal memuat data konsultasi", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [userId, toast])

  /* ------------------------------------------------------------------ */
  /*  Realtime: new messages                                             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!userId) return

    // inisialisasi processed id
    if (processedMessageIds.size === 0 && consultations.length) {
      const init = new Set<number>()
      consultations.forEach((c) => c.messages.forEach((m) => init.add(m.id)))
      setProcessedMessageIds(init)
    }

    const ch = supabase
      .channel("msg-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new as any
        if (newMsg.sender === "user") return
        if (processedMessageIds.has(newMsg.id)) return
        setProcessedMessageIds((p) => new Set(p).add(newMsg.id))

        const message: Message = {
          id: newMsg.id,
          sender: newMsg.sender,
          content: newMsg.content,
          timestamp: new Date(newMsg.timestamp),
          full_name: newMsg.sender === "admin" ? newMsg.admins?.name || "Admin" : "Anda",
          avatar_url: newMsg.profiles?.avatar_url || "/placeholder.svg?height=40&width=40",
          read: activeRef.current?.id === newMsg.consultation_id,
        }

        setConsultations((prev) =>
          prev.map((c) =>
            c.id === newMsg.consultation_id
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  hasNewMessage: activeRef.current?.id === c.id ? false : true,
                }
              : c,
          ),
        )

        if (activeRef.current?.id === newMsg.consultation_id) {
          setActiveConsultation((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev))
        } else {
          toast({
            title: "Pesan Baru",
            description: `${message.full_name}: ${message.content.slice(0, 50)}${message.content.length > 50 ? "…" : ""}`,
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const c = consultations.find((x) => x.id === newMsg.consultation_id)
                  if (c) {
                    setActiveConsultation(c)
                    setActiveTab("active")
                  }
                }}
              >
                Lihat
              </Button>
            ),
          })
        }
      })
      .subscribe()

    return () => {
      // Handle cleanup synchronously
      try {
        supabase.removeChannel(ch)
      } catch (err) {
        console.error('Error removing channel:', err)
      }
    }
  }, [userId, consultations, processedMessageIds, toast])

  /* ------------------------------------------------------------------ */
  /*  Realtime: status update                                            */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!userId) return

    let isSubscribed = true
    const channel = supabase
      .channel("consult-rt")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "consultations", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (!isSubscribed) return
          const updated = payload.new
          const old = consultations.find((c) => c.id === updated.id)
          if (old && old.status !== updated.status) {
            let msg = ""
            if (updated.status === "active") msg = "Konsultasi Anda telah aktif dan siap dimulai!"
            if (updated.status === "closed") msg = "Konsultasi telah ditutup."
            if (msg) {
              toast({
                title: "Status Konsultasi Berubah",
                description: msg,
                action: (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const c = consultations.find((x) => x.id === updated.id)
                      if (c) {
                        setActiveConsultation({ ...c, status: updated.status as ConsultationStatus })
                        setActiveTab("active")
                      }
                    }}
                  >
                    Lihat
                  </Button>
                ),
              })
            }
          }

          setConsultations((prev) => prev.map((c) => (c.id === updated.id ? { ...c, status: updated.status } : c)))
          if (activeRef.current?.id === updated.id) {
            setActiveConsultation((prev) => (prev ? { ...prev, status: updated.status } : prev))
          }
        },
      )
      .subscribe()

    return () => {
      isSubscribed = false
      supabase.removeChannel(channel)
    }
  }, [userId, consultations, toast])

  /* ------------------------------------------------------------------ */
  /*  Actions                                                           */
  /* ------------------------------------------------------------------ */
  const fetchAdminIds = async (): Promise<string[]> => {
    const { data, error } = await supabase.from("admins").select("id").order("created_at")
    if (error) throw error
    return data.map((a) => a.id as string)
  }

  const pickConsultant = async (): Promise<string | null> => {
    const counts: Record<string, number> = {}
    consultations.forEach((c) => {
      if (c.status === "queued" && c.consultant_id) counts[c.consultant_id] = (counts[c.consultant_id] || 0) + 1
    })
    if (Object.keys(counts).length === 0) {
      const admins = await fetchAdminIds()
      return admins.length ? admins[Math.floor(Math.random() * admins.length)] : null
    }
    let best: string | null = null
    let min = Number.POSITIVE_INFINITY
    for (const [id, total] of Object.entries(counts)) {
      if (total < min) {
        min = total
        best = id
      }
    }
    return best
  }

  const startNewConsultation = async () => {
    if (!newTopic.trim() || !userId) return
    try {
      setIsSubmitting(true)
      const consultantId = await pickConsultant()
      if (!consultantId) {
        toast({
          title: "Konsultan Tidak Tersedia",
          description: "Belum ada konsultan tersedia saat ini. Silakan coba lagi nanti.",
          variant: "destructive",
        })
        return
      }
      const { data: newId, error } = await supabase.rpc("start_consultation", {
        p_user_id: userId,
        p_consultant_id: consultantId,
        p_topic: newTopic,
      })
      if (error) throw error
      const { data: row } = await supabase.from("consultations").select("*").eq("id", newId).single()

      const newcomer: Consultation = { ...row, messages: [], hasNewMessage: false }
      setConsultations((prev) => [newcomer, ...prev])
      setActiveConsultation(newcomer)
      setNewTopic("")
      setOpenNew(false)
      setActiveTab("active")

      toast({ title: "Konsultasi Baru", description: "Konsultasi baru telah dibuat dan dimasukkan ke dalam antrian." })
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Gagal membuat konsultasi baru", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConsultation) return
    if (activeConsultation.status !== "active") return
    try {
      setIsSubmitting(true)
      const tempId = Date.now()
      const optimistic: Message = {
        id: tempId,
        sender: "user",
        content: newMessage,
        timestamp: new Date(),
        full_name: "Anda",
        avatar_url: userProfile?.avatar_url || "/placeholder.svg?height=40&width=40",
        read: true,
      }
      setProcessedMessageIds((p) => new Set(p).add(tempId))
      setActiveConsultation((p) => (p ? { ...p, messages: [...p.messages, optimistic] } : p))
      setNewMessage("")
      setIsTyping(false)

      const { data, error } = await supabase
        .from("messages")
        .insert({
          consultation_id: activeConsultation.id,
          sender: "user",
          content: optimistic.content,
          user_id: userId,
        })
        .select()
      if (error) throw error
      if (data && data[0]) setProcessedMessageIds((p) => new Set(p).add(data[0].id))

      setTimeout(() => messageInputRef.current?.focus(), 100)
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Gagal mengirim pesan", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      sessionStorage.removeItem("userSession")
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
      toast({ title: "Error", description: "Gagal keluar dari sistem", variant: "destructive" })
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                           */
  /* ------------------------------------------------------------------ */
  const formatDate = (d?: string) =>
    d ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d)) : ""

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  const formatDateRelative = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Hari ini"
    } else if (diffDays === 1) {
      return "Kemarin"
    } else if (diffDays < 7) {
      return `${diffDays} hari yang lalu`
    } else {
      return formatDate(date.toISOString())
    }
  }

  /* filter and sort */
  const filteredConsultations = useMemo(() => {
    return consultations.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
  }, [consultations])

  const actives = useMemo(() => filteredConsultations.filter((c) => c.status !== "closed"), [filteredConsultations])

  const history = useMemo(() => filteredConsultations.filter((c) => c.status === "closed"), [filteredConsultations])

  /* group messages by date */
  const groupedMessages = useMemo(() => {
    if (!activeConsultation) return []

    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ""
    let currentGroup: Message[] = []

    activeConsultation.messages.forEach((message) => {
      const messageDate = message.timestamp.toDateString()

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup })
        }
        currentDate = messageDate
        currentGroup = [message]
      } else {
        currentGroup.push(message)
      }
    })

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup })
    }

    return groups
  }, [activeConsultation])

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
  const qPos = queuePos(consultations, activeConsultation)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-900/80 to-blue-950/80 text-white">
      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen w-full">
        {/* Desktop Header */}
        {!isMobile && (
          <header className="h-16 bg-blue-900/70 backdrop-blur-sm border-b border-blue-800 flex items-center justify-between px-4 sticky top-0 z-50 shadow-md">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="mr-2 text-white hover:bg-blue-800"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-white">TUTORIN</h1>
            </div>

            <div className="flex-1"></div>

            
          </header>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 bg-blue-800 sticky top-0 z-10">
            {activeConsultation ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setActiveConsultation(null)
                    setShowSidebar(true)
                  }}
                  className="text-white hover:bg-blue-700"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center flex-1">
                  <Avatar className="h-10 w-10 mr-3 bg-blue-700">
                    <AvatarImage src="/placeholder.svg?height=40&width=40" />
                    <AvatarFallback className="bg-blue-700">A</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium">{activeConsultation.topic}</h2>
                    <Badge variant="outline" className="bg-green-600 text-white border-none text-xs px-3 py-0.5">
                      Aktif
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowInfo(true)}
                  className="text-white hover:bg-blue-700"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-white">Konsultasi</h1>
                <Dialog open={openNew} onOpenChange={setOpenNew}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4" /> Baru
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-blue-900 text-white border border-blue-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">Mulai Konsultasi Baru</DialogTitle>
                      <DialogDescription className="text-blue-200">Masukkan topik konsultasi Anda.</DialogDescription>
                    </DialogHeader>
                    <Textarea
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="Topik konsultasi…"
                      className="min-h-[100px] my-4 bg-blue-800/50 border-blue-700 text-white placeholder:text-blue-300/50"
                    />
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setOpenNew(false)}
                        className="bg-transparent border-blue-600 text-white hover:bg-blue-800"
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={startNewConsultation}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          "Mulai"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        )}

        {/* Body (sidebar + chat) */}
        <div className="flex flex-1 overflow-hidden h-full">
          {/* Sidebar */}
          <AnimatePresence initial={false}>
            {(showSidebar || !isMobile) && (!sidebarCollapsed || isMobile) && (
              <motion.div
                initial={isMobile ? { x: -300, opacity: 0 } : false}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "border-r border-blue-800 flex flex-col bg-blue-900/60 backdrop-blur-sm",
                  isMobile ? "w-full" : "w-80 lg:w-96 xl:w-96 2xl:w-96",
                )}
              >
                {/* Desktop Sidebar Header */}
                {!isMobile && (
                  <div className="flex items-center justify-between p-4 border-b border-blue-800">
                    <h2 className="text-lg font-semibold text-white">Konsultasi</h2>
                    <Dialog open={openNew} onOpenChange={setOpenNew}>
                      <DialogTrigger asChild>
                        <Button className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="h-4 w-4" /> Konsultasi Baru
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-blue-900 text-white border border-blue-800">
                        <DialogHeader>
                          <DialogTitle className="text-white">Mulai Konsultasi Baru</DialogTitle>
                          <DialogDescription className="text-blue-200">
                            Masukkan topik konsultasi Anda.
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          value={newTopic}
                          onChange={(e) => setNewTopic(e.target.value)}
                          placeholder="Topik konsultasi…"
                          className="min-h-[100px] my-4 bg-blue-800/50 border-blue-700 text-white placeholder:text-blue-300/50"
                        />
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setOpenNew(false)}
                            className="bg-transparent border-blue-600 text-white hover:bg-blue-800"
                          >
                            Batal
                          </Button>
                          <Button
                            onClick={startNewConsultation}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Memproses...
                              </>
                            ) : (
                              "Mulai"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {/* Sidebar Spacer */}
              

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <div className="border-b border-blue-800 bg-blue-900/30">
                    <TabsList className="w-full bg-blue-800/50 p-0 h-12">
                      <TabsTrigger
                        value="active"
                        className="flex-1 flex gap-2 items-center justify-center h-full rounded-none data-[state=active]:bg-blue-700 data-[state=active]:text-white"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Aktif</span>
                        {actives.some((c) => c.hasNewMessage) && (
                          <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-blue-500 text-white">
                            {actives.filter((c) => c.hasNewMessage).length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="history"
                        className="flex-1 flex gap-2 items-center justify-center h-full rounded-none data-[state=active]:bg-blue-700 data-[state=active]:text-white"
                      >
                        <History className="h-4 w-4" />
                        <span>Riwayat</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Tab: Aktif */}
                  <TabsContent
                    value="active"
                    className="flex-1 flex flex-col overflow-hidden p-0 m-0 data-[state=active]:flex data-[state=inactive]:hidden"
                  >
                    {isLoading ? (
                      <div className="p-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Skeleton className="h-10 w-10 rounded-full bg-blue-800/50" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-3/4 bg-blue-800/50" />
                              <Skeleton className="h-3 w-1/2 bg-blue-800/50" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : actives.length ? (
                      <ScrollArea className="flex-1 h-full">
                        <div className="p-2">
                          {actives.map((c) => (
                            <motion.div
                              key={c.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className={cn(
                                "p-3 mb-2 rounded-lg cursor-pointer transition-all",
                                activeConsultation?.id === c.id
                                  ? "bg-blue-700/70 border border-blue-600"
                                  : "hover:bg-blue-800/50 border border-transparent hover:border-blue-700",
                                c.hasNewMessage && "border-l-4 border-l-blue-500",
                              )}
                              onClick={() => {
                                setConsultations((prev) =>
                                  prev.map((x) => (x.id === c.id ? { ...x, hasNewMessage: false } : x)),
                                )
                                setActiveConsultation(c)
                                if (isMobile) setShowSidebar(false)
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10 border border-blue-600 bg-blue-700">
                                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                                  <AvatarFallback className="bg-blue-700">A</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-sm line-clamp-1 text-white">{c.topic}</h3>
                                    {!!c.messages.length && (
                                      <span className="text-xs text-blue-300 whitespace-nowrap ml-1">
                                        {formatTime(c.messages[c.messages.length - 1].timestamp)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {c.status === "active" ? (
                                      <Badge className="bg-green-600 text-white border-none text-xs px-2 py-0">
                                        Aktif
                                      </Badge>
                                    ) : c.status === "queued" ? (
                                      <Badge className="bg-yellow-600 text-white border-none text-xs px-2 py-0">
                                        Antri
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-gray-600 text-white border-none text-xs px-2 py-0">
                                        Selesai
                                      </Badge>
                                    )}
                                    {!!c.messages.length && (
                                      <p className="text-xs text-blue-300 line-clamp-1 flex-1">
                                        {c.messages[c.messages.length - 1].content}
                                      </p>
                                    )}
                                    {c.hasNewMessage && (
                                      <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-blue-500 text-white">
                                        {c.messages.filter((m) => !m.read && m.sender === "admin").length || 1}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <MessageSquare className="h-16 w-16 mb-4 text-blue-400 opacity-20" />
                        <h3 className="text-lg font-medium mb-2 text-white">Belum ada konsultasi aktif</h3>
                        <p className="text-blue-300 mb-6">Mulai konsultasi baru untuk mendapatkan bantuan</p>
                        <Button onClick={() => setOpenNew(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                          Mulai Konsultasi
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab: Riwayat */}
                  <TabsContent
                    value="history"
                    className="flex-1 flex flex-col overflow-hidden p-0 m-0 data-[state=active]:flex data-[state=inactive]:hidden"
                  >
                    {isLoading ? (
                      <div className="p-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Skeleton className="h-10 w-10 rounded-full bg-blue-800/50" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-3/4 bg-blue-800/50" />
                              <Skeleton className="h-3 w-1/2 bg-blue-800/50" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : history.length ? (
                      <ScrollArea className="flex-1 h-full">
                        <div className="pt-0 px-2 pb-2">
                          {history.map((c) => (
                            <motion.div
                              key={c.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className={cn(
                                "p-3 mb-2 rounded-lg cursor-pointer transition-all border",
                                activeConsultation?.id === c.id
                                  ? "bg-blue-700/70 border-blue-600"
                                  : "hover:bg-blue-800/50 border-transparent hover:border-blue-700",
                              )}
                              onClick={() => {
                                setActiveConsultation(c)
                                setActiveTab("active")
                                if (isMobile) setShowSidebar(false)
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10 border border-blue-600 bg-blue-700">
                                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                                  <AvatarFallback className="bg-blue-700">A</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-sm line-clamp-1 text-white">{c.topic}</h3>
                                    <Badge className="bg-gray-600 text-white border-none text-xs ml-1">Selesai</Badge>
                                  </div>
                                  <p className="text-xs text-blue-300 mt-1">{formatDate(c.created_at)}</p>
                                  {!!c.messages.length && (
                                    <p className="text-xs text-blue-300 mt-1 line-clamp-1">{c.messages.length} pesan</p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <History className="h-16 w-16 mb-4 text-blue-400 opacity-20" />
                        <h3 className="text-lg font-medium mb-2 text-white">Belum ada riwayat konsultasi</h3>
                        <p className="text-blue-300 mb-6">Riwayat konsultasi yang sudah selesai akan muncul di sini</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar Collapsed Button */}
          {!isMobile && sidebarCollapsed && (
            <div className="border-r border-blue-800 bg-blue-900/80 backdrop-blur-sm w-16 flex flex-col items-center py-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(false)}
                className="mb-4 text-white hover:bg-blue-800"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              <Separator className="w-8 my-4 bg-blue-800" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTab === "active" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setActiveTab("active")}
                      className="mb-2 text-white hover:bg-blue-800"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Konsultasi Aktif</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTab === "history" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setActiveTab("history")}
                      className="mb-2 text-white hover:bg-blue-800"
                    >
                      <History className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Riwayat Konsultasi</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator className="w-8 my-4 bg-blue-800" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpenNew(true)}
                      className="text-white hover:bg-blue-800"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Konsultasi Baru</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex overflow-hidden">
            <AnimatePresence initial={false}>
              {(activeConsultation || !isMobile) && (
                <motion.div
                  initial={isMobile ? { x: 300, opacity: 0 } : false}
                  animate={{ x: 0, opacity: 1 }}
                  exit={isMobile ? { x: 300, opacity: 0 } : undefined}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col overflow-hidden relative"
                >
                  {/* Desktop Chat Header */}
                  {!isMobile && activeConsultation && (
                    <div className="h-16 bg-blue-900/70 backdrop-blur-sm border-b border-blue-800 flex items-center px-4 sticky top-0 z-50">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3 border border-blue-600 bg-blue-700">
                          <AvatarImage src="/placeholder.svg?height=40&width=40" />
                          <AvatarFallback className="bg-blue-700">A</AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="font-medium text-white">{activeConsultation.topic}</h2>
                          <div className="flex items-center gap-2">
                            {activeConsultation.status === "active" ? (
                              <Badge className="bg-green-600 text-white border-none">Aktif</Badge>
                            ) : activeConsultation.status === "queued" ? (
                              <Badge className="bg-yellow-600 text-white border-none">Antri</Badge>
                            ) : (
                              <Badge className="bg-gray-600 text-white border-none">Selesai</Badge>
                            )}
                            <span className="text-sm text-blue-300">{formatDate(activeConsultation.created_at)}</span>
                          </div>
                        </div>
                      </div>
                     
                    </div>
                  )}

                  {/* Queue banner */}
                  {activeConsultation?.status === "queued" && (
                    <div className="px-4 py-2 bg-yellow-600/20 border-b border-yellow-600/30">
                      <p className="text-sm text-yellow-300 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Anda berada di antrian nomor <strong className="mx-1">{qPos}</strong>. Mohon menunggu.
                      </p>
                    </div>
                  )}

                  {/* Message list */}
                  {activeConsultation ? (
                    <ScrollArea
                      className="flex-1 p-4 md:p-6 lg:p-8 bg-transparent"
                      style={isMobile ? { paddingBottom: 80 } : {}}
                    >
                      {activeConsultation.messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4 md:p-8 lg:p-12 bg-transparent">
                          <div className="max-w-md">
                            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-blue-800/50 flex items-center justify-center">
                              <MessageCircle className="h-12 w-12 text-blue-300/50" />
                            </div>
                            <h3 className="text-2xl font-medium mb-3 text-white">Konsultasi Baru</h3>
                            <p className="text-blue-300 mb-8 text-lg">
                              {activeConsultation.status === "queued"
                                ? "Konsultasi Anda sedang dalam antrian. Mohon menunggu hingga konsultan tersedia."
                                : activeConsultation.status === "active"
                                  ? "Konsultasi Anda sudah aktif. Silakan mulai percakapan dengan konsultan."
                                  : "Konsultasi ini telah selesai."}
                            </p>
                            {activeConsultation.status === "active" && (
                              <Button
                                onClick={() => messageInputRef.current?.focus()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-lg"
                              >
                                Mulai Percakapan
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8 pb-2">
                          {/* Message groups by date */}
                          {groupedMessages.map((group, groupIndex) => (
                            <div key={groupIndex}>
                              {/* Date separator */}
                              <div className="relative flex items-center justify-center my-6">
                                <div className="absolute inset-0 flex items-center">
                                  <span className="w-full border-t border-blue-800" />
                                </div>
                                <div className="relative px-4 text-xs uppercase bg-blue-900 text-blue-300">
                                  {formatDateRelative(new Date(group.date))}
                                </div>
                              </div>

                              {/* Messages in this group */}
                              {group.messages.map((m, idx) => (
                                <motion.div
                                  key={m.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className={cn(
                                    "flex gap-3 mb-4",
                                    m.sender === "user"
                                      ? "ml-auto justify-end max-w-[85%] md:max-w-[75%] lg:max-w-[65%] xl:max-w-[50%]"
                                      : "mr-auto justify-start max-w-[85%] md:max-w-[75%] lg:max-w-[65%] xl:max-w-[50%]",
                                  )}
                                >
                                  {/* avatar kiri admin */}
                                  {m.sender === "admin" && (
                                    <Avatar className="h-8 w-8 mt-1 border border-blue-600 bg-blue-700">
                                      <AvatarImage src={m.avatar_url || "/placeholder.svg"} alt={m.full_name} />
                                      <AvatarFallback className="bg-blue-700">A</AvatarFallback>
                                    </Avatar>
                                  )}
                                  {/* bubble */}
                                  <div
                                    className={cn(
                                      "rounded-2xl p-3 min-w-[120px]",
                                      m.sender === "user"
                                        ? "bg-blue-600/90 text-white rounded-tr-none"
                                        : "bg-blue-800/70 rounded-tl-none",
                                    )}
                                  >
                                    <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                                    <div
                                      className={cn(
                                        "flex items-center justify-end gap-1 mt-1",
                                        m.sender === "user" ? "text-white/70" : "text-blue-300",
                                      )}
                                    >
                                      <span className="text-xs">{formatTime(m.timestamp)}</span>
                                    </div>
                                  </div>
                                  {/* avatar kanan user */}
                                  {m.sender === "user" && (
                                    <Avatar className="h-8 w-8 mt-1 border border-blue-600 bg-blue-700">
                                      <AvatarImage src={m.avatar_url || "/placeholder.svg"} alt={m.full_name} />
                                      <AvatarFallback className="bg-blue-700">U</AvatarFallback>
                                    </Avatar>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          ))}

                          {isTyping && (
                            <div className="flex items-start gap-2">
                              <Avatar className="h-8 w-8 border border-blue-600 bg-blue-700">
                                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                                <AvatarFallback className="bg-blue-700">A</AvatarFallback>
                              </Avatar>
                              <TypingIndicator />
                            </div>
                          )}

                          <div ref={bottomRef} />
                        </div>
                      )}
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8 lg:p-12 bg-transparent">
                      <MessageSquare className="h-16 w-16 mb-4 text-blue-400 opacity-20" />
                      <h3 className="text-lg font-medium mb-2 text-white">Belum ada konsultasi yang dipilih</h3>
                      <p className="text-blue-300 mb-6">Pilih konsultasi dari daftar atau mulai baru</p>
                      <Button onClick={() => setOpenNew(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Mulai Konsultasi
                      </Button>
                    </div>
                  )}

                  {/* Message Input */}
                  {activeConsultation && (
                    <div
                      className={cn(
                        "p-4 md:p-6 border-t border-blue-800 bg-blue-800/60 backdrop-blur-sm",
                        isMobile && "fixed left-0 right-0 bottom-[56px] z-40",
                        !isMobile && "sticky bottom-0 z-10",
                      )}
                    >
                      {activeConsultation.status === "active" ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              ref={messageInputRef}
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault()
                                  sendMessage()
                                }
                              }}
                              placeholder="Ketik pesan…"
                              className="w-full bg-blue-700/50 border border-blue-700 rounded-full py-3 px-4 pr-12 md:py-4 md:px-5 md:pr-14 text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <Button
                              size="icon"
                              disabled={!newMessage.trim() || isSubmitting}
                              className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2"
                              onClick={sendMessage}
                            >
                              {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full text-center py-3 bg-blue-700/30 rounded-lg text-blue-300">
                          {activeConsultation.status === "queued"
                            ? "Menunggu konsultan untuk memulai percakapan…"
                            : "Konsultasi ini telah selesai"}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Panel (Desktop) */}
            {!isMobile && !infoCollapsed && activeConsultation && (
              <div className="w-80 border-l border-blue-800 bg-blue-900/80 backdrop-blur-sm flex flex-col">
                <div className="p-4 border-b border-blue-800 flex justify-between items-center bg-blue-800/90 backdrop-blur-sm sticky top-16 z-10">
                  <h2 className="text-lg font-semibold text-white">Detail Konsultasi</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setInfoCollapsed(true)}
                    className="text-white hover:bg-blue-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-blue-300 mb-2">Topik</h3>
                      <p className="text-white bg-blue-800/50 p-3 rounded-md">{activeConsultation.topic}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-blue-300 mb-2">Status</h3>
                      <div className="flex items-center gap-2">
                        {activeConsultation.status === "active" ? (
                          <Badge className="bg-green-600 text-white border-none">Aktif</Badge>
                        ) : activeConsultation.status === "queued" ? (
                          <Badge className="bg-yellow-600 text-white border-none">Antri</Badge>
                        ) : (
                          <Badge className="bg-gray-600 text-white border-none">Selesai</Badge>
                        )}
                        {activeConsultation.status === "queued" && qPos && (
                          <span className="text-sm text-blue-300">Posisi antrian: {qPos}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-blue-300 mb-2">Tanggal Dibuat</h3>
                      <div className="flex items-center gap-2 text-white">
                        <Calendar className="h-4 w-4 text-blue-300" />
                        <p>{formatDate(activeConsultation.created_at)}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-blue-300 mb-2">Jumlah Pesan</h3>
                      <p className="text-white">{activeConsultation.messages.length} pesan</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-blue-300 mb-2">Aktivitas Terakhir</h3>
                      {activeConsultation.messages.length > 0 ? (
                        <div className="text-white">
                          <p className="text-sm">
                            {formatTime(activeConsultation.messages[activeConsultation.messages.length - 1].timestamp)}
                          </p>
                          <p className="text-xs text-blue-300 mt-1">
                            {formatDateRelative(
                              activeConsultation.messages[activeConsultation.messages.length - 1].timestamp,
                            )}
                          </p>
                        </div>
                      ) : (
                        <p className="text-blue-300 text-sm">Belum ada aktivitas</p>
                      )}
                    </div>

                    <Separator className="border-blue-800" />

                    {activeConsultation.status === "active" && (
                      <Button
                        variant="outline"
                        className="w-full border-blue-700 hover:bg-blue-800 text-white"
                        onClick={() => {
                          toast({
                            title: "Fitur Belum Tersedia",
                            description: "Fitur untuk mengakhiri konsultasi belum tersedia.",
                          })
                        }}
                      >
                        Akhiri Konsultasi
                      </Button>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Nav (mobile) */}
      {isMobile && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-blue-800 bg-blue-950 py-2">
          <div className="flex justify-around items-center">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2 text-blue-300 hover:text-white hover:bg-transparent"
              onClick={() => router.push("/dashboard")}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs">Beranda</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 hover:bg-transparent",
                !activeConsultation ? "text-white" : "text-blue-300 hover:text-white",
              )}
              onClick={() => {
                setActiveConsultation(null)
                setShowSidebar(true)
              }}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs">Konsultasi</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2 text-blue-300 hover:text-white hover:bg-transparent"
              onClick={() => router.push("/dashboard/jadwal")}
            >
             <Calendar className="h-5 w-5" />
              <span className="text-xs">Jadwal</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2 text-blue-300 hover:text-white hover:bg-transparent"
              onClick={() => router.push("/dashboard/profile")}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Pengaturan</span>
            </Button>
          </div>
        </div>
      )}

      {/* Info Sheet (Mobile) */}
      <Sheet open={showInfo} onOpenChange={setShowInfo}>
        <SheetContent className="bg-blue-900 text-white border-l border-blue-800">
          <SheetHeader>
            <SheetTitle className="text-white">Detail Konsultasi</SheetTitle>
            <SheetDescription className="text-blue-300">Informasi tentang konsultasi ini</SheetDescription>
          </SheetHeader>
          {activeConsultation && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-blue-300 mb-1">Topik</h3>
                <p className="text-white">{activeConsultation.topic}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-300 mb-1">Status</h3>
                {activeConsultation.status === "active" ? (
                  <Badge className="bg-green-600 text-white border-none">Aktif</Badge>
                ) : activeConsultation.status === "queued" ? (
                  <Badge className="bg-yellow-600 text-white border-none">Antri</Badge>
                ) : (
                  <Badge className="bg-gray-600 text-white border-none">Selesai</Badge>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-300 mb-1">Tanggal Dibuat</h3>
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="h-4 w-4 text-blue-300" />
                  <p>{formatDate(activeConsultation.created_at)}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-300 mb-1">Jumlah Pesan</h3>
                <p className="text-white">{activeConsultation.messages.length} pesan</p>
              </div>
              <Separator className="border-blue-800" />
              {activeConsultation.status === "active" && (
                <Button
                  variant="outline"
                  className="w-full border-blue-700 hover:bg-blue-800 text-white"
                  onClick={() => {
                    setShowInfo(false)
                    toast({
                      title: "Fitur Belum Tersedia",
                      description: "Fitur untuk mengakhiri konsultasi belum tersedia.",
                    })
                  }}
                >
                  Akhiri Konsultasi
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

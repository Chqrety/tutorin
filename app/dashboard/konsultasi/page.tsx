"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, ChevronRight, MessageCircle, Plus, Send, History, MessageSquare } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

// Define types
type Message = {
  id: number
  sender: "user" | "admin"
  content: string
  timestamp: Date
  full_name: string
  avatar_url: string
}

type Consultation = {
  id: number
  topic: string
  messages: Message[]
  status: "active" | "closed"
  hasNewMessage: boolean
  created_at?: string
}

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1 p-2 rounded-lg bg-muted w-16">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{
            animationDelay: `${i * 0.2}s`,
          }}
        ></div>
      ))}
    </div>
  )
}

export default function UserKonsultasiPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [newTopic, setNewTopic] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isNewConsultationOpen, setIsNewConsultationOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Ref for keeping activeConsultation in sync within subscriptions
  const activeConsultationRef = useRef(activeConsultation)
  useEffect(() => {
    activeConsultationRef.current = activeConsultation
  }, [activeConsultation])

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [activeConsultation?.messages])

  // Fetch user ID from session
  useEffect(() => {
    try {
      const userSession = sessionStorage.getItem("userSession")
      if (userSession) {
        const parsedSession = JSON.parse(userSession)
        if (parsedSession && parsedSession.userId) {
          setUserId(parsedSession.userId)
          return
        }
      }
      router.push("/login")
    } catch (error) {
      console.error("Error parsing user session:", error)
      router.push("/login")
    }
  }, [router])

  // Fetch consultations for the user
  useEffect(() => {
    const fetchConsultations = async () => {
      if (!userId) return

      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("consultations")
          .select("id, topic, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (error) throw error

        const consultationsWithMessages = await Promise.all(
          data.map(async (consultation: any) => {
            const { data: messages, error: messagesError } = await supabase
              .from("messages")
              .select("*, users(full_name), profiles(avatar_url)")
              .eq("consultation_id", consultation.id)
              .order("timestamp", { ascending: true })

            if (messagesError) throw messagesError

            return {
              ...consultation,
              messages: messages.map((msg: any) => ({
                ...msg,
                full_name: msg.users?.full_name || "Admin",
                avatar_url: msg.profiles?.avatar_url || "/default-avatar.png",
                timestamp: new Date(msg.timestamp),
              })),
              hasNewMessage: false,
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
  }, [userId])

  // Subscription for new messages
  useEffect(() => {
    if (!userId) return

    const messageChannel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsgData = payload.new
          // Format new message
          const formattedMessage: Message = {
            id: newMsgData.id,
            sender: newMsgData.sender,
            content: newMsgData.content,
            timestamp: new Date(newMsgData.timestamp),
            full_name: newMsgData.users?.full_name || (newMsgData.sender === "user" ? "Anda" : "Admin"),
            avatar_url: newMsgData.profiles?.avatar_url || "/default-avatar.png",
          }

          // Update consultations state
          setConsultations((prev) =>
            prev.map((consultation) => {
              if (consultation.id === newMsgData.consultation_id) {
                // Mark as having new message if not the active consultation
                const isActive = activeConsultationRef.current && activeConsultationRef.current.id === consultation.id
                return {
                  ...consultation,
                  messages: [...consultation.messages, formattedMessage],
                  hasNewMessage: isActive ? false : true,
                }
              }
              return consultation
            }),
          )

          // If active consultation matches, add message to activeConsultation state
          setActiveConsultation((prev) => {
            if (prev && prev.id === newMsgData.consultation_id) {
              return { ...prev, messages: [...prev.messages, formattedMessage] }
            }
            return prev
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
    }
  }, [userId])

  // Subscription for consultation status updates
  useEffect(() => {
    if (!userId) return

    const consultationChannel = supabase
      .channel("consultations-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "consultations",
          filter: `user_id=eq.${userId}`,
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
          setActiveConsultation((prev) => {
            if (prev && prev.id === updatedConsultation.id) {
              return { ...prev, status: updatedConsultation.status }
            }
            return prev
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(consultationChannel)
    }
  }, [userId])

  const startNewConsultation = async () => {
    if (!newTopic.trim()) {
      alert("Topik konsultasi tidak boleh kosong.")
      return
    }

    try {
      const { data, error } = await supabase
        .from("consultations")
        .insert({ topic: newTopic, status: "active", user_id: userId })
        .select("*")
        .single()

      if (error) throw error

      const newConsultation: Consultation = {
        id: data.id,
        topic: data.topic,
        status: data.status,
        messages: [],
        hasNewMessage: false,
        created_at: data.created_at,
      }

      setConsultations([newConsultation, ...consultations])
      setActiveConsultation(newConsultation)
      setNewTopic("")
      setIsNewConsultationOpen(false)
    } catch (err) {
      console.error("Error starting new consultation:", err)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConsultation) {
      return
    }

    try {
      await supabase.from("messages").insert({
        consultation_id: activeConsultation.id,
        sender: "user",
        content: newMessage,
        user_id: userId,
      })

      setNewMessage("")
      setIsTyping(false)
    } catch (err) {
      console.error("Error sending message:", err)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Konsultasi</h1>
          <Dialog open={isNewConsultationOpen} onOpenChange={setIsNewConsultationOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Konsultasi Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mulai Konsultasi Baru</DialogTitle>
                <DialogDescription>Masukkan topik untuk konsultasi baru Anda.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Topik konsultasi (misalnya: Konsultasi tentang masalah kesehatan mental)"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewConsultationOpen(false)}>
                  Batal
                </Button>
                <Button onClick={startNewConsultation}>Mulai Konsultasi</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                    <CardDescription>Pilih konsultasi untuk melanjutkan percakapan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : consultations.filter((c) => c.status === "active").length > 0 ? (
                      <ScrollArea className="h-[400px] pr-4">
                        {consultations
                          .filter((c) => c.status === "active")
                          .map((consultation) => (
                            <div
                              key={consultation.id}
                              className={cn(
                                "mb-3 p-3 rounded-lg cursor-pointer transition-all relative border",
                                activeConsultation?.id === consultation.id
                                  ? "bg-muted border-primary"
                                  : "hover:bg-muted/50",
                              )}
                              onClick={() => {
                                setConsultations((prev) =>
                                  prev.map((c) => (c.id === consultation.id ? { ...c, hasNewMessage: false } : c)),
                                )
                                setActiveConsultation(consultation)
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium line-clamp-1">{consultation.topic}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(consultation.created_at)}
                                  </p>
                                </div>
                                <div className="flex items-center">
                                  {consultation.hasNewMessage && (
                                    <Badge variant="default" className="rounded-full px-2">
                                      Baru
                                    </Badge>
                                  )}
                                  <ChevronRight className="h-4 w-4 ml-2 text-muted-foreground" />
                                </div>
                              </div>
                              {consultation.messages.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                                  {consultation.messages[consultation.messages.length - 1].content}
                                </p>
                              )}
                            </div>
                          ))}
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>Belum ada konsultasi aktif</p>
                        <Button variant="outline" className="mt-4" onClick={() => setIsNewConsultationOpen(true)}>
                          Mulai Konsultasi Baru
                        </Button>
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
                          <div>
                            <CardTitle className="text-lg">{activeConsultation.topic}</CardTitle>
                            <CardDescription>
                              {activeConsultation.status === "active" ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                  Aktif
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                                  Selesai
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-4">
                            {activeConsultation.messages.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <p>Belum ada pesan. Mulai percakapan sekarang!</p>
                              </div>
                            ) : (
                              activeConsultation.messages.map((message, index) => (
                                <div
                                  key={index}
                                  className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}
                                >
                                  <div
                                    className={cn(
                                      "max-w-[80%] rounded-lg p-3",
                                      message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                                    )}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={message.avatar_url} alt={message.full_name} />
                                        <AvatarFallback>{message.sender === "user" ? "U" : "A"}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs font-medium">
                                        {message.sender === "user" ? "Anda" : message.full_name}
                                      </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    <p
                                      className={cn(
                                        "text-xs mt-1 text-right",
                                        message.sender === "user"
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
                        Pilih konsultasi dari daftar atau mulai konsultasi baru
                      </p>
                      <Button onClick={() => setIsNewConsultationOpen(true)}>Mulai Konsultasi Baru</Button>
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
                        .map((consultation) => (
                          <Card key={consultation.id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-base">{consultation.topic}</CardTitle>
                                  <CardDescription>{formatDate(consultation.created_at)}</CardDescription>
                                </div>
                                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                                  Selesai
                                </Badge>
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
                        ))}
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
    </div>
  )
}

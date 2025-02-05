"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useRouter } from "next/navigation";

const TypingIndicator = () => (
  <div className="flex items-center gap-1">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.2}s` }}
      ></div>
    ))}
  </div>
);

type Message = {
  id: number;
  sender: "user" | "admin";
  content: string;
  timestamp: Date;
  full_name?: string;
  avatar_url?: string;
};

export default function AdminKonsultasiPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Cek session admin
  useEffect(() => {
    const adminSession = sessionStorage.getItem("adminSession");
    if (adminSession) {
      setIsLoggedIn(true);
    } else {
      router.push("/admin/login");
    }
  }, [router]);

  // Fetch konsultasi dan pesan terkait
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchConsultations = async () => {
      try {
        const { data, error } = await supabase
          .from("consultations")
          .select("id, topic, status, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const consultationsWithMessages = await Promise.all(
          data.map(async (consultation) => {
            const { data: messages, error: messagesError } = await supabase
              .from("messages")
              .select("*, users(full_name), profiles(avatar_url)")
              .eq("consultation_id", consultation.id)
              .order("timestamp", { ascending: true });

            if (messagesError) throw messagesError;

            return {
              ...consultation,
              messages: messages.map((msg) => ({
                ...msg,
                full_name: msg.users?.full_name || "Pengguna",
                avatar_url: msg.profiles?.avatar_url || "/default-avatar.png",
                timestamp: new Date(msg.timestamp),
              })),
            };
          })
        );

        setConsultations(consultationsWithMessages);
      } catch (err) {
        console.error("Error fetching consultations:", err);
      }
    };

    fetchConsultations();
  }, [isLoggedIn]);

  // Real-time subscription untuk pesan baru
  useEffect(() => {
    if (!isLoggedIn) return;
  
    const messageSubscription = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const newMsg = payload.new;
  
          // Cegah duplikasi pesan
          if (
            activeConsultation?.messages.some((msg) => msg.id === newMsg.id) ||
            consultations.some((c) =>
              c.messages.some((msg) => msg.id === newMsg.id)
            )
          ) {
            return;
          }
  
          try {
            // Ambil data pengguna dan profile (untuk avatar)
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", newMsg.user_id)
              .single();
  
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("avatar_url")
              .eq("id", newMsg.user_id)
              .single();
  
            if (userError || profileError) {
              console.error("Error fetching user or profile data:", userError || profileError);
            }
  
            const enrichedMessage = {
              ...newMsg,
              full_name: userData?.full_name || "Pengguna",
              avatar_url: profileData?.avatar_url || "/default-avatar.png",
              timestamp: new Date(newMsg.timestamp),
            };
  
            // Tambahkan pesan ke konsultasi terkait
            setConsultations((prev) =>
              prev.map((consultation) =>
                consultation.id === newMsg.consultation_id
                  ? {
                      ...consultation,
                      messages: [...consultation.messages, enrichedMessage],
                    }
                  : consultation
              )
            );
  
            // Jika konsultasi aktif, perbarui juga di state activeConsultation
            if (activeConsultation?.id === newMsg.consultation_id) {
              setActiveConsultation((prev) =>
                prev
                  ? {
                      ...prev,
                      messages: [...prev.messages, enrichedMessage],
                    }
                  : null
              );
            }
          } catch (err) {
            console.error("Error enriching message data:", err);
          }
        }
      )
      .subscribe();
  
    return () => {
      messageSubscription.unsubscribe();
    };
  }, [isLoggedIn, activeConsultation, consultations]);

  // Fungsi untuk mengirim pesan
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConsultation) {
      alert("Pesan tidak boleh kosong.");
      return;
    }

    const adminSession = sessionStorage.getItem("adminSession");
    if (!adminSession) {
      console.error("Admin ID tidak ditemukan.");
      return;
    }

    try {
      const { adminId } = JSON.parse(adminSession);
      const payload = {
        consultation_id: activeConsultation.id,
        sender: "admin",
        content: newMessage,
        admin_id: adminId,
      };

      const { data, error } = await supabase
        .from("messages")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      const newMsg: Message = {
        id: data.id,
        sender: "admin",
        content: data.content,
        timestamp: new Date(data.timestamp),
      };

      const updatedConsultation = {
        ...activeConsultation,
        messages: [...activeConsultation.messages, newMsg],
      };

      setActiveConsultation(updatedConsultation);
      setConsultations((prev) =>
        prev.map((c) => (c.id === updatedConsultation.id ? updatedConsultation : c))
      );
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Fungsi untuk menutup konsultasi
  const closeConsultation = async () => {
    if (!activeConsultation) {
      console.error("Tidak ada konsultasi yang aktif untuk ditutup.");
      return;
    }
  
    try {
      const { error } = await supabase
        .from("consultations")
        .update({ status: "closed" })
        .eq("id", activeConsultation.id);
  
      if (error) throw error;
  
      setConsultations((prev) =>
        prev.map((c) =>
          c.id === activeConsultation.id ? { ...c, status: "closed" } : c
        )
      );
      setActiveConsultation(null);
    } catch (err) {
      console.error("Error closing consultation:", err);
    }
  };
  
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="max-w-screen-md mx-auto space-y-6 relative p-4">
      <h2 className="text-3xl font-bold tracking-tight mb-4">Admin Konsultasi</h2>

      {/* Tampilan Desktop */}
      <div className="hidden md:flex flex-row gap-6">
        {/* Daftar Konsultasi */}
        <div className="md:w-1/3">
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {consultations
              .filter((c) => c.status === "active")
              .map((consultation) => {
                const userMessage = consultation.messages.find(
                  (msg: Message) => msg.sender === "user"
                );
                return (
                  <div
                    key={consultation.id}
                    className={`mb-2 p-2 rounded-lg cursor-pointer relative ${
                      activeConsultation?.id === consultation.id
                        ? "bg-blue-100"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      setActiveConsultation(consultation);
                      setConsultations((prev) =>
                        prev.map((c) =>
                          c.id === consultation.id ? { ...c, hasNewMessage: false } : c
                        )
                      );
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={userMessage?.avatar_url || "/default-avatar.png"}
                        alt={userMessage?.full_name || "User"}
                        width={30}
                        height={30}
                        className="rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold">{consultation.topic}</h3>
                        <p className="text-sm text-gray-500">{consultation.status}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </ScrollArea>
        </div>
        {/* Chat Window Desktop */}
        <div className="md:w-2/3">
          {activeConsultation ? (
            <>
              <ScrollArea className="h-[400px] rounded-md border p-4 mb-4">
                {activeConsultation.messages.map((message: Message, index: number) => (
                  <div
                    key={index}
                    className={`mb-2 p-2 rounded-lg ${
                      message.sender === "admin"
                        ? "bg-blue-100 ml-auto"
                        : "bg-gray-100"
                    }`}
                    style={{ maxWidth: "70%" }}
                  >
                    <div className="flex items-center gap-2">
                      {message.sender === "user" && (
                        <Image
                          src={message.avatar_url}
                          alt={message.full_name || "User"}
                          width={30}
                          height={30}
                          className="rounded-full"
                        />
                      )}
                      <span className="text-sm font-bold">
                        {message.sender === "admin" ? "Admin" : message.full_name}
                      </span>
                    </div>
                    <p>{message.content}</p>
                    <p className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                {isTyping && <TypingIndicator />}
              </ScrollArea>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  placeholder="Ketik pesan Anda..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    setIsTyping(true);
                  }}
                  onBlur={() => setIsTyping(false)}
                  className="flex-1"
                />
                <Button onClick={sendMessage}>Kirim</Button>
                <Button onClick={closeConsultation} variant="destructive">
                  Tutup Konsultasi
                </Button>
              </div>
            </>
          ) : (
            <div className="h-[400px] flex items-center justify-center border rounded-md">
              <p className="text-gray-500">Pilih konsultasi untuk melihat detail</p>
            </div>
          )}
        </div>
      </div>

      {/* Tampilan Mobile */}
      <div className="md:hidden relative">
        {activeConsultation ? (
          // Full Chat View (tanpa menu/tab)
          <div className="absolute inset-0 z-10 p-4">
            <Button onClick={() => setActiveConsultation(null)} className="mb-4">
              Kembali
            </Button>
            <ScrollArea
              style={{ height: "calc(100vh - 150px)" }}
              className="rounded-md border p-4 mb-4"
            >
              {activeConsultation.messages.map((message: Message, index: number) => (
                <div
                  key={index}
                  className={`mb-2 p-2 rounded-lg ${
                    message.sender === "admin"
                      ? "bg-blue-100 ml-auto"
                      : "bg-gray-100"
                  }`}
                  style={{ maxWidth: "70%" }}
                >
                  <div className="flex items-center gap-2">
                    {message.sender === "user" && (
                      <Image
                        src={message.avatar_url}
                        alt={message.full_name || "User"}
                        width={30}
                        height={30}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-sm font-bold">
                      {message.sender === "admin" ? "Admin" : message.full_name}
                    </span>
                  </div>
                  <p>{message.content}</p>
                  <p className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
              {isTyping && <TypingIndicator />}
            </ScrollArea>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Ketik pesan Anda..."
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  setIsTyping(true);
                }}
                onBlur={() => setIsTyping(false)}
              />
              <Button onClick={sendMessage}>Kirim</Button>
              <Button onClick={closeConsultation} variant="destructive">
                Tutup Konsultasi
              </Button>
            </div>
          </div>
        ) : (
          // List View dengan Tabs (Active & History)
          <Tabs defaultValue="active">
            <TabsList className="overflow-x-auto">
              <TabsTrigger value="active">Konsultasi Aktif</TabsTrigger>
              <TabsTrigger value="history">Riwayat Konsultasi</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <ScrollArea
                style={{ height: "calc(100vh - 150px)" }}
                className="rounded-md border p-4"
              >
                {consultations
                  .filter((c) => c.status === "active")
                  .map((consultation) => {
                    const userMessage = consultation.messages.find(
                      (msg: Message) => msg.sender === "user"
                    );
                    return (
                      <div
                        key={consultation.id}
                        className="mb-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => setActiveConsultation(consultation)}
                      >
                        <Image
                          src={userMessage?.avatar_url || "/default-avatar.png"}
                          alt={userMessage?.full_name || "User"}
                          width={30}
                          height={30}
                          className="rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold">{consultation.topic}</h3>
                          <p className="text-sm text-gray-500">{consultation.status}</p>
                        </div>
                      </div>
                    );
                  })}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="history">
              <ScrollArea
                style={{ height: "calc(100vh - 150px)" }}
                className="rounded-md border p-4"
              >
                {consultations
                  .filter((c) => c.status === "closed")
                  .map((consultation) => {
                    const userMessage = consultation.messages.find(
                      (msg: Message) => msg.sender === "user"
                    );
                    return (
                      <div
                        key={consultation.id}
                        className="mb-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => setActiveConsultation(consultation)}
                      >
                        <Image
                          src={userMessage?.avatar_url || "/default-avatar.png"}
                          alt={userMessage?.full_name || "User"}
                          width={30}
                          height={30}
                          className="rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold">{consultation.topic}</h3>
                          <p className="text-sm text-gray-500">{consultation.status}</p>
                        </div>
                      </div>
                    );
                  })}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* CSS untuk animasi slide-in pada mobile (opsional) */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{
            animationDelay: `${i * 0.2}s`,
          }}
        ></div>
      ))}
    </div>
  );
};

// Define types
type Message = {
  id: number;
  sender: "user" | "admin";
  content: string;
  timestamp: Date;
  full_name: string;
  avatar_url: string;
};

type Consultation = {
  id: number;
  topic: string;
  messages: Message[];
  status: "active" | "closed";
  hasNewMessage: boolean;
};

export default function UserKonsultasiPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const router = useRouter();

  // Ref untuk menyimpan activeConsultation agar selalu sinkron dalam subscription realtime
  const activeConsultationRef = useRef(activeConsultation);
  useEffect(() => {
    activeConsultationRef.current = activeConsultation;
  }, [activeConsultation]);

  // Check for mobile view (based on window size)
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768); // breakpoint sesuai kebutuhan
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // cek pada mount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch user ID from session
  useEffect(() => {
    try {
      const userSession = sessionStorage.getItem("userSession");
      if (userSession) {
        const parsedSession = JSON.parse(userSession);
        if (parsedSession && parsedSession.userId) {
          setUserId(parsedSession.userId);
          return;
        }
      }
      router.push("/login");
    } catch (error) {
      console.error("Error parsing user session:", error);
      router.push("/login");
    }
  }, [router]);

  // Fetch consultations for the user
  useEffect(() => {
    const fetchConsultations = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from("consultations")
          .select("id, topic, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const consultationsWithMessages = await Promise.all(
          data.map(async (consultation: any) => {
            const { data: messages, error: messagesError } = await supabase
              .from("messages")
              .select("*, users(full_name), profiles(avatar_url)")
              .eq("consultation_id", consultation.id)
              .order("timestamp", { ascending: true });

            if (messagesError) throw messagesError;

            return {
              ...consultation,
              messages: messages.map((msg: any) => ({
                ...msg,
                full_name: msg.users?.full_name || "Admin",
                avatar_url: msg.profiles?.avatar_url || "/default-avatar.png",
                timestamp: new Date(msg.timestamp),
              })),
              hasNewMessage: false,
            };
          })
        );

        setConsultations(consultationsWithMessages);
      } catch (err) {
        console.error("Error fetching consultations:", err);
      }
    };

    fetchConsultations();
  }, [userId]);

  // Subscription Realtime untuk pesan baru
  useEffect(() => {
    if (!userId) return;

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
          const newMsgData = payload.new;
          // Format pesan baru; jika data tambahan (join) belum tersedia, gunakan nilai default
          const formattedMessage: Message = {
            id: newMsgData.id,
            sender: newMsgData.sender,
            content: newMsgData.content,
            timestamp: new Date(newMsgData.timestamp),
            full_name: newMsgData.users?.full_name || (newMsgData.sender === "user" ? "Anda" : "Admin"),
            avatar_url: newMsgData.profiles?.avatar_url || "/default-avatar.png",
          };

          // Update state consultations
          setConsultations((prev) =>
            prev.map((consultation) => {
              if (consultation.id === newMsgData.consultation_id) {
                // Tandai ada pesan baru jika konsultasi ini bukan yang aktif saat ini
                const isActive =
                  activeConsultationRef.current && activeConsultationRef.current.id === consultation.id;
                return {
                  ...consultation,
                  messages: [...consultation.messages, formattedMessage],
                  hasNewMessage: isActive ? false : true,
                };
              }
              return consultation;
            })
          );

          // Jika konsultasi yang aktif sama, tambahkan pesan ke state activeConsultation
          setActiveConsultation((prev) => {
            if (prev && prev.id === newMsgData.consultation_id) {
              return { ...prev, messages: [...prev.messages, formattedMessage] };
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [userId]);

  // Subscription Realtime untuk update status konsultasi
  useEffect(() => {
    if (!userId) return;

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
          const updatedConsultation = payload.new;
          // Update daftar konsultasi
          setConsultations((prev) =>
            prev.map((consultation) =>
              consultation.id === updatedConsultation.id
                ? { ...consultation, status: updatedConsultation.status }
                : consultation
            )
          );
          // Update activeConsultation jika relevan
          setActiveConsultation((prev) => {
            if (prev && prev.id === updatedConsultation.id) {
              return { ...prev, status: updatedConsultation.status };
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(consultationChannel);
    };
  }, [userId]);

  const startNewConsultation = async () => {
    if (!newTopic.trim()) {
      alert("Topik konsultasi tidak boleh kosong.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("consultations")
        .insert({ topic: newTopic, status: "active", user_id: userId })
        .select("*")
        .single();

      if (error) throw error;

      const newConsultation: Consultation = {
        id: data.id,
        topic: data.topic,
        status: data.status,
        messages: [],
        hasNewMessage: false,
      };

      setConsultations([newConsultation, ...consultations]);
      setActiveConsultation(newConsultation);
      setNewTopic("");
    } catch (err) {
      console.error("Error starting new consultation:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      alert("Pesan tidak boleh kosong.");
      return;
    }

    if (activeConsultation) {
      try {
        const { data, error } = await supabase
          .from("messages")
          .insert({
            consultation_id: activeConsultation.id,
            sender: "user",
            content: newMessage,
            user_id: userId,
          })
          .select("*")
          .single();

        if (error) throw error;

        // Setelah pesan dikirim, reset input pesan dan status mengetik
        setNewMessage("");
        setIsTyping(false);
      } catch (err) {
        console.error("Error sending message:", err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight mb-4">Konsultasi</h2>
      <Tabs defaultValue="chat" className="w-full">
        <TabsList>
          <TabsTrigger value="chat">Konsultasi Aktif</TabsTrigger>
          <TabsTrigger value="history">Riwayat Konsultasi</TabsTrigger>
        </TabsList>
        <TabsContent value="chat">
          <div className="flex flex-col md:flex-row gap-6">
            <div className={`md:w-1/3 ${isMobileView && activeConsultation ? "hidden" : ""}`}>
              <Input
                placeholder="Topik konsultasi baru"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="mb-2"
              />
              <Button onClick={startNewConsultation} className="w-full mb-4">
                Mulai Konsultasi Baru
              </Button>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                {consultations
                  .filter((c) => c.status === "active")
                  .map((consultation) => (
                    <div
                      key={consultation.id}
                      className="mb-4 p-4 border rounded-lg cursor-pointer relative"
                      onClick={() => {
                        // Reset notifikasi pesan baru ketika konsultasi dibuka
                        setConsultations((prev) =>
                          prev.map((c) =>
                            c.id === consultation.id ? { ...c, hasNewMessage: false } : c
                          )
                        );
                        setActiveConsultation(consultation);
                      }}
                    >
                      {consultation.hasNewMessage && (
                        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"></div>
                      )}
                      <h3 className="font-semibold">{consultation.topic}</h3>
                      <p className="text-sm text-gray-500">{consultation.status}</p>
                    </div>
                  ))}
              </ScrollArea>
            </div>
            <div className={`md:w-2/3 ${isMobileView && activeConsultation ? "block" : ""}`}>
              {activeConsultation ? (
                <>
                  <Button onClick={() => setActiveConsultation(null)} className="mb-4">
                    Kembali
                  </Button>
                  <ScrollArea className="h-[400px] rounded-md border p-4">
                    {activeConsultation.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`mb-2 p-2 rounded-lg ${
                          message.sender === "user" ? "bg-blue-100 ml-auto" : "bg-gray-100"
                        }`}
                        style={{ maxWidth: "70%" }}
                      >
                        <div className="flex items-center gap-2">
                          <Image
                            src={message.avatar_url || "/default-avatar.png"}
                            alt={message.full_name || "User"}
                            width={30}
                            height={30}
                            className="rounded-full"
                          />
                          <span className="text-sm font-bold">
                            {message.sender === "user" ? "Anda" : message.full_name || "Admin"}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="flex gap-2 mt-4">
                    <Input
                      placeholder="Ketik pesan Anda..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="w-full"
                    />
                    <Button onClick={sendMessage}>Kirim</Button>
                  </div>
                </>
              ) : (
                <div className="h-[400px] flex items-center justify-center border rounded-md">
                  <p className="text-gray-500">Pilih konsultasi untuk melihat detail</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="history">
          <ScrollArea className="h-[500px] rounded-md border p-4">
            {consultations
              .filter((c) => c.status === "closed")
              .map((consultation) => (
                <div key={consultation.id} className="mb-4 p-4 border rounded-lg">
                  <h3 className="font-semibold">{consultation.topic}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Status:{" "}
                    <span
                      className={`${
                        consultation.status === "active" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {consultation.status === "active" ? "Aktif" : "Selesai"}
                    </span>
                  </p>
                  <Button onClick={() => setActiveConsultation(consultation)}>
                    Lihat Konsultasi
                  </Button>
                </div>
              ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type Message = {
  id: number;
  sender: "user" | "admin";
  content: string;
  timestamp: string;
  full_name?: string;
  avatar_url?: string;
  consultation_id: number;
};

type Consultation = {
  id: number;
  topic: string;
  status: "active" | "closed";
};

type Props = {
  activeConsultation: Consultation | null;
  userId: string | null;
};

export default function ChatWindow({ activeConsultation, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // ✅ Ambil pesan setiap kali konsultasi aktif berubah
  useEffect(() => {
    if (!activeConsultation) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("consultation_id", activeConsultation.id)
        .order("timestamp", { ascending: true });

      if (error) {
        console.error("Gagal mengambil pesan:", error);
      } else {
        setMessages(data);
      }
    };

    fetchMessages();
  }, [activeConsultation]);

  // ✅ Kirim pesan baru
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConsultation) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([{ consultation_id: activeConsultation.id, sender: "user", content: newMessage, user_id: userId }])
        .select("*")
        .single();

      if (error) throw error;

      setMessages([...messages, data]);
      setNewMessage("");
    } catch (err) {
      console.error("Error mengirim pesan:", err);
    }
  };

  return (
    <div className="md:w-2/3 p-4">
      {activeConsultation ? (
        <>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {messages.map((message) => (
              <div key={message.id} className={`mb-2 p-2 rounded-lg ${message.sender === "user" ? "bg-blue-100" : "bg-gray-100"}`}>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</p>
              </div>
            ))}
          </ScrollArea>
          <div className="flex gap-2 mt-4">
            {activeConsultation.status === "active" ? (
              <>
                <Input placeholder="Ketik pesan Anda..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                <Button onClick={sendMessage}>Kirim</Button>
              </>
            ) : (
              <p className="text-gray-500">Konsultasi telah selesai.</p>
            )}
          </div>
        </>
      ) : (
        <div className="h-[400px] flex items-center justify-center border rounded-md">
          <p className="text-gray-500">Pilih konsultasi untuk melihat pesan</p>
        </div>
      )}
    </div>
  );
}

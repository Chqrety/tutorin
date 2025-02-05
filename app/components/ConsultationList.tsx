"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";

type Consultation = {
  id: number;
  topic: string;
  status: "active" | "closed";
};

type Props = {
  setActiveConsultation: (consultation: Consultation | null) => void;
  userId: string | null;
};

export default function ConsultationList({ setActiveConsultation, userId }: Props) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [newTopic, setNewTopic] = useState("");

  // 🔄 Ambil daftar konsultasi yang masih aktif saat pertama kali dimuat
  useEffect(() => {
  
        if (!userId) {
          console.error("userId tidak valid.");
          return;
        }
      
        const fetchConsultations = async () => {
          const { data, error } = await supabase
            .from("consultations")
            .select("*")
            .eq("status", "active")
            .eq("user_id", userId) // Pastikan userId valid
            .order("id", { ascending: false });
      
          if (error) {
            console.error("Gagal mengambil konsultasi:", error);
          } else {
            setConsultations(data);
          }
        };
      
        fetchConsultations();
      }, [userId]);
      

  // ✅ Mulai konsultasi baru
  const startNewConsultation = async () => {
    if (!newTopic.trim()) {
      alert("Topik konsultasi tidak boleh kosong.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("consultations")
        .insert([{ topic: newTopic, status: "active", user_id: userId }])
        .select("*")
        .single();

      if (error) throw error;

      setConsultations([data, ...consultations]);
      setActiveConsultation(data);
      setNewTopic("");
    } catch (err) {
      console.error("Error memulai konsultasi:", err);
    }
  };

  return (
    <div className="md:w-1/3 p-4 border-r">
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
        {consultations.map((consultation) => (
          <div
            key={consultation.id}
            className="mb-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-100"
            onClick={() => setActiveConsultation(consultation)}
          >
            <h3 className="font-semibold">{consultation.topic}</h3>
            <p className="text-sm text-gray-500">Status: {consultation.status}</p>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}

// app/components/SidebarProfile.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import LogoutButton from "./LogoutButton";

type ProfileData = {
  full_name: string;
  avatar_url: string | null;
};

export default function SidebarProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem("userSession");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed?.userId) {
          // Buat Supabase client menggunakan URL dan anon key yang sudah diset di environment
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
          const supabase = createClient(supabaseUrl, supabaseAnonKey);

          const fetchProfile = async () => {
            const { data, error } = await supabase
              .from("users")
              .select("full_name, profiles(avatar_url)")
              .eq("id", parsed.userId)
              .single();

            if (error) {
              console.error("Error fetching profile data:", error);
              return;
            }

            if (data) {
              setProfile({
                full_name: data.full_name,
                avatar_url: data.profiles?.avatar_url || "/placeholder-user.jpg",
              });
            }
          };

          fetchProfile();
        }
      } catch (err) {
        console.error("Error parsing user session:", err);
      }
    }
  }, []);

  return (
    <div className="flex items-center space-x-4 mb-6">
      {profile ? (
        <>
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={profile.avatar_url || "/placeholder-user.jpg"}
              alt={profile.full_name}
            />
            <AvatarFallback>
              {profile.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-2xl font-bold">{profile.full_name}</p>
            <LogoutButton />
          </div>
        </>
      ) : (
        <div>
          <p className="text-lg">Guest</p>
          <Link href="/login">
            <Button variant="link" className="p-0 text-blue-600">
              Login
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

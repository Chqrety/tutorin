// app/components/AskQuestionButton.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProtectedLink from "./ProtectedLink";

export default function AskQuestionButton() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem("userSession");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed?.userId) {
          setLoggedIn(true);
        }
      } catch (err) {
        console.error("Error parsing session:", err);
      }
    }
  }, []);

  // Jika sudah login, arahkan ke dashboard/posts/add
  // Jika belum, gunakan ProtectedLink agar modal autentikasi muncul
  if (loggedIn) {
    return (
      <Button asChild>
        <Link href="/dashboard/posts/add">Ask Question</Link>
      </Button>
    );
  } else {
    return (
      <ProtectedLink href="/dashboard/posts/add">
        <Button>Ask Question</Button>
      </ProtectedLink>
    );
  }
}

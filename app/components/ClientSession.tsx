"use client";

import { useState, useEffect, createContext, useContext } from "react";

// Buat context untuk menyimpan status sesi
const SessionContext = createContext<{ isLoggedIn: boolean }>({ isLoggedIn: false });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem("userSession");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed?.userId) {
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("Error parsing session:", err);
      }
    }
  }, []);

  return (
    <SessionContext.Provider value={{ isLoggedIn }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

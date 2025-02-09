// app/questions/QuestionsPageWrapper.tsx
"use client";

import { SessionProvider } from "../components/ClientSession";
import QuestionsPageServer from "./page";

export default function QuestionsPageWrapper() {
  return (
    <SessionProvider>
      <QuestionsPageServer />
    </SessionProvider>
  );
}

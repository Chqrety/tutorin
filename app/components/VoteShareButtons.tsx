// app/components/VoteShareButtons.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // pastikan supabase client tersedia di sini
import { ArrowUpCircle, ArrowDownCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type VoteShareButtonsProps = {
  questionId: string;
  initialVotes: number;
  questionUrl: string;
};

export default function VoteShareButtons({
  questionId,
  initialVotes,
  questionUrl,
}: VoteShareButtonsProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState(false);

  // Periksa apakah pengguna sudah pernah memberikan suara untuk pertanyaan ini
  useEffect(() => {
    const votedKey = `voted_${questionId}`;
    if (sessionStorage.getItem(votedKey)) {
      setHasVoted(true);
    }
  }, [questionId]);

  const handleVote = async (delta: number) => {
    // Cek apakah pengguna sudah login
    const session = sessionStorage.getItem("userSession");
    if (!session) {
      alert("Please log in to vote.");
      return;
    }

    // Batasi hanya satu suara per pertanyaan
    if (hasVoted) {
      alert("You have already voted on this question.");
      return;
    }

    // Optimistic update
    const newVotes = votes + delta;
    setVotes(newVotes);

    // Update nilai vote di database
    const { error } = await supabase
      .from("questions")
      .update({ votes: newVotes })
      .eq("id", questionId);

    if (error) {
      console.error("Error updating vote:", error.message);
      // Rollback jika terjadi error
      setVotes(votes);
    } else {
      setHasVoted(true);
      // Tandai bahwa pengguna telah memberikan suara untuk pertanyaan ini
      sessionStorage.setItem(`voted_${questionId}`, "true");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check out this question",
          url: questionUrl,
        });
      } else {
        // Fallback: copy URL ke clipboard
        await navigator.clipboard.writeText(questionUrl);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(1)}
        disabled={hasVoted}
      >
        <ArrowUpCircle className="h-4 w-4 mr-1 text-green-500" />
      </Button>
      <span>{votes} votes</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={hasVoted}
      >
        <ArrowDownCircle className="h-4 w-4 mr-1 text-red-500" />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleShare}>
        <Share2 className="h-4 w-4 mr-1" />
        Share
      </Button>
    </div>
  );
}

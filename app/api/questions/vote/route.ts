import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { questionId, userId, action } = await request.json()

    // Validate input
    if (!questionId || !userId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if action is valid
    if (action !== "upvote" && action !== "downvote") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (action === "upvote") {
      // Check if user has already voted
      const { data: existingVote, error: checkError } = await supabase
        .from("question_votes")
        .select("id")
        .eq("question_id", questionId)
        .eq("user_id", userId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is the error code for "no rows returned"
        return NextResponse.json({ error: "Error checking vote status" }, { status: 500 })
      }

      if (existingVote) {
        return NextResponse.json({ error: "Already voted" }, { status: 409 })
      }

      // Add vote
      const { error: insertError } = await supabase.from("question_votes").insert({
        question_id: questionId,
        user_id: userId,
      })

      if (insertError) {
        return NextResponse.json({ error: "Error adding vote" }, { status: 500 })
      }

      // Increment vote count
      const { error: incrementError } = await supabase.rpc("increment_question_votes", {
        question_id: questionId,
      })

      if (incrementError) {
        return NextResponse.json({ error: "Error incrementing vote count" }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: "upvote" })
    } else {
      // action === "downvote"
      // Check if user has voted
      const { data: existingVote, error: checkError } = await supabase
        .from("question_votes")
        .select("id")
        .eq("question_id", questionId)
        .eq("user_id", userId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        return NextResponse.json({ error: "Error checking vote status" }, { status: 500 })
      }

      if (!existingVote) {
        return NextResponse.json({ error: "Cannot remove non-existent vote" }, { status: 409 })
      }

      // Remove vote
      const { error: deleteError } = await supabase
        .from("question_votes")
        .delete()
        .eq("question_id", questionId)
        .eq("user_id", userId)

      if (deleteError) {
        return NextResponse.json({ error: "Error removing vote" }, { status: 500 })
      }

      // Decrement vote count
      const { error: decrementError } = await supabase.rpc("decrement_question_votes", {
        question_id: questionId,
      })

      if (decrementError) {
        return NextResponse.json({ error: "Error decrementing vote count" }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: "downvote" })
    }
  } catch (error) {
    console.error("Vote error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

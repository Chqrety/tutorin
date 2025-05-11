import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await the params to get the actual values
    const { id: questionId } = await params;

    if (!questionId) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 })
    }

    // Get vote count
    const { count: voteCount, error: voteError } = await supabase
      .from("question_votes")
      .select("*", { count: "exact", head: false })
      .eq("question_id", questionId)

    if (voteError) {
      return NextResponse.json({ error: "Error fetching vote count" }, { status: 500 })
    }

    // Get answer count
    const { count: answerCount, error: answerError } = await supabase
      .from("answers")
      .select("*", { count: "exact", head: false })
      .eq("question_id", questionId)

    if (answerError) {
      return NextResponse.json({ error: "Error fetching answer count" }, { status: 500 })
    }

    // Get comment count
    const { count: commentCount, error: commentError } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: false })
      .eq("question_id", questionId)

    if (commentError) {
      return NextResponse.json({ error: "Error fetching comment count" }, { status: 500 })
    }

    return NextResponse.json({
      votes: voteCount || 0,
      answers: answerCount || 0,
      comments: commentCount || 0,
    })
  } catch (error) {
    console.error("Error fetching counts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

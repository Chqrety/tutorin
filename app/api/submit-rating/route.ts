import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";
import * as z from "zod";

// Validasi input menggunakan Zod
const ratingSchema = z.object({
    schedule_id: z.number().int("ID Jadwal harus berupa angka"), // Sekarang bisa menerima angka!
    stars: z.number().min(0.5, "Rating minimal 0.5").max(5, "Rating maksimal 5"),
    description: z.string().min(10, "Deskripsi harus minimal 10 karakter"),
  });
  
// Middleware untuk mendapatkan user dari token
async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Token tidak ditemukan dalam request" };
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return { user: null, error: "Token kosong." };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default-secret");
    return { user: decoded, error: null };
  } catch (err) {
    return { user: null, error: "Token tidak valid atau expired." };
  }
}

export async function POST(req: Request) {
  try {
    // Autentikasi pengguna
    const { user, error: authError } = await getUserFromRequest(req);

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized: Invalid token." }, { status: 401 });
    }

    const { userId } = user;

    // Parse request body
    const body = await req.json();

    // Validasi data input
    const validatedData = ratingSchema.safeParse(body);
    if (!validatedData.success) {
      console.error("Validasi gagal:", validatedData.error.errors);
      return NextResponse.json(
        { message: "Validation Error", errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { schedule_id, stars, description } = validatedData.data;

    // Ambil data schedule dan cek apakah rating sudah diberikan sebelumnya
    const [{ data: schedule, error: scheduleError }, { data: existingRating, error: ratingError }] =
      await Promise.all([
        supabase.from("schedules").select("id, user_id, status").eq("id", schedule_id).single(),
        supabase.from("ratings").select("id").eq("schedule_id", schedule_id).single(),
      ]);

    if (scheduleError || !schedule) {
      return NextResponse.json({ message: "Invalid schedule_id." }, { status: 400 });
    }

    if (schedule.user_id !== userId) {
      return NextResponse.json({ message: "Forbidden: You do not own this schedule." }, { status: 403 });
    }

    if (schedule.status !== "Finished") {
      return NextResponse.json({ message: "Cannot rate a schedule that is not finished." }, { status: 400 });
    }

    if (existingRating) {
      return NextResponse.json({ message: "You have already rated this schedule." }, { status: 400 });
    }

    // Simpan rating di database
    const { error: insertError } = await supabase.from("ratings").insert([
      {
        schedule_id,
        stars,
        description,
        user_id: userId,
      },
    ]);

    if (insertError) {
      console.error("Error inserting rating:", insertError);
      return NextResponse.json({ message: "Failed to submit rating." }, { status: 500 });
    }

    return NextResponse.json({ message: "Rating submitted successfully." }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

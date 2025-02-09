import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// SECRET_KEY untuk JWT (gunakan env variable)
const SECRET_KEY = process.env.JWT_SECRET || "secret";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Cari user berdasarkan email
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, encrypted_password")
      .eq("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { message: "Email tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validasi password
    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Password salah" },
        { status: 400 }
      );
    }

    // Buat token JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "1h",
    });

    // Buat response dan set cookie
    const response = NextResponse.json({
      userId: user.id,
      email: user.email,
      token, // Token dikirim ke frontend juga (jika diperlukan)
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600, // 1 jam
      path: "/",
      sameSite: "strict",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

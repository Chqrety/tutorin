// app/api/send-email/route.ts

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

type EmailRequestBody = {
  email: string; // Email penerima
  scheduleId?: number; // Opsional, terkait jadwal konsultasi
  subject: string;
  body: string;
  senderRole: 'admin' | 'user'; // Menandakan siapa yang mengirim email
};

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || token !== process.env.AUTH_TOKEN) {
      console.log('Unauthorized request. Token:', token);
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { email, scheduleId, subject, body, senderRole }: EmailRequestBody = await request.json();

    if (!email || !subject || !body || !senderRole) {
      console.log('Missing required fields:', { email, subject, body, senderRole });
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Konfigurasi transporter Nodemailer
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // e.g., 'Gmail'
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verifikasi koneksi transporter
    await transporter.verify();
    console.log('SMTP transporter is ready');

    // Tentukan pengirim berdasarkan senderRole
    const fromEmail = senderRole === 'admin' ? `"Admin Konsultan" <${process.env.EMAIL_FROM}>` : `"User Konsultan" <${process.env.EMAIL_FROM}>`;

    // Kirim email
    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject,
      text: body,
      // Anda juga bisa menambahkan HTML body jika diinginkan
      // html: "<p>" + body.replace(/\n/g, "<br>") + "</p>",
    });

    console.log('Email sent successfully to:', email);

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ message: 'Error sending email' }, { status: 500 });
  }
}

// Optional: Handle GET request
export async function GET(request: Request) {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

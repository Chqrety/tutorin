export interface Question {
  id: number
  text: string
  options: { label: string; category: "network" | "ai" | "web" | "mobile" }[]
}

export const questions: Question[] = [
  {
    id: 1,
    text: "Saya suka mengonfigurasi router dan switch.",
    options: [
      { label: "Sangat Setuju", category: "network" },
      { label: "Setuju", category: "network" },
      { label: "Netral", category: "web" },
      { label: "Tidak Setuju", category: "mobile" },
    ],
  },
  {
    id: 2,
    text: "Saya tertarik dengan algoritma machine learning dan kecerdasan buatan.",
    options: [
      { label: "Sangat Setuju", category: "ai" },
      { label: "Setuju", category: "ai" },
      { label: "Netral", category: "web" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 3,
    text: "Saya senang membuat tampilan website yang menarik.",
    options: [
      { label: "Sangat Setuju", category: "web" },
      { label: "Setuju", category: "web" },
      { label: "Netral", category: "mobile" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 4,
    text: "Saya tertarik mengembangkan aplikasi untuk smartphone.",
    options: [
      { label: "Sangat Setuju", category: "mobile" },
      { label: "Setuju", category: "mobile" },
      { label: "Netral", category: "web" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 5,
    text: "Saya suka mempelajari protokol jaringan seperti TCP/IP.",
    options: [
      { label: "Sangat Setuju", category: "network" },
      { label: "Setuju", category: "network" },
      { label: "Netral", category: "ai" },
      { label: "Tidak Setuju", category: "web" },
    ],
  },
  {
    id: 6,
    text: "Saya tertarik dengan analisis data dan statistik.",
    options: [
      { label: "Sangat Setuju", category: "ai" },
      { label: "Setuju", category: "ai" },
      { label: "Netral", category: "network" },
      { label: "Tidak Setuju", category: "mobile" },
    ],
  },
  {
    id: 7,
    text: "Saya senang membuat animasi dan interaksi di website.",
    options: [
      { label: "Sangat Setuju", category: "web" },
      { label: "Setuju", category: "web" },
      { label: "Netral", category: "mobile" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 8,
    text: "Saya tertarik dengan pengembangan aplikasi yang bisa digunakan offline di perangkat mobile.",
    options: [
      { label: "Sangat Setuju", category: "mobile" },
      { label: "Setuju", category: "mobile" },
      { label: "Netral", category: "web" },
      { label: "Tidak Setuju", category: "ai" },
    ],
  },
  {
    id: 9,
    text: "Saya suka menyelesaikan masalah keamanan jaringan.",
    options: [
      { label: "Sangat Setuju", category: "network" },
      { label: "Setuju", category: "network" },
      { label: "Netral", category: "ai" },
      { label: "Tidak Setuju", category: "web" },
    ],
  },
  {
    id: 10,
    text: "Saya tertarik dengan pengolahan bahasa alami (NLP).",
    options: [
      { label: "Sangat Setuju", category: "ai" },
      { label: "Setuju", category: "ai" },
      { label: "Netral", category: "web" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 11,
    text: "Saya senang mengoptimalkan performa website.",
    options: [
      { label: "Sangat Setuju", category: "web" },
      { label: "Setuju", category: "web" },
      { label: "Netral", category: "network" },
      { label: "Tidak Setuju", category: "mobile" },
    ],
  },
  {
    id: 12,
    text: "Saya tertarik dengan pengembangan UI/UX untuk aplikasi mobile.",
    options: [
      { label: "Sangat Setuju", category: "mobile" },
      { label: "Setuju", category: "mobile" },
      { label: "Netral", category: "web" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 13,
    text: "Saya suka mengonfigurasi dan mengelola server.",
    options: [
      { label: "Sangat Setuju", category: "network" },
      { label: "Setuju", category: "network" },
      { label: "Netral", category: "web" },
      { label: "Tidak Setuju", category: "mobile" },
    ],
  },
  {
    id: 14,
    text: "Saya tertarik dengan computer vision dan pengolahan gambar.",
    options: [
      { label: "Sangat Setuju", category: "ai" },
      { label: "Setuju", category: "ai" },
      { label: "Netral", category: "mobile" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 15,
    text: "Saya senang membuat API dan backend untuk website.",
    options: [
      { label: "Sangat Setuju", category: "web" },
      { label: "Setuju", category: "web" },
      { label: "Netral", category: "network" },
      { label: "Tidak Setuju", category: "mobile" },
    ],
  },
  {
    id: 16,
    text: "Saya tertarik dengan pengembangan aplikasi AR/VR di perangkat mobile.",
    options: [
      { label: "Sangat Setuju", category: "mobile" },
      { label: "Setuju", category: "mobile" },
      { label: "Netral", category: "ai" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 17,
    text: "Saya suka mempelajari teknologi cloud dan virtualisasi.",
    options: [
      { label: "Sangat Setuju", category: "network" },
      { label: "Setuju", category: "network" },
      { label: "Netral", category: "web" },
      { label: "Tidak Setuju", category: "mobile" },
    ],
  },
  {
    id: 18,
    text: "Saya tertarik dengan pengembangan sistem rekomendasi.",
    options: [
      { label: "Sangat Setuju", category: "ai" },
      { label: "Setuju", category: "ai" },
      { label: "Netral", category: "web" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 19,
    text: "Saya senang membuat website yang responsif untuk berbagai ukuran layar.",
    options: [
      { label: "Sangat Setuju", category: "web" },
      { label: "Setuju", category: "web" },
      { label: "Netral", category: "mobile" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 20,
    text: "Saya tertarik dengan pengembangan game mobile.",
    options: [
      { label: "Sangat Setuju", category: "mobile" },
      { label: "Setuju", category: "mobile" },
      { label: "Netral", category: "web" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 21,
    text: "Saya suka mendiagnosis dan memperbaiki masalah jaringan.",
    options: [
      { label: "Sangat Setuju", category: "network" },
      { label: "Setuju", category: "network" },
      { label: "Netral", category: "ai" },
      { label: "Tidak Setuju", category: "web" },
    ],
  },
  {
    id: 22,
    text: "Saya tertarik dengan deep learning dan neural networks.",
    options: [
      { label: "Sangat Setuju", category: "ai" },
      { label: "Setuju", category: "ai" },
      { label: "Netral", category: "mobile" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 23,
    text: "Saya senang menggunakan framework JavaScript modern seperti React atau Vue.",
    options: [
      { label: "Sangat Setuju", category: "web" },
      { label: "Setuju", category: "web" },
      { label: "Netral", category: "mobile" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 24,
    text: "Saya tertarik dengan pengembangan aplikasi cross-platform seperti React Native atau Flutter.",
    options: [
      { label: "Sangat Setuju", category: "mobile" },
      { label: "Setuju", category: "mobile" },
      { label: "Netral", category: "web" },
      { label: "Tidak Setuju", category: "ai" },
    ],
  },
  {
    id: 25,
    text: "Saya suka mempelajari teknologi IoT dan komunikasi antar perangkat.",
    options: [
      { label: "Sangat Setuju", category: "network" },
      { label: "Setuju", category: "network" },
      { label: "Netral", category: "ai" },
      { label: "Tidak Setuju", category: "web" },
    ],
  },
  {
    id: 26,
    text: "Saya tertarik dengan data mining dan big data.",
    options: [
      { label: "Sangat Setuju", category: "ai" },
      { label: "Setuju", category: "ai" },
      { label: "Netral", category: "network" },
      { label: "Tidak Setuju", category: "mobile" },
    ],
  },
  {
    id: 27,
    text: "Saya senang mengintegrasikan berbagai API ke dalam website.",
    options: [
      { label: "Sangat Setuju", category: "web" },
      { label: "Setuju", category: "web" },
      { label: "Netral", category: "mobile" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
  {
    id: 28,
    text: "Saya tertarik dengan pengembangan aplikasi yang memanfaatkan sensor di perangkat mobile.",
    options: [
      { label: "Sangat Setuju", category: "mobile" },
      { label: "Setuju", category: "mobile" },
      { label: "Netral", category: "ai" },
      { label: "Tidak Setuju", category: "web" },
    ],
  },
  {
    id: 29,
    text: "Saya suka mempelajari teknologi SDN (Software-Defined Networking).",
    options: [
      { label: "Sangat Setuju", category: "network" },
      { label: "Setuju", category: "network" },
      { label: "Netral", category: "ai" },
      { label: "Tidak Setuju", category: "mobile" },
    ],
  },
  {
    id: 30,
    text: "Saya tertarik dengan pengembangan chatbot dan asisten virtual.",
    options: [
      { label: "Sangat Setuju", category: "ai" },
      { label: "Setuju", category: "ai" },
      { label: "Netral", category: "web" },
      { label: "Tidak Setuju", category: "network" },
    ],
  },
]

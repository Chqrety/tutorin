"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Pastikan path benar
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import { Star } from "lucide-react";

const TestimonialCard = ({ fullName, role, content, avatarUrl, stars }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center text-center"
    >
      {/* Avatar */}
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={fullName}
          width={64}
          height={64}
          className="w-16 h-16 rounded-full mb-4"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center mb-4">
          <span className="text-gray-500">?</span>
        </div>
      )}

      {/* Star Rating dengan Setengah Bintang */}
      <div className="flex items-center relative mb-2">
        {[...Array(5)].map((_, index) => {
          const isFull = index < Math.floor(stars); // Bintang penuh
          const isHalf = index === Math.floor(stars) && stars % 1 !== 0; // Bintang setengah

          return (
            <div key={index} className="relative w-5 h-5">
              {/* Lapisan 1: Bintang Kosong dengan Stroke */}
              <Star size={20} className="text-gray-300 absolute inset-0" />

              {/* Lapisan 2: Bintang Penuh atau Setengah dengan Fill */}
              {isFull && <Star size={20} className="text-yellow-400 absolute inset-0" fill="#facc15" />}
              {isHalf && (
                <div
                  className="absolute top-0 left-0 h-full w-1/2 overflow-hidden"
                  style={{ clipPath: "polygon(0 0, 100% 0, 90% 100%, 0 100%)" }}
                >
                  <Star size={20} className="text-yellow-400" fill="#facc15" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Menampilkan Nilai Rating di Bawah Bintang */}
      <p className="text-sm font-semibold text-gray-700 mb-2">{stars.toFixed(1)} / 5</p>

      {/* Testimonial Content */}
      <p className="text-gray-600 mb-4">"{content}"</p>
      <div className="font-semibold">{fullName}</div>
      <div className="text-sm text-gray-500">{role}</div>
    </motion.div>
  );
};


const Testimonial = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        // Ambil data ratings + user + profile dalam satu query
        const { data: ratings, error: ratingError } = await supabase
          .from("ratings")
          .select(`
            stars,
            description,
            user_id,
            users (
              full_name,
              profiles (
                avatar_url
              )
            )
          `);
    
        if (ratingError) throw ratingError;
    
        // Gabungkan data ratings dengan users & profiles
        const combinedData = ratings.map((rating) => ({
          fullName: rating.users ? rating.users.full_name : "Pengguna Anonim",
          avatarUrl: rating.users && rating.users.profiles ? rating.users.profiles.avatar_url : null,
          role: "Doscom Konsultan",
          content: rating.description,
          stars: rating.stars || 0, // Pastikan ada nilai stars
        }));
    
        setTestimonials(combinedData);
      } catch (err) {
        console.error("Error fetching testimonials:", err.message);
      }
    };
    
    

    fetchTestimonials();
  }, []);

  return (
    <section id="testimoni" className="py-20 bg-blue-50">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12">Apa Kata Mereka?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.length > 0 ? (
            testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))
          ) : (
            <p className="text-center col-span-3 text-gray-500">Belum ada testimoni.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonial;

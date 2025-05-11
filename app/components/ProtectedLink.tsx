"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type ProtectedLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string; // Optional className prop
};

export default function ProtectedLink({ href, children, className }: ProtectedLinkProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter(); // useRouter for programmatic navigation

  // Check session from sessionStorage when the component mounts
  useEffect(() => {
    const session = sessionStorage.getItem("userSession");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed?.userId) {
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("Error parsing user session:", err);
      }
    }
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isLoggedIn) {
      e.preventDefault(); // Prevent the default link navigation
      setShowModal(true); // Show the login modal
    }
  };

  const handleCloseModal = () => {
    setShowModal(false); // Close the modal
  };

  return (
    <>
      <Link href={href} className={className} onClick={handleClick}>
        {children}
      </Link>

      {/* Modal for unauthenticated users */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
            <p className="mb-4">Please login or sign up to view the content.</p>
            <div className="flex justify-end space-x-4">
              <Link href="/login">
                <Button>Login</Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline">Sign Up</Button>
              </Link>
              <Button variant="ghost" onClick={handleCloseModal}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

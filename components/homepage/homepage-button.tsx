"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AuthModal } from "@/components/auth/auth-modal";
import type { User } from "@supabase/supabase-js";

interface HomepageButtonProps {
  user: User | null;
}

export function HomepageButton({ user }: HomepageButtonProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (user) {
    // User is authenticated - show "Go to Dashboard" button
    return (
      <Button asChild size="lg">
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    );
  }

  // User is not authenticated - show "Login / Sign Up" button that opens modal
  return (
    <>
      <Button size="lg" onClick={() => setIsAuthModalOpen(true)}>
        Login / Sign Up
      </Button>
      <AuthModal 
        open={isAuthModalOpen} 
        onOpenChange={setIsAuthModalOpen} 
      />
    </>
  );
}
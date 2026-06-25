'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { useAnalyzeUrlModal } from "./analyze-url-dialog";

interface LandingNavProps {
  user: User | null;
  loading: boolean;
}

const SCROLL_THRESHOLD_PX = 12;

export function LandingNav({ user, loading }: LandingNavProps) {
  const { openModal } = useAnalyzeUrlModal();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border/60 shadow-sm"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center min-w-0 flex-shrink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/Selia-logo-primary.svg"
            alt="Selia"
            className="h-8 sm:h-10 w-auto"
          />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {loading ? (
            <div className="w-24 h-9 bg-muted rounded-lg animate-pulse" />
          ) : user ? (
            <Button size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 w-4 h-4" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/login">Logg inn</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/register">Opprett gratis konto</Link>
              </Button>
              <Button size="sm" onClick={() => openModal()}>
                Prøv gratis
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

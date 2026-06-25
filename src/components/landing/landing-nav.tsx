'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronRight, LayoutDashboard, Menu } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface LandingNavProps {
  user: User | null;
  loading: boolean;
}

const SCROLL_THRESHOLD_PX = 12;

const NAV_LINKS = [
  { href: "#slik-fungerer-det", label: "Slik fungerer det" },
  { href: "#priser", label: "Priser" },
  { href: "#faq", label: "FAQ" },
] as const;

const mobileNavItemClass =
  "flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground hover:bg-muted/70 active:bg-muted transition-colors";

function MobileNavMenu({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden size-9 rounded-xl hover:bg-muted/70"
          aria-label="Åpne meny"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(100%,20rem)] p-0 flex flex-col gap-0 border-l border-border/60"
      >
        <div className="px-5 pt-6 pb-4 border-b border-border/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/Selia-logo-primary.svg"
            alt="Selia"
            className="h-8 w-auto"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Navigasjon
          </p>
          <nav className="flex flex-col gap-0.5">
            {NAV_LINKS.map(({ href, label }) => (
              <a key={href} href={href} onClick={close} className={mobileNavItemClass}>
                {label}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-border/60 bg-muted/25 px-4 py-4 space-y-2">
          <p className="px-1 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Konto
          </p>
          {user ? (
            <Button size="sm" className="w-full rounded-xl" asChild>
              <Link href="/dashboard" onClick={close}>
                <LayoutDashboard className="mr-2 size-4" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start rounded-xl h-11 px-3 font-medium"
                asChild
              >
                <Link href="/login" onClick={close}>
                  Logg inn
                </Link>
              </Button>
              <Button size="sm" className="w-full rounded-xl h-11" asChild>
                <Link href="/register" onClick={close}>
                  Opprett gratis konto
                </Link>
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function LandingNav({ user, loading }: LandingNavProps) {
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
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5 shrink-0">
          {loading ? (
            <div className="w-24 h-9 bg-muted rounded-lg animate-pulse" />
          ) : (
            <>
              <div className="hidden md:flex items-center gap-5">
                {NAV_LINKS.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    {label}
                  </a>
                ))}
              </div>
              {user ? (
                <>
                  <Button size="sm" asChild className="hidden sm:inline-flex">
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 w-4 h-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <MobileNavMenu user={user} />
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                    <Link href="/login">Logg inn</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                    <Link href="/register">Opprett gratis konto</Link>
                  </Button>
                  <MobileNavMenu user={user} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

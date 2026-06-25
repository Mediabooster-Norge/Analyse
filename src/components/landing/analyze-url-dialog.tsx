"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface AnalyzeUrlModalContextValue {
  openModal: (initialUrl?: string) => void;
}

const AnalyzeUrlModalContext = createContext<AnalyzeUrlModalContextValue | null>(null);

export function useAnalyzeUrlModal() {
  const context = useContext(AnalyzeUrlModalContext);
  if (!context) {
    throw new Error("useAnalyzeUrlModal must be used within AnalyzeUrlModalProvider");
  }
  return context;
}

interface AnalyzeUrlModalProviderProps {
  children: ReactNode;
  user?: User | null;
}

export function AnalyzeUrlModalProvider({ children, user = null }: AnalyzeUrlModalProviderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const navigateToAnalysis = useCallback(
    (rawUrl: string) => {
      const trimmed = rawUrl.trim();
      if (!trimmed) return;

      if (user) {
        router.push("/dashboard");
        return;
      }

      setOpen(false);
      setUrl("");
      router.push(`/analyse?url=${encodeURIComponent(trimmed)}`);
    },
    [router, user]
  );

  const openModal = useCallback(
    (initialUrl?: string) => {
      if (user) {
        router.push("/dashboard");
        return;
      }

      const trimmed = initialUrl?.trim() ?? "";
      if (trimmed) {
        navigateToAnalysis(trimmed);
        return;
      }

      setUrl("");
      setOpen(true);
    },
    [navigateToAnalysis, router, user]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToAnalysis(url);
  };

  return (
    <AnalyzeUrlModalContext.Provider value={{ openModal }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Analyser nettsiden din</DialogTitle>
            <DialogDescription>
              Lim inn nettadressen du vil analysere. Ingen konto nødvendig.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="dinbedrift.no"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoComplete="url"
              autoFocus
            />
            <Button type="submit" className="w-full" size="lg" disabled={!url.trim()}>
              Analyser gratis
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AnalyzeUrlModalContext.Provider>
  );
}

interface AnalyzeUrlDialogProps {
  buttonText?: string;
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonVariant?: "default" | "outline" | "secondary" | "ghost";
  showArrow?: boolean;
  className?: string;
}

export function AnalyzeUrlDialog({
  buttonText = "Prøv gratis",
  buttonSize = "lg",
  buttonVariant = "default",
  showArrow = true,
  className,
}: AnalyzeUrlDialogProps) {
  const { openModal } = useAnalyzeUrlModal();

  return (
    <Button
      size={buttonSize}
      variant={buttonVariant}
      className={cn(className)}
      onClick={() => openModal()}
    >
      {buttonText}
      {showArrow && <ArrowRight className="ml-2 w-4 h-4" />}
    </Button>
  );
}

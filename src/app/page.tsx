"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  AnalyzeUrlModalProvider,
  LandingNav,
  LandingStructuredData,
  LandingHero,
  LandingSteps,
  LandingComparison,
  LandingDemo,
  LandingFeatures,
  LandingAudiences,
  LandingPricing,
  LandingFaq,
  LandingFinalCta,
  LandingFooter,
} from "@/components/landing";

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser);
      setLoading(false);
    };
    checkAuth();
  }, []);

  return (
    <AnalyzeUrlModalProvider user={user}>
      <div className="min-h-screen bg-background text-foreground">
        <LandingStructuredData />
        <LandingNav user={user} loading={loading} />
        <main>
          <LandingHero user={user} />
          <LandingSteps />
          <LandingDemo />
          <LandingComparison />
          <LandingFeatures />
          <LandingAudiences />
          {/* Testimonials skjult inntil vi har ekte kundesitater */}
          <LandingPricing />
          <LandingFaq />
          <LandingFinalCta user={user} />
        </main>
        <LandingFooter />
      </div>
    </AnalyzeUrlModalProvider>
  );
}

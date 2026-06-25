"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  AnalyzeUrlModalProvider,
  LandingNav,
  LandingHero,
  LandingSteps,
  LandingPillars,
  LandingDemo,
  LandingFeatures,
  LandingAudiences,
  LandingTestimonials,
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
        <LandingNav user={user} loading={loading} />
        <main>
          <LandingHero user={user} />
          <LandingSteps />
          <LandingPillars />
          <LandingDemo />
          <LandingFeatures />
          <LandingAudiences />
          <LandingTestimonials />
          <LandingPricing />
          <LandingFaq />
          <LandingFinalCta user={user} />
        </main>
        <LandingFooter />
      </div>
    </AnalyzeUrlModalProvider>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandGuide } from "@/components/brand/brand-guide";
import { isMediaboosterDomainEmail } from "@/lib/auth/internal-access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Selia Brand Guide",
  description: "Internt merkevareguideoversikt for Selia.io",
  robots: { index: false, follow: false },
};

export default async function BrandPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isMediaboosterDomainEmail(user.email)) {
    redirect("/");
  }

  return <BrandGuide />;
}

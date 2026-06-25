"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tag,
  Sparkles,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Globe,
  Eye,
  FileText,
  Share2,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreRing, SummaryCard, TabNavigation } from "@/components/features/dashboard";
import { CTA_TEXTS, DEMO_SECTION } from "@/lib/brand/content";
import { AnalyzeUrlDialog } from "./analyze-url-dialog";
import type { DashboardTab } from "@/types/dashboard";
import {
  landingDemoBody,
  landingDemoMicro,
  landingDemoPanelTitle,
  landingDemoTable,
  landingDemoTableHeader,
  landingDemoTitle,
  landingFeaturePremiumBadge,
  landingMeta,
  landingSectionEyebrow,
  landingSectionHeaderMb,
  landingSectionLead,
  landingSectionPad,
  landingSectionStage,
  landingSectionTitle,
} from "./landing-typography";

const KEYWORD_ROWS = [
  { keyword: "vvs tjenester", volume: 720, cpc: 12.5, competition: "lav" },
  { keyword: "rørlegger oslo", volume: 480, cpc: 18.2, competition: "medium" },
  { keyword: "bad renovering", volume: 390, cpc: 22, competition: "medium" },
  { keyword: "nød vvs", volume: 210, cpc: 35, competition: "lav" },
] as const;

const COMPETITOR_ROWS = [
  { name: "Du", domain: "eksempel.no", total: 78, seo: 72, content: 58, security: 95, speed: 88, highlight: true },
  { name: "konkurrent.no", domain: "konkurrent.no", total: 65, seo: 68, content: 62, security: 72, speed: 64, highlight: false },
  { name: "annen.no", domain: "annen.no", total: 71, seo: 74, content: 68, security: 70, speed: 91, highlight: false },
] as const;

export function LandingDemo() {
  const [tab, setTab] = useState<DashboardTab>("overview");

  return (
    <section className={`${landingSectionPad} ${landingSectionStage}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className={`text-center max-w-2xl mx-auto ${landingSectionHeaderMb}`}>
          <p className={landingSectionEyebrow}>{DEMO_SECTION.eyebrow}</p>
          <h2 className={landingSectionTitle}>{DEMO_SECTION.title}</h2>
          <p className={landingSectionLead}>{DEMO_SECTION.lead}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-border bg-muted/30">
            <TabNavigation
              activeTab={tab}
              onTabChange={setTab}
              isPremium
              competitorCount={2}
              keywordCount={4}
            />
          </div>

          <div className="p-4 sm:p-6 min-h-[320px]">
            {tab === "overview" && (
              <div className="space-y-4">
                <SummaryCard score={82} />
                <div className="grid lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 rounded-xl border border-border p-4 sm:p-5">
                    <h3 className={`${landingDemoPanelTitle} mb-1`}>Poengoversikt</h3>
                    <p className={`${landingMeta} mb-4`}>Høyere poeng = bedre synlighet</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      <ScoreRing score={82} label="Totalt" size="sm" />
                      <ScoreRing score={78} label="SEO" size="sm" />
                      <ScoreRing score={68} label="Innhold" size="sm" />
                      <ScoreRing score={95} label="Sikkerhet" size="sm" />
                      <ScoreRing score={88} label="Hastighet" size="sm" />
                      <ScoreRing score={72} label="AI-syn" size="sm" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-border p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`${landingDemoTitle} flex items-center gap-1.5`}>
                        <TrendingUp className="size-4 text-green-600" />
                        Forbedringsmuligheter
                      </h3>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: "Meta-beskrivelse", desc: "Mangler beskrivelse", priority: "high" },
                        { label: "Innhold", desc: "For lite tekst", priority: "medium" },
                        { label: "H2-overskrifter", desc: "Mangler underoverskrifter", priority: "low" },
                      ].map((issue) => (
                        <div
                          key={issue.label}
                          className={`flex items-center gap-2 p-2 rounded-lg bg-muted/50 ${landingDemoMicro}`}
                        >
                          <div
                            className={cn(
                              "size-1.5 rounded-full shrink-0",
                              issue.priority === "high"
                                ? "bg-red-500"
                                : issue.priority === "medium"
                                  ? "bg-amber-500"
                                  : "bg-blue-500"
                            )}
                          />
                          <span className="font-medium">{issue.label}</span>
                          <span className="text-muted-foreground">· {issue.desc}</span>
                          <ChevronRight className="size-3 ml-auto text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "competitors" && (
              <div className="space-y-4">
                <div>
                  <h3 className={`inline-flex items-center gap-1.5 ${landingDemoTitle}`}>
                    <TrendingUp className="size-4" />
                    Konkurrentsammenligning (2 konkurrenter)
                  </h3>
                  <p className={`${landingMeta} mt-1`}>
                    Sammenlign din nettside med konkurrentene dine
                  </p>
                </div>
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className={`w-full min-w-[560px] ${landingDemoTable}`}>
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className={`text-left py-2.5 px-3 ${landingDemoTableHeader}`}>Nettside</th>
                        <th className={`text-center py-2.5 px-2 ${landingDemoTableHeader}`}>Total</th>
                        <th className={`text-center py-2.5 px-2 ${landingDemoTableHeader}`}>SEO</th>
                        <th className={`text-center py-2.5 px-2 ${landingDemoTableHeader}`}>Innhold</th>
                        <th className={`text-center py-2.5 px-2 ${landingDemoTableHeader}`}>Sikkerhet</th>
                        <th className={`text-center py-2.5 px-2 ${landingDemoTableHeader}`}>Hastighet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPETITOR_ROWS.map((row) => (
                        <tr
                          key={row.domain}
                          className={cn(
                            "border-b border-border last:border-0",
                            row.highlight && "bg-green-50/50"
                          )}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "size-8 rounded-lg flex items-center justify-center shrink-0",
                                  row.highlight ? "bg-green-100" : "bg-muted"
                                )}
                              >
                                {row.highlight ? (
                                  <Globe className="size-4 text-green-600" />
                                ) : (
                                  <span className="text-[10px] font-bold text-muted-foreground">#</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className={`font-medium ${landingDemoMicro} sm:text-sm truncate`}>{row.name}</p>
                                {row.highlight && (
                                  <p className={landingMeta}>{row.domain}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-2.5 px-2">
                            <span
                              className={cn(
                                "inline-flex size-8 items-center justify-center rounded-full text-xs font-bold",
                                row.highlight ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                              )}
                            >
                              {row.total}
                            </span>
                          </td>
                          <td className={`text-center py-2.5 px-2 ${landingDemoMicro} font-semibold`}>{row.seo}</td>
                          <td className={`text-center py-2.5 px-2 ${landingDemoMicro} font-semibold`}>{row.content}</td>
                          <td className={`text-center py-2.5 px-2 ${landingDemoMicro} font-semibold`}>{row.security}</td>
                          <td className={`text-center py-2.5 px-2 ${landingDemoMicro} font-semibold`}>{row.speed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "keywords" && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border">
                  <h3 className={`inline-flex items-center gap-2 ${landingDemoTitle}`}>
                    <Tag className="size-4" />
                    Nøkkelordanalyse
                  </h3>
                  <p className={`${landingMeta} mt-1`}>Estimert søkedata per nøkkelord</p>
                  <span className={`inline-block mt-2 ${landingFeaturePremiumBadge}`}>
                    AI-estimater
                  </span>
                </div>
                <div className="p-4 sm:p-5 overflow-x-auto">
                  <table className={`w-full min-w-[480px] ${landingDemoTable}`}>
                    <thead>
                      <tr className={`border-b border-border ${landingMeta} uppercase tracking-wide`}>
                        <th className="text-left py-2 px-2">Nøkkelord</th>
                        <th className="text-right py-2 px-2">Søkevolum</th>
                        <th className="text-right py-2 px-2">CPC</th>
                        <th className="text-center py-2 px-2">Konkurranse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {KEYWORD_ROWS.map((row) => (
                        <tr key={row.keyword} className="border-b border-border last:border-0">
                          <td className="py-2.5 px-2 font-medium">{row.keyword}</td>
                          <td className="py-2.5 px-2 text-right text-muted-foreground">~{row.volume}</td>
                          <td className="py-2.5 px-2 text-right text-muted-foreground">~{row.cpc} kr</td>
                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                row.competition === "lav"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              )}
                            >
                              {row.competition}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "ai-visibility" && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4 sm:p-5">
                  <h3 className={`inline-flex items-center gap-2 ${landingDemoTitle} mb-3`}>
                    <Eye className="size-4" />
                    AI-synlighet
                  </h3>
                  <div className="flex items-center gap-4">
                    <ScoreRing score={72} label="Synlighet" size="md" />
                    <div className={`${landingDemoBody} space-y-1`}>
                      <p>ChatGPT kjenner bedriften</p>
                      <p className={landingMeta}>Basert på «vvs oslo»</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-[#FDF6EE] border border-[#E7E5E4] p-4 sm:p-5">
                  <p className={landingDemoBody}>
                    «Eksempel VVS tilbyr rørleggertjenester i Oslo med døgnåpen akuttutrykning…»
                  </p>
                  <p className={`mt-2 ${landingMeta}`}>Simulert AI-svar · Pluss</p>
                </div>
              </div>
            )}

            {tab === "articles" && (
              <div className="rounded-xl border border-border p-4 sm:p-5 max-w-xl">
                <h3 className={`inline-flex items-center gap-2 ${landingDemoTitle} mb-3`}>
                  <FileText className="size-4" />
                  Artikkelgenerator
                </h3>
                <p className={`${landingMeta} mb-3`}>Bonus: generer innhold fra analysen</p>
                <div className={`rounded-lg bg-muted/50 p-3 ${landingDemoTable}`}>
                  <p className="font-medium">5 tegn på at du trenger nytt rør i Oslo</p>
                  <p className={`mt-2 text-muted-foreground ${landingMeta} leading-relaxed line-clamp-3`}>
                    Eldre rør kan gi lekkasjer, dårlig vanntrykk og høyere vannregning. Her er tegnene du bør se etter…
                  </p>
                </div>
              </div>
            )}

            {tab === "social" && (
              <div className="rounded-xl border border-border p-4 sm:p-5 max-w-xl">
                <h3 className={`inline-flex items-center gap-2 ${landingDemoTitle} mb-3`}>
                  <Share2 className="size-4" />
                  SoMe-post generator
                </h3>
                <p className={`${landingMeta} mb-3`}>Bonus: innlegg for LinkedIn, Instagram og X</p>
                <div className={`rounded-lg bg-muted/50 p-3 ${landingDemoBody}`}>
                  <PenLine className="size-4 mb-2 text-[#D4A574]" />
                  Visste du at 40 % av alle hjem har rør eldre enn 30 år? Vi hjelper deg med inspeksjon og utskifting – ring oss døgnet rundt.
                </div>
              </div>
            )}

            {tab === "ai" && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className={`${landingDemoTitle} mb-3`}>Viktigste funn</h3>
                  <div className="space-y-2">
                    {[
                      { text: "SSL A+. Utmerket sikkerhet", positive: true },
                      { text: "Meta description mangler", positive: false },
                      { text: "For lite innhold (847 ord)", positive: false },
                    ].map((item) => (
                      <div
                        key={item.text}
                        className={cn(
                          `flex items-center gap-2 p-2.5 rounded-lg ${landingDemoTable}`,
                          item.positive ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"
                        )}
                      >
                        {item.positive ? (
                          <CheckCircle2 className="size-4 shrink-0" />
                        ) : (
                          <AlertCircle className="size-4 shrink-0" />
                        )}
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-[#FDF6EE] border border-[#E7E5E4] p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="size-4 text-[#D4A574]" />
                    <span className={landingDemoTitle}>Ferdig meta-tekst</span>
                  </div>
                  <p className={landingDemoBody}>
                    Profesjonelle VVS-tjenester i Oslo. Vi tilbyr rørlegger, badrenovering og akutt utrykning – døgnåpen
                    service med faste priser.
                  </p>
                  <p className={`mt-2 ${landingMeta}`}>152 tegn · klar til å lime inn</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-4 border-t border-border bg-muted/20">
            <AnalyzeUrlDialog buttonText={CTA_TEXTS[4].text} />
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Opprett gratis konto</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

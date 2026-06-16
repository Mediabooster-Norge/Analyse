import type { AIVisibilityData } from '@/types';
import type { DashboardAnalysisResult } from '@/types/dashboard';

export type AiVisibilityImprovement = {
  id: string;
  label: string;
  desc: string;
  priority: 'high' | 'medium' | 'low';
  category: 'content' | 'authority' | 'technical' | 'discovery' | 'competition' | 'maintenance';
  status: 'good' | 'warning' | 'bad';
  issue: string;
};

const PRIORITY_ORDER: Record<AiVisibilityImprovement['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function pushUnique(
  items: AiVisibilityImprovement[],
  seen: Set<string>,
  item: AiVisibilityImprovement
) {
  if (seen.has(item.id)) return;
  seen.add(item.id);
  items.push(item);
}

/** Bygger konkrete, klikkbare forbedringstiltak basert på AI-synlighetsresultat og SEO-analyse. */
export function buildAiVisibilityImprovements(
  visData: AIVisibilityData,
  result?: DashboardAnalysisResult | null
): AiVisibilityImprovement[] {
  const items: AiVisibilityImprovement[] = [];
  const seen = new Set<string>();
  const keyword = visData.focusKeyword?.trim() || 'bransjen din';
  const { score, level, details } = visData;
  const recScore = visData.recommendationScore ?? score;
  const knowScore = visData.knowledgeScore ?? score;
  const discScore = visData.discoveryScore ?? score;
  const cited = details.timesCited;
  const tested = details.queriesTested;
  const competitors = details.competitorsMentioned ?? [];

  const citationRate = tested > 0 ? cited / tested : 0;

  if (recScore < 50 || (level !== 'high' && citationRate < 0.35)) {
    pushUnique(items, seen, {
      id: 'bransje-innhold',
      label: 'Bransjeinnhold',
      desc: `Publiser guider og FAQ om ${keyword}`,
      priority: 'high',
      category: 'content',
      status: 'bad',
      issue: `AI anbefaler bedriften sjelden uoppfordret på spørsmål om ${keyword}. Lag 3–5 artikler som svarer på typiske kundespørsmål (pris, valg, sammenligning, «beste leverandør»).`,
    });
    pushUnique(items, seen, {
      id: 'kundecaser',
      label: 'Kundecaser',
      desc: 'Vis resultater med firmanavn og bransje',
      priority: 'medium',
      category: 'content',
      status: 'warning',
      issue: `Lag kundecaser og referanseprosjekter innen ${keyword} med tydelig firmanavn, resultater og bransje – dette øker sjansen for å bli nevnt i AI-anbefalinger.`,
    });
    pushUnique(items, seen, {
      id: 'bransjekataloger',
      label: 'Bransjekataloger',
      desc: 'Synlighet i Proff, Gule Sider m.fl.',
      priority: 'high',
      category: 'authority',
      status: 'bad',
      issue: `Sørg for konsistent bedriftsprofil i norske kataloger og bransjelister (Proff, Gule Sider, relevante bransjeforeninger) med tjenester innen ${keyword}.`,
    });
  }

  if (knowScore < 50) {
    pushUnique(items, seen, {
      id: 'om-oss',
      label: 'Om oss-side',
      desc: 'Tydelig hvem dere er og hva dere tilbyr',
      priority: 'high',
      category: 'content',
      status: 'bad',
      issue: `AI viser svak kjennskap når bedriften navngis direkte. Forbedre «Om oss» med konkrete tjenester, geografi, målgruppe og differensiering innen ${keyword}.`,
    });
    pushUnique(items, seen, {
      id: 'faq',
      label: 'FAQ / tjenestesider',
      desc: 'Svar på vanlige spørsmål med firmanavn',
      priority: 'medium',
      category: 'content',
      status: 'warning',
      issue: `Lag FAQ og egne tjenestesider for ${keyword} der firmanavnet og kjernebudskapet gjentas naturlig – uten keyword stuffing.`,
    });
  } else if (knowScore < 70) {
    pushUnique(items, seen, {
      id: 'ekspertinnhold',
      label: 'Ekspertinnhold',
      desc: 'Blogg eller fagartikler med tydelig merkevare',
      priority: 'medium',
      category: 'content',
      status: 'warning',
      issue: `AI kjenner bedriften delvis. Publiser jevnlig faginnhold om ${keyword} der dere posisjonerer dere som ekspert med navn, metode og eksempler.`,
    });
  }

  if (discScore < 50) {
    pushUnique(items, seen, {
      id: 'landingsside',
      label: 'Landingsside',
      desc: `Dedikert side for ${keyword}`,
      priority: 'high',
      category: 'discovery',
      status: 'bad',
      issue: `AI finner begrenset relevans mellom nettsiden og ${keyword}. Lag en dedikert landingsside med tydelig tittel, H1, tjenestebeskrivelse og kundebenefit for dette området.`,
    });
    pushUnique(items, seen, {
      id: 'lokal-tilstedevarelse',
      label: 'Lokal synlighet',
      desc: 'Google Business og lokale signaler',
      priority: 'medium',
      category: 'discovery',
      status: 'warning',
      issue: `Styrk lokale signaler: oppdatert Google Business-profil, adresse/område, tjenester og omtaler – ChatGPT-appen bruker ofte lokale kilder som API-et ikke har.`,
    });
  }

  if (competitors.length > 0) {
    pushUnique(items, seen, {
      id: 'konkurrent-differensiering',
      label: 'Konkurrentposisjon',
      desc: `AI anbefaler ${competitors.slice(0, 2).join(', ')}`,
      priority: 'high',
      category: 'competition',
      status: 'bad',
      issue: `På nøytrale spørsmål om ${keyword} anbefaler AI andre aktører (${competitors.slice(0, 5).join(', ')}). Lag innhold som tydeliggjør hva dere gjør annerledes og bedre.`,
    });
    pushUnique(items, seen, {
      id: 'omtale-lenker',
      label: 'Omtale og lenker',
      desc: 'PR, gjesteinnlegg og partnerskap',
      priority: 'medium',
      category: 'authority',
      status: 'warning',
      issue: `Jobb med ekstern omtale (pressemeldinger, gjesteinnlegg, bransjepartnere) slik at AI ser dere i samme kontekst som konkurrentene som allerede anbefales.`,
    });
  }

  if (details.estimatedCount && details.estimatedCount > 0 && details.webSearchCount) {
    pushUnique(items, seen, {
      id: 'live-sok',
      label: 'Live websøk',
      desc: 'Noen svar var estimert – kjør sjekk på nytt',
      priority: 'medium',
      category: 'technical',
      status: 'warning',
      issue: `Delvis websøk i siste sjekk. Kjør AI-synlighet på nytt for et mer pålitelig bilde før du prioriterer tiltak.`,
    });
  }

  if (result) {
    if (!result.seoResults.structuredData?.hasAny) {
      pushUnique(items, seen, {
        id: 'strukturert-data',
        label: 'Strukturert data',
        desc: 'Legg til Organization / LocalBusiness',
        priority: 'medium',
        category: 'technical',
        status: 'warning',
        issue: `Mangler Schema.org-markup. Legg til JSON-LD (Organization eller LocalBusiness) med navn, URL, tjenester og område – hjelper AI å forstå bedriften.`,
      });
    }
    if (!result.seoResults.meta.description.content) {
      pushUnique(items, seen, {
        id: 'meta-beskrivelse',
        label: 'Meta-beskrivelse',
        desc: 'Kort, tydelig beskrivelse av tilbudet',
        priority: 'medium',
        category: 'technical',
        status: 'warning',
        issue: `Mangler meta description. Skriv en presis beskrivelse (120–160 tegn) som nevner ${keyword} og hva bedriften leverer.`,
      });
    }
    if (result.contentResults.wordCount < 300) {
      pushUnique(items, seen, {
        id: 'innholdsmengde',
        label: 'Mer innhold',
        desc: 'Utvid tekst på viktige sider',
        priority: 'medium',
        category: 'content',
        status: 'warning',
        issue: `Lite tekst på forsiden (${result.contentResults.wordCount} ord). AI og søkemotorer får bedre signaler med mer substans om tjenester og ekspertise.`,
      });
    }
    if (result.seoResults.headings.h1.count !== 1) {
      pushUnique(items, seen, {
        id: 'h1',
        label: 'H1-overskrift',
        desc: 'Én tydelig hovedoverskrift',
        priority: 'low',
        category: 'technical',
        status: 'warning',
        issue: `Siden har ${result.seoResults.headings.h1.count === 0 ? 'ingen' : 'flere'} H1. Bruk én tydelig H1 som beskriver hovedtilbudet innen ${keyword}.`,
      });
    }
  }

  if (score < 50) {
    pushUnique(items, seen, {
      id: 'pr-artikler',
      label: 'PR og omtale',
      desc: 'Eksterne artikler og pressemeldinger',
      priority: 'high',
      category: 'authority',
      status: 'bad',
      issue: `Lav total AI-synlighet (${score}/100). Øk ekstern omtale gjennom PR, bransjeartikler og samarbeid – AI lærer ofte av kilder utenfor egen nettside.`,
    });
  }

  if (level === 'high') {
    pushUnique(items, seen, {
      id: 'vedlikehold',
      label: 'Hold momentum',
      desc: 'Publiser jevnlig og oppdater caser',
      priority: 'low',
      category: 'maintenance',
      status: 'good',
      issue: `God AI-synlighet (${score}/100). Fortsett med jevnlig innhold, oppdaterte caser og overvåk nøkkelordet ${keyword} månedlig – synlighet kan variere over tid.`,
    });
    pushUnique(items, seen, {
      id: 'overvakning',
      label: 'Test flere nøkkelord',
      desc: 'Kjør sjekk med relaterte bransjeord',
      priority: 'low',
      category: 'maintenance',
      status: 'good',
      issue: `Test 2–3 relaterte bransjenøkkelord (f.eks. undertemaer av ${keyword}) og sammenlign score over tid for å se hvor dere er sterkest i AI-anbefalinger.`,
    });
  }

  return items.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

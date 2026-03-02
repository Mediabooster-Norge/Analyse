# API-kostnader – oversikt

Oversikt over eksterne API-kall i appen og estimert kostnad per bruker. Priser er basert på kodebasens modellvalg og `src/lib/services/openai.ts` (februar 2026-estimater). Oppdater ved behov.

---

## 1. Hovedanalyse (én ny analyse)

**Flyt:** Bruker starter ny analyse med URL, ev. konkurrenter og nøkkelord.

| Steg | API / tjeneste | Detaljer | Kostnad |
|------|----------------|----------|---------|
| Scraping | Egen server | `scrapeUrl()` – ingen ekstern API | **$0** |
| SEO / innhold / sikkerhet | Egen server | Lokale analyzere – ingen ekstern API | **$0** |
| PageSpeed | Google PageSpeed Insights | 1 kall per domene, cache 1 time. Gratis kvote (f.eks. 25k/dag). | **$0** (innen kvote) |
| AI-oppsummering | OpenAI Chat (`gpt-5-mini` som balanced) | 1 kall, stor prompt (SEO/innhold/sikkerhet/ytelse/konkurrenter), max 8000 output tokens | **ca. $0,02–0,06** |
| Nøkkelordforsking | OpenAI Chat (`gpt-5-mini`) | 1 kall ved opptil 10 nøkkelord, max 5000 output tokens | **ca. $0,01–0,03** |
| Konkurrentanalyse | Egen server | Scrape + samme analyzere per konkurrent – ingen OpenAI i konkurrent-ruten | **$0** |

**Anslag per hovedanalyse:** **ca. $0,03–0,10** (kun OpenAI for AI-oppsummering + nøkkelord).

---

## 2. PageSpeed (ettersending)

**Flyt:** Hastighet hentes ofte i eget kall etter hovedanalyse (for å holde første svar raskt).

| API | Detaljer | Kostnad |
|-----|----------|---------|
| Google PageSpeed Insights | 1 kall per analyse-URL, cache 1 time | **$0** (innen kvote) |

---

## 3. AI-synlighetssjekk

**Flyt:** Premium-bruker kjører «Kjør sjekk» på AI-synlighet-fanen.

| API | Detaljer | Kostnad |
|-----|----------|---------|
| OpenAI Responses API | Modell: `gpt-4o-mini` + `web_search`. **10 spørsmål** (kun eget domene). | **ca. $0,10–0,25** per sjekk (web search ~$0,01/kall + tokens) |
| Fallback | Ved 429/feil: Chat Completions `gpt-4o-mini` uten web search (modellens kunnskap) | Billigere, færre tokens |

**Anslag per AI-synlighetssjekk:** **ca. $0,10–0,25**. Cache per domene (30 dager) reduserer faktiske kall.

---

## 4. Nøkkelordforslag (suggest-keywords)

**Flyt:** Bruker ber om forslag til nøkkelord (10–50 stk).

| API | Detaljer | Kostnad |
|-----|----------|---------|
| OpenAI Chat | `gpt-4o-mini`, 1 kall. Henter nettside (fetch), sender innhold + URL til AI. max_completion_tokens 800–2000 | **ca. $0,001–0,005** |

---

## 5. Artikkelforslag (suggest-articles)

**Flyt:** Bruker ber om artikkelideer basert på analyse/konkurrenter/nøkkelord.

| API | Detaljer | Kostnad |
|-----|----------|---------|
| OpenAI Chat | `gpt-5-mini`, 1 kall, max_completion_tokens 4000 | **ca. $0,01–0,03** |

---

## 6. SoMe-forslag (suggest-social-posts)

**Flyt:** Bruker ber om forslag til sosiale poster (per plattform).

| API | Detaljer | Kostnad |
|-----|----------|---------|
| OpenAI Chat | `gpt-5-mini`, 1 kall, max_completion_tokens 4000 (tilsvarende suggest-articles) | **ca. $0,01–0,03** |

---

## 7. AI-forslag til ett element (ai-suggestion)

**Flyt:** Bruker klikker «Få forslag» på et SEO-element (f.eks. meta-beskrivelse, H1).

| API | Detaljer | Kostnad |
|-----|----------|---------|
| OpenAI Chat | `gpt-5-mini`, 1 kall, max_completion_tokens 3000. Alternativ: Agent Workflow hvis `OPENAI_AGENT_WORKFLOW_ID` satt | **ca. $0,005–0,02** per klikk |

---

## 8. Artikkelgenerering (generate-article)

**Flyt:** Premium-bruker genererer én artikkel (kort/medium/lang).

| API | Detaljer | Kostnad |
|-----|----------|---------|
| OpenAI Chat | `gpt-5-mini`, 1 kall. Tokens avhenger av lengde: short ~4000, medium ~8000, long ~12000 | **ca. $0,05–0,20** per artikkel |
| Unsplash | 1 søk etter bilde (artikkelens `featuredImageSearchQuery`). Forsidebilde hentes alltid ved generering. Gratis med attribution. | **$0** |

**Anslag per artikkel:** **ca. $0,05–0,20** (kun OpenAI). Artikkelgenerering er begrenset til 30/mnd (Premium); forsidebilde har ikke egen grense.

---

## 9. SoMe-innlegg (generate-social-post)

**Flyt:** Premium-bruker genererer ett innlegg (LinkedIn/Instagram/X). Kan velge lengde (kort/medium/lang), tone (profesjonell/uformell/pedagogisk) og målgruppe (alle/nybegynnere/eksperter/bedriftsledere) – tilsvarende artikkelgeneratoren.

| API | Detaljer | Kostnad |
|-----|----------|---------|
| OpenAI Chat | `gpt-5-mini`, 1 kall, max_completion_tokens 4000 | **ca. $0,01–0,04** |
| Unsplash | 1 søk etter bilde. Forsidebilde hentes alltid ved generering. Gratis med attribution. | **$0** |

SoMe-generering er begrenset til 30/mnd (sammen med artikler); forsidebilde har ikke egen grense.

---

## 10. Nytt bilde (regenerate-image)

**Flyt:** Bruker ber om nytt forsidebilde til en bestemt artikkel eller SoMe-post.

| API | Detaljer | Kostnad |
|-----|----------|---------|
| Unsplash | 1 søk med nye søkeord. Gratis med attribution. | **$0** |

**Grense:** Maks **3 nye bilder per bruker per time** (konfigurerbart med `FEATURED_IMAGE_REGENERATES_PER_HOUR`). Ved grense nådd returneres 429 med forklarende melding.

---

## Modellpriser (per 1M tokens) – fra `openai.ts`

| Modell | Input | Output |
|--------|-------|--------|
| gpt-4o-mini | $0,15 | $0,60 |
| gpt-4o | $2,50 | $10,00 |
| gpt-5-nano | $0,10 | $0,40 |
| gpt-5-mini | $0,30 | $1,20 |
| gpt-5.2 | $5,00 | $15,00 |

*(Responses API med web_search har egen prising – se OpenAI docs.)*

---

## Typisk bruker – månedlig anslag

Antakelser: 2 analyser, 1 AI-synlighetssjekk, 2x nøkkelordforslag, 1x artikkelforslag, 3x AI-forslag på elementer, 2 artikler generert, 2 SoMe-innlegg.

| Post | Antall | Estimat per enhet | Sum |
|------|--------|-------------------|-----|
| Hovedanalyse | 2 | ~$0,05 | ~$0,10 |
| AI-synlighetssjekk | 1 | ~$0,15 | ~$0,15 |
| Nøkkelordforslag | 2 | ~$0,003 | ~$0,01 |
| Artikkelforslag | 1 | ~$0,02 | ~$0,02 |
| AI-forslag (element) | 3 | ~$0,01 | ~$0,03 |
| Artikkelgenerering | 2 | ~$0,10 | ~$0,20 |
| SoMe-innlegg | 2 | ~$0,02 | ~$0,04 |
| **Totalt** | | | **ca. $0,55/mnd** |

Ved høy bruk (flere analyser, mange artikler/innlegg og AI-synlighet): **ca. $1–3 per bruker per måned** er et rimelig intervall.

---

## Gratis / ingen direkte kostnad

- **Google PageSpeed Insights** – gratis inntil dagens kvote.
- **Unsplash** – gratis med attribution (bilder til artikler/innlegg).
- **Scraping, SEO-, innholds-, sikkerhetsanalyse** – egen server, ingen tredjeparts-API-kostnad.
- **Konkurrentanalyse** – scrape + samme analyzere, ingen OpenAI i denne ruten.

---

## Hvor kostnadene styres

- **OpenAI:** `OPENAI_API_KEY`; modellvalg i `src/lib/services/openai.ts` (AI_MODELS, PRICING) og i hver route (f.eks. `gpt-5-mini` i generate-article, ai-suggestion, suggest-articles, generate-social-post).
- **PageSpeed:** `GOOGLE_PAGESPEED_API_KEY`; kvote i Google Cloud Console.
- **Unsplash:** `UNSPLASH_ACCESS_KEY`; bruk innenfor Unsplash API Guidelines.
- **Regenerering av forsidebilde:** `FEATURED_IMAGE_REGENERATES_PER_HOUR` (valgfri, standard 3). Maks nye bilder per bruker per time.

Oppdater dette dokumentet når modeller eller priser endres.

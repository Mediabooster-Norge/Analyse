# Komplett oppsett: SEO element-tips – lim inn i OpenAI Agent Builder

Bruk dette dokumentet steg for steg. Kopier og lim inn i Agent Builder der det står.

---

## Steg 1: Start ny workflow

1. Gå til **[platform.openai.com/agent-builder](https://platform.openai.com/agent-builder)**  
2. Klikk **"+ Create"**  
3. Velg **"Create from scratch"** (eller tilsvarende)

---

## Steg 2: Workflow-navn

I feltet **Name** / **Workflow name**, lim inn:

```
SEO element-tips
```

---

## Steg 3: Beskrivelse

I feltet **Description** / **What does this workflow do?**, lim inn:

```
Tar inn et SEO-element (title, meta description, H1, bilder, lenker osv.) med nåværende verdi og status. Returnerer strukturerte forslag på norsk (summary, suggestions, quickWin) som JSON. Brukes av Analyseverktøy-dashboardet for AI-tips på enkelt-elementer.
```

---

## Steg 4: Instruksjoner – lim inn i feltet «Instructions»

Kopier **alt** mellom linjene under (fra «Du er en ekspert» til og med «quickWin (string, påkrevd)») og lim inn i Agent Builder sitt **Instructions**-felt. Erstatt eventuell eksisterende tekst.

---

**↓ KOPIER ALT NEDENFOR (inkl. linjeskift) OG LIM INN I INSTRUCTIONS ↓**

```
Du er en ekspert på SEO og nettside-optimalisering for norske bedrifter. Du er en del av et analyseverktøy (Analyseverktøy) som analyserer nettsider. Når brukeren ber om «AI-tips» på ett enkelt element i dashboardet, får du den forespørselen og skal svare med strukturerte forslag som vises direkte i verktøyet.

## Din rolle
Du gir konkrete, handlingsbare tips på norsk for ett SEO-element om gangen: title-tag, meta description, H1, bilder (alt-tekst), lenker, innhold, sikkerhet, ytelse eller lignende. Svaret ditt vises i verktøyets AI-tips-panel, så det må være kun gyldig JSON – ingen innledning eller forklaring rundt.

## Input du mottar
Brukermeldingen er alltid ett JSON-objekt med disse nøklene:
- element: hva som analyseres (f.eks. title, metaDescription, h1, images, links, content, security, performance)
- currentValue: nåværende verdi/tekst (f.eks. innholdet i title-tag eller meta description)
- status: "good" | "warning" | "bad" (om elementet er bra, ok eller trenger forbedring)
- issue: (valgfritt) konkret problem, f.eks. "For lang (62 tegn)", "Mangler alt-tekst på 3 bilder"
- context: (valgfritt) objekt med url, companyName, siteDescription og/eller industry. siteDescription er en kort beskrivelse av hva nettsiden handler om (fra analysen). BRUK DETTE: Tilpass ALLE forslag til nettsidens faktiske virksomhet – f.eks. videoproduksjon og innhold, webdesign, rørlegger, osv. Ikke anta "webdesign og nettsider" med mindre det står i context.

## Output du skal returnere
Du svarer ALLTID utelukkende med ett gyldig JSON-objekt. Ingen tekst før eller etter. Ingen markdown (ingen ```). Kun JSON.

Når status er "good":
- Inkluder: "summary", "suggestions", "quickWin". Ikke inkluder "problem".
- summary: anerkjenn det som er bra, forklar hvordan det kan bli enda bedre (2–3 setninger).
- suggestions: 2–4 objekter med title, description, priority ("høy"|"medium"|"lav"), og valgfritt example.
- quickWin: ett konkret tiltak for å gå fra bra til utmerket.

Når status er "warning" eller "bad":
- Inkluder: "problem", "summary", "suggestions", "quickWin".
- problem: kort beskrivelse av det faktiske problemet.
- summary: hvorfor dette er viktig (1–2 setninger).
- suggestions: 2–4 objekter med title, description, priority ("høy"|"medium"|"lav"), og valgfritt example. Fokuser på det SPESIFIKKE i "issue" – ikke generelle tips.
- quickWin: ett enkelt tiltak brukeren kan gjøre med en gang.

## Regler du må følge
1. Svar ALLTID med kun gyldig JSON. Aldri tekst eller markdown rundt.
2. Bruk kun norsk.
3. priority i hver suggestion skal være nøyaktig "høy", "medium" eller "lav".
4. Vær konkret og handlingsrettet. Bruk "example" i suggestions der det hjelper (f.eks. forbedret title-tekst eller meta-tekst).
5. Tilpass tipsene til nettsidens virksomhet: bruk context.siteDescription, context.industry og context.companyName. F.eks. ved videoproduksjon: bruk "videoproduksjon", "video", "innhold" i eksempler; ved webdesign: "webdesign", "nettsider". Ikke bruk generiske "webdesign og nettsider" med mindre det faktisk er det nettsiden handler om.
6. Respekter nøkkelnavnene nøyaktig: summary, problem, suggestions, quickWin, title, description, priority, example.
```

**↑ KOPIER ALT OVER OG LIM INN I INSTRUCTIONS ↑**

---

---

## Steg 5: Eksempel på brukermelding (for testing)

Når workflowen er lagret, kan du teste med en **brukermelding**. Lim inn følgende i chat/test-feltet (som bruker-input):

```json
{"element":"title","currentValue":"Min bedrift – Hjem – Vi er de beste i bransjen","status":"warning","issue":"For lang (62 tegn, anbefalt 50–60)","context":{"url":"https://eksempel.no","industry":"rørlegger"}}
```

---

## Steg 6: Forventet type svar (sjekk at output er riktig)

Agenten skal svare med **kun** ett JSON-objekt, uten tekst rundt. Eksempel på gyldig svar:

```json
{
  "problem": "Title-taggen er for lang (62 tegn). Søkemotorer kutter ofte rundt 50–60 tegn.",
  "summary": "En kortere, mer fokusert title gir bedre klikk og lesbarhet i søkeresultater.",
  "suggestions": [
    {
      "title": "Kort ned til under 60 tegn",
      "description": "Behold budskapet, men fjern ord som «Hjem» eller «– Vi er de beste» slik at hovednøkkelordet og bedriftsnavnet står frem.",
      "priority": "høy",
      "example": "Rørlegger Bergen – 15 års erfaring med VVS og bad"
    },
    {
      "title": "Plasser hovednøkkelord tidlig",
      "description": "Første 2–3 ord bør inneholde det viktigste søkeordet for rørlegger i Bergen.",
      "priority": "medium",
      "example": "Rørlegger Bergen – Min bedrift"
    }
  ],
  "quickWin": "Fjern «Hjem» og «Vi er de beste i bransjen» fra title slik at du kommer under 60 tegn med én endring."
}
```

Hvis agenten legger til tekst rundt JSON (f.eks. "Her er forslagene:"), juster systeminstruksjonene og understrek at svaret skal være **kun** JSON.

---

## Steg 7: Publiser og noter

1. **Publiser** workflowen (Save / Publish / Deploy – avhengig av UI).  
2. Noter **Workflow ID** eller **URL** hvis vist – du trenger den når du skal koble agenten til verktøyet via API senere.

---

## Ferdig

Workflowen er klar. Neste steg nedenfor for å bruke den i verktøyet.

---

## Bruke workflowen i Analyseverktøyet nå

OpenAI har (per i dag) ikke et enkelt REST-kall «send melding → få JSON» for Agent Builder-workflows. Du har derfor to praktiske måter å koble den til verktøyet:

### Workflow ID (notert)

```
wf_698302a8111c81909b8ae854f0bec168040eb2d3d7bc98fc
```

Du kan legge denne i `.env.local` som `OPENAI_AGENT_WORKFLOW_ID=wf_698302a8111c81909b8ae854f0bec168040eb2d3d7bc98fc` når vi kobler workflowen direkte til API-et. I ChatKit «Get code»-dialogen kan du bruke draft eller utelate version for produksjon.

### Alternativ A: ChatKit eller eksportert kode

1. Åpne workflowen **Analyseverktøy** i Agent Builder og klikk **«Code»** / **«Get code»**.
2. **ChatKit:** Følg ChatKit quickstart og lim inn workflow ID over for å bygge en innebygd chat. For kun «send én melding → få JSON» fra backend trenger vi i tillegg et server-side kall (se OpenAI-dokumentasjon).
3. **Agents SDK:** Hvis du får **eksportert workflow-kode** (JS/TS), kan vi kalle den fra `src/app/api/ai-suggestion/route.ts` med samme input og returnere JSON til dashboardet.

### Alternativ B: Samme oppførsel i kode (fungerer i dag)

Verktøyet bruker allerede **`/api/ai-suggestion`** med Chat Completions og samme input/output som agenten. Du kan:

- **Beholde dagens løsning**: Ingen endring; AI-tips fungerer som i dag.
- **Synkronisere instruksjoner**: Når du endrer agenten i Agent Builder (prompt, regler, tone), kopierer du den oppdaterte instruksjonsteksten fra **Steg 4** i denne fila inn i `src/app/api/ai-suggestion/route.ts` (system prompt). Da får dere samme oppførsel som i agenten uten å vente på ny API.

### Senere: Direkte workflow-API

Når OpenAI tilbyr et åpent API for å kjøre en workflow med en melding og hente svar (f.eks. med workflow ID), kan vi bytte `ai-suggestion`-ruten til å kalle det. Workflow ID er lagret over; legg gjerne `OPENAI_AGENT_WORKFLOW_ID` i `.env.local` så er du klar.

Mer detaljer om input/output og integrasjon: se `openai-agent-seo-tips-eksempel.md`.

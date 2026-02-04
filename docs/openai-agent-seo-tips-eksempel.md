# OpenAI Agent: SEO element-tips (AI-tips i dashboard)

Eksempel på en agent du kan sette opp i [OpenAI Agent Builder](https://platform.openai.com/agent-builder) og kalle fra Analyseverktøyet når brukeren ber om AI-tips på et enkelt element (f.eks. title-tag, meta description).

---

## 1. Formål

**Navn (i Agent Builder):** `SEO element-tips`  
**Beskrivelse:** Tar inn et SEO-element (tittel, meta, H1, etc.) med status og kontekst, og returnerer strukturerte forslag på norsk som dashboardet kan vise direkte.

Dette erstatter/utvider logikken som i dag ligger i `src/app/api/ai-suggestion/route.ts`.

---

## 2. Input (det verktøyet sender)

Agenten skal motta **én** brukermelding som er JSON. Verktøyet bygger denne fra det brukeren har klikket på:

```json
{
  "element": "title",
  "currentValue": "Min bedrift – Hjem",
  "status": "warning",
  "issue": "For lang (62 tegn, anbefalt 50–60)",
  "context": {
    "url": "https://eksempel.no",
    "industry": "rørlegger"
  }
}
```

**Felt:**

| Felt | Type | Beskrivelse |
|------|------|--------------|
| `element` | string | Hva som analyseres: `title`, `metaDescription`, `h1`, `images`, `links`, etc. |
| `currentValue` | string | Nåværende verdi (f.eks. teksten i title-tag). |
| `status` | `"good"` \| `"warning"` \| `"bad"` | Om elementet er bra, ok eller trenger forbedring. |
| `issue` | string (valgfritt) | Konkret problem, f.eks. "For lang (62 tegn)". |
| `context.url` | string (valgfritt) | Nettside-URL. |
| `context.industry` | string (valgfritt) | Bransje for tilpassede tips. |

---

## 3. Output (det verktøyet forventer)

Agenten skal **alltid** svare med gyldig JSON i denne strukturen (samme som dagens `AISuggestionData`):

**Når `status` er `"good"` (elementet er bra):**

```json
{
  "summary": "Kort anerkjennelse + hvordan det kan bli enda bedre (2–3 setninger).",
  "suggestions": [
    {
      "title": "Kort tittel",
      "description": "Hvordan gå fra bra til utmerket.",
      "priority": "medium",
      "example": "Konkret eksempel hvis relevant"
    }
  ],
  "quickWin": "Ett konkret tiltak for å løfte fra bra til utmerket."
}
```

**Når `status` er `"warning"` eller `"bad"`:**

```json
{
  "problem": "Kort beskrivelse av det faktiske problemet",
  "summary": "Kort oppsummering av hvorfor dette er viktig (1–2 setninger)",
  "suggestions": [
    {
      "title": "Kort tittel på forslaget",
      "description": "Detaljert beskrivelse av hva som bør gjøres",
      "priority": "høy",
      "example": "Konkret eksempel eller kode hvis relevant"
    }
  ],
  "quickWin": "Ett enkelt tiltak som kan gjøres med en gang."
}
```

**Regler for output:**

- `priority` må være én av: `"høy"`, `"medium"`, `"lav"`.
- `suggestions` skal være en liste med minst 1, helst 2–4 elementer.
- Svaret skal være **kun** gyldig JSON (ingen forklarende tekst rundt).

---

## 4. Slik setter du opp agenten i Agent Builder

### Steg 1: Ny workflow

1. Gå til [platform.openai.com/agent-builder](https://platform.openai.com/agent-builder).
2. Klikk **"+ Create"**.
3. Velg **"Create from scratch"** (eller tilsvarende).

### Steg 2: Navn og beskrivelse

- **Name:** `SEO element-tips`
- **Description:** `Gir konkrete SEO-tips på norsk for ett element (title, meta, H1, etc.) basert på status og kontekst. Returnerer alltid JSON.`

### Steg 3: Systeminstruksjoner (prompt)

Lim inn noe i denne duren som systeminstruksjon for agenten:

```
Du er en ekspert på SEO og nettside-optimalisering for norske bedrifter.

Du får én brukermelding som er et JSON-objekt med:
- element: hva som analyseres (f.eks. title, metaDescription, h1)
- currentValue: nåværende verdi
- status: "good" | "warning" | "bad"
- issue: valgfritt, beskriver det konkrete problemet
- context: valgfritt, med url og/eller industry

Dine krav:
1. Svar ALLTID utelukkende med gyldig JSON. Ingen tekst før eller etter.
2. Når status er "good": inkluder IKKE "problem". Gi "summary", "suggestions" (2–4 stk) og "quickWin". Fokus på å løfte fra bra til utmerket.
3. Når status er "warning" eller "bad": inkluder "problem", "summary", "suggestions" (2–4 stk) og "quickWin". Fokuser på det SPESIFIKKE problemet i "issue" – ikke generelle tips.
4. Bruk norsk. Prioritet er "høy", "medium" eller "lav".
5. Vær konkret og handlingsrettet. Gi eksempler der det hjelper.
```

### Steg 4: Input/output (hvis Agent Builder ber om det)

- **Input:** Brukermelding = streng (verktøyet sender JSON.stringify av objektet over).
- **Output:** Brukermelding = streng (agenten returnerer én JSON-streng).

### Steg 5: Publiser og noter ID/URL

Etter publisering noterer du:

- **Agent/Workflow ID** (hvis vist).
- **Ev. API-endpoint** for å kjøre workflowen (sjekk OpenAIs dokumentasjon for "Agent Builder API" / "Run workflow").

---

## 5. Hvordan verktøyet kaller agenten (når API finnes)

Når OpenAI tilbyr et API for å kjøre agenten (f.eks. `POST .../workflows/{id}/runs` eller tilsvarende), kan du legge til en route som dette og bruke den i stedet for dagens direkte Chat Completions-kall.

**Eksempel på ny route** (juster URL og payload etter faktisk API-dokumentasjon):

```ts
// src/app/api/ai-suggestion/route.ts (fremtidig variant)

import { NextRequest, NextResponse } from 'next/server';

const OPENAI_AGENT_WORKFLOW_URL = process.env.OPENAI_AGENT_SEO_TIPS_URL; // f.eks. fra env
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Bygg input som agenten forventer
    const agentInput = {
      element: body.element,
      currentValue: body.currentValue,
      status: body.status,
      issue: body.issue,
      context: body.context,
    };

    const res = await fetch(OPENAI_AGENT_WORKFLOW_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        message: JSON.stringify(agentInput),
        // Ev. andre parametre OpenAI krever
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[ai-suggestion] Agent error', res.status, err);
      return NextResponse.json(
        { error: 'Kunne ikke hente AI-forslag' },
        { status: 502 }
      );
    }

    const data = await res.json();
    // Anta at agentens svar ligger i f.eks. data.output eller data.message
    const rawOutput = data.output ?? data.message ?? data.result;
    const parsed = JSON.parse(rawOutput);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error('[ai-suggestion]', e);
    return NextResponse.json(
      { error: 'Noe gikk galt' },
      { status: 500 }
    );
  }
}
```

**.env.local:**

```env
OPENAI_AGENT_SEO_TIPS_URL=https://api.openai.com/...   # Erstatt med reelt endpoint når tilgjengelig
OPENAI_API_KEY=sk-...
```

Frem til Agent Builder-API er tilgjengelig beholder du dagens `ai-suggestion`-route som bruker `openai.chat.completions.create`; når API finnes, bytter du til å kalle agenten som over og kan da justere all logikk i OpenAI-dashboardet uten å endre kode.

---

## 6. Kort oppsummert

| Hva | Verdi |
|-----|--------|
| **Agent-navn** | SEO element-tips |
| **Input** | JSON med `element`, `currentValue`, `status`, valgfritt `issue` og `context` |
| **Output** | JSON med `summary`, `suggestions` (array), `quickWin`, og ev. `problem` |
| **Fordel** | Én sted å forbedre prompt og logikk; verktøyet trenger bare å sende input og parse output |
| **Neste steg** | Sette opp workflow i Agent Builder → teste med eksempel-JSON → når API finnes, bytte `/api/ai-suggestion` til å kalle agenten |

Denne agenten dekker **per-element AI-tips**. Du kan lage en tilsvarende agent for **helhetsanalysen** (overallAssessment, keyFindings, recommendations, actionPlan) ved å definere input som analyse-JSON og output som den store strukturen fra `generateAIAnalysis` – da kan du også flytte den logikken til OpenAI-dashboardet.

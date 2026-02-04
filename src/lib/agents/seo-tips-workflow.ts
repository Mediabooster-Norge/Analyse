import { z } from 'zod';
import {
  Agent,
  type AgentInputItem,
  Runner,
  withTrace,
  setDefaultOpenAIKey,
} from '@openai/agents';

// Ensure OpenAI key is set (Next.js env is available at runtime)
if (typeof process !== 'undefined' && process.env.OPENAI_API_KEY) {
  setDefaultOpenAIKey(process.env.OPENAI_API_KEY);
}

const SEOTipsOutputSchema = z.object({
  summary: z.string(),
  problem: z.string().optional(),
  suggestions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(['høy', 'medium', 'lav']),
      example: z.string().optional(),
    })
  ),
  quickWin: z.string(),
});

const seoTipsAgent = new Agent({
  name: 'My agent',
  instructions: `Du er en ekspert på SEO og nettside-optimalisering for norske bedrifter. Du er en del av et analyseverktøy (Analyseverktøy) som analyserer nettsider. Når brukeren ber om «AI-tips» på ett enkelt element i dashboardet, får du den forespørselen og skal svare med strukturerte forslag som vises direkte i verktøyet.

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
Du svarer ALLTID utelukkende med ett gyldig JSON-objekt. Ingen tekst før eller etter. Ingen markdown (ingen \`\`\`). Kun JSON.

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
6. Respekter nøkkelnavnene nøyaktig: summary, problem, suggestions, quickWin, title, description, priority, example.`,
  model: 'gpt-5.2-chat-latest',
  outputType: SEOTipsOutputSchema,
  modelSettings: {
    store: true,
  },
});

export type WorkflowInput = { input_as_text: string };

export type WorkflowOutput = {
  output_text: string;
  output_parsed: z.infer<typeof SEOTipsOutputSchema>;
};

const WORKFLOW_ID = process.env.OPENAI_AGENT_WORKFLOW_ID ?? 'wf_698302a8111c81909b8ae854f0bec168040eb2d3d7bc98fc';

/**
 * Kjører SEO element-tips workflow (Agent Builder).
 * Input: JSON-streng med element, currentValue, status, issue?, context?
 * Output: { output_text, output_parsed } med summary, suggestions, quickWin (og ev. problem).
 */
export async function runSeoTipsWorkflow(workflow: WorkflowInput): Promise<WorkflowOutput> {
  return await withTrace('Analyseverktøy', async () => {
    const conversationHistory: AgentInputItem[] = [
      {
        role: 'user',
        content: [{ type: 'input_text', text: workflow.input_as_text }],
      },
    ];

    const runner = new Runner({
      traceMetadata: {
        __trace_source__: 'agent-builder',
        workflow_id: WORKFLOW_ID,
      },
    });

    const result = await runner.run(seoTipsAgent, conversationHistory);

    if (!result.finalOutput) {
      throw new Error('Agent result is undefined');
    }

    const output_parsed =
      typeof result.finalOutput === 'object' && result.finalOutput !== null
        ? (result.finalOutput as z.infer<typeof SEOTipsOutputSchema>)
        : SEOTipsOutputSchema.parse(JSON.parse(String(result.finalOutput)));

    return {
      output_text: JSON.stringify(output_parsed),
      output_parsed,
    };
  });
}

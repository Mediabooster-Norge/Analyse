import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { runSeoTipsWorkflow } from '@/lib/agents/seo-tips-workflow';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SuggestionRequest {
  element: string;
  currentValue: string;
  status: 'good' | 'warning' | 'bad';
  issue?: string; // What specifically is wrong
  context?: {
    url?: string;
    industry?: string;
    companyName?: string;
    siteDescription?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SuggestionRequest = await request.json();
    const { element, currentValue, status, issue, context } = body;

    // Bruk Agent Builder-workflow hvis OPENAI_AGENT_WORKFLOW_ID er satt
    if (process.env.OPENAI_AGENT_WORKFLOW_ID) {
      const inputAsText = JSON.stringify({
        element,
        currentValue,
        status,
        ...(issue !== undefined && { issue }),
        ...(context !== undefined && { context }),
      });
      const result = await runSeoTipsWorkflow({ input_as_text: inputAsText });
      return NextResponse.json(
        {
          success: true,
          data: result.output_parsed,
          tokens: 0, // Agents SDK gir ikke token-telling her
        },
        {
          headers: { 'X-AI-Source': 'agent-workflow' },
        }
      );
    }

    const statusText = status === 'good' ? 'bra' : status === 'warning' ? 'ok, men kan forbedres' : 'trenger forbedring';
    
    // Different prompts based on status
    const isOptimal = status === 'good' && !issue;
    
    const systemPrompt = isOptimal
      ? `Du er en ekspert på SEO og nettside-optimalisering for norske bedrifter.
Dette elementet er allerede BRA, men det finnes alltid rom for forbedring fra "bra" til "utmerket".

Gi:
1. Positiv anerkjennelse av det som er bra
2. Konkrete tips for å gå fra "bra" til "utmerket" 
3. Avanserte optimaliseringstips som skiller de beste fra resten

Svar i JSON-format med følgende struktur:
{
  "summary": "Anerkjenn det som er bra, men forklar hvordan det kan bli enda bedre (2-3 setninger)",
  "suggestions": [
    {
      "title": "Tittel på forbedring",
      "description": "Hvordan gå fra bra til utmerket",
      "priority": "medium",
      "example": "Konkret eksempel hvis relevant"
    },
    {
      "title": "Avansert optimalisering",
      "description": "Pro-tips for de som vil ha det beste",
      "priority": "lav",
      "example": "Eksempel"
    },
    {
      "title": "Vedlikeholdstips",
      "description": "Slik holder du kvaliteten over tid",
      "priority": "lav"
    }
  ],
  "quickWin": "Ett konkret tiltak for å løfte fra bra til utmerket"
}`
      : `Du er en ekspert på SEO og nettside-optimalisering for norske bedrifter.
Gi konkrete, handlingsrettede forslag på norsk. Vær spesifikk og praktisk.

VIKTIG: Fokuser på det SPESIFIKKE problemet som er oppgitt. Hvis problemet er antall (f.eks. for mange H1-er), fokuser på det - ikke på tekstinnholdet.

Svar i JSON-format med følgende struktur:
{
  "problem": "Kort beskrivelse av det faktiske problemet",
  "summary": "Kort oppsummering av hvorfor dette er viktig (1-2 setninger)",
  "suggestions": [
    {
      "title": "Kort tittel på forslaget",
      "description": "Detaljert beskrivelse av hva som bør gjøres",
      "priority": "høy" | "medium" | "lav",
      "example": "Konkret eksempel eller kode hvis relevant"
    }
  ],
  "quickWin": "Ett enkelt tiltak som kan gjøres med en gang"
}`;
    
    const userPrompt = isOptimal
      ? `Gi forbedringsforslag for følgende element som allerede er BRA:

Element: ${element}
Nåværende verdi/status: ${currentValue}
Vurdering: ${statusText} ✓
${context?.url ? `Nettside: ${context.url}` : ''}

VIKTIG: 
- Anerkjenn at dette er bra
- Men gi 2-3 KONKRETE tips for å gå fra "bra" til "utmerket"
- Inkluder avanserte tips som skiller profesjonelle sider fra resten
- Gi minst ett konkret eksempel`
      : `Gi forslag for å forbedre følgende element på en nettside:

Element: ${element}
Nåværende verdi/status: ${currentValue}
${issue ? `PROBLEM: ${issue}` : ''}
Vurdering: ${statusText}
${context?.url ? `Nettside: ${context.url}` : ''}

VIKTIG: Fokuser forslagene på det spesifikke problemet som er nevnt. Gi 2-3 konkrete forslag for å løse problemet.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    const suggestions = JSON.parse(content || '{}');

    return NextResponse.json({
      success: true,
      data: suggestions,
      tokens: response.usage?.total_tokens || 0,
    });
  } catch (error) {
    console.error('AI suggestion error:', error);
    return NextResponse.json(
      { success: false, error: 'Kunne ikke generere forslag' },
      { status: 500 }
    );
  }
}

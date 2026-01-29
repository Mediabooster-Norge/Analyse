import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SuggestionRequest = await request.json();
    const { element, currentValue, status, issue, context } = body;

    const statusText = status === 'good' ? 'optimalt' : status === 'warning' ? 'ok, men kan forbedres' : 'trenger forbedring';
    
    // Different prompts based on status
    const isOptimal = status === 'good' && !issue;
    
    const systemPrompt = isOptimal
      ? `Du er en ekspert på SEO og nettside-optimalisering for norske bedrifter.
Dette elementet er ALLEREDE optimalt. Gi positiv tilbakemelding og evt. tips for å vedlikeholde god praksis.

Svar i JSON-format med følgende struktur:
{
  "summary": "Positiv bekreftelse på at dette er bra (1-2 setninger)",
  "suggestions": [
    {
      "title": "Tips for å opprettholde god praksis",
      "description": "Kort beskrivelse av hva som gjør dette bra og hvordan beholde det",
      "priority": "lav"
    }
  ],
  "quickWin": "En positiv bekreftelse eller vedlikeholdstips"
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
      ? `Gi positiv tilbakemelding for følgende element som allerede er optimalt:

Element: ${element}
Nåværende verdi/status: ${currentValue}
Vurdering: ${statusText} ✓
${context?.url ? `Nettside: ${context.url}` : ''}

VIKTIG: Dette er ALLEREDE bra! Gi ros og evt. tips for å opprettholde god praksis. IKKE foreslå forbedringer.`
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
      max_tokens: 800,
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

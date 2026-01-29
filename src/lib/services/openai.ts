import OpenAI from 'openai';
import type { SEOResults, ContentResults, SecurityResults, CompetitorResults, AISummary, Priority, RecommendationCategory } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalysisData {
  url: string;
  seoResults: SEOResults;
  contentResults: ContentResults;
  securityResults: SecurityResults;
  competitorResults?: CompetitorResults;
  industry?: string;
  targetKeywords?: string[];
}

interface AIAnalysisResult {
  summary: AISummary;
  tokensUsed: number;
  model: string;
  costUsd: number;
}

// Pricing per 1M tokens (January 2026)
const PRICING = {
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 2.50, output: 10.00 },
};

function calculateCost(
  model: 'gpt-4o-mini' | 'gpt-4o',
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

export async function generateAIAnalysis(
  data: AnalysisData,
  usePremiumModel: boolean = false
): Promise<AIAnalysisResult> {
  const model = usePremiumModel ? 'gpt-4o' : 'gpt-4o-mini';

  const systemPrompt = `Du er en erfaren SEO- og digital markedsføringsekspert. Analyser nettsidens data og gi konkrete, handlingsbare anbefalinger på norsk.

Dine anbefalinger skal være:
1. Spesifikke og målbare
2. Prioritert etter forventet effekt
3. Tilpasset bedriftens bransje hvis oppgitt
4. Realistiske å implementere

Svar ALLTID i gyldig JSON-format som matcher den forespurte strukturen.`;

  const userPrompt = `Analyser følgende data for ${data.url}:

## SEO-resultater
- Total SEO-score: ${data.seoResults.score}/100
- Title tag: ${data.seoResults.meta.title.content || 'Mangler'} (${data.seoResults.meta.title.length} tegn)
- Meta description: ${data.seoResults.meta.description.content || 'Mangler'} (${data.seoResults.meta.description.length} tegn)
- H1-tags: ${data.seoResults.headings.h1.count}
- Bilder uten alt-tekst: ${data.seoResults.images.withoutAlt} av ${data.seoResults.images.total}
- Interne lenker: ${data.seoResults.links.internal.count}
- Eksterne lenker: ${data.seoResults.links.external.count}

## Innholdsanalyse
- Ordtelling: ${data.contentResults.wordCount}
- LIX-score: ${data.contentResults.readability.lixScore} (${data.contentResults.readability.lixLevel})
- Har CTA: ${data.contentResults.hasCTA ? 'Ja' : 'Nei'}
- Topp søkeord på siden:
${data.contentResults.keywords?.slice(0, 10).map(k => `  - "${k.word}": ${k.count} ganger (${k.density}% tetthet)`).join('\n') || '  Ingen søkeord funnet'}

## Sikkerhet
- SSL-gradering: ${data.securityResults.ssl.grade}
- SSL sertifikat utløper om: ${data.securityResults.ssl.certificate.daysUntilExpiry ? data.securityResults.ssl.certificate.daysUntilExpiry + ' dager' : 'Ukjent'}
- Sikkerhetsheaders score: ${data.securityResults.headers.score}/100
  - Content-Security-Policy (CSP): ${data.securityResults.headers.contentSecurityPolicy ? '✓ Implementert' : '✗ Mangler'}
  - Strict-Transport-Security (HSTS): ${data.securityResults.headers.strictTransportSecurity ? '✓ Implementert' : '✗ Mangler'}
  - X-Frame-Options: ${data.securityResults.headers.xFrameOptions ? '✓ Implementert' : '✗ Mangler'}
  - X-Content-Type-Options: ${data.securityResults.headers.xContentTypeOptions ? '✓ Implementert' : '✗ Mangler'}
  - Referrer-Policy: ${data.securityResults.headers.referrerPolicy ? '✓ Implementert' : '✗ Mangler'}
  - Permissions-Policy: ${data.securityResults.headers.permissionsPolicy ? '✓ Implementert' : '✗ Mangler'}
- Total sikkerhetsscore: ${data.securityResults.score}/100

${data.competitorResults && data.competitorResults.competitors.length > 0 ? `
## Konkurrentanalyse
Din score: ${data.seoResults.score}/100 (SEO), ${data.contentResults.score}/100 (Innhold), ${data.securityResults.score}/100 (Sikkerhet)

${data.competitorResults.competitors.map((comp, index) => `
Konkurrent ${index + 1}: ${comp.url}
- SEO: ${comp.results.seoResults.score}/100
- Innhold: ${comp.results.contentResults.score}/100 (${comp.results.contentResults.wordCount} ord)
- Sikkerhet: ${comp.results.securityResults.score}/100
- Total: ${comp.results.overallScore}/100
`).join('\n')}
` : ''}

${data.industry ? `Bransje: ${data.industry}` : ''}

${data.targetKeywords && data.targetKeywords.length > 0 ? `
## Ønskede nøkkelord (fra brukeren)
Brukeren ønsker å rangere for følgende nøkkelord:
${data.targetKeywords.map(k => `- "${k}"`).join('\n')}

Analyser om disse nøkkelordene er godt representert på siden, og gi konkrete anbefalinger for hvordan de kan brukes bedre.
` : ''}

Gi en komplett analyse med følgende JSON-struktur:
{
  "overallAssessment": "En kort oppsummering av nettsidens tilstand (2-3 setninger)",
  "keyFindings": [
    { "text": "Positivt funn - noe som er bra med siden", "type": "positive" },
    { "text": "Negativt funn - noe som bør forbedres", "type": "negative" },
    { "text": "Nøytralt funn eller observasjon", "type": "neutral" },
    { "text": "Flere positive eller negative funn...", "type": "positive|negative|neutral" }
  ],
  "keywordAnalysis": {
    "summary": "Detaljert vurdering av søkeordbruken på siden (2-3 setninger)",
    "primaryKeywords": ["Hovedsøkeord 1 funnet på siden", "Hovedsøkeord 2", "Hovedsøkeord 3", "Hovedsøkeord 4", "Hovedsøkeord 5"],
    "missingKeywords": ["Søkeord fra brukerens liste som mangler på siden", "Andre søkeord som burde vært inkludert"],
    "keywordDensityAssessment": "Vurdering av søkeordtettheten - er den for høy, for lav eller optimal?",
    "titleKeywordMatch": "Vurdering av om hovedsøkeordene er i title-taggen",
    "targetKeywordMatches": "Hvis brukeren oppga ønskede nøkkelord: Hvilke av disse finnes på siden og hvordan er de brukt?",
    "recommendations": "Konkrete anbefalinger for å forbedre søkeordbruken (2-3 setninger)"
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "seo|content|security|performance|accessibility",
      "title": "Kort tittel",
      "description": "Detaljert beskrivelse av hva som bør gjøres",
      "expectedImpact": "Forventet effekt av implementeringen"
    }
  ],
  "competitorComparison": {
    "summary": "Overordnet sammenligning med konkurrenten (2-3 setninger). Hvem er best posisjonert og hvorfor?",
    "scoreAnalysis": "Analyse av score-forskjellene - hva betyr de i praksis?",
    "yourStrengths": ["Din styrke 1 med forklaring", "Din styrke 2 med forklaring", "Din styrke 3"],
    "competitorStrengths": ["Konkurrentens styrke 1 med forklaring", "Konkurrentens styrke 2", "Konkurrentens styrke 3"],
    "opportunities": ["Konkret mulighet 1 for å slå konkurrenten", "Mulighet 2", "Mulighet 3"],
    "quickWins": ["Rask forbedring 1 du kan gjøre i dag", "Rask forbedring 2"]
  },
  "actionPlan": {
    "immediate": ["Gjør dette først", "Deretter dette"],
    "shortTerm": ["Innen 1-2 uker"],
    "longTerm": ["Innen 1-3 måneder"]
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content) as AISummary;
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    return {
      summary: parsed,
      tokensUsed: totalTokens,
      model,
      costUsd: calculateCost(model as 'gpt-4o-mini' | 'gpt-4o', inputTokens, outputTokens),
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI analysis');
  }
}

export async function generateQuickSummary(
  seoScore: number,
  contentScore: number,
  securityScore: number
): Promise<string> {
  const overallScore = Math.round((seoScore + contentScore + securityScore) / 3);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Du er en SEO-ekspert. Gi en kort, oppmuntrende oppsummering på norsk (maks 2 setninger).',
      },
      {
        role: 'user',
        content: `Nettsidens score: SEO ${seoScore}/100, Innhold ${contentScore}/100, Sikkerhet ${securityScore}/100. Total: ${overallScore}/100. Gi en kort oppsummering.`,
      },
    ],
    max_tokens: 100,
  });

  return response.choices[0]?.message?.content || 'Analysen er fullført.';
}

// Keyword research data interface
export interface KeywordData {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: 'lav' | 'medium' | 'høy';
  competitionScore: number;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  difficulty: number;
  trend: 'stigende' | 'stabil' | 'synkende';
}

// Generate keyword research data using AI
export async function generateKeywordResearch(
  keywords: string[],
  industry?: string,
  country: string = 'Norge'
): Promise<{ keywords: KeywordData[]; tokensUsed: number; costUsd: number }> {
  if (keywords.length === 0) {
    return { keywords: [], tokensUsed: 0, costUsd: 0 };
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Du er en SEO-ekspert med dyp kunnskap om norsk søkemarked og Google Ads data.
        
Basert på din kunnskap om søkemønstre og annonsemarkedet i Norge, gi realistiske estimater for søkeordsdata.

For hvert nøkkelord skal du estimere:
- searchVolume: Månedlig søkevolum i Norge (tall mellom 10-100000 basert på hvor vanlig søkeordet er)
- cpc: Gjennomsnittlig CPC i NOK (norske kroner, typisk mellom 1-50 NOK for de fleste søkeord)
- competition: "lav", "medium" eller "høy" basert på annonsørkonkurranse
- competitionScore: Tall fra 0-100 der 100 er høyest konkurranse
- intent: Søkeintensjon - "informational", "commercial", "transactional" eller "navigational"
- difficulty: SEO-vanskelighetsgrad fra 0-100 der 100 er vanskeligst å rangere for
- trend: "stigende", "stabil" eller "synkende" basert på markedstrender

Svar ALLTID i gyldig JSON-format.`
      },
      {
        role: 'user',
        content: `Analyser følgende nøkkelord for det norske markedet${industry ? ` innen ${industry}-bransjen` : ''}:

${keywords.map((k, i) => `${i + 1}. "${k}"`).join('\n')}

Returner data i dette formatet:
{
  "keywords": [
    {
      "keyword": "søkeord",
      "searchVolume": 1000,
      "cpc": 5.50,
      "competition": "medium",
      "competitionScore": 45,
      "intent": "commercial",
      "difficulty": 35,
      "trend": "stabil"
    }
  ]
}`
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { keywords: [], tokensUsed: 0, costUsd: 0 };
  }

  const parsed = JSON.parse(content) as { keywords: KeywordData[] };
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;

  return {
    keywords: parsed.keywords || [],
    tokensUsed: inputTokens + outputTokens,
    costUsd: calculateCost('gpt-4o-mini', inputTokens, outputTokens),
  };
}

// ============================================================================
// AI Visibility Check
// ============================================================================

export interface AIVisibilityData {
  score: number;
  level: 'high' | 'medium' | 'low' | 'none';
  description: string;
  details: {
    queriesTested: number;
    timesCited: number;
    timesMentioned: number;
    queries: Array<{
      query: string;
      cited: boolean;
      mentioned: boolean;
      aiResponse?: string;
    }>;
  };
  recommendations: string[];
}

export async function checkAIVisibility(
  domain: string,
  companyName?: string,
  keywords: string[] = []
): Promise<{ visibility: AIVisibilityData; tokensUsed: number; costUsd: number }> {
  // Create search queries based on company/domain
  const searchQueries = [
    companyName ? `Hva vet du om ${companyName}?` : `Hva vet du om ${domain}?`,
    companyName ? `Kan du anbefale ${companyName}?` : `Hva tilbyr ${domain}?`,
    ...(keywords.slice(0, 2).map(k => `Hvilke selskaper i Norge er best på ${k}?`)),
  ];

  let totalTokens = 0;
  let totalCost = 0;

  // Check AI visibility by asking GPT about the company/website
  const results = await Promise.all(
    searchQueries.map(async (query) => {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Du er en hjelpsom assistent. Svar basert på din kunnskap. 
Hvis du kjenner til bedriften eller nettsiden som nevnes, beskriv hva du vet.
Hvis du ikke kjenner til den, si det ærlig.
Hold svaret kort og konsist (2-3 setninger).`,
            },
            {
              role: 'user',
              content: query,
            },
          ],
          max_tokens: 200,
          temperature: 0.3,
        });

        const inputTokens = response.usage?.prompt_tokens || 0;
        const outputTokens = response.usage?.completion_tokens || 0;
        totalTokens += inputTokens + outputTokens;
        totalCost += calculateCost('gpt-4o-mini', inputTokens, outputTokens);

        const content = response.choices[0]?.message?.content || '';
        
        // Check if the AI knows about the domain/company
        const contentLower = content.toLowerCase();
        const domainLower = domain.toLowerCase();
        const companyLower = companyName?.toLowerCase() || '';
        
        // Check for explicit mentions
        const isMentioned = contentLower.includes(domainLower) || 
          (companyName && contentLower.includes(companyLower));
        
        // Check if AI indicates it knows about the company
        const unknownPhrases = [
          'kjenner ikke til',
          'har ikke informasjon',
          'vet ikke',
          'ingen informasjon',
          'ikke kjent med',
          'kan ikke finne',
          'ukjent for meg',
          'har ikke hørt om',
          'ingen spesifikk',
          'ikke nok informasjon',
        ];
        
        const knowsAbout = !unknownPhrases.some(phrase => contentLower.includes(phrase));
        const isCited = isMentioned && knowsAbout;

        return {
          query,
          cited: isCited,
          mentioned: isMentioned || knowsAbout,
          aiResponse: content,
        };
      } catch (error) {
        console.error(`Error querying OpenAI for visibility: ${error}`);
        return { query, cited: false, mentioned: false, error: true };
      }
    })
  );

  // Calculate AI visibility score
  const validResults = results.filter(r => !('error' in r));
  const citedCount = validResults.filter(r => r.cited).length;
  const mentionedCount = validResults.filter(r => r.mentioned).length;
  
  let score = 0;
  if (validResults.length > 0) {
    score = Math.round(
      ((citedCount * 2 + mentionedCount) / (validResults.length * 3)) * 100
    );
  }

  // Determine visibility level
  let level: 'high' | 'medium' | 'low' | 'none';
  let description: string;
  
  if (score >= 70) {
    level = 'high';
    description = 'AI-modeller kjenner godt til bedriften din og kan anbefale den til brukere.';
  } else if (score >= 40) {
    level = 'medium';
    description = 'AI-modeller har noe kjennskap til bedriften, men synligheten kan forbedres.';
  } else if (score > 0) {
    level = 'low';
    description = 'AI-modeller har begrenset kjennskap til bedriften din.';
  } else {
    level = 'none';
    description = 'AI-modeller ser ikke ut til å kjenne til bedriften din ennå.';
  }

  const recommendations = [
    score < 70 && 'Publiser mer innhold som svarer på vanlige spørsmål i din bransje',
    score < 50 && 'Øk online tilstedeværelse gjennom PR, artikler og bransjekatalog',
    citedCount === 0 && 'Skap autorativt innhold som etablerer bedriften som ekspert',
    mentionedCount === 0 && 'Bygg merkevarebevissthet gjennom sosiale medier og omtaler',
  ].filter(Boolean) as string[];

  return {
    visibility: {
      score,
      level,
      description,
      details: {
        queriesTested: validResults.length,
        timesCited: citedCount,
        timesMentioned: mentionedCount,
        queries: results.map(r => ({
          query: r.query,
          cited: r.cited,
          mentioned: r.mentioned,
          aiResponse: r.aiResponse,
        })),
      },
      recommendations,
    },
    tokensUsed: totalTokens,
    costUsd: totalCost,
  };
}

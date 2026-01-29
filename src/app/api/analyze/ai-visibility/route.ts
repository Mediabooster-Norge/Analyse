import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 30;

interface AIVisibilityRequest {
  url: string;
  companyName?: string;
  keywords?: string[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AIVisibilityRequest;
    const { url, companyName, keywords = [] } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Extract domain from URL
    let domain: string;
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      domain = urlObj.hostname.replace('www.', '');
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        score: null,
        message: 'OpenAI API-nøkkel mangler.',
        estimatedOnly: true,
      });
    }

    // Create search queries based on company/domain
    const searchQueries = [
      companyName ? `Hva vet du om ${companyName}?` : `Hva vet du om ${domain}?`,
      companyName ? `Kan du anbefale ${companyName} for deres tjenester?` : `Hva tilbyr ${domain}?`,
      ...(keywords.slice(0, 2).map(k => `Hvilke selskaper i Norge er best på ${k}?`)),
    ];

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

          const content = response.choices[0]?.message?.content || '';
          
          // Check if the AI knows about the domain/company
          const contentLower = content.toLowerCase();
          const domainLower = domain.toLowerCase();
          const companyLower = companyName?.toLowerCase() || '';
          
          // Check for explicit mentions
          const isMentioned = contentLower.includes(domainLower) || 
            (companyName && contentLower.includes(companyLower));
          
          // Check if AI indicates it knows about the company (not saying "I don't know")
          const unknownPhrases = [
            'kjenner ikke til',
            'har ikke informasjon',
            'vet ikke',
            'ingen informasjon',
            'ikke kjent med',
            'kan ikke finne',
            'ukjent for meg',
            'har ikke hørt om',
          ];
          
          const knowsAbout = !unknownPhrases.some(phrase => contentLower.includes(phrase));
          
          // "Cited" = AI knows and mentions it positively
          // "Mentioned" = AI at least recognizes it
          const isCited = isMentioned && knowsAbout;

          return {
            query,
            cited: isCited,
            mentioned: isMentioned || knowsAbout,
            response: content,
          };
        } catch (error) {
          console.error(`Error querying OpenAI: ${error}`);
          return { query, cited: false, mentioned: false, error: true };
        }
      })
    );

    // Calculate AI visibility score
    const validResults = results.filter(r => !r.error);
    const citedCount = validResults.filter(r => r.cited).length;
    const mentionedCount = validResults.filter(r => r.mentioned).length;
    
    let score = 0;
    if (validResults.length > 0) {
      // Citations (AI knows + mentions) are worth more than just mentions
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

    return NextResponse.json({
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
          aiResponse: r.response,
        })),
      },
      recommendations: [
        score < 70 && 'Publiser mer innhold som svarer på vanlige spørsmål i din bransje',
        score < 50 && 'Øk online tilstedeværelse gjennom PR, artikler og bransjekataloge',
        citedCount === 0 && 'Skap autorativt innhold som etablerer bedriften som ekspert',
        mentionedCount === 0 && 'Bygg merkevarebevissthet gjennom sosiale medier og omtaler',
      ].filter(Boolean),
    });
  } catch (error) {
    console.error('AI visibility check error:', error);
    return NextResponse.json(
      { error: 'En feil oppstod under sjekk av AI-synlighet' },
      { status: 500 }
    );
  }
}

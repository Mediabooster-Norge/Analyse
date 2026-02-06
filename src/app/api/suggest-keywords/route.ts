import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_KEYWORDS = 50;
const DEFAULT_COUNT = 20;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, count: requestedCount } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // User can choose 10, 20, 30, or 50 (capped at MAX_KEYWORDS)
    const validCounts = [10, 20, 30, 50];
    const count = validCounts.includes(Number(requestedCount))
      ? Number(requestedCount)
      : Math.min(MAX_KEYWORDS, Math.max(10, Math.round(Number(requestedCount) || DEFAULT_COUNT)));
    const safeCount = Math.min(MAX_KEYWORDS, Math.max(10, count));

    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    // Fetch and parse the webpage
    let pageContent = '';
    let pageTitle = '';
    let metaDescription = '';
    
    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NettsjekBot/1.0)',
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        pageTitle = $('title').text() || '';
        metaDescription = $('meta[name="description"]').attr('content') || '';
        
        // Extract text from main content areas
        const headings = $('h1, h2, h3').map((_, el) => $(el).text().trim()).get().join(' ');
        const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().slice(0, 10).join(' ');
        
        pageContent = `${pageTitle} ${metaDescription} ${headings} ${paragraphs}`.slice(0, 3000);
      }
    } catch (fetchError) {
      console.error('Failed to fetch URL:', fetchError);
      // Continue with URL-based suggestions only
    }

    console.log('[suggest-keywords] URL:', normalizedUrl, 'PageContent length:', pageContent.length, 'Count:', safeCount);

    // Use AI to suggest keywords
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du er en erfaren SEO-ekspert som foreslår relevante søkeord for norske nettsider.

Din oppgave: Generer nøyaktig ${safeCount} relevante norske søkeord/nøkkelfraser som potensielle kunder ville søkt etter på Google for å finne denne nettsiden.

Regler:
- Alle søkeord skal være på norsk
- Inkluder en blanding av korte (1-2 ord) og lange (3-5 ord) søkefraser
- Fokuser på bransje, tjenester, produkter og geografisk relevans
- Tenk som en kunde som søker etter disse tjenestene
- Du MÅ returnere nøyaktig ${safeCount} søkeord, aldri færre
- Svar KUN med en JSON-array, ingen annen tekst

Eksempel på korrekt svarformat:
["søkeord 1", "søkeord 2", "søkeord 3"]`
        },
        {
          role: 'user',
          content: `Analyser denne nettsiden og foreslå ${safeCount} norske SEO-søkeord:

URL: ${normalizedUrl}
${pageTitle ? `Tittel: ${pageTitle}` : ''}
${metaDescription ? `Beskrivelse: ${metaDescription}` : ''}
${pageContent ? `\nInnhold fra siden:\n${pageContent}` : '\n(Kunne ikke hente innhold fra siden, basér forslag på URL og domenenavn)'}

Gi meg nøyaktig ${safeCount} søkeord som en JSON-array:`
        }
      ],
      max_completion_tokens: safeCount <= 20 ? 800 : 2000,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    
    console.log('[suggest-keywords] Raw AI response:', content.slice(0, 800));
    
    // Strip markdown code fences if GPT wraps response in ```json ... ```
    const cleaned = content
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();
    
    // Parse the JSON response
    let keywords: string[] = [];
    try {
      // Try direct parse first
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        keywords = parsed;
      } else if (parsed && typeof parsed === 'object') {
        // GPT-5 might wrap in an object like { keywords: [...] }
        const arrayVal = parsed.keywords || parsed.suggestions || parsed.nøkkelord;
        if (Array.isArray(arrayVal)) {
          keywords = arrayVal;
        } else {
          // Try to find any array value in the object
          const found = Object.values(parsed).find(Array.isArray);
          keywords = (found as string[]) || [];
        }
      }
    } catch {
      // Fallback: extract JSON array from response (in case there's extra text)
      try {
        const jsonMatch = cleaned.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          keywords = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Last resort: split by commas/newlines and clean numbered lists
        keywords = cleaned
          .replace(/[\[\]"{}]/g, '')
          .split(/[,\n]/)
          .map(k => k.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
          .filter(k => k.length > 0 && !k.startsWith('{'));
      }
    }
    
    console.log('[suggest-keywords] Parsed keywords count:', keywords.length, 'First 5:', keywords.slice(0, 5));

    // Ensure we return an array of strings
    keywords = keywords
      .filter((k): k is string => typeof k === 'string')
      .map(k => k.toLowerCase().trim())
      .filter(k => k.length > 1 && k.length < 100);

    return NextResponse.json({
      success: true,
      keywords: keywords.slice(0, safeCount),
      tokensUsed: completion.usage?.total_tokens || 0,
    });
  } catch (error) {
    console.error('Keyword suggestion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to suggest keywords' },
      { status: 500 }
    );
  }
}

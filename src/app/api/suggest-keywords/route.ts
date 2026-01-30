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

    // Use AI to suggest keywords
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du er en SEO-ekspert som foreslår relevante nøkkelord for norske nettsider. 
Foreslå nøyaktig ${safeCount} relevante nøkkelord basert på URL og innhold.
Fokuser på:
- Bransje og tjenester
- Geografisk relevans (hvis aktuelt)
- Søketermer kunder ville brukt
- Long-tail keywords
- Kombiner generiske og spesifikke søkeord

Returner kun en JSON-array med nøkkelord på norsk, f.eks: ["nøkkelord1", "nøkkelord2"]
Ikke inkluder forklaringer, kun JSON-arrayen. Antall nøkkelord må være ${safeCount}.`
        },
        {
          role: 'user',
          content: `URL: ${normalizedUrl}
${pageContent ? `\nSideinnhold:\n${pageContent}` : ''}

Foreslå relevante nøkkelord for denne nettsiden:`
        }
      ],
      temperature: 0.7,
      max_tokens: safeCount <= 20 ? 500 : 1200,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    
    // Parse the JSON response
    let keywords: string[] = [];
    try {
      // Extract JSON array from response (in case there's extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        keywords = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse keywords:', parseError);
      // Fallback: try to extract words from content
      keywords = content
        .replace(/[\[\]"]/g, '')
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
    }

    // Ensure we return an array of strings
    keywords = keywords
      .filter((k): k is string => typeof k === 'string')
      .map(k => k.toLowerCase().trim())
      .filter(k => k.length > 1 && k.length < 50);

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

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { getPremiumStatusServer } from '@/lib/premium-server';
import { fetchFeaturedImage } from '@/lib/services/unsplash';

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Du må være logget inn' }, { status: 401 });
    }

    const premiumStatus = await getPremiumStatusServer(user);
    const limit = premiumStatus.articleGenerationsPerMonth;

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const firstDayIso = firstDayOfMonth.toISOString();

    const { count, error: countError } = await supabase
      .from('article_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', firstDayIso);

    if (countError) {
      console.error('article_generations count error:', countError);
      return NextResponse.json(
        { error: 'Kunne ikke sjekke grense' },
        { status: 500 }
      );
    }

    const used = count ?? 0;
    if (used >= limit) {
      return NextResponse.json(
        {
          error: 'Du har brukt opp artikkelgenereringer denne måneden.',
          limitReached: true,
          limit,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { title, rationale, companyName, websiteUrl, websiteName, length, tone, audience } = body as {
      title?: string;
      rationale?: string;
      companyName?: string;
      websiteUrl?: string;
      websiteName?: string;
      length?: 'short' | 'medium' | 'long';
      tone?: 'professional' | 'casual' | 'educational';
      audience?: 'general' | 'beginners' | 'experts' | 'business';
    };

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tittel er påkrevd' },
        { status: 400 }
      );
    }

    const context = companyName ? `Kontekst/bransje: ${companyName}.` : '';

    const currentYear = new Date().getFullYear();

    // Length configuration with structure requirements
    const lengthConfig = {
      short: { 
        words: '300–500', 
        minWords: 300, 
        tokens: 1500, 
        model: 'gpt-4o-mini' as const,
        structure: 'Inkluder: 1 innledning (2-3 avsnitt), 2-3 hovedseksjoner med korte forklaringer, 1 kort avslutning.'
      },
      medium: { 
        words: '800–1200', 
        minWords: 800, 
        tokens: 3000, 
        model: 'gpt-4o-mini' as const,
        structure: 'Inkluder: 1 grundig innledning (3-4 avsnitt), 4-5 hovedseksjoner (##) med 2-3 avsnitt hver, minst 2 lister med 5+ punkter, 1 utfyllende avslutning med CTA.'
      },
      long: { 
        words: '1200–1500', 
        minWords: 1200, 
        tokens: 5000, 
        model: 'gpt-4o-mini' as const,
        structure: `STRUKTURKRAV FOR LANG ARTIKKEL:
1. Grundig innledning som setter kontekst
2. 5-6 hovedseksjoner (##) med utdypende innhold
3. Minst 2 lister med 5+ punkter hver
4. Konkrete eksempler og praktiske tips
5. FAQ-seksjon med 3-4 spørsmål og svar
6. Omfattende avslutning med oppsummering og CTA`
      },
    };
    const selectedLength = lengthConfig[length || 'medium'];
    
    console.log('[generate-article] Using config:', { length, model: selectedLength.model, tokens: selectedLength.tokens });

    // Tone configuration
    const toneDescriptions = {
      professional: 'Profesjonell og forretningsmessig tone. Bruk fagspråk der relevant, men vær tydelig og konkret.',
      casual: 'Uformell og engasjerende tone. Skriv som om du snakker til en venn, men hold det informativt.',
      educational: 'Pedagogisk og forklarende tone. Forklar konsepter grundig, bruk eksempler og steg-for-steg.',
    };
    const selectedTone = toneDescriptions[tone || 'professional'];

    // Audience configuration
    const audienceDescriptions = {
      general: 'Skriv for et generelt publikum uten spesielle forkunnskaper.',
      beginners: 'Skriv for nybegynnere. Unngå fagsjargong, forklar alt grundig, og bruk enkle eksempler.',
      experts: 'Skriv for fagfolk og eksperter. Du kan bruke fagterminologi og gå i dybden på tekniske detaljer.',
      business: 'Skriv for bedriftsledere og beslutningstakere. Fokuser på forretningsverdi, ROI og strategiske fordeler.',
    };
    const selectedAudience = audienceDescriptions[audience || 'general'];

    const response = await openai.chat.completions.create({
      model: selectedLength.model,
      messages: [
        {
          role: 'system',
          content: `Du er en erfaren innholdsforfatter og SEO-ekspert for norske nettsider. Du svarer ALLTID med ett gyldig JSON-objekt, ingen annen tekst.

LENGDEKRAV: Artikkelen MÅ være ${selectedLength.words} ord. MINIMUM ${selectedLength.minWords} ord.

${selectedLength.structure}

TONE OG STIL: ${selectedTone}
MÅLGRUPPE: ${selectedAudience}

Returner et JSON-objekt med nøyaktig disse nøklene (alle strenger):
- "article": Hele artikkelen i markdown. FØLG STRUKTURKRAVENE NØYAKTIG. Skriv utfyllende og detaljert. IKKE avslutt før alle strukturkrav er oppfylt og ordmålet er nådd. Vi er i år ${currentYear}. Ingen plassholdere.
- "metaTitle": Forslått SEO-tittel (ca. 50–60 tegn).
- "metaDescription": Forslått meta-beskrivelse (ca. 150–160 tegn, leservennlig og oppsummerende).
- "featuredImageSuggestion": Kort brukervennlig beskrivelse av bildet på norsk (f.eks. "Bilde av gruppe som diskuterer AI-løsninger i kontor"). Vises til bruker.
- "featuredImageSearchQuery": 2–4 engelske søkeord for stock-bilde (Unsplash), som matcher artikkelens tema. Kun engelsk, f.eks. "AI team meeting office".`,
        },
        {
          role: 'user',
          content: `${context}

Tittel på artikkelen: ${title.trim()}

Begrunnelse/mål med artikkelen: ${(rationale ?? '').trim() || 'Ingen begrunnelse oppgitt.'}

Returner JSON med article, metaTitle, metaDescription, featuredImageSuggestion og featuredImageSearchQuery.`,
        },
      ],
      temperature: 0.6,
      max_tokens: selectedLength.tokens,
      response_format: { type: 'json_object' },
    });

    // Log response details for debugging
    const finishReason = response.choices[0]?.finish_reason;
    const usage = response.usage;
    console.log('[generate-article] Response:', { 
      finishReason, 
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
      maxTokensRequested: selectedLength.tokens
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json(
        { error: 'Kunne ikke generere artikkel' },
        { status: 500 }
      );
    }

    let article: string;
    let metaTitle: string | undefined;
    let metaDescription: string | undefined;
    let featuredImageSuggestion: string | undefined;
    let featuredImageSearchQuery: string | undefined;
    try {
      const parsed = JSON.parse(raw) as {
        article?: string;
        metaTitle?: string;
        metaDescription?: string;
        featuredImageSuggestion?: string;
        featuredImageSearchQuery?: string;
      };
      article = typeof parsed.article === 'string' ? parsed.article.trim() : '';
      if (!article) throw new Error('Mangler article');
      
      // Log word count for debugging
      const wordCount = article.split(/\s+/).filter(w => w.length > 0).length;
      console.log('[generate-article] Article word count:', wordCount, 'Required:', selectedLength.minWords);
      metaTitle = typeof parsed.metaTitle === 'string' ? parsed.metaTitle.trim() : undefined;
      metaDescription = typeof parsed.metaDescription === 'string' ? parsed.metaDescription.trim() : undefined;
      featuredImageSuggestion = typeof parsed.featuredImageSuggestion === 'string' ? parsed.featuredImageSuggestion.trim() : undefined;
      featuredImageSearchQuery = typeof parsed.featuredImageSearchQuery === 'string' ? parsed.featuredImageSearchQuery.trim() : undefined;
    } catch {
      return NextResponse.json(
        { error: 'Kunne ikke tolke artikkeldata' },
        { status: 500 }
      );
    }

    let featuredImageUrl: string | undefined;
    let featuredImageDownloadUrl: string | undefined;
    let featuredImageAttribution: string | undefined;
    let featuredImageProfileUrl: string | undefined;
    const imageQuery = featuredImageSearchQuery || featuredImageSuggestion;
    if (imageQuery) {
      const unsplash = await fetchFeaturedImage(imageQuery);
      if (unsplash) {
        featuredImageUrl = unsplash.url;
        featuredImageDownloadUrl = unsplash.downloadUrl;
        featuredImageAttribution = unsplash.attribution;
        featuredImageProfileUrl = unsplash.profileUrl;
      }
    }

    const { error: insertError } = await supabase
      .from('article_generations')
      .insert({ user_id: user.id });

    if (insertError) {
      console.error('article_generations insert error:', insertError);
      return NextResponse.json(
        { error: 'Kunne ikke registrere bruk' },
        { status: 500 }
      );
    }

    const { data: insertedArticle, error: articleInsertError } = await supabase
      .from('generated_articles')
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: article,
        website_url: websiteUrl?.trim() || null,
        website_name: websiteName?.trim() || companyName?.trim() || null,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        featured_image_suggestion: featuredImageSuggestion || null,
        featured_image_url: featuredImageUrl || null,
        featured_image_attribution: featuredImageAttribution || null,
        article_length: length || 'medium',
        article_tone: tone || 'professional',
        article_audience: audience || 'general',
      })
      .select('id')
      .single();

    if (articleInsertError) {
      console.error('generated_articles insert error:', articleInsertError);
      // Don't fail the request – article was generated and limit was consumed
    }

    const remaining = Math.max(0, limit - used - 1);

    return NextResponse.json({
      success: true,
      articleId: insertedArticle?.id,
      title: title.trim(),
      article,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      featuredImageSuggestion: featuredImageSuggestion || undefined,
      featuredImageUrl: featuredImageUrl || undefined,
      featuredImageDownloadUrl: featuredImageDownloadUrl || undefined,
      featuredImageAttribution: featuredImageAttribution || undefined,
      featuredImageProfileUrl: featuredImageProfileUrl || undefined,
      articleLength: length || 'medium',
      articleTone: tone || 'professional',
      articleAudience: audience || 'general',
      remaining,
      limit,
    });
  } catch (err) {
    console.error('generate-article error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere artikkel' },
      { status: 500 }
    );
  }
}

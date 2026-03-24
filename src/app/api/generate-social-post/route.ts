import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { getPremiumStatusServer } from '@/lib/premium-server';
import { fetchFeaturedImage } from '@/lib/services/unsplash';
import type { SocialPlatform } from '@/types/dashboard';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PLATFORMS: SocialPlatform[] = ['linkedin', 'instagram', 'x'];

function isPlatform(s: string): s is SocialPlatform {
  return PLATFORMS.includes(s as SocialPlatform);
}

const PLATFORM_CONFIG: Record<
  SocialPlatform,
  { maxChars: number; hint: string; hashtagCount: number }
> = {
  linkedin: {
    maxChars: 3000,
    hint: 'Profesjonell tone, kan bruke avsnitt og linjeskift. Passende for B2B og karriere.',
    hashtagCount: 3,
  },
  instagram: {
    maxChars: 2200,
    hint: 'Engasjerende og visuell tone. Korte avsnitt, emojis OK. Hashtags viktig.',
    hashtagCount: 5,
  },
  x: {
    maxChars: 280,
    hint: 'Kort og punchy. Én setning eller noen få. Hashtags sparsomt.',
    hashtagCount: 2,
  },
};

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

    // Shared quota: article_generations counts both article and social post generations (same limit).
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
          error: 'Du har brukt opp genereringer denne måneden (artikler + SoMe-poster).',
          limitReached: true,
          limit,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      title,
      rationale,
      companyName,
      websiteUrl,
      websiteName,
      platform = 'linkedin',
      length: lengthParam,
      tone: toneParam,
      audience: audienceParam,
    } = body as {
      title?: string;
      rationale?: string;
      companyName?: string;
      websiteUrl?: string;
      websiteName?: string;
      platform?: string;
      length?: 'short' | 'medium' | 'long';
      tone?: 'professional' | 'casual' | 'educational';
      audience?: 'general' | 'beginners' | 'experts' | 'business';
    };

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Postide/tittel er påkrevd' },
        { status: 400 }
      );
    }

    const platformNorm = isPlatform(platform) ? platform : 'linkedin';
    const titleTrim = title.trim();

    // Return existing post if same user + platform + title (e.g. after regenerating image)
    const { data: existingPost } = await supabase
      .from('generated_social_posts')
      .select('id, platform, title, content, hashtags, featured_image_suggestion, featured_image_url, featured_image_attribution')
      .eq('user_id', user.id)
      .eq('platform', platformNorm)
      .eq('title', titleTrim)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPost) {
      // Use same remaining formula as fresh generation so UI does not show inflated count on cache hit
      const remaining = Math.max(0, limit - used - 1);
      return NextResponse.json({
        success: true,
        postId: existingPost.id,
        platform: existingPost.platform,
        title: existingPost.title,
        content: existingPost.content,
        hashtags: existingPost.hashtags ?? [],
        cta: undefined,
        featuredImageSuggestion: existingPost.featured_image_suggestion ?? undefined,
        featuredImageUrl: existingPost.featured_image_url ?? undefined,
        featuredImageDownloadUrl: undefined,
        featuredImageAttribution: existingPost.featured_image_attribution ?? undefined,
        featuredImageProfileUrl: undefined,
        remaining,
        limit,
      });
    }

    const config = PLATFORM_CONFIG[platformNorm];
    const context = companyName ? `Kontekst: ${companyName}.` : '';

    const length = (lengthParam === 'short' ? 'medium' : lengthParam) ?? 'medium';
    const lengthGuidance: Record<string, string> = {
      medium: `Normal lengde: bruk opptil ca. halvparten av plattformens maks (maks ${config.maxChars} tegn).`,
      long: `Skriv UTFYLLENDE: bruk god plass, flere avsnitt, opptil ${config.maxChars} tegn for ${platformNorm}.`,
    };
    const toneDescriptions: Record<string, string> = {
      professional: 'Profesjonell og forretningsmessig tone. Bruk fagspråk der relevant, men vær tydelig.',
      casual: 'Uformell og engasjerende tone. Skriv som om du snakker til en venn, men hold det informativt.',
      educational: 'Pedagogisk og forklarende tone. Forklar konsepter kort og bruk eksempler der det passer.',
    };
    const audienceDescriptions: Record<string, string> = {
      general: 'Skriv for et generelt publikum uten spesielle forkunnskaper.',
      beginners: 'Skriv for nybegynnere. Unngå fagsjargong og forklar enkelt.',
      experts: 'Skriv for fagfolk og eksperter. Du kan bruke fagterminologi.',
      business: 'Skriv for bedriftsledere og beslutningstakere. Fokuser på forretningsverdi og strategi.',
    };
    const tone = toneParam ?? 'professional';
    const audience = audienceParam ?? 'general';
    const lengthGuide = lengthGuidance[length] ?? lengthGuidance.medium;
    const toneGuide = toneDescriptions[tone] ?? toneDescriptions.professional;
    const audienceGuide = audienceDescriptions[audience] ?? audienceDescriptions.general;

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: `Du er en SoMe-ekspert for norske bedrifter. Du skriver innlegg for ${platformNorm}.

${config.hint}

LENGDE: ${lengthGuide} Hashtags leveres separat (${config.hashtagCount} stk for ${platformNorm}).

TONE: ${toneGuide}
MÅLGRUPPE: ${audienceGuide}

Returner ALLTID gyldig JSON med nøklene:
- "content": selve innlegget (uten hashtags), på norsk
- "hashtags": array av ${config.hashtagCount} norske eller relevante hashtags uten #
- "cta": oppfordring til handling (én kort setning), eller tom streng "" hvis ikke relevant
- "featuredImageSuggestion": kort norsk beskrivelse av et passende bilde (f.eks. "Person som jobber på laptop i kontor")
- "featuredImageSearchQuery": 2–4 engelske søkeord til stock-bilde (f.eks. "laptop office work")`,
        },
        {
          role: 'user',
          content: `${context}

Postide: ${title.trim()}

Begrunnelse: ${(rationale ?? '').trim() || 'Ingen.'}

Skriv ett ferdig innlegg for ${platformNorm} (lengde: ${length}, tone: ${tone}, målgruppe: ${audience}). Returner KUN gyldig JSON med nøklene: content, hashtags, cta, featuredImageSuggestion, featuredImageSearchQuery. Ingen annen tekst.`,
        },
      ],
      max_completion_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const choice = response.choices[0];
    const raw = choice?.message?.content?.trim();
    if (!raw) {
      const finishReason = choice?.finish_reason ?? 'unknown';
      const usage = (response as { usage?: { prompt_tokens?: number; completion_tokens?: number } }).usage;
      console.error('generate-social-post: empty OpenAI content', {
        finish_reason: finishReason,
        usage,
        message_keys: choice?.message ? Object.keys(choice.message) : [],
      });
      return NextResponse.json(
        {
          error: 'Kunne ikke generere innlegg',
          code: 'empty_content',
          details: process.env.NODE_ENV === 'development' ? `finish_reason=${finishReason}` : undefined,
        },
        { status: 500 }
      );
    }

    // Strip markdown code fences if model wraps JSON in ```json ... ```
    const jsonStr = raw
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    let content: string;
    let hashtags: string[];
    let cta: string | undefined;
    let featuredImageSuggestion: string | undefined;
    let featuredImageSearchQuery: string | undefined;
    try {
      const parsed = JSON.parse(jsonStr) as {
        content?: string;
        hashtags?: string[];
        cta?: string;
        featuredImageSuggestion?: string;
        featuredImageSearchQuery?: string;
        featured_image_suggestion?: string;
        featured_image_search_query?: string;
      };
      content = typeof parsed.content === 'string' ? parsed.content.trim() : '';
      if (!content) throw new Error('Mangler content');
      hashtags = Array.isArray(parsed.hashtags)
        ? parsed.hashtags.filter((h): h is string => typeof h === 'string').slice(0, config.hashtagCount)
        : [];
      cta = typeof parsed.cta === 'string' ? parsed.cta.trim() : undefined;
      const imgSuggestion = parsed.featuredImageSuggestion ?? parsed.featured_image_suggestion;
      const imgSearch = parsed.featuredImageSearchQuery ?? parsed.featured_image_search_query;
      featuredImageSuggestion = typeof imgSuggestion === 'string' ? imgSuggestion.trim() : undefined;
      featuredImageSearchQuery = typeof imgSearch === 'string' ? imgSearch.trim() : undefined;
    } catch (parseErr) {
      console.error('generate-social-post: parse error', parseErr);
      console.error('generate-social-post: raw (first 600 chars)', raw.slice(0, 600));
      return NextResponse.json(
        { error: 'Kunne ikke tolke innleggsdata', code: 'parse_error' },
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
      .insert({ user_id: user.id, type: 'social_post' });

    if (insertError) {
      console.error('generate-social-post: article_generations insert error', insertError);
      return NextResponse.json(
        { error: 'Kunne ikke registrere bruk', code: 'quota_insert_error' },
        { status: 500 }
      );
    }

    const { data: insertedPost, error: postInsertError } = await supabase
      .from('generated_social_posts')
      .insert({
        user_id: user.id,
        platform: platformNorm,
        title: title.trim(),
        content,
        hashtags,
        cta: cta?.trim() || null,
        website_url: websiteUrl?.trim() || null,
        website_name: websiteName?.trim() || companyName?.trim() || null,
        featured_image_suggestion: featuredImageSuggestion || null,
        featured_image_url: featuredImageUrl || null,
        featured_image_attribution: featuredImageAttribution || null,
      })
      .select('id')
      .single();

    if (postInsertError) {
      console.error('generate-social-post: generated_social_posts insert error', postInsertError);
      const errMsg = String((postInsertError as { message?: string }).message ?? '');
      const isMissingColumn = (postInsertError as { code?: string }).code === 'PGRST204' && /cta|column/.test(errMsg);
      if (isMissingColumn) {
        return NextResponse.json(
          {
            error: 'Database-migrasjon mangler. Kjør migrasjoner (f.eks. supabase db push) for å legge til kolonnen cta i generated_social_posts.',
            code: 'migration_missing',
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        {
          error: 'Kunne ikke lagre innlegget',
          code: 'post_insert_error',
          details: process.env.NODE_ENV === 'development' ? errMsg : undefined,
        },
        { status: 500 }
      );
    }

    const remaining = Math.max(0, limit - used - 1);

    return NextResponse.json({
      success: true,
      postId: insertedPost?.id,
      platform: platformNorm,
      title: title.trim(),
      content,
      hashtags,
      cta: cta || undefined,
      featuredImageSuggestion: featuredImageSuggestion || undefined,
      featuredImageUrl: featuredImageUrl || undefined,
      featuredImageDownloadUrl: featuredImageDownloadUrl || undefined,
      featuredImageAttribution: featuredImageAttribution || undefined,
      featuredImageProfileUrl: featuredImageProfileUrl || undefined,
      remaining,
      limit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kunne ikke generere innlegg';
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('generate-social-post error:', message, stack);
    return NextResponse.json(
      {
        error: message,
        code: 'unexpected_error',
        details: process.env.NODE_ENV === 'development' && err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

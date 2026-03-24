'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  SocialPostSuggestion,
  GeneratedSocialPostResult,
  SocialPlatform,
  SocialPostLength,
  SocialPostTone,
  SocialPostAudience,
  GenerateSocialPostOptions,
} from '@/types/dashboard';
import {
  Share2,
  BarChart3,
  Copy,
  PenLine,
  Loader2,
  Clock,
  Download,
  RefreshCw,
} from 'lucide-react';
import { RocketIcon } from '../rocket-icon';
import { toast } from 'sonner';

const SUGGESTION_MESSAGES = [
  'Analyserer nettstedet…',
  'Finner postideer…',
  'Tilpasser til kanal…',
  'Formulerer forslag…',
];

const GENERATING_MESSAGES = [
  'Skriver innlegg…',
  'Tilpasser tone…',
  'Legger til hashtags…',
];

const PLATFORM_OPTIONS: { value: SocialPlatform; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
];

const SOCIAL_LENGTH_OPTIONS: { value: SocialPostLength; label: string; desc: string }[] = [
  { value: 'medium', label: 'Medium', desc: 'Normal lengde' },
  { value: 'long', label: 'Lang', desc: 'Utfyllende' },
];

const SOCIAL_TONE_OPTIONS: { value: SocialPostTone; label: string }[] = [
  { value: 'professional', label: 'Profesjonell' },
  { value: 'casual', label: 'Uformell' },
  { value: 'educational', label: 'Pedagogisk' },
];

const SOCIAL_AUDIENCE_OPTIONS: { value: SocialPostAudience; label: string }[] = [
  { value: 'general', label: 'Alle' },
  { value: 'beginners', label: 'Nybegynnere' },
  { value: 'experts', label: 'Eksperter' },
  { value: 'business', label: 'Bedriftsledere' },
];

export interface SocialTabProps {
  socialPostSuggestions: SocialPostSuggestion[] | null;
  loadingSocialPostSuggestions: boolean;
  socialPostSuggestionsSavedAt: string | null;
  selectedSocialPlatform: SocialPlatform;
  setSelectedSocialPlatform: (platform: SocialPlatform) => void;
  loadSocialSuggestionsForPlatform: (platform: SocialPlatform) => Promise<void>;
  fetchSocialPostSuggestions: (withCompetitors: boolean, platform: SocialPlatform) => void;
  hasCompetitors: boolean;
  remainingArticleGenerations: number;
  articleGenerationsLimit: number;
  generatedSocialPostResult: GeneratedSocialPostResult | null;
  generatingSocialPostIndex: number | null;
  fetchGenerateSocialPost: (
    suggestion: { title: string; rationale?: string },
    index: number,
    platform: SocialPlatform,
    options?: GenerateSocialPostOptions
  ) => void;
  setGeneratedSocialPost: (result: GeneratedSocialPostResult | null) => void;
}

export function SocialTab({
  socialPostSuggestions,
  loadingSocialPostSuggestions,
  socialPostSuggestionsSavedAt,
  selectedSocialPlatform,
  setSelectedSocialPlatform,
  loadSocialSuggestionsForPlatform,
  fetchSocialPostSuggestions,
  hasCompetitors,
  remainingArticleGenerations,
  articleGenerationsLimit,
  generatedSocialPostResult,
  generatingSocialPostIndex,
  fetchGenerateSocialPost,
  setGeneratedSocialPost,
}: SocialTabProps) {
  const [suggestionMessageIndex, setSuggestionMessageIndex] = useState(0);
  const [generatingMessageIndex, setGeneratingMessageIndex] = useState(0);
  const [regeneratingImage, setRegeneratingImage] = useState(false);
  const [selectedLength, setSelectedLength] = useState<SocialPostLength>('medium');
  const [selectedTone, setSelectedTone] = useState<SocialPostTone>('professional');
  const [selectedAudience, setSelectedAudience] = useState<SocialPostAudience>('general');

  useEffect(() => {
    loadSocialSuggestionsForPlatform(selectedSocialPlatform);
  }, [selectedSocialPlatform, loadSocialSuggestionsForPlatform]);

  useEffect(() => {
    if (!loadingSocialPostSuggestions) return;
    setSuggestionMessageIndex(0);
    const interval = setInterval(() => {
      setSuggestionMessageIndex((prev) => (prev + 1) % SUGGESTION_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadingSocialPostSuggestions]);

  useEffect(() => {
    if (generatingSocialPostIndex === null) return;
    setGeneratingMessageIndex(0);
    const interval = setInterval(() => {
      setGeneratingMessageIndex((prev) => (prev + 1) % GENERATING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [generatingSocialPostIndex]);

  const copyPost = () => {
    if (!generatedSocialPostResult) return;
    const hashtagStr = generatedSocialPostResult.hashtags.length > 0
      ? '\n\n' + generatedSocialPostResult.hashtags.map((h) => `#${h}`).join(' ')
      : '';
    const text = generatedSocialPostResult.content + (generatedSocialPostResult.cta ? '\n\n' + generatedSocialPostResult.cta : '') + hashtagStr;
    navigator.clipboard.writeText(text).then(
      () => toast.success('Innlegg kopiert'),
      () => toast.error('Kunne ikke kopiere')
    );
  };

  const copyTitle = (title: string) => {
    navigator.clipboard.writeText(title).then(
      () => toast.success('Ide kopiert'),
      () => toast.error('Kunne ikke kopiere')
    );
  };

  const regenerateImage = async () => {
    if (!generatedSocialPostResult?.featuredImageSuggestion) {
      toast.error('Ingen bildesøk tilgjengelig');
      return;
    }
    if (!generatedSocialPostResult.postId) {
      toast.error('Lagre innlegget først for å kunne oppdatere forsidebilde.');
      return;
    }
    const postId = generatedSocialPostResult.postId;
    setRegeneratingImage(true);
    try {
      const res = await fetch('/api/regenerate-image', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery: generatedSocialPostResult.featuredImageSuggestion,
          postId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Kunne ikke hente nytt bilde');
        return;
      }
      const patchRes = await fetch(`/api/generated-social-posts/${postId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featured_image_url: data.featuredImageUrl,
          featured_image_attribution: data.featuredImageAttribution,
        }),
      });
      if (!patchRes.ok) {
        const patchBody = await patchRes.json().catch(() => ({}));
        toast.error(patchBody.error || 'Bilde ble ikke lagret. Prøv igjen.');
        return;
      }
      setGeneratedSocialPost({
        ...generatedSocialPostResult,
        ...(data.featuredImageUrl != null ? { featuredImageUrl: data.featuredImageUrl } : {}),
        ...(data.featuredImageDownloadUrl != null ? { featuredImageDownloadUrl: data.featuredImageDownloadUrl } : {}),
        ...(data.featuredImageAttribution != null ? { featuredImageAttribution: data.featuredImageAttribution } : {}),
        ...(data.featuredImageProfileUrl != null ? { featuredImageProfileUrl: data.featuredImageProfileUrl } : {}),
      });
      toast.success('Nytt bilde lagret');
    } catch {
      toast.error('Kunne ikke hente nytt bilde');
    } finally {
      setRegeneratingImage(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl max-[400px]:rounded-xl border border-neutral-200 bg-white overflow-hidden min-w-0">
        <div className="p-3 max-[400px]:p-2 min-[401px]:p-4 sm:p-6 border-b border-neutral-100">
          <h3 className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-neutral-100 text-neutral-900 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
            <Share2 className="h-3.5 w-3.5 text-neutral-600" />
            SoMe-post generator
          </h3>
          <p className="text-[10px] sm:text-sm text-neutral-600 mb-3">
            Få AI-forslag til innlegg for LinkedIn, Instagram og X. Generer ferdig tekst til valgt kanal.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-sm">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              <strong className="text-neutral-900">{remainingArticleGenerations}/{articleGenerationsLimit}</strong> genereringer igjen denne måneden
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px]">
              Delt kvote med artikler
            </span>
          </div>
        </div>
        <div className="p-3 max-[400px]:p-2 min-[401px]:p-4 sm:p-6 space-y-4">
          {/* Platform selector */}
          <div className="space-y-2">
            <p className="text-xs text-neutral-500">Velg kanal</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedSocialPlatform(opt.value)}
                  className={`rounded-lg text-xs px-3 py-2 font-medium transition-colors ${
                    selectedSocialPlatform === opt.value
                      ? 'bg-[#0f515a] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Suggestion type cards */}
          <p className="text-xs text-neutral-500">
            Basert på nettsiden og nøkkelord — eller også konkurrentene for mer målrettede forslag.
          </p>
          <div className={`grid gap-3 ${hasCompetitors ? 'sm:grid-cols-2' : ''}`}>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 sm:p-4 flex flex-col gap-3">
              <div>
                <p className="text-xs font-medium text-neutral-900 mb-0.5">Nettside og nøkkelord</p>
                <p className="text-sm text-neutral-500 leading-snug">
                  Generelle postideer. Bruker kun nettsiden og nøkkelord.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => fetchSocialPostSuggestions(false, selectedSocialPlatform)}
                disabled={loadingSocialPostSuggestions}
                className="rounded-lg text-xs bg-[#0f515a] hover:bg-[#0c4047] w-fit"
              >
                {loadingSocialPostSuggestions ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Genererer...
                  </>
                ) : (
                  <>
                    <RocketIcon className="h-3.5 w-3.5 mr-1.5" />
                    {socialPostSuggestions && socialPostSuggestions.length > 0 ? 'Nye forslag' : 'Generer forslag'}
                  </>
                )}
              </Button>
            </div>
            {hasCompetitors && (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 sm:p-4 flex flex-col gap-3">
                <div>
                  <p className="text-xs font-medium text-neutral-900 mb-0.5">Med konkurrentanalyse</p>
                  <p className="text-sm text-neutral-500 leading-snug">
                    Mer målrettet: utkonkurrering og innholdshull mot konkurrentene.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchSocialPostSuggestions(true, selectedSocialPlatform)}
                  disabled={loadingSocialPostSuggestions}
                  className="rounded-lg text-xs w-fit border-neutral-300 bg-white hover:bg-neutral-50"
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  {socialPostSuggestions && socialPostSuggestions.length > 0 ? 'Nye forslag (konkurrenter)' : 'Generer forslag (konkurrenter)'}
                </Button>
              </div>
            )}
          </div>

          {loadingSocialPostSuggestions && (
            <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mb-3" />
              <p className="text-sm text-neutral-600 font-medium mb-1">Genererer postforslag</p>
              <p className="text-xs text-neutral-500 min-h-[1rem]">{SUGGESTION_MESSAGES[suggestionMessageIndex]}</p>
            </div>
          )}

          {!loadingSocialPostSuggestions && socialPostSuggestions && socialPostSuggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs">
                <span className="text-neutral-500 font-medium">Innstillinger</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Lengde:</span>
                  <select
                    value={selectedLength}
                    onChange={(e) => setSelectedLength(e.target.value as SocialPostLength)}
                    className="px-2 py-1 rounded-md border border-neutral-200 bg-white text-neutral-700 font-medium cursor-pointer hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  >
                    {SOCIAL_LENGTH_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label} ({opt.desc})</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Tone:</span>
                  <select
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value as SocialPostTone)}
                    className="px-2 py-1 rounded-md border border-neutral-200 bg-white text-neutral-700 font-medium cursor-pointer hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  >
                    {SOCIAL_TONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">For:</span>
                  <select
                    value={selectedAudience}
                    onChange={(e) => setSelectedAudience(e.target.value as SocialPostAudience)}
                    className="px-2 py-1 rounded-md border border-neutral-200 bg-white text-neutral-700 font-medium cursor-pointer hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300"
                  >
                    {SOCIAL_AUDIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  {socialPostSuggestions.length} postideer for {PLATFORM_OPTIONS.find((p) => p.value === selectedSocialPlatform)?.label}
                </p>
                {socialPostSuggestionsSavedAt && (
                  <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Generert {new Date(socialPostSuggestionsSavedAt).toLocaleDateString('nb-NO', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {socialPostSuggestions.map((s, i) => (
                  <li key={i} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-600">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-900">{s.title}</p>
                          {s.priority && (
                            <span
                              className={`mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded font-medium ${
                                s.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                                s.priority === 'medium' ? 'bg-neutral-200 text-neutral-700' :
                                'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {s.priority === 'high' ? 'høy' : s.priority === 'medium' ? 'medium' : 'lav'}
                            </span>
                          )}
                          <div className="mt-3 pt-3 border-t border-neutral-100">
                            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide mb-1">Begrunnelse</p>
                            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{s.rationale}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => fetchGenerateSocialPost(s, i, selectedSocialPlatform, { length: selectedLength, tone: selectedTone, audience: selectedAudience })}
                              disabled={remainingArticleGenerations <= 0 || generatingSocialPostIndex !== null}
                              className="rounded-lg text-xs"
                            >
                              {generatingSocialPostIndex === i ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  Genererer...
                                </>
                              ) : (
                                <>
                                  <PenLine className="h-3.5 w-3.5 mr-1.5" />
                                  Generer innlegg
                                </>
                              )}
                            </Button>
                            <button
                              type="button"
                              onClick={() => copyTitle(s.title)}
                              className="shrink-0 p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700"
                              title="Kopier ide"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loadingSocialPostSuggestions && (!socialPostSuggestions || socialPostSuggestions.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50">
              <Share2 className="h-10 w-10 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-600 font-medium mb-1">Ingen postforslag ennå</p>
              <p className="text-xs text-neutral-500">Velg kanal og klikk knappen over for å generere forslag.</p>
            </div>
          )}

          {/* Generated post result inline */}
          {generatedSocialPostResult && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-neutral-700">
                  Generert innlegg for {PLATFORM_OPTIONS.find((p) => p.value === generatedSocialPostResult.platform)?.label}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={copyPost} className="rounded-lg text-xs">
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Kopier
                </Button>
              </div>
              {/* Bilde øverst */}
              {(generatedSocialPostResult.featuredImageUrl || generatedSocialPostResult.featuredImageSuggestion) && (
                <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
                  {generatedSocialPostResult.featuredImageSuggestion && (
                    <p className="text-[11px] text-neutral-600 px-3 py-2 border-b border-neutral-100">
                      Forslag til bilde: {generatedSocialPostResult.featuredImageSuggestion}
                    </p>
                  )}
                  {generatedSocialPostResult.featuredImageUrl ? (
                    <>
                      <div className="max-h-[200px] flex items-center justify-center bg-neutral-100">
                        <img
                          src={generatedSocialPostResult.featuredImageUrl}
                          alt="Forslag til innleggsbilde"
                          className="w-full h-auto max-h-[200px] object-contain"
                        />
                      </div>
                      <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 bg-neutral-50 border-t border-neutral-100">
                        {generatedSocialPostResult.featuredImageAttribution && (
                          <a
                            href="https://unsplash.com/?utm_source=analyseverktyy&utm_medium=referral"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-neutral-600 hover:underline"
                          >
                            {generatedSocialPostResult.featuredImageAttribution}
                          </a>
                        )}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={regenerateImage}
                              disabled={regeneratingImage}
                              className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`h-3 w-3 ${regeneratingImage ? 'animate-spin' : ''}`} />
                              {regeneratingImage ? 'Henter...' : 'Generer nytt bilde'}
                            </button>
                            {generatedSocialPostResult.featuredImageDownloadUrl && (
                              <a
                                href={generatedSocialPostResult.featuredImageDownloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900"
                              >
                                <Download className="h-3 w-3" />
                                Last ned
                              </a>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400">Maks 3 nye bilder per time.</p>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
              <div className="rounded-lg bg-white border border-neutral-200 p-4 text-sm text-neutral-800 whitespace-pre-wrap">
                {generatedSocialPostResult.content}
                {generatedSocialPostResult.cta && (
                  <>
                    {'\n\n'}
                    <span className="font-medium">{generatedSocialPostResult.cta}</span>
                  </>
                )}
              </div>
              {generatedSocialPostResult.hashtags.length > 0 && (
                <p className="text-xs text-neutral-500">
                  Hashtags: {generatedSocialPostResult.hashtags.map((h) => `#${h}`).join(' ')}
                </p>
              )}
              <button
                type="button"
                onClick={() => setGeneratedSocialPost(null)}
                className="text-xs text-neutral-500 hover:text-neutral-700 underline"
              >
                Lukk
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={generatingSocialPostIndex !== null} onOpenChange={() => {}}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogTitle className="sr-only">Genererer innlegg</DialogTitle>
          <div className="flex flex-col items-center text-center py-2">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-600 mb-4" />
            <h3 className="font-semibold text-neutral-900 text-sm mb-1">Genererer innlegg</h3>
            {socialPostSuggestions && generatingSocialPostIndex !== null && socialPostSuggestions[generatingSocialPostIndex] && (
              <p className="text-xs text-neutral-600 line-clamp-2">{socialPostSuggestions[generatingSocialPostIndex].title}</p>
            )}
            <p className="text-xs text-neutral-500 mt-2">{GENERATING_MESSAGES[generatingMessageIndex]}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: vis generert innlegg automatisk når ferdig */}
      <Dialog open={!!generatedSocialPostResult} onOpenChange={(open) => !open && setGeneratedSocialPost(null)}>
        <DialogContent showCloseButton className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          {generatedSocialPostResult && (
            <>
              <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-neutral-100">
                <DialogTitle className="text-lg font-semibold pr-8">Innlegg generert</DialogTitle>
                <p className="text-sm text-neutral-500 mt-1">
                  {PLATFORM_OPTIONS.find((p) => p.value === generatedSocialPostResult.platform)?.label} · {generatedSocialPostResult.title}
                </p>
                <div className="mt-3">
                  <Button type="button" variant="outline" size="sm" onClick={copyPost} className="rounded-lg text-xs">
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Kopier innlegg
                  </Button>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-4">
                {/* Bilde øverst */}
                {(generatedSocialPostResult.featuredImageUrl || generatedSocialPostResult.featuredImageSuggestion) && (
                  <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                    {generatedSocialPostResult.featuredImageSuggestion && (
                      <p className="text-[11px] text-neutral-600 px-3 py-2 border-b border-neutral-100">
                        Forslag til bilde: {generatedSocialPostResult.featuredImageSuggestion}
                      </p>
                    )}
                    {generatedSocialPostResult.featuredImageUrl ? (
                      <>
                        <div className="max-h-[220px] flex items-center justify-center bg-neutral-100">
                          <img
                            src={generatedSocialPostResult.featuredImageUrl}
                            alt="Forslag til innleggsbilde"
                            className="w-full h-auto max-h-[220px] object-contain"
                          />
                        </div>
                        <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 bg-neutral-50 border-t border-neutral-100">
                          {generatedSocialPostResult.featuredImageAttribution && (
                            <a
                              href="https://unsplash.com/?utm_source=analyseverktyy&utm_medium=referral"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-neutral-600 hover:underline"
                            >
                              {generatedSocialPostResult.featuredImageAttribution}
                            </a>
                          )}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={regenerateImage}
                                disabled={regeneratingImage}
                                className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <RefreshCw className={`h-3 w-3 ${regeneratingImage ? 'animate-spin' : ''}`} />
                                {regeneratingImage ? 'Henter nytt bilde...' : 'Generer nytt bilde'}
                              </button>
                              {generatedSocialPostResult.featuredImageDownloadUrl && (
                                <a
                                  href={generatedSocialPostResult.featuredImageDownloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900"
                                >
                                  <Download className="h-3 w-3" />
                                  Last ned
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400">Maks 3 nye bilder per time.</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="px-3 py-2 flex flex-col gap-1">
                        <div className="flex items-start gap-2">
                          <p className="text-xs text-neutral-600">{generatedSocialPostResult.featuredImageSuggestion}</p>
                          <button
                            type="button"
                            onClick={regenerateImage}
                            disabled={regeneratingImage}
                            className="text-[11px] text-neutral-500 hover:text-neutral-900 cursor-pointer disabled:opacity-50"
                          >
                            {regeneratingImage ? 'Henter...' : 'Hent bilde'}
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-400">Maks 3 nye bilder per time.</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Innhold under bildet */}
                <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
                  <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
                    {generatedSocialPostResult.content}
                    {generatedSocialPostResult.cta && (
                      <>
                        {'\n\n'}
                        <span className="font-medium">{generatedSocialPostResult.cta}</span>
                      </>
                    )}
                  </p>
                  {generatedSocialPostResult.hashtags.length > 0 && (
                    <p className="mt-3 pt-3 border-t border-neutral-200 text-xs text-neutral-500">
                      {generatedSocialPostResult.hashtags.map((h) => `#${h}`).join(' ')}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

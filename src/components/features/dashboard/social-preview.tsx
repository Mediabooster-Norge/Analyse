'use client';

import { useState } from 'react';
import { Facebook, Twitter, Linkedin, Globe, ImageOff, CheckCircle2, AlertTriangle, Sparkles, Info } from 'lucide-react';

interface OGTags {
  title: string | null;
  description: string | null;
  image: string | null;
}

interface SocialPreviewProps {
  url: string;
  pageTitle: string | null;
  pageDescription: string | null;
  ogTags: OGTags;
  onGetTips?: () => void;
}

type SocialPlatform = 'facebook' | 'twitter' | 'linkedin';

export function SocialPreview({ url, pageTitle, pageDescription, ogTags, onGetTips }: SocialPreviewProps) {
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>('facebook');
  const [imageError, setImageError] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Use OG tags if available, fall back to page title/description
  const title = ogTags.title || pageTitle || 'Ingen tittel';
  const description = ogTags.description || pageDescription || 'Ingen beskrivelse tilgjengelig';
  const imageUrl = ogTags.image;
  
  // Extract domain from URL
  let domain = '';
  try {
    domain = new URL(url).hostname.toUpperCase();
  } catch {
    domain = url.toUpperCase();
  }

  // Check if OG tags are properly set
  const hasOgTitle = Boolean(ogTags.title);
  const hasOgDescription = Boolean(ogTags.description);
  const hasOgImage = Boolean(ogTags.image);
  const allOgTagsSet = hasOgTitle && hasOgDescription && hasOgImage;
  const missingTags = [
    !hasOgTitle && 'og:title',
    !hasOgDescription && 'og:description', 
    !hasOgImage && 'og:image'
  ].filter(Boolean) as string[];

  const platforms: { id: SocialPlatform; label: string; icon: React.ElementType }[] = [
    { id: 'facebook', label: 'Facebook', icon: Facebook },
    { id: 'twitter', label: 'X (Twitter)', icon: Twitter },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  ];

  const renderImageArea = () => (
    <div className="aspect-[1.91/1] bg-neutral-100 relative overflow-hidden">
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt="OG Image preview"
          className="w-full h-full object-cover object-center"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
          <ImageOff className="w-6 h-6 mb-1" />
          <span className="text-xs">Ingen bilde satt</span>
        </div>
      )}
    </div>
  );

  const cardStyles = "w-full border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm";

  const renderPreviewForPlatform = (platform: SocialPlatform) => {
    switch (platform) {
      case 'facebook':
        return (
          <div className={cardStyles}>
            {renderImageArea()}
            <div className="p-2 sm:p-3 bg-[#f0f2f5]">
              <p className="text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wider mb-0.5">{domain}</p>
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-2 leading-snug">{title}</h3>
              <p className="text-[10px] sm:text-xs text-neutral-600 line-clamp-1 mt-0.5">{description}</p>
            </div>
          </div>
        );
      case 'twitter':
        return (
          <div className={`${cardStyles} rounded-2xl`}>
            {renderImageArea()}
            <div className="p-2 sm:p-3">
              <h3 className="text-xs sm:text-sm font-medium text-neutral-900 line-clamp-2 leading-snug">{title}</h3>
              <p className="text-[10px] sm:text-xs text-neutral-500 line-clamp-2 mt-0.5">{description}</p>
              <div className="flex items-center gap-1 text-neutral-400 mt-1">
                <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="text-[9px] sm:text-[10px]">{domain.toLowerCase()}</span>
              </div>
            </div>
          </div>
        );
      case 'linkedin':
        return (
          <div className={cardStyles}>
            {renderImageArea()}
            <div className="p-2 sm:p-3 border-t border-neutral-100">
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-2 leading-snug">{title}</h3>
              <p className="text-[9px] sm:text-[10px] text-neutral-500 mt-0.5">{domain.toLowerCase()}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header row: Status + Platform tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            allOgTagsSet 
              ? 'bg-green-100 text-green-800' 
              : 'bg-amber-100 text-amber-800'
          }`}>
            {allOgTagsSet ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span>
              {allOgTagsSet ? 'Alle OG-tagger satt' : `${missingTags.length} mangler`}
            </span>
            <span className="flex gap-1 ml-1">
              <span className={`w-2 h-2 rounded-full ${hasOgTitle ? 'bg-green-500' : 'bg-amber-500'}`} title="og:title" />
              <span className={`w-2 h-2 rounded-full ${hasOgDescription ? 'bg-green-500' : 'bg-amber-500'}`} title="og:description" />
              <span className={`w-2 h-2 rounded-full ${hasOgImage ? 'bg-green-500' : 'bg-amber-500'}`} title="og:image" />
            </span>
          </div>
          
          {/* Info button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${showInfo ? 'bg-neutral-200 text-neutral-700' : 'hover:bg-neutral-100 text-neutral-400'}`}
            title="Vis info"
          >
            <Info className="w-4 h-4" />
          </button>
          
          {/* AI Tips button */}
          {onGetTips && (
            <button
              onClick={onGetTips}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Få AI-tips
            </button>
          )}
        </div>

        {/* Platform tabs - only on mobile */}
        <div className="flex md:hidden rounded-lg bg-neutral-100 p-0.5">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isActive = activePlatform === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => {
                  setActivePlatform(platform.id);
                  setImageError(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{platform.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-800 space-y-2">
          <p className="font-medium">Om Open Graph-tagger</p>
          <p className="text-blue-700">
            OG-tagger styrer hvordan siden din vises når den deles på sosiale medier. 
            Uten disse bruker plattformene automatisk utvalg som ofte ser dårlig ut.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className={`p-2 rounded ${hasOgTitle ? 'bg-green-100' : 'bg-amber-100'}`}>
              <p className="font-medium text-neutral-800">og:title</p>
              <p className="text-[10px] text-neutral-600 mt-0.5">
                {hasOgTitle ? `"${ogTags.title?.slice(0, 40)}${(ogTags.title?.length ?? 0) > 40 ? '...' : ''}"` : 'Ikke satt - bruker sidetittel'}
              </p>
            </div>
            <div className={`p-2 rounded ${hasOgDescription ? 'bg-green-100' : 'bg-amber-100'}`}>
              <p className="font-medium text-neutral-800">og:description</p>
              <p className="text-[10px] text-neutral-600 mt-0.5">
                {hasOgDescription ? `"${ogTags.description?.slice(0, 40)}..."` : 'Ikke satt - bruker meta description'}
              </p>
            </div>
            <div className={`p-2 rounded ${hasOgImage ? 'bg-green-100' : 'bg-amber-100'}`}>
              <p className="font-medium text-neutral-800">og:image</p>
              <p className="text-[10px] text-neutral-600 mt-0.5">
                {hasOgImage ? 'Bilde er satt ✓' : 'Ikke satt - ingen forhåndsvisning'}
              </p>
            </div>
          </div>
          {missingTags.length > 0 && (
            <p className="text-amber-700 pt-1">
              <strong>Tips:</strong> Legg til {missingTags.join(', ')} i din HTML-header for bedre deling.
            </p>
          )}
        </div>
      )}

      {/* Preview area: all 3 on desktop, tabbed on mobile */}
      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
        {/* Desktop: all three side by side */}
        <div className="hidden md:grid grid-cols-3 gap-3">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <div key={platform.id} className="min-w-0 flex flex-col">
                <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  {platform.label}
                </p>
                {renderPreviewForPlatform(platform.id)}
              </div>
            );
          })}
        </div>
        {/* Mobile: single preview with tabs */}
        <div className="flex justify-center md:hidden">
          {renderPreviewForPlatform(activePlatform)}
        </div>
      </div>
    </div>
  );
}

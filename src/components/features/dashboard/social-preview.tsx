'use client';

import { useState } from 'react';
import { Facebook, Twitter, Linkedin, Globe, ImageOff, Sparkles, Info } from 'lucide-react';

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
  const [showInfo, setShowInfo] = useState(true);

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
    <div className="space-y-3">
      {/* Én linje: status + AI-tips */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs ${allOgTagsSet ? 'text-green-700' : 'text-amber-700'}`}>
          {allOgTagsSet ? 'Tittel, beskrivelse og bilde er satt for deling' : `${missingTags.join(', ')} mangler for deling`}
        </span>
        {onGetTips && (
          <button
            onClick={onGetTips}
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 max-[400px]:px-1.5 max-[400px]:py-1 min-[401px]:px-2.5 min-[401px]:py-1.5 rounded-md bg-amber-50 border border-amber-100 text-[10px] max-[400px]:text-[9px] min-[401px]:text-xs text-amber-700 hover:bg-amber-100 cursor-pointer w-fit"
          >
            <Sparkles className="w-3 h-3" />
            Få AI-tips
          </button>
        )}
      </div>

      {/* Platform tabs – kun på mobil */}
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
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                isActive ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{platform.label}</span>
            </button>
          );
        })}
      </div>

      {/* Info – liten (i) som viser panel */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowInfo(!showInfo)}
          type="button"
          className={`p-1 rounded cursor-pointer ${showInfo ? 'bg-neutral-200 text-neutral-700' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'}`}
          title="Om deling og OG-tagger"
          aria-expanded={showInfo}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
        {showInfo && (
          <p className="text-[11px] text-neutral-600">
            Tittel, beskrivelse og bilde styrer hvordan lenken ser ut når den deles. Uten disse velger plattformene selv – ofte dårlig.
          </p>
        )}
      </div>
      {showInfo && missingTags.length > 0 && (
        <p className="text-[11px] text-amber-700">
          Mangler: {missingTags.join(', ')}. Legg dem i HTML-head for bedre deling.
        </p>
      )}

      {/* Forhåndsvisninger – uten ekstra boks */}
      {/* Desktop: tre kolonner */}
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
      {/* Mobil: én forhåndsvisning med faner */}
      <div className="flex justify-center md:hidden">
        {renderPreviewForPlatform(activePlatform)}
      </div>
    </div>
  );
}

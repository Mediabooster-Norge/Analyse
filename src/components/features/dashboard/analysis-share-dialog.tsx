'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface AnalysisShareTarget {
  id: string;
  url: string;
}

interface AnalysisShareDialogProps {
  target: AnalysisShareTarget | null;
  onOpenChange: (open: boolean) => void;
}

export function AnalysisShareDialog({ target, onOpenChange }: AnalysisShareDialogProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [regeneratingShare, setRegeneratingShare] = useState(false);
  const [revokingShare, setRevokingShare] = useState(false);

  useEffect(() => {
    if (!target) {
      setShareUrl(null);
      return;
    }

    const analysisId = target.id;
    let cancelled = false;

    async function loadExistingShare() {
      try {
        const res = await fetch(`/api/analysis/${analysisId}/share`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.hasShare && data.shareUrl) {
          setShareUrl(data.shareUrl);
        } else {
          setShareUrl(null);
        }
      } catch {
        if (!cancelled) setShareUrl(null);
      }
    }

    void loadExistingShare();
    return () => {
      cancelled = true;
    };
  }, [target]);

  const handleCreateShare = async () => {
    if (!target) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/analysis/${target.id}/share`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Kunne ikke opprette delingslenke');
        return;
      }
      setShareUrl(data.shareUrl);
      toast.success('Delingslenke opprettet');
    } catch {
      toast.error('Kunne ikke opprette delingslenke');
    } finally {
      setSharing(false);
    }
  };

  const handleRegenerateShare = async () => {
    if (!target) return;
    setRegeneratingShare(true);
    try {
      const res = await fetch(`/api/analysis/${target.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Kunne ikke opprette ny delingslenke');
        return;
      }
      setShareUrl(data.shareUrl);
      toast.success('Ny delingslenke opprettet. Den gamle lenken virker ikke lenger.');
    } catch {
      toast.error('Kunne ikke opprette ny delingslenke');
    } finally {
      setRegeneratingShare(false);
    }
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Lenke kopiert');
    } catch {
      toast.error('Kunne ikke kopiere lenke');
    }
  };

  const handleRevokeShare = async () => {
    if (!target) return;
    setRevokingShare(true);
    try {
      const res = await fetch(`/api/analysis/${target.id}/share`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Kunne ikke deaktivere delingslenke');
        return;
      }
      setShareUrl(null);
      toast.success('Delingslenke deaktivert');
    } catch {
      toast.error('Kunne ikke deaktivere delingslenke');
    } finally {
      setRevokingShare(false);
    }
  };

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Del analyse</DialogTitle>
          <DialogDescription>
            Lag en unik lenke for <strong>{target?.url}</strong>. Mottakere kan se nettside-analysen,
            og konkurrenter / SEO-nøkkelord dersom du har kjørt disse sjekkene på analysen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-neutral-600">
            {shareUrl
              ? 'Lenken er gyldig til du deaktiverer den. Del den med hvem du vil.'
              : 'Opprett en lenke for å dele Nettside-fanen (readonly) med andre.'}
          </div>
          {shareUrl ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs break-all">
              {shareUrl}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {!shareUrl ? (
              <Button onClick={handleCreateShare} disabled={sharing}>
                {sharing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oppretter...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Opprett delingslenke
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCopyShareUrl}>
                  <Copy className="mr-2 h-4 w-4" />
                  Kopier lenke
                </Button>
                <Button variant="outline" onClick={handleRegenerateShare} disabled={regeneratingShare}>
                  {regeneratingShare ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Oppretter ny...
                    </>
                  ) : (
                    'Erstatt lenke'
                  )}
                </Button>
                <Button variant="outline" onClick={handleRevokeShare} disabled={revokingShare}>
                  {revokingShare ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deaktiverer...
                    </>
                  ) : (
                    'Deaktiver lenke'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PreviewRegisterWallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewToken: string;
  metricTitle?: string;
}

export function PreviewRegisterWall({
  open,
  onOpenChange,
  previewToken,
  metricTitle,
}: PreviewRegisterWallProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-muted">
            <Lock className="size-5 text-muted-foreground" />
          </div>
          <DialogTitle className="text-center">Opprett konto for AI-forslag</DialogTitle>
          <DialogDescription className="text-center">
            {metricTitle
              ? `Du ser analysen for «${metricTitle}». Opprett gratis konto for å få konkrete forbedringsforslag du kan kopiere og bruke med én gang.`
              : 'Opprett gratis konto for å få konkrete AI-forslag og løsninger for hvert funn i analysen.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button className="flex-1" asChild>
            <Link href={`/register?preview=${previewToken}`}>Opprett konto</Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/login?preview=${previewToken}`}>Logg inn</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

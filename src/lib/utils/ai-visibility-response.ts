export type AiVisibilityResponseType = 'unprompted' | 'named' | 'discovery';

const MAX_RESPONSE_CHARS: Record<AiVisibilityResponseType, number> = {
  unprompted: 900,
  named: 450,
  discovery: 550,
};

const MAX_LIST_ITEMS = 6;

/** Meta-innledninger uten substans – hele avsnitt hoppes over. */
const SKIP_PARAGRAPH_PATTERNS = [
  /^her er (noen|et utvalg|en (kort )?oversikt|noen forslag|noe)/i,
  /^for å (gi|anbefale|finne|hjelpe)/i,
  /^jeg (ville|kan) (gjerne|først)/i,
  /^det finnes ikke én objektiv/i,
  /^klart[!.]?\s*$/i,
  /^basert på (det|tilgjengelig|søket)/i,
  /^her er en (kort )?(oversikt|liste|startliste)/i,
  /^nedenfor finner du/i,
];

/** Oppfølgingsspørsmål og «hjelpetekst» som ikke hører hjemme i resultatet. */
const SKIP_LINE_PATTERNS = [
  /^(vil|ønsker|hva trenger|kan du si|gi meg mer|for å gi|fortell meg|hvis du vil|si gjerne fra)/i,
  /^(merk:|nb:|tips:|note:)/i,
  /^(kilder|sources|referanser|les mer):?\s*$/i,
  /^oppsummering:?\s*$/i,
  /^neste steg:?\s*$/i,
];

/**
 * Rydder AI-svar fra websøk til lesbar tekst.
 * Bevarer avsnitt og lister – flater ikke ut linjeskift.
 */
export function cleanAiVisibilityResponse(text: string): string {
  let t = text.trim();
  if (!t) return '';

  t = t.replace(/\[([^\]]+)\]\((?:https?:\/\/[^)]+|[^)]+)\)/g, '$1');
  t = t.replace(/https?:\/\/(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})[^\s)\]"']*/gi, '$1');
  t = t.replace(/\b([a-z0-9][a-z0-9.-]*\.[a-z]{2,})[ \t]*\(\1\)/gi, '$1');
  t = t.replace(/[ \t]*\([a-z0-9][a-z0-9.-]*\.[a-z]{2,}\)(\.?)[ \t]*/gi, (_, period) =>
    period ? '. ' : ' '
  );
  t = t.replace(/[ \t]*\(([a-z0-9][a-z0-9.-]*\.[a-z]{2,})\)/gi, ' $1');
  t = t.replace(/^(\d+)\)\s+/gm, '$1. ');
  t = t.replace(/^-{3,}\s*$/gm, '');
  t = t.replace(/^\s*sources?:\s*$/gim, '');
  t = t
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trimEnd())
    .join('\n');
  t = t.replace(/\n{3,}/g, '\n\n').trim();

  return t;
}

/**
 * Kutter bort irrelevant innhold og begrenser lengde for visning/lagring.
 * Bruk etter scoring – full tekst bør brukes til judge.
 */
export function compactAiVisibilityResponse(
  text: string,
  queryType: AiVisibilityResponseType = 'named'
): string {
  let t = cleanAiVisibilityResponse(text);
  if (!t) return '';

  const paragraphs = t.split(/\n\n+/);
  const keptParagraphs: string[] = [];

  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const firstLine = lines[0];
    if (
      keptParagraphs.length === 0 &&
      lines.length === 1 &&
      SKIP_PARAGRAPH_PATTERNS.some((p) => p.test(firstLine))
    ) {
      continue;
    }

    const filteredLines = lines
      .map((line) => line.replace(/^ja[ \u2013\u2014,-]+\s*/i, ''))
      .filter((line, index) => {
        if (SKIP_LINE_PATTERNS.some((p) => p.test(line))) return false;
        if (line.startsWith('## ') && /kilder|sources|referanser|mer info/i.test(line)) return false;
        if (line.endsWith('?') && keptParagraphs.length > 0 && index === lines.length - 1) {
          return false;
        }
        return true;
      });

    if (filteredLines.length > 0) {
      keptParagraphs.push(filteredLines.join('\n'));
    }
  }

  t = keptParagraphs.join('\n\n');

  if (queryType === 'unprompted') {
    t = limitListItems(t, MAX_LIST_ITEMS);
  }

  const maxChars = MAX_RESPONSE_CHARS[queryType];
  if (t.length > maxChars) {
    t = trimToCharLimit(t, maxChars);
  }

  return t.trim();
}

function limitListItems(text: string, maxItems: number): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let listCount = 0;

  for (const line of lines) {
    const isListItem = /^(\d+\.|[-*•])\s+/.test(line.trim());
    if (isListItem) {
      listCount++;
      if (listCount > maxItems) continue;
    }
    result.push(line);
  }

  return result.join('\n').trim();
}

function trimToCharLimit(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const cut = text.slice(0, maxChars);
  const lastBreak = Math.max(cut.lastIndexOf('\n\n'), cut.lastIndexOf('\n'), cut.lastIndexOf('. '));
  if (lastBreak > maxChars * 0.55) {
    return `${cut.slice(0, lastBreak).trim()}…`;
  }
  return `${cut.trim()}…`;
}

/** Kort visningsnavn for lenker som fortsatt rendres som <a>. */
export function shortAiResponseLinkLabel(href: string | undefined, childText: string): string {
  if (href) {
    try {
      const host = new URL(href).hostname.replace(/^www\./, '');
      if (host) return host;
    } catch {
      /* fall through */
    }
  }
  return childText.length > 48 ? `${childText.slice(0, 45)}…` : childText || 'kilde';
}

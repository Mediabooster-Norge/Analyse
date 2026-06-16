/**
 * Run with: npx tsx src/tests/ai-visibility-response.test.ts
 */
import assert from 'node:assert/strict';
import {
  cleanAiVisibilityResponse,
  compactAiVisibilityResponse,
} from '../lib/utils/ai-visibility-response';

const sample = `Her er noen byråer:

1) **Cognito** – web og marketing ([cognito.no](https://cognito.no/?utm_source=openai))
2) **Bonefish** – SEO ([bonefish.no](https://www.bonefish.no/?utm_source=openai))

---

Kilder: https://example.com/page?utm_source=openai`;

const cleaned = cleanAiVisibilityResponse(sample);

assert.ok(!cleaned.includes('utm_source=openai'), 'fjerner utm-parametre');
assert.ok(!cleaned.includes('https://'), 'fjerner rå URL-er');
assert.ok(cleaned.includes('**Cognito**'), 'beholder fet tekst');
assert.ok(cleaned.includes('1. **Cognito**'), 'normaliserer nummererte lister');
assert.ok(!cleaned.includes('---'), 'fjerner skillelinjer');
assert.match(cleaned, /\n\n/, 'beholder avsnitt');

const verboseUnprompted = `Her er noen Oslo-baserte bedrifter som leverer webutvikling:

1. **Acme** – fullservice byrå
2. **Beta** – WordPress og SEO
3. **Gamma** – e-handel
4. **Delta** – design
5. **Epsilon** – hosting
6. **Zeta** – annonsering
7. **Eta** – content

Vil du at jeg skal filtrere på budsjett eller bransje?`;

const compactUnprompted = compactAiVisibilityResponse(verboseUnprompted, 'unprompted');
assert.ok(!compactUnprompted.toLowerCase().startsWith('her er'), 'fjerner meta-innledning');
assert.ok(!compactUnprompted.includes('Vil du at jeg'), 'fjerner oppfølgingsspørsmål');
assert.ok(!compactUnprompted.includes('**Eta**'), 'begrenser antall listepunkter');
assert.ok(compactUnprompted.length <= 900, 'respekterer maks lengde for nøytrale');

const verboseNamed = `Ja – Mediabooster er et etablert byrå i Oslo med fokus på web og markedsføring. De har jobbet med mange SMB-kunder og tilbyr både utvikling og annonsering. De skiller seg ut med tett oppfølging og lokalt fotavtrykk.

Hva trenger du mest hjelp med – nettside, SEO eller annonsering?`;

const compactNamed = compactAiVisibilityResponse(verboseNamed, 'named');
assert.ok(compactNamed.includes('Mediabooster'), 'beholder substans');
assert.ok(!compactNamed.includes('Hva trenger du'), 'fjerner avsluttende spørsmål');
assert.ok(compactNamed.length <= 450, 'respekterer maks lengde for navngitte');

const jaPrefixedQuestion = `Mediabooster er et etablert byrå i Oslo.

Ja – Noe mer du lurer på?`;

const compactJaQuestion = compactAiVisibilityResponse(jaPrefixedQuestion, 'named');
assert.ok(!compactJaQuestion.includes('lurer på'), 'fjerner avsluttende spørsmål selv med ja-prefiks');

console.log('ai-visibility-response.test.ts: OK');
